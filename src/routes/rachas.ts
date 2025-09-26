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
 *     responses:
 *       201:
 *         description: Racha agendado
 *       409:
 *         description: Horário já reservado
 */
router.post('/', async (req, res) => {
  const { date, field, hour, userName } = req.body as { date: string; field: string; hour: number; userName?: string };

  if (!VALID_HOURS.includes(hour as any)) return res.status(400).json({ message: 'Hora inválida (18..23)' });

  const day = new Date(date + 'T00:00:00');

  try {
    const created = await prisma.racha.create({ data: { date: day, field, hour, scheduled: true, userName: userName ?? null } });
    res.status(201).json(created);
  } catch (e) {
    return res.status(409).json({ message: 'Já existe racha para esse campo/hora/data' });
  }
});

export default router;


