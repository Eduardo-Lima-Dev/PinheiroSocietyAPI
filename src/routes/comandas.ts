import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireUser } from '../middleware/auth.js';

const router = Router();

// Todas as rotas de comandas requerem autenticação (USER ou ADMIN)
router.use(requireAuth);
router.use(requireUser);

/**
 * @swagger
 * tags:
 *   name: Comandas
 *   description: Gestão de comandas e itens
 */

/**
 * @swagger
 * /comandas:
 *   get:
 *     tags: [Comandas]
 *     summary: Lista comandas com filtros opcionais
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [aberta, fechada]
 *         description: Filtrar por status da comanda
 *       - in: query
 *         name: clienteId
 *         schema:
 *           type: integer
 *         description: Filtrar por ID do cliente
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Limite de resultados por página
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Número de registros para pular
 *       - in: query
 *         name: dataInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início para filtrar comandas fechadas (formato YYYY-MM-DD)
 *       - in: query
 *         name: dataFim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim para filtrar comandas fechadas (formato YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lista de comandas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comandas:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       clienteId:
 *                         type: integer
 *                         nullable: true
 *                       openedAt:
 *                         type: string
 *                         format: date-time
 *                       closedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       totalCents:
 *                         type: integer
 *                       payment:
 *                         type: string
 *                         enum: [CASH, PIX, CARD]
 *                         nullable: true
 *                       notes:
 *                         type: string
 *                         nullable: true
 *                       cliente:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nomeCompleto:
 *                             type: string
 *                           telefone:
 *                             type: string
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             description:
 *                               type: string
 *                             quantity:
 *                               type: integer
 *                             unitCents:
 *                               type: integer
 *                             produtoId:
 *                               type: integer
 *                               nullable: true
 *                 total:
 *                   type: integer
 *                   description: Total de comandas encontradas
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *       400:
 *         description: Parâmetros inválidos
 */
router.get('/', async (req, res) => {
  const { 
    status, 
    clienteId, 
    limit = 50, 
    offset = 0, 
    dataInicio, 
    dataFim 
  } = req.query as { 
    status?: 'aberta' | 'fechada'; 
    clienteId?: string; 
    limit?: string; 
    offset?: string; 
    dataInicio?: string; 
    dataFim?: string; 
  };

  // Validar parâmetros numéricos
  const limitNum = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const offsetNum = Math.max(Number(offset) || 0, 0);

  // Construir filtros
  const where: any = {};

  // Filtro por status
  if (status === 'aberta') {
    where.closedAt = null;
  } else if (status === 'fechada') {
    where.closedAt = { not: null };
  }

  // Filtro por cliente
  if (clienteId) {
    const clienteIdNum = Number(clienteId);
    if (isNaN(clienteIdNum)) {
      return res.status(400).json({ message: 'clienteId deve ser um número válido' });
    }
    where.clienteId = clienteIdNum;
  }

  // Filtro por data (apenas para comandas fechadas)
  if (dataInicio || dataFim) {
    if (!where.closedAt) {
      where.closedAt = { not: null }; // Força filtrar apenas comandas fechadas
    }

    const dateFilter: any = {};
    
    if (dataInicio) {
      const inicio = new Date(dataInicio + 'T00:00:00');
      if (isNaN(inicio.getTime())) {
        return res.status(400).json({ message: 'dataInicio deve estar no formato YYYY-MM-DD' });
      }
      dateFilter.gte = inicio;
    }
    
    if (dataFim) {
      const fim = new Date(dataFim + 'T23:59:59');
      if (isNaN(fim.getTime())) {
        return res.status(400).json({ message: 'dataFim deve estar no formato YYYY-MM-DD' });
      }
      dateFilter.lte = fim;
    }

    if (Object.keys(dateFilter).length > 0) {
      where.closedAt = { ...where.closedAt, ...dateFilter };
    }
  }

  try {
    // Buscar comandas
    const comandas = await prisma.comanda.findMany({
      where,
    include: {
      items: true,
      cliente: { 
        select: { 
          id: true, 
          nomeCompleto: true, 
          telefone: true 
        } 
      },
      mesa: {
        select: {
          id: true,
          numero: true
        }
      }
    },
      orderBy: { openedAt: 'desc' },
      take: limitNum,
      skip: offsetNum
    });

    // Contar total para paginação
    const total = await prisma.comanda.count({ where });

    res.json({
      comandas,
      total,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < total
      }
    });

  } catch (error) {
    console.error('Erro ao buscar comandas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /comandas:
 *   post:
 *     tags: [Comandas]
 *     summary: Abre uma comanda
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clienteId:
 *                 type: integer
 *                 description: ID do cliente (opcional)
 *               mesaId:
 *                 type: integer
 *                 description: ID da mesa (opcional)
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comanda aberta
 */
router.post('/', async (req, res) => {
  const { clienteId, mesaId, notes } = req.body as { clienteId?: number; mesaId?: number; notes?: string };
  
  // Se clienteId foi informado, verificar se cliente existe
  if (clienteId) {
    const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
    if (!cliente) {
      return res.status(400).json({ message: 'Cliente não encontrado' });
    }
  }

  // Se mesaId foi informado, verificar se mesa existe
  if (mesaId) {
    const mesa = await prisma.mesa.findUnique({ where: { id: mesaId } });
    if (!mesa) {
      return res.status(400).json({ message: 'Mesa não encontrada' });
    }
  }
  
  const comanda = await prisma.comanda.create({ 
    data: { 
      clienteId: clienteId ?? null,
      mesaId: mesaId ?? null,
      notes: notes ?? null 
    } 
  });
  res.status(201).json(comanda);
});

/**
 * @swagger
 * /comandas/{id}:
 *   get:
 *     tags: [Comandas]
 *     summary: Obtém uma comanda
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Comanda encontrada
 *       404:
 *         description: Não encontrada
 */
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const comanda = await prisma.comanda.findUnique({ 
    where: { id }, 
    include: { 
      items: true, 
      cliente: { 
        select: { 
          id: true, 
          nomeCompleto: true, 
          telefone: true 
        } 
      },
      mesa: {
        select: {
          id: true,
          numero: true
        }
      }
    } 
  });
  if (!comanda) return res.status(404).json({ message: 'Comanda não encontrada' });
  res.json(comanda);
});

/**
 * @swagger
 * /comandas/{id}/itens:
 *   post:
 *     tags: [Comandas]
 *     summary: Adiciona item na comanda
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
 *             required: [quantity]
 *             properties:
 *               produtoId:
 *                 type: integer
 *                 description: ID do produto (opcional, se não informado será item customizado)
 *               description:
 *                 type: string
 *                 description: Descrição do item (obrigatório se produtoId não informado)
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               unitCents:
 *                 type: integer
 *                 minimum: 0
 *                 description: Preço unitário (obrigatório se produtoId não informado)
 *     responses:
 *       201:
 *         description: Item adicionado
 *       400:
 *         description: Produto não encontrado ou estoque insuficiente
 */
router.post('/:id/itens', async (req, res) => {
  const id = Number(req.params.id);
  const { produtoId, description, quantity, unitCents } = req.body as { 
    produtoId?: number; 
    description?: string; 
    quantity: number; 
    unitCents?: number; 
  };

  let finalDescription = description;
  let finalUnitCents = unitCents;

  // Se produtoId foi informado, buscar produto e verificar estoque
  if (produtoId) {
    const produto = await prisma.produto.findUnique({
      where: { id: produtoId, active: true },
      include: { estoque: true }
    });

    if (!produto) {
      return res.status(400).json({ message: 'Produto não encontrado ou inativo' });
    }

    if (produto.estoque && produto.estoque.quantidade < quantity) {
      return res.status(400).json({ 
        message: 'Estoque insuficiente', 
        disponivel: produto.estoque.quantidade,
        solicitado: quantity 
      });
    }

    finalDescription = produto.name;
    finalUnitCents = produto.priceCents;

    // Atualizar estoque
    if (produto.estoque) {
      await prisma.estoque.update({
        where: { produtoId },
        data: { quantidade: produto.estoque.quantidade - quantity }
      });
    }
  } else {
    // Item customizado - validar campos obrigatórios
    if (!description || !unitCents) {
      return res.status(400).json({ message: 'Para itens customizados, description e unitCents são obrigatórios' });
    }
  }

  const item = await prisma.comandaItem.create({ 
    data: { 
      comandaId: id, 
      produtoId: produtoId || null,
      description: finalDescription!, 
      quantity, 
      unitCents: finalUnitCents! 
    } 
  });

  // Atualizar total da comanda
  const items = await prisma.comandaItem.findMany({ where: { comandaId: id } });
  const totalCents = items.reduce((acc, it) => acc + it.quantity * it.unitCents, 0);
  await prisma.comanda.update({ where: { id }, data: { totalCents } });
  
  res.status(201).json(item);
});

/**
 * @swagger
 * /comandas/{id}/fechar:
 *   post:
 *     tags: [Comandas]
 *     summary: Fecha uma comanda
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
 *             required: [payment]
 *             properties:
 *               payment:
 *                 type: string
 *                 enum: [CASH, PIX, CARD]
 *     responses:
 *       200:
 *         description: Comanda fechada
 */
router.post('/:id/fechar', async (req, res) => {
  const id = Number(req.params.id);
  const { payment } = req.body as { payment: 'CASH' | 'PIX' | 'CARD' };
  const updated = await prisma.comanda.update({ where: { id }, data: { closedAt: new Date(), payment } });
  res.json(updated);
});

export default router;


