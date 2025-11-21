import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireUser } from '../middleware/auth.js';

const router = Router();

// Todas as rotas de produtos requerem autenticação (USER ou ADMIN)
router.use(requireAuth);
router.use(requireUser);

/**
 * @swagger
 * tags:
 *   name: Produtos
 *   description: Gestão de produtos e estoque
 */

/**
 * @swagger
 * /produtos:
 *   get:
 *     tags: [Produtos]
 *     summary: Lista produtos com filtros e paginação
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [BEBIDA, COMIDA, SNACK, OUTROS]
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista de produtos paginada
 */
router.get('/', async (req, res) => {
  const { category, active, page = '1', pageSize = '10' } = req.query as {
    category?: string;
    active?: string;
    page?: string;
    pageSize?: string;
  };

  const pageNumber = Math.max(1, Number(page) || 1);
  const sizeNumber = Math.min(100, Math.max(1, Number(pageSize) || 10));

  const where: any = {};
  if (category) where.category = category;
  if (active !== undefined) where.active = active === 'true';

  const [total, produtos] = await Promise.all([
    prisma.produto.count({ where }),
    prisma.produto.findMany({
      where,
      include: { estoque: true },
      orderBy: { name: 'asc' },
      skip: (pageNumber - 1) * sizeNumber,
      take: sizeNumber
    })
  ]);

  res.json({
    data: produtos,
    pagination: {
      total,
      page: pageNumber,
      pageSize: sizeNumber,
      totalPages: Math.ceil(total / sizeNumber)
    }
  });
});

/**
 * @swagger
 * /produtos:
 *   post:
 *     tags: [Produtos]
 *     summary: Cria um produto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, category, priceCents]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [BEBIDA, COMIDA, SNACK, OUTROS]
 *               priceCents:
 *                 type: integer
 *               quantidade:
 *                 type: integer
 *                 default: 0
 *               minQuantidade:
 *                 type: integer
 *                 default: 0
 *     responses:
 *       201:
 *         description: Produto criado
 */
router.post('/', async (req, res) => {
  const { name, description, category, priceCents, quantidade = 0, minQuantidade = 0 } = req.body;

  const produto = await prisma.produto.create({
    data: {
      name,
      description,
      category,
      priceCents,
      estoque: {
        create: {
          quantidade,
          minQuantidade
        }
      }
    },
    include: { estoque: true }
  });

  res.status(201).json(produto);
});

/**
 * @swagger
 * /produtos/{id}:
 *   put:
 *     tags: [Produtos]
 *     summary: Atualiza um produto
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [BEBIDA, COMIDA, SNACK, OUTROS]
 *               priceCents:
 *                 type: integer
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Produto atualizado
 */
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, description, category, priceCents, active } = req.body;

  const produto = await prisma.produto.update({
    where: { id },
    data: { name, description, category, priceCents, active },
    include: { estoque: true }
  });

  res.json(produto);
});

/**
 * @swagger
 * /produtos/{id}/estoque:
 *   put:
 *     tags: [Produtos]
 *     summary: Atualiza estoque de um produto
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
 *             required: [quantidade]
 *             properties:
 *               quantidade:
 *                 type: integer
 *               minQuantidade:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Estoque atualizado
 */
router.put('/:id/estoque', async (req, res) => {
  const id = Number(req.params.id);
  const { quantidade, minQuantidade } = req.body;

  // Buscar estoque atual para registrar movimentação
  const estoqueAtual = await prisma.estoque.findUnique({
    where: { produtoId: id }
  });
  const quantidadeAnterior = estoqueAtual?.quantidade ?? 0;

  const estoque = await prisma.estoque.upsert({
    where: { produtoId: id },
    update: { quantidade, minQuantidade },
    create: { produtoId: id, quantidade, minQuantidade }
  });

  // Registrar movimentação de ajuste direto (tratado como ENTRADA ou SAIDA conforme variação)
  const diferenca = quantidade - quantidadeAnterior;
  if (diferenca !== 0) {
    await prisma.movimentacaoEstoque.create({
      data: {
        produtoId: id,
        tipo: diferenca > 0 ? 'ENTRADA' : 'SAIDA',
        quantidade: Math.abs(diferenca),
        quantidadeAntes: quantidadeAnterior,
        quantidadeDepois: quantidade,
        observacao: 'Ajuste direto de estoque'
      }
    });
  }

  res.json(estoque);
});

/**
 * @swagger
 * /produtos/{id}/movimentacoes:
 *   get:
 *     tags: [Produtos]
 *     summary: Lista movimentações de estoque de um produto com paginação
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista paginada de movimentações
 */
router.get('/:id/movimentacoes', async (req, res) => {
  const id = Number(req.params.id);
  const { page = '1', pageSize = '10' } = req.query;

  const pageNumber = Math.max(1, Number(page) || 1);
  const sizeNumber = Math.min(100, Math.max(1, Number(pageSize) || 10));

  const [total, movimentos] = await Promise.all([
    prisma.movimentacaoEstoque.count({ where: { produtoId: id } }),
    prisma.movimentacaoEstoque.findMany({
      where: { produtoId: id },
      orderBy: { createdAt: 'desc' },
      skip: (pageNumber - 1) * sizeNumber,
      take: sizeNumber
    })
  ]);

  res.json({
    data: movimentos,
    pagination: {
      total,
      page: pageNumber,
      pageSize: sizeNumber,
      totalPages: Math.ceil(total / sizeNumber)
    }
  });
});

/**
 * @swagger
 * /produtos/estoque-baixo:
 *   get:
 *     tags: [Produtos]
 *     summary: Lista produtos com estoque baixo com paginação
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista de produtos com estoque baixo paginada
 */
router.get('/estoque-baixo', async (req, res) => {
  const { page = '1', pageSize = '10' } = req.query;
  const pageNumber = Math.max(1, Number(page) || 1);
  const sizeNumber = Math.min(100, Math.max(1, Number(pageSize) || 10));

  // Buscar produtos ativos com estoque
  const produtos = await prisma.produto.findMany({
    where: {
      active: true,
      estoque: {
        isNot: null
      }
    },
    include: { estoque: true },
    orderBy: { name: 'asc' }
  });

  // Filtrar produtos com estoque baixo
  const produtosEstoqueBaixo = produtos.filter(produto => {
    if (!produto.estoque) return false;
    return produto.estoque.quantidade <= produto.estoque.minQuantidade;
  });

  const total = produtosEstoqueBaixo.length;
  const inicio = (pageNumber - 1) * sizeNumber;
  const fim = inicio + sizeNumber;
  const pageData = produtosEstoqueBaixo.slice(inicio, fim);

  res.json({
    data: pageData,
    pagination: {
      total,
      page: pageNumber,
      pageSize: sizeNumber,
      totalPages: Math.ceil(total / sizeNumber)
    }
  });
});

/**
 * @swagger
 * /produtos/{id}/entrada-estoque:
 *   post:
 *     tags: [Produtos]
 *     summary: Adiciona quantidade ao estoque de um produto
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
 *             required: [quantidade]
 *             properties:
 *               quantidade:
 *                 type: integer
 *                 minimum: 1
 *               observacao:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estoque atualizado com sucesso
 *       404:
 *         description: Produto não encontrado
 *       400:
 *         description: Quantidade inválida
 */
router.post('/:id/entrada-estoque', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { quantidade, observacao } = req.body;

    // Validações
    if (!quantidade || quantidade <= 0) {
      return res.status(400).json({ message: 'Quantidade deve ser maior que zero' });
    }

    // Verificar se produto existe
    const produto = await prisma.produto.findUnique({
      where: { id },
      include: { estoque: true }
    });

    if (!produto) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    // Buscar estoque atual
    const estoqueAtual = produto.estoque;
    const quantidadeAnterior = estoqueAtual?.quantidade || 0;
    const novaQuantidade = quantidadeAnterior + quantidade;

    // Atualizar ou criar estoque
    const estoqueAtualizado = await prisma.estoque.upsert({
      where: { produtoId: id },
      update: {
        quantidade: novaQuantidade,
        updatedAt: new Date()
      },
      create: {
        produtoId: id,
        quantidade: novaQuantidade,
        minQuantidade: 0
      }
    });

    // Registrar movimentação de estoque (entrada)
    await prisma.movimentacaoEstoque.create({
      data: {
        produtoId: id,
        tipo: 'ENTRADA',
        quantidade,
        quantidadeAntes: quantidadeAnterior,
        quantidadeDepois: novaQuantidade,
        observacao
      }
    });

    res.json({
      message: 'Entrada de estoque realizada com sucesso',
      produto: {
        id: produto.id,
        name: produto.name
      },
      estoque: {
        quantidadeAnterior,
        quantidadeAdicionada: quantidade,
        novaQuantidade: estoqueAtualizado.quantidade,
        minQuantidade: estoqueAtualizado.minQuantidade,
        observacao: observacao || null
      }
    });
  } catch (error) {
    console.error('Erro ao adicionar entrada de estoque:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;
