import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestão de usuários
 */

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Lista usuários
 *     responses:
 *       200:
 *         description: Lista de usuários
 */
router.get('/', async (_req, res) => {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true } });
  res.json(users);
});

/**
 * @swagger
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Cria um usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, USER]
 *     responses:
 *       201:
 *         description: Usuário criado
 *       409:
 *         description: E-mail já cadastrado
 */
router.post('/', async (req, res) => {
  const { name, email, password, role } = req.body as { name: string; email: string; password: string; role: 'ADMIN' | 'USER' };

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ message: 'E-mail já cadastrado' });

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, password: hash, role } });
  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Atualiza um usuário
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
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, USER]
 *     responses:
 *       200:
 *         description: Usuário atualizado
 *       404:
 *         description: Usuário não encontrado
 *       409:
 *         description: E-mail já cadastrado
 */
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, email, role } = req.body as {
    name?: string;
    email?: string;
    role?: 'ADMIN' | 'USER';
  };

  // Verificar se usuário existe
  const userExistente = await prisma.user.findUnique({ where: { id } });
  if (!userExistente) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }

  // Verificar se email já existe em outro usuário
  if (email && email !== userExistente.email) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'E-mail já cadastrado' });
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(email && { email }),
      ...(role && { role })
    }
  });

  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Exclui um usuário
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuário excluído
 *       404:
 *         description: Usuário não encontrado
 *       400:
 *         description: Não é possível excluir o último administrador
 */
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  // Verificar se usuário existe
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }

  // Verificar se é o último administrador
  if (user.role === 'ADMIN') {
    const totalAdmins = await prisma.user.count({
      where: { role: 'ADMIN' }
    });
    
    if (totalAdmins === 1) {
      return res.status(400).json({ 
        message: 'Não é possível excluir o último administrador do sistema' 
      });
    }
  }

  await prisma.user.delete({ where: { id } });
  res.json({ message: 'Usuário excluído com sucesso' });
});

export default router;


