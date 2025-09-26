import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

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
  const produtos = await prisma.produto.findMany({
    where: {
      active: true,
      estoque: {
        quantidade: {
          lte: prisma.estoque.fields.minQuantidade
        }
      }
    },
    include: { estoque: true },
    orderBy: { name: 'asc' }
  });

  res.json(produtos);
});

export default router;
