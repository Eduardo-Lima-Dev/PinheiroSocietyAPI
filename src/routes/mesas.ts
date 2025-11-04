import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireUser } from '../middleware/auth.js';

const router = Router();

// Todas as rotas de mesas requerem autenticação (USER ou ADMIN)
router.use(requireAuth);
router.use(requireUser);

/**
 * @swagger
 * tags:
 *   name: Mesas
 *   description: Gestão de mesas do restaurante/bar
 */

/**
 * @swagger
 * /mesas:
 *   get:
 *     tags: [Mesas]
 *     summary: Lista todas as mesas
 *     parameters:
 *       - in: query
 *         name: ativa
 *         required: false
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: ocupada
 *         required: false
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de mesas
 */
router.get('/', async (req, res) => {
  const { ativa, ocupada } = req.query as { ativa?: string; ocupada?: string };
  
  const where: any = {};
  
  if (typeof ativa !== 'undefined') {
    where.ativa = ativa === 'true';
  }
  
  if (typeof ocupada !== 'undefined') {
    if (ocupada === 'true') {
      where.clienteId = { not: null };
    } else {
      where.clienteId = null;
    }
  }
  
  const mesas = await prisma.mesa.findMany({
    where,
    include: {
      cliente: { 
        select: { 
          id: true, 
          nomeCompleto: true, 
          telefone: true 
        } 
      },
      comandas: {
        where: { closedAt: null },
        select: {
          id: true,
          totalCents: true,
          openedAt: true
        }
      }
    },
    orderBy: { numero: 'asc' }
  });
  
  res.json(mesas);
});

/**
 * @swagger
 * /mesas/{id}:
 *   get:
 *     tags: [Mesas]
 *     summary: Obtém uma mesa por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Mesa encontrada
 *       404:
 *         description: Mesa não encontrada
 */
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const mesa = await prisma.mesa.findUnique({
    where: { id },
    include: {
      cliente: { 
        select: { 
          id: true, 
          nomeCompleto: true, 
          telefone: true,
          email: true
        } 
      },
      comandas: {
        include: {
          items: true
        }
      }
    }
  });

  if (!mesa) {
    return res.status(404).json({ message: 'Mesa não encontrada' });
  }

  res.json(mesa);
});

/**
 * @swagger
 * /mesas:
 *   post:
 *     tags: [Mesas]
 *     summary: Cria uma nova mesa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [numero]
 *             properties:
 *               numero:
 *                 type: integer
 *                 description: Número da mesa
 *               clienteId:
 *                 type: integer
 *                 description: ID do cliente que ocupará a mesa (opcional)
 *               ativa:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Mesa criada
 *       409:
 *         description: Número da mesa já existe
 *       404:
 *         description: Cliente não encontrado
 */
router.post('/', async (req, res) => {
  const { numero, clienteId, ativa = true } = req.body as {
    numero: number;
    clienteId?: number;
    ativa?: boolean;
  };

  // Verificar se número da mesa já existe
  const existingMesa = await prisma.mesa.findUnique({ where: { numero } });
  if (existingMesa) {
    return res.status(409).json({ message: 'Número da mesa já existe' });
  }

  // Verificar se cliente existe (se fornecido)
  if (clienteId) {
    const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
  }

  const mesa = await prisma.mesa.create({
    data: { numero, clienteId: clienteId ?? null, ativa },
    include: {
      cliente: { 
        select: { 
          id: true, 
          nomeCompleto: true, 
          telefone: true 
        } 
      }
    }
  });

  res.status(201).json(mesa);
});

/**
 * @swagger
 * /mesas/{id}:
 *   put:
 *     tags: [Mesas]
 *     summary: Atualiza uma mesa
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
 *               numero:
 *                 type: integer
 *               clienteId:
 *                 type: integer
 *               ativa:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Mesa atualizada
 *       404:
 *         description: Mesa não encontrada
 *       409:
 *         description: Número da mesa já existe
 */
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { numero, clienteId, ativa } = req.body as {
    numero?: number;
    clienteId?: number;
    ativa?: boolean;
  };

  // Verificar se mesa existe
  const mesaExistente = await prisma.mesa.findUnique({ where: { id } });
  if (!mesaExistente) {
    return res.status(404).json({ message: 'Mesa não encontrada' });
  }

  // Verificar se número já existe em outra mesa
  if (numero && numero !== mesaExistente.numero) {
    const existingMesa = await prisma.mesa.findUnique({ where: { numero } });
    if (existingMesa) {
      return res.status(409).json({ message: 'Número da mesa já existe' });
    }
  }

  // Verificar se cliente existe (se fornecido)
  if (clienteId) {
    const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
  }

  const mesa = await prisma.mesa.update({
    where: { id },
    data: {
      ...(numero && { numero }),
      ...(clienteId && { clienteId }),
      ...(typeof ativa === 'boolean' && { ativa })
    },
    include: {
      cliente: { 
        select: { 
          id: true, 
          nomeCompleto: true, 
          telefone: true 
        } 
      },
      comandas: {
        where: { closedAt: null },
        select: {
          id: true,
          totalCents: true,
          openedAt: true
        }
      }
    }
  });

  res.json(mesa);
});

/**
 * @swagger
 * /mesas/{id}:
 *   delete:
 *     tags: [Mesas]
 *     summary: Exclui uma mesa
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Mesa excluída
 *       404:
 *         description: Mesa não encontrada
 *       400:
 *         description: Mesa possui comanda ativa
 */
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  // Verificar se mesa existe
  const mesa = await prisma.mesa.findUnique({ where: { id } });
  if (!mesa) {
    return res.status(404).json({ message: 'Mesa não encontrada' });
  }

  // Verificar se mesa possui comanda ativa
  const comandaAtiva = await prisma.comanda.findFirst({
    where: { mesaId: id, closedAt: null }
  });

  if (comandaAtiva) {
    return res.status(400).json({
      message: 'Não é possível excluir mesa com comanda ativa',
      comandaId: comandaAtiva.id
    });
  }

  await prisma.mesa.delete({ where: { id } });
  res.json({ message: 'Mesa excluída com sucesso' });
});

/**
 * @swagger
 * /mesas/{id}/ocupar:
 *   post:
 *     tags: [Mesas]
 *     summary: Ocupa uma mesa com cliente
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
 *             required: [clienteId]
 *             properties:
 *               clienteId:
 *                 type: integer
 *                 description: ID do cliente que ocupará a mesa (opcional)
 *     responses:
 *       200:
 *         description: Mesa ocupada com sucesso
 *       404:
 *         description: Mesa ou cliente não encontrado
 *       400:
 *         description: Mesa já está ocupada
 */
router.post('/:id/ocupar', async (req, res) => {
  const id = Number(req.params.id);
  const { clienteId } = req.body as {
    clienteId: number;
  };

  // Verificar se mesa existe
  const mesa = await prisma.mesa.findUnique({ where: { id } });
  if (!mesa) {
    return res.status(404).json({ message: 'Mesa não encontrada' });
  }

  // Verificar se mesa já está ocupada
  if (mesa.clienteId) {
    return res.status(400).json({ message: 'Mesa já está ocupada' });
  }

  // Verificar se cliente existe
  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) {
    return res.status(404).json({ message: 'Cliente não encontrado' });
  }

  const mesaAtualizada = await prisma.mesa.update({
    where: { id },
    data: {
      clienteId
    },
    include: {
      cliente: { 
        select: { 
          id: true, 
          nomeCompleto: true, 
          telefone: true 
        } 
      },
      comandas: {
        where: { closedAt: null },
        select: {
          id: true,
          totalCents: true,
          openedAt: true
        }
      }
    }
  });

  res.json(mesaAtualizada);
});

/**
 * @swagger
 * /mesas/{id}/liberar:
 *   post:
 *     tags: [Mesas]
 *     summary: Libera uma mesa
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Mesa liberada com sucesso
 *       404:
 *         description: Mesa não encontrada
 *       400:
 *         description: Mesa já está livre
 */
router.post('/:id/liberar', async (req, res) => {
  const id = Number(req.params.id);

  // Verificar se mesa existe
  const mesa = await prisma.mesa.findUnique({ where: { id } });
  if (!mesa) {
    return res.status(404).json({ message: 'Mesa não encontrada' });
  }

  // Verificar se mesa já está livre
  if (!mesa.clienteId) {
    return res.status(400).json({ message: 'Mesa já está livre' });
  }

  const mesaAtualizada = await prisma.mesa.update({
    where: { id },
    data: {
      clienteId: null
    },
    include: {
      cliente: { 
        select: { 
          id: true, 
          nomeCompleto: true, 
          telefone: true 
        } 
      }
    }
  });

  res.json(mesaAtualizada);
});

export default router;
