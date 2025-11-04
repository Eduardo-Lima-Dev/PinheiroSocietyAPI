import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireUser } from '../middleware/auth.js';

const router = Router();

// Todas as rotas de quadras requerem autenticação (USER ou ADMIN)
router.use(requireAuth);
router.use(requireUser);

/**
 * @swagger
 * tags:
 *   name: Quadras
 *   description: Gestão de quadras
 */

/**
 * @swagger
 * /quadras:
 *   get:
 *     tags: [Quadras]
 *     summary: Lista todas as quadras
 *     parameters:
 *       - in: query
 *         name: ativa
 *         required: false
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de quadras
 */
router.get('/', async (req, res) => {
  const { ativa } = req.query as { ativa?: string };
  const where = typeof ativa === 'undefined' ? {} : { ativa: ativa === 'true' };
  
  const quadras = await prisma.quadra.findMany({
    where,
    orderBy: { nome: 'asc' }
  });
  
  res.json(quadras);
});

/**
 * @swagger
 * /quadras/{id}:
 *   get:
 *     tags: [Quadras]
 *     summary: Obtém uma quadra por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Quadra encontrada
 *       404:
 *         description: Quadra não encontrada
 */
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const quadra = await prisma.quadra.findUnique({
    where: { id },
    include: {
      reservas: {
        where: { status: 'ATIVA' },
        select: {
          id: true,
          data: true,
          hora: true,
          precoCents: true,
          cliente: {
            select: { nomeCompleto: true, telefone: true }
          }
        },
        orderBy: [{ data: 'asc' }, { hora: 'asc' }]
      }
    }
  });

  if (!quadra) {
    return res.status(404).json({ message: 'Quadra não encontrada' });
  }

  res.json(quadra);
});

/**
 * @swagger
 * /quadras:
 *   post:
 *     tags: [Quadras]
 *     summary: Cria uma nova quadra
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome]
 *             properties:
 *               nome:
 *                 type: string
 *               ativa:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Quadra criada
 *       409:
 *         description: Nome da quadra já existe
 */
router.post('/', async (req, res) => {
  const { nome, ativa = true } = req.body as {
    nome: string;
    ativa?: boolean;
  };

  // Verificar se nome já existe
  const existingQuadra = await prisma.quadra.findUnique({ where: { nome } });
  if (existingQuadra) {
    return res.status(409).json({ message: 'Nome da quadra já existe' });
  }

  const quadra = await prisma.quadra.create({
    data: { nome, ativa }
  });

  res.status(201).json(quadra);
});

/**
 * @swagger
 * /quadras/{id}:
 *   put:
 *     tags: [Quadras]
 *     summary: Atualiza uma quadra
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               ativa:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Quadra atualizada
 *       404:
 *         description: Quadra não encontrada
 *       409:
 *         description: Nome da quadra já existe
 */
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { nome, ativa } = req.body as {
    nome?: string;
    ativa?: boolean;
  };

  // Verificar se quadra existe
  const quadraExistente = await prisma.quadra.findUnique({ where: { id } });
  if (!quadraExistente) {
    return res.status(404).json({ message: 'Quadra não encontrada' });
  }

  // Verificar se nome já existe em outra quadra
  if (nome && nome !== quadraExistente.nome) {
    const existingQuadra = await prisma.quadra.findUnique({ where: { nome } });
    if (existingQuadra) {
      return res.status(409).json({ message: 'Nome da quadra já existe' });
    }
  }

  const quadra = await prisma.quadra.update({
    where: { id },
    data: {
      ...(nome && { nome }),
      ...(typeof ativa === 'boolean' && { ativa })
    }
  });

  res.json(quadra);
});

/**
 * @swagger
 * /quadras/{id}:
 *   delete:
 *     tags: [Quadras]
 *     summary: Exclui uma quadra
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Quadra excluída
 *       404:
 *         description: Quadra não encontrada
 *       400:
 *         description: Quadra possui reservas ativas
 */
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  // Verificar se quadra existe
  const quadra = await prisma.quadra.findUnique({ where: { id } });
  if (!quadra) {
    return res.status(404).json({ message: 'Quadra não encontrada' });
  }

  // Verificar se quadra possui reservas ativas
  const reservasAtivas = await prisma.reserva.count({
    where: { quadraId: id, status: 'ATIVA' }
  });

  if (reservasAtivas > 0) {
    return res.status(400).json({
      message: 'Não é possível excluir quadra com reservas ativas',
      reservasAtivas
    });
  }

  await prisma.quadra.delete({ where: { id } });
  res.json({ message: 'Quadra excluída com sucesso' });
});

/**
 * @swagger
 * /quadras/{id}/disponibilidade:
 *   get:
 *     tags: [Quadras]
 *     summary: Verifica disponibilidade de uma quadra em uma data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: data
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Disponibilidade da quadra
 *       404:
 *         description: Quadra não encontrada
 */
router.get('/:id/disponibilidade', async (req, res) => {
  const id = Number(req.params.id);
  const { data } = req.query;

  if (!data) {
    return res.status(400).json({ message: 'Parâmetro data é obrigatório' });
  }

  // Converter para string e limpar espaços (pegar primeiro valor se for array)
  const dataStr = Array.isArray(data) ? String(data[0]) : String(data);
  const dataLimpa = dataStr.trim();

  // Validar formato YYYY-MM-DD
  const formatoData = /^\d{4}-\d{2}-\d{2}$/;
  if (!formatoData.test(dataLimpa)) {
    return res.status(400).json({ message: 'Formato de data inválido. Use YYYY-MM-DD' });
  }

  // Verificar se quadra existe
  const quadra = await prisma.quadra.findUnique({ where: { id } });
  if (!quadra) {
    return res.status(404).json({ message: 'Quadra não encontrada' });
  }

  const dataConsulta = new Date(dataLimpa + 'T00:00:00');
  const dataFim = new Date(dataLimpa + 'T23:59:59');

  // Validar se as datas são válidas
  if (isNaN(dataConsulta.getTime()) || isNaN(dataFim.getTime())) {
    return res.status(400).json({ message: 'Formato de data inválido. Use YYYY-MM-DD' });
  }

  // Buscar reservas ativas para a data
  const reservas = await prisma.reserva.findMany({
    where: {
      quadraId: id,
      data: {
        gte: dataConsulta,
        lte: dataFim
      },
      status: 'ATIVA'
    },
    select: { hora: true }
  });

  // Horários disponíveis (8h às 23h)
  const horariosDisponiveis = [];
  const horariosOcupados = reservas.map(r => r.hora);

  for (let hora = 8; hora <= 23; hora++) {
    const precoCents = hora < 17 ? 10000 : 11000; // 100 reais até 17h, 110 reais após
    
    horariosDisponiveis.push({
      hora,
      disponivel: !horariosOcupados.includes(hora),
      precoCents,
      precoReais: precoCents / 100
    });
  }

  res.json({
    quadra: {
      id: quadra.id,
      nome: quadra.nome
    },
    data,
    horarios: horariosDisponiveis
  });
});

export default router;
