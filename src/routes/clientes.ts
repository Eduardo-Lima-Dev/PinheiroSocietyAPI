import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Clientes
 *   description: Gestão de clientes
 */

/**
 * @swagger
 * /clientes:
 *   get:
 *     tags: [Clientes]
 *     summary: Lista todos os clientes
 *     responses:
 *       200:
 *         description: Lista de clientes
 */
router.get('/', async (_req, res) => {
  const clientes = await prisma.cliente.findMany({
    select: {
      id: true,
      nomeCompleto: true,
      cpf: true,
      email: true,
      telefone: true,
      tipo: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: { nomeCompleto: 'asc' }
  });
  res.json(clientes);
});

/**
 * @swagger
 * /clientes/{id}:
 *   get:
 *     tags: [Clientes]
 *     summary: Obtém um cliente por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *       404:
 *         description: Cliente não encontrado
 */
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const cliente = await prisma.cliente. findUnique({
    where: { id },
    include: {
      comandas: {
        select: {
          id: true,
          openedAt: true,
          closedAt: true,
          totalCents: true,
          payment: true
        },
        orderBy: { openedAt: 'desc' },
        take: 10
      },
      reservas: {
        select: {
          id: true,
          data: true,
          hora: true,
          precoCents: true,
          status: true,
          quadra: {
            select: { nome: true }
          }
        },
        orderBy: { data: 'desc' },
        take: 10
      }
    }
  });

  if (!cliente) {
    return res.status(404).json({ message: 'Cliente não encontrado' });
  }

  res.json(cliente);
});

/**
 * @swagger
 * /clientes:
 *   post:
 *     tags: [Clientes]
 *     summary: Cria um novo cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nomeCompleto, cpf, email, telefone]
 *             properties:
 *               nomeCompleto:
 *                 type: string
 *               cpf:
 *                 type: string
 *               email:
 *                 type: string
 *               telefone:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [FIXO, VISITANTE]
 *                 default: VISITANTE
 *                 description: Tipo de cliente (FIXO para mensalista ou VISITANTE)
 *     responses:
 *       201:
 *         description: Cliente criado
 *       409:
 *         description: CPF ou email já cadastrado
 */
router.post('/', async (req, res) => {
  const { nomeCompleto, cpf, email, telefone, tipo } = req.body as {
    nomeCompleto: string;
    cpf: string;
    email: string;
    telefone: string;
    tipo?: 'FIXO' | 'VISITANTE';
  };

  // Verificar se CPF ou email já existem
  const existingCliente = await prisma.cliente.findFirst({
    where: {
      OR: [
        { cpf },
        { email }
      ]
    }
  });

  if (existingCliente) {
    const field = existingCliente.cpf === cpf ? 'CPF' : 'email';
    return res.status(409).json({ message: `${field} já cadastrado` });
  }

  // Validar tipo se fornecido
  if (tipo && !['FIXO', 'VISITANTE'].includes(tipo)) {
    return res.status(400).json({ message: 'Tipo de cliente inválido. Use FIXO ou VISITANTE' });
  }

  const cliente = await prisma.cliente.create({
    data: {
      nomeCompleto,
      cpf,
      email,
      telefone,
      tipo: tipo || 'VISITANTE'
    }
  });

  res.status(201).json(cliente);
});

/**
 * @swagger
 * /clientes/{id}:
 *   put:
 *     tags: [Clientes]
 *     summary: Atualiza um cliente
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
 *               nomeCompleto:
 *                 type: string
 *               cpf:
 *                 type: string
 *               email:
 *                 type: string
 *               telefone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cliente atualizado
 *       404:
 *         description: Cliente não encontrado
 *       409:
 *         description: CPF ou email já cadastrado
 */
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { nomeCompleto, cpf, email, telefone, tipo } = req.body as {
    nomeCompleto?: string;
    cpf?: string;
    email?: string;
    telefone?: string;
    tipo?: 'FIXO' | 'VISITANTE';
  };

  // Verificar se cliente existe
  const clienteExistente = await prisma.cliente.findUnique({ where: { id } });
  if (!clienteExistente) {
    return res.status(404).json({ message: 'Cliente não encontrado' });
  }

  // Verificar se CPF ou email já existem em outros clientes
  if (cpf || email) {
    const existingCliente = await prisma.cliente.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [
              ...(cpf ? [{ cpf }] : []),
              ...(email ? [{ email }] : [])
            ]
          }
        ]
      }
    });

    if (existingCliente) {
      const field = existingCliente.cpf === cpf ? 'CPF' : 'email';
      return res.status(409).json({ message: `${field} já cadastrado` });
    }
  }

  // Validar tipo se fornecido
  if (tipo && !['FIXO', 'VISITANTE'].includes(tipo)) {
    return res.status(400).json({ message: 'Tipo de cliente inválido. Use FIXO ou VISITANTE' });
  }

  const cliente = await prisma.cliente.update({
    where: { id },
    data: {
      ...(nomeCompleto && { nomeCompleto }),
      ...(cpf && { cpf }),
      ...(email && { email }),
      ...(telefone && { telefone }),
      ...(tipo && { tipo })
    }
  });

  res.json(cliente);
});

/**
 * @swagger
 * /clientes/{id}:
 *   delete:
 *     tags: [Clientes]
 *     summary: Exclui um cliente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cliente excluído
 *       404:
 *         description: Cliente não encontrado
 *       400:
 *         description: Cliente possui comandas ou reservas ativas
 */
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  // Verificar se cliente existe
  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) {
    return res.status(404).json({ message: 'Cliente não encontrado' });
  }

  // Verificar se cliente possui comandas ou reservas ativas
  const comandasAbertas = await prisma.comanda.count({
    where: { clienteId: id, closedAt: null }
  });

  const reservasAtivas = await prisma.reserva.count({
    where: { clienteId: id, status: 'ATIVA' }
  });

  if (comandasAbertas > 0 || reservasAtivas > 0) {
    return res.status(400).json({
      message: 'Não é possível excluir cliente com comandas abertas ou reservas ativas',
      comandasAbertas,
      reservasAtivas
    });
  }

  await prisma.cliente.delete({ where: { id } });
  res.json({ message: 'Cliente excluído com sucesso' });
});

/**
 * @swagger
 * /clientes/buscar:
 *   get:
 *     tags: [Clientes]
 *     summary: Busca clientes por CPF, nome ou email
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de clientes encontrados
 */
router.get('/buscar', async (req, res) => {
  const { q } = req.query as { q: string };

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ message: 'Termo de busca deve ter pelo menos 2 caracteres' });
  }

  const clientes = await prisma.cliente.findMany({
    where: {
      OR: [
        { nomeCompleto: { contains: q, mode: 'insensitive' } },
        { cpf: { contains: q } },
        { email: { contains: q, mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      nomeCompleto: true,
      cpf: true,
      email: true,
      telefone: true,
      tipo: true
    },
    orderBy: { nomeCompleto: 'asc' },
    take: 20
  });

  res.json(clientes);
});

export default router;
