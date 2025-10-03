import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Reservas
 *   description: Gestão de reservas de quadras
 */

/**
 * @swagger
 * /reservas:
 *   get:
 *     tags: [Reservas]
 *     summary: Lista reservas
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [ATIVA, CANCELADA, CONCLUIDA]
 *       - in: query
 *         name: dataInicio
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dataFim
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lista de reservas
 */
router.get('/', async (req, res) => {
  const { status, dataInicio, dataFim } = req.query;

  const where: any = {};

  if (status) {
    const statusStr = Array.isArray(status) ? String(status[0]) : String(status);
    where.status = statusStr;
  }

  if (dataInicio || dataFim) {
    where.data = {};
    if (dataInicio) {
      const dataInicioStr = Array.isArray(dataInicio) ? String(dataInicio[0]) : String(dataInicio);
      const dataInicioLimpa = dataInicioStr.trim();
      
      // Validar formato YYYY-MM-DD
      const formatoData = /^\d{4}-\d{2}-\d{2}$/;
      if (!formatoData.test(dataInicioLimpa)) {
        return res.status(400).json({ message: 'Formato de dataInicio inválido. Use YYYY-MM-DD' });
      }
      
      const inicio = new Date(dataInicioLimpa + 'T00:00:00');
      if (isNaN(inicio.getTime())) {
        return res.status(400).json({ message: 'Formato de dataInicio inválido. Use YYYY-MM-DD' });
      }
      
      where.data.gte = inicio;
    }
    if (dataFim) {
      const dataFimStr = Array.isArray(dataFim) ? String(dataFim[0]) : String(dataFim);
      const dataFimLimpa = dataFimStr.trim();
      
      // Validar formato YYYY-MM-DD
      const formatoData = /^\d{4}-\d{2}-\d{2}$/;
      if (!formatoData.test(dataFimLimpa)) {
        return res.status(400).json({ message: 'Formato de dataFim inválido. Use YYYY-MM-DD' });
      }
      
      const fim = new Date(dataFimLimpa + 'T23:59:59');
      if (isNaN(fim.getTime())) {
        return res.status(400).json({ message: 'Formato de dataFim inválido. Use YYYY-MM-DD' });
      }
      
      where.data.lte = fim;
    }
  }

  const reservas = await prisma.reserva.findMany({
    where,
    include: {
      cliente: {
        select: { id: true, nomeCompleto: true, telefone: true }
      },
      quadra: {
        select: { id: true, nome: true }
      }
    },
    orderBy: [{ data: 'asc' }, { hora: 'asc' }]
  });

  res.json(reservas);
});

/**
 * @swagger
 * /reservas/{id}:
 *   get:
 *     tags: [Reservas]
 *     summary: Obtém uma reserva por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reserva encontrada
 *       404:
 *         description: Reserva não encontrada
 */
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const reserva = await prisma.reserva.findUnique({
    where: { id },
    include: {
      cliente: true,
      quadra: true
    }
  });

  if (!reserva) {
    return res.status(404).json({ message: 'Reserva não encontrada' });
  }

  res.json(reserva);
});

/**
 * @swagger
 * /reservas:
 *   post:
 *     tags: [Reservas]
 *     summary: Cria uma nova reserva
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clienteId, quadraId, data, hora]
 *             properties:
 *               clienteId:
 *                 type: integer
 *               quadraId:
 *                 type: integer
 *               data:
 *                 type: string
 *                 format: date
 *               hora:
 *                 type: integer
 *                 minimum: 8
 *                 maximum: 23
 *               observacoes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reserva criada
 *       400:
 *         description: Dados inválidos
 *       409:
 *         description: Conflito de horário
 */
router.post('/', async (req, res) => {
  const { clienteId, quadraId, data, hora, observacoes } = req.body as {
    clienteId: number;
    quadraId: number;
    data: string;
    hora: number;
    observacoes?: string;
  };

  // Validações
  if (hora < 8 || hora > 23) {
    return res.status(400).json({ message: 'Hora deve estar entre 8 e 23' });
  }

  const dataReserva = new Date(data + 'T00:00:00');
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (dataReserva < hoje) {
    return res.status(400).json({ message: 'Não é possível agendar para datas passadas' });
  }

  // Verificar se cliente e quadra existem
  const [cliente, quadra] = await Promise.all([
    prisma.cliente.findUnique({ where: { id: clienteId } }),
    prisma.quadra.findUnique({ where: { id: quadraId } })
  ]);

  if (!cliente) {
    return res.status(400).json({ message: 'Cliente não encontrado' });
  }

  if (!quadra || !quadra.ativa) {
    return res.status(400).json({ message: 'Quadra não encontrada ou inativa' });
  }

  // Verificar conflito de horário
  const conflito = await prisma.reserva.findFirst({
    where: {
      quadraId,
      data: dataReserva,
      hora,
      status: 'ATIVA'
    }
  });

  if (conflito) {
    return res.status(409).json({ message: 'Horário já está ocupado' });
  }

  // Calcular preço baseado no horário
  const precoCents = hora < 17 ? 10000 : 11000; // 100 reais até 17h, 110 reais após

  const reserva = await prisma.reserva.create({
    data: {
      clienteId,
      quadraId,
      data: dataReserva,
      hora,
      precoCents,
      observacoes: observacoes || null
    },
    include: {
      cliente: {
        select: { id: true, nomeCompleto: true, telefone: true }
      },
      quadra: {
        select: { id: true, nome: true }
      }
    }
  });

  res.status(201).json(reserva);
});

/**
 * @swagger
 * /reservas/{id}/reagendar:
 *   put:
 *     tags: [Reservas]
 *     summary: Reagenda uma reserva
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
 *             required: [novaData, novaHora]
 *             properties:
 *               novaData:
 *                 type: string
 *                 format: date
 *               novaHora:
 *                 type: integer
 *                 minimum: 8
 *                 maximum: 23
 *               observacoes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reserva reagendada
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Reserva não encontrada
 *       409:
 *         description: Conflito de horário
 */
router.put('/:id/reagendar', async (req, res) => {
  const id = Number(req.params.id);
  const { novaData, novaHora, observacoes } = req.body as {
    novaData: string;
    novaHora: number;
    observacoes?: string;
  };

  // Validações
  if (novaHora < 8 || novaHora > 23) {
    return res.status(400).json({ message: 'Hora deve estar entre 8 e 23' });
  }

  const novaDataReserva = new Date(novaData + 'T00:00:00');
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (novaDataReserva < hoje) {
    return res.status(400).json({ message: 'Não é possível reagendar para datas passadas' });
  }

  // Verificar se reserva existe e está ativa
  const reserva = await prisma.reserva.findUnique({
    where: { id },
    include: { quadra: true }
  });

  if (!reserva) {
    return res.status(404).json({ message: 'Reserva não encontrada' });
  }

  if (reserva.status !== 'ATIVA') {
    return res.status(400).json({ message: 'Apenas reservas ativas podem ser reagendadas' });
  }

  // Verificar conflito de horário (excluindo a própria reserva)
  const conflito = await prisma.reserva.findFirst({
    where: {
      quadraId: reserva.quadraId,
      data: novaDataReserva,
      hora: novaHora,
      status: 'ATIVA',
      id: { not: id }
    }
  });

  if (conflito) {
    return res.status(409).json({ message: 'Novo horário já está ocupado' });
  }

  // Calcular novo preço baseado no horário
  const novoPrecoCents = novaHora < 17 ? 10000 : 11000;

  const reservaAtualizada = await prisma.reserva.update({
    where: { id },
    data: {
      data: novaDataReserva,
      hora: novaHora,
      precoCents: novoPrecoCents,
      observacoes: observacoes || reserva.observacoes
    },
    include: {
      cliente: {
        select: { id: true, nomeCompleto: true, telefone: true }
      },
      quadra: {
        select: { id: true, nome: true }
      }
    }
  });

  res.json(reservaAtualizada);
});

/**
 * @swagger
 * /reservas/{id}/cancelar:
 *   put:
 *     tags: [Reservas]
 *     summary: Cancela uma reserva
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reserva cancelada
 *       404:
 *         description: Reserva não encontrada
 *       400:
 *         description: Reserva já cancelada ou concluída
 */
router.put('/:id/cancelar', async (req, res) => {
  const id = Number(req.params.id);

  const reserva = await prisma.reserva.findUnique({ where: { id } });
  if (!reserva) {
    return res.status(404).json({ message: 'Reserva não encontrada' });
  }

  if (reserva.status !== 'ATIVA') {
    return res.status(400).json({ message: 'Apenas reservas ativas podem ser canceladas' });
  }

  const reservaCancelada = await prisma.reserva.update({
    where: { id },
    data: { status: 'CANCELADA' },
    include: {
      cliente: {
        select: { id: true, nomeCompleto: true, telefone: true }
      },
      quadra: {
        select: { id: true, nome: true }
      }
    }
  });

  res.json(reservaCancelada);
});

/**
 * @swagger
 * /reservas/{id}/concluir:
 *   put:
 *     tags: [Reservas]
 *     summary: Marca uma reserva como concluída
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reserva concluída
 *       404:
 *         description: Reserva não encontrada
 *       400:
 *         description: Reserva não está ativa
 */
router.put('/:id/concluir', async (req, res) => {
  const id = Number(req.params.id);

  const reserva = await prisma.reserva.findUnique({ where: { id } });
  if (!reserva) {
    return res.status(404).json({ message: 'Reserva não encontrada' });
  }

  if (reserva.status !== 'ATIVA') {
    return res.status(400).json({ message: 'Apenas reservas ativas podem ser concluídas' });
  }

  const reservaConcluida = await prisma.reserva.update({
    where: { id },
    data: { status: 'CONCLUIDA' },
    include: {
      cliente: {
        select: { id: true, nomeCompleto: true, telefone: true }
      },
      quadra: {
        select: { id: true, nome: true }
      }
    }
  });

  res.json(reservaConcluida);
});

export default router;
