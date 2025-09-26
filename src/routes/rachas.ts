import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

const VALID_HOURS = [18, 19, 20, 21, 22, 23] as const;

/**
 * @swagger
 * tags:
 *   name: Rachas
 *   description: Gestão de rachas e horários
 */

/**
 * @swagger
 * /rachas:
 *   get:
 *     tags: [Rachas]
 *     summary: Lista rachas
 *     description: Lista todos os rachas. Use `scheduled=true` para apenas agendados e `scheduled=false` para livres.
 *     parameters:
 *       - in: query
 *         name: scheduled
 *         required: false
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de rachas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Racha'
 */
router.get('/', async (req, res) => {
  const { scheduled } = req.query as { scheduled?: string };
  const where = typeof scheduled === 'undefined' ? {} : { scheduled: scheduled === 'true' };
  const rachas = await prisma.racha.findMany({ where, orderBy: [{ date: 'asc' }, { hour: 'asc' }, { field: 'asc' }] });
  res.json(rachas);
});

/**
 * @swagger
 * /rachas/slots:
 *   get:
 *     tags: [Rachas]
 *     summary: Lista horários disponíveis por data e campo
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: field
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Horários e disponibilidade
 */
router.get('/slots', async (req, res) => {
  const { date, field } = req.query as { date?: string; field?: string };
  if (!date || !field) return res.status(400).json({ message: 'Parâmetros date e field são obrigatórios' });

  const day = new Date(date + 'T00:00:00');

  const rachas = await prisma.racha.findMany({
    where: { date: day, field },
    select: { hour: true, scheduled: true },
  });
  const taken = new Map(rachas.map(r => [r.hour, r.scheduled]));
  const slots = VALID_HOURS.map(hour => ({ hour, available: taken.get(hour) ? !taken.get(hour) : true }));
  res.json({ date, field, slots });
});

/**
 * @swagger
 * /rachas:
 *   post:
 *     tags: [Rachas]
 *     summary: Agenda um racha
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, field, hour]
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               field:
 *                 type: string
 *               hour:
 *                 type: integer
 *                 enum: [18,19,20,21,22,23]
 *               userName:
 *                 type: string
 *                 description: Nome de quem está agendando (opcional)
 *               recorrente:
 *                 type: boolean
 *                 default: false
 *                 description: Se o racha deve se repetir semanalmente
 *     responses:
 *       201:
 *         description: Racha agendado
 *       400:
 *         description: Hora inválida
 *       409:
 *         description: Conflito de horário/campo/data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 conflitos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       field:
 *                         type: string
 *                       hour:
 *                         type: integer
 *                       message:
 *                         type: string
 *                 rachasCriados:
 *                   type: integer
 *                 totalTentativas:
 *                   type: integer
 */
router.post('/', async (req, res) => {
  const { date, field, hour, userName, recorrente = false } = req.body as { 
    date: string; 
    field: string; 
    hour: number; 
    userName?: string; 
    recorrente?: boolean; 
  };

  if (!VALID_HOURS.includes(hour as any)) return res.status(400).json({ message: 'Hora inválida (18..23)' });

  const day = new Date(date + 'T00:00:00');
  const diaSemana = recorrente ? day.getDay() : null;

  try {
    if (recorrente) {
      // Para rachas recorrentes, verificar conflitos antes de criar
      const conflitos = [];
      const rachas = [];
      
      for (let i = 0; i < 12; i++) {
        const dataRacha = new Date(day);
        dataRacha.setDate(day.getDate() + (i * 7));
        
        // Verificar se já existe racha para esta data/hora/campo
        const rachaExistente = await prisma.racha.findFirst({
          where: {
            date: dataRacha,
            field,
            hour,
            scheduled: true
          }
        });
        
        if (rachaExistente) {
          conflitos.push({
            date: dataRacha.toISOString().split('T')[0],
            field,
            hour,
            message: `Já existe racha agendado para ${dataRacha.toLocaleDateString('pt-BR')} às ${hour}:00 no campo ${field}`
          });
        } else {
          try {
            const racha = await prisma.racha.create({
              data: {
                date: dataRacha,
                field,
                hour,
                scheduled: true,
                userName: userName ?? null,
                recorrente: true,
                diaSemana
              }
            });
            rachas.push(racha);
          } catch (e) {
            conflitos.push({
              date: dataRacha.toISOString().split('T')[0],
              field,
              hour,
              message: `Erro ao criar racha para ${dataRacha.toLocaleDateString('pt-BR')} às ${hour}:00 no campo ${field}`
            });
          }
        }
      }
      
      if (conflitos.length > 0) {
        return res.status(409).json({ 
          message: 'Conflitos encontrados ao criar rachas recorrentes',
          conflitos,
          rachasCriados: rachas.length,
          totalTentativas: 12
        });
      }
      
      res.status(201).json({ message: 'Rachas recorrentes criados com sucesso', rachas });
    } else {
      const created = await prisma.racha.create({ 
        data: { 
          date: day, 
          field, 
          hour, 
          scheduled: true, 
          userName: userName ?? null,
          recorrente: false,
          diaSemana: null
        } 
      });
      res.status(201).json(created);
    }
  } catch (e) {
    return res.status(409).json({ message: 'Já existe racha para esse campo/hora/data' });
  }
});

/**
 * @swagger
 * /rachas/{id}/desativar:
 *   post:
 *     tags: [Rachas]
 *     summary: Desativa um racha recorrente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Racha desativado
 *       404:
 *         description: Racha não encontrado
 */
router.post('/:id/desativar', async (req, res) => {
  const id = Number(req.params.id);
  
  const racha = await prisma.racha.findUnique({ where: { id } });
  if (!racha) return res.status(404).json({ message: 'Racha não encontrado' });
  
  if (!racha.recorrente) {
    return res.status(400).json({ message: 'Apenas rachas recorrentes podem ser desativados' });
  }
  
  // Desativa todos os rachas recorrentes futuros com mesmo campo, hora e dia da semana
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const updated = await prisma.racha.updateMany({
    where: {
      field: racha.field,
      hour: racha.hour,
      diaSemana: racha.diaSemana,
      date: { gte: hoje },
      recorrente: true,
      ativo: true
    },
    data: { ativo: false }
  });
  
  res.json({ 
    message: 'Rachas recorrentes desativados', 
    count: updated.count,
    field: racha.field,
    hour: racha.hour,
    diaSemana: racha.diaSemana
  });
});

export default router;


