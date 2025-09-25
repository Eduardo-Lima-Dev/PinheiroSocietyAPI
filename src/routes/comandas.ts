import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Comandas
 *   description: Gestão de comandas e itens
 */

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
 *               userId:
 *                 type: integer
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comanda aberta
 */
router.post('/', async (req, res) => {
  const { userId, notes, customerName } = req.body as { userId?: number; notes?: string; customerName?: string };
  const comanda = await prisma.comanda.create({ data: { userId: userId ?? null, notes: notes ?? null, customerName: customerName ?? null } });
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
  const comanda = await prisma.comanda.findUnique({ where: { id }, include: { items: true, user: { select: { id: true, name: true } } } });
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
 *             required: [description, quantity, unitCents]
 *             properties:
 *               description:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               unitCents:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       201:
 *         description: Item adicionado
 */
router.post('/:id/itens', async (req, res) => {
  const id = Number(req.params.id);
  const { description, quantity, unitCents } = req.body as { description: string; quantity: number; unitCents: number };

  const item = await prisma.comandaItem.create({ data: { comandaId: id, description, quantity, unitCents } });
  // atualiza total
  const sum = await prisma.comandaItem.aggregate({ where: { comandaId: id }, _sum: { quantity: true, unitCents: true } });
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


