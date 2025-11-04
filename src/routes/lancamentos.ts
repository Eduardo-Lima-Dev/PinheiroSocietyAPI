import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireUser } from '../middleware/auth.js';

const router = Router();

// Todas as rotas de lançamentos requerem autenticação (USER ou ADMIN)
router.use(requireAuth);
router.use(requireUser);

/**
 * @swagger
 * tags:
 *   name: Lançamentos
 *   description: Gestão de lançamentos diretos (vendas sem comanda)
 */

/**
 * @swagger
 * /lancamentos:
 *   post:
 *     tags: [Lançamentos]
 *     summary: Criar novo lançamento com produto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [payment, produtoId, quantity]
 *             properties:
 *               clienteId:
 *                 type: integer
 *                 description: ID do cliente (opcional)
 *               nomeCliente:
 *                 type: string
 *                 description: Nome do cliente (opcional)
 *               payment:
 *                 type: string
 *                 enum: [CASH, PIX, CARD]
 *               produtoId:
 *                 type: integer
 *                 description: ID do produto
 *               quantity:
 *                 type: integer
 *                 description: Quantidade do produto
 *               description:
 *                 type: string
 *                 description: Descrição customizada (opcional se produtoId for fornecido)
 *               unitCents:
 *                 type: integer
 *                 description: Preço unitário em centavos (opcional se produtoId for fornecido)
 *     responses:
 *       201:
 *         description: Lançamento criado com sucesso
 *       400:
 *         description: Dados inválidos ou estoque insuficiente
 *       404:
 *         description: Cliente ou produto não encontrado
 */
router.post('/', async (req, res) => {
  try {
    const { clienteId, nomeCliente, payment, produtoId, quantity = 1, description, unitCents } = req.body;

    // Validações básicas
    if (!payment) {
      return res.status(400).json({ message: 'Método de pagamento é obrigatório' });
    }

    if (!produtoId && (!description || !unitCents)) {
      return res.status(400).json({ message: 'ProdutoId ou (description + unitCents) são obrigatórios' });
    }

    // Se clienteId foi fornecido, verificar se cliente existe
    if (clienteId) {
      const cliente = await prisma.cliente.findUnique({
        where: { id: Number(clienteId) }
      });

      if (!cliente) {
        return res.status(404).json({ message: 'Cliente não encontrado' });
      }
    }

    let produto = null;
    let itemDescription = description;
    let itemUnitCents = unitCents;

    // Se produtoId foi fornecido, buscar produto e validar estoque
    if (produtoId) {
      produto = await prisma.produto.findUnique({
        where: { id: Number(produtoId) },
        include: { estoque: true }
      });

      if (!produto) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }

      if (!produto.active) {
        return res.status(400).json({ message: 'Produto está inativo' });
      }

      // Verificar estoque
      const estoqueAtual = produto.estoque?.quantidade || 0;
      if (estoqueAtual < quantity) {
        return res.status(400).json({ 
          message: `Estoque insuficiente. Disponível: ${estoqueAtual}, Solicitado: ${quantity}` 
        });
      }

      itemDescription = produto.name;
      itemUnitCents = produto.priceCents;
    }

    const totalItemCents = quantity * itemUnitCents;

    // Criar lançamento com item
    const lancamento = await prisma.lancamento.create({
      data: {
        clienteId: clienteId ? Number(clienteId) : null,
        nomeCliente: nomeCliente || null,
        payment,
        totalCents: totalItemCents,
        items: {
          create: {
            produtoId: produtoId ? Number(produtoId) : null,
            description: itemDescription,
            quantity,
            unitCents: itemUnitCents
          }
        }
      },
      include: {
        cliente: true,
        items: {
          include: { produto: true }
        }
      }
    });

    // Se há produto, atualizar estoque
    if (produto && produto.estoque) {
      await prisma.estoque.update({
        where: { produtoId: produto.id },
        data: {
          quantidade: produto.estoque.quantidade - quantity
        }
      });
    }

    res.status(201).json(lancamento);
  } catch (error) {
    console.error('Erro ao criar lançamento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /lancamentos/{id}/itens:
 *   post:
 *     tags: [Lançamentos]
 *     summary: Adicionar item ao lançamento
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
 *               produtoId:
 *                 type: integer
 *                 description: ID do produto (opcional)
 *               description:
 *                 type: string
 *                 description: Descrição do item (obrigatório se produtoId não for fornecido)
 *               quantity:
 *                 type: integer
 *                 default: 1
 *               unitCents:
 *                 type: integer
 *                 description: Preço unitário em centavos (obrigatório se produtoId não for fornecido)
 *     responses:
 *       201:
 *         description: Item adicionado com sucesso
 *       400:
 *         description: Dados inválidos ou estoque insuficiente
 *       404:
 *         description: Lançamento ou produto não encontrado
 */
router.post('/:id/itens', async (req, res) => {
  try {
    const lancamentoId = Number(req.params.id);
    const { produtoId, description, quantity = 1, unitCents } = req.body;

    // Verificar se lançamento existe
    const lancamento = await prisma.lancamento.findUnique({
      where: { id: lancamentoId }
    });

    if (!lancamento) {
      return res.status(404).json({ message: 'Lançamento não encontrado' });
    }

    let produto = null;
    let itemDescription = description;
    let itemUnitCents = unitCents;

    // Se produtoId foi fornecido, buscar produto e validar estoque
    if (produtoId) {
      produto = await prisma.produto.findUnique({
        where: { id: Number(produtoId) },
        include: { estoque: true }
      });

      if (!produto) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }

      if (!produto.active) {
        return res.status(400).json({ message: 'Produto está inativo' });
      }

      // Verificar estoque
      const estoqueAtual = produto.estoque?.quantidade || 0;
      if (estoqueAtual < quantity) {
        return res.status(400).json({ 
          message: `Estoque insuficiente. Disponível: ${estoqueAtual}, Solicitado: ${quantity}` 
        });
      }

      itemDescription = produto.name;
      itemUnitCents = produto.priceCents;
    } else {
      // Se não há produtoId, description e unitCents são obrigatórios
      if (!description || !unitCents) {
        return res.status(400).json({ 
          message: 'Description e unitCents são obrigatórios quando produtoId não é fornecido' 
        });
      }
    }

    // Criar item do lançamento
    const lancamentoItem = await prisma.lancamentoItem.create({
      data: {
        lancamentoId,
        produtoId: produtoId ? Number(produtoId) : null,
        description: itemDescription,
        quantity,
        unitCents: itemUnitCents
      }
    });

    // Se há produto, atualizar estoque
    if (produto && produto.estoque) {
      await prisma.estoque.update({
        where: { produtoId: produto.id },
        data: {
          quantidade: produto.estoque.quantidade - quantity
        }
      });
    }

    // Recalcular total do lançamento
    const totalItemCents = quantity * itemUnitCents;
    const novoTotal = lancamento.totalCents + totalItemCents;

    await prisma.lancamento.update({
      where: { id: lancamentoId },
      data: { totalCents: novoTotal }
    });

    // Buscar lançamento atualizado
    const lancamentoAtualizado = await prisma.lancamento.findUnique({
      where: { id: lancamentoId },
      include: {
        cliente: true,
        items: {
          include: { produto: true }
        }
      }
    });

    res.status(201).json({
      message: 'Item adicionado com sucesso',
      item: lancamentoItem,
      lancamento: lancamentoAtualizado
    });
  } catch (error) {
    console.error('Erro ao adicionar item ao lançamento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /lancamentos/{id}:
 *   get:
 *     tags: [Lançamentos]
 *     summary: Buscar lançamento específico
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lançamento encontrado
 *       404:
 *         description: Lançamento não encontrado
 */
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    const lancamento = await prisma.lancamento.findUnique({
      where: { id },
      include: {
        cliente: true,
        items: {
          include: { produto: true }
        }
      }
    });

    if (!lancamento) {
      return res.status(404).json({ message: 'Lançamento não encontrado' });
    }

    res.json(lancamento);
  } catch (error) {
    console.error('Erro ao buscar lançamento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /lancamentos:
 *   get:
 *     tags: [Lançamentos]
 *     summary: Listar todos os lançamentos
 *     parameters:
 *       - in: query
 *         name: dataInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início do filtro
 *       - in: query
 *         name: dataFim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim do filtro
 *       - in: query
 *         name: clienteId
 *         schema:
 *           type: integer
 *         description: Filtrar por cliente específico
 *     responses:
 *       200:
 *         description: Lista de lançamentos
 */
router.get('/', async (req, res) => {
  try {
    const { dataInicio, dataFim, clienteId } = req.query;

    let whereClause: any = {};

    // Filtro por data
    if (dataInicio || dataFim) {
      whereClause.createdAt = {};
      if (dataInicio) {
        whereClause.createdAt.gte = new Date(dataInicio as string);
      }
      if (dataFim) {
        whereClause.createdAt.lte = new Date(dataFim as string);
      }
    }

    // Filtro por cliente
    if (clienteId) {
      whereClause.clienteId = Number(clienteId);
    }

    const lancamentos = await prisma.lancamento.findMany({
      where: whereClause,
      include: {
        cliente: true,
        items: {
          include: { produto: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(lancamentos);
  } catch (error) {
    console.error('Erro ao listar lançamentos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;
