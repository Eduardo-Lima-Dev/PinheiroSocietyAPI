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
 *     summary: Lista produtos
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
 *     responses:
 *       200:
 *         description: Lista de produtos
 */
router.get('/', async (req, res) => {
  const { category, active } = req.query as { category?: string; active?: string };
  
  const where: any = {};
  if (category) where.category = category;
  if (active !== undefined) where.active = active === 'true';

  const produtos = await prisma.produto.findMany({
    where,
    include: { estoque: true },
    orderBy: { name: 'asc' }
  });
  
  res.json(produtos);
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

  const estoque = await prisma.estoque.upsert({
    where: { produtoId: id },
    update: { quantidade, minQuantidade },
    create: { produtoId: id, quantidade, minQuantidade }
  });

  res.json(estoque);
});

/**
 * @swagger
 * /produtos/estoque-baixo:
 *   get:
 *     tags: [Produtos]
 *     summary: Lista produtos com estoque baixo
 *     responses:
 *       200:
 *         description: Lista de produtos com estoque baixo
 */
router.get('/estoque-baixo', async (req, res) => {
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

  res.json(produtosEstoqueBaixo);
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
