import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
//import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
type UserRole = 'ADMIN' | 'USER';
type UserStatus = 'ATIVO' | 'INATIVO';

const userSelect = {
  id: true,
  name: true,
  email: true,
  cpf: true,
  role: true,
  status: true,
  createdAt: true
} as const;

const parseStatus = (status?: string): UserStatus | undefined => {
  if (!status) return undefined;
  if (status === 'ATIVO' || status === 'INATIVO') return status;
  return undefined;
};

// Todas as rotas de usuários requerem autenticação ADMIN
//router.use(requireAuth);
//router.use(requireAdmin);

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
  const users = await prisma.user.findMany({
    select: userSelect,
    orderBy: { createdAt: 'desc' }
  });
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
 *             required: [name, email, cpf, password, role]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               cpf:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, USER]
 *               status:
 *                 type: string
 *                 enum: [ATIVO, INATIVO]
 *     responses:
 *       201:
 *         description: Usuário criado
 *       409:
 *         description: E-mail já cadastrado
 */
router.post('/', async (req, res) => {
  const { name, email, cpf, password, role, status } = req.body as {
    name: string;
    email: string;
    cpf: string;
    password: string;
    role: UserRole;
    status?: UserStatus;
  };

  const parsedStatus = parseStatus(status);
  if (status && !parsedStatus) {
    return res.status(400).json({ message: 'Status inválido' });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ message: 'E-mail já cadastrado' });

  const cpfExists = await prisma.user.findUnique({ where: { cpf } });
  if (cpfExists) return res.status(409).json({ message: 'CPF já cadastrado' });

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, cpf, password: hash, role, status: parsedStatus ?? 'ATIVO' }
  });
  res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    cpf: user.cpf,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt
  });
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
 *               cpf:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, USER]
 *               status:
 *                 type: string
 *                 enum: [ATIVO, INATIVO]
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
  const { name, email, cpf, role, status } = req.body as {
    name?: string;
    email?: string;
    cpf?: string;
    role?: UserRole;
    status?: UserStatus;
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

  if (cpf && cpf !== userExistente.cpf) {
    const existingCpf = await prisma.user.findUnique({ where: { cpf } });
    if (existingCpf) {
      return res.status(409).json({ message: 'CPF já cadastrado' });
    }
  }

  const parsedStatus = parseStatus(status);
  if (status && !parsedStatus) {
    return res.status(400).json({ message: 'Status inválido' });
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(email && { email }),
      ...(cpf && { cpf }),
      ...(role && { role }),
      ...(parsedStatus && { status: parsedStatus })
    }
  });

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    cpf: user.cpf,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt
  });
});

/**
 * @swagger
 * /users/search:
 *   get:
 *     tags: [Users]
 *     summary: Busca usuários com paginação
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Termo para buscar por nome ou CPF
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ATIVO, INATIVO]
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
 *         description: Resultado da busca
 */
router.get('/search', async (req, res) => {
  const { q, status, page = '1', pageSize = '10' } = req.query;
  const pageNumber = Math.max(1, Number(page) || 1);
  const sizeNumber = Math.min(100, Math.max(1, Number(pageSize) || 10));
  const parsedStatus = parseStatus(typeof status === 'string' ? status : undefined);

  if (status && !parsedStatus) {
    return res.status(400).json({ message: 'Status inválido' });
  }

  const term = typeof q === 'string' && q.trim().length > 0 ? q.trim() : undefined;
  const orFilters: Record<string, unknown>[] = [];
  if (term) {
    orFilters.push({ name: { contains: term, mode: 'insensitive' } });
    const numericTerm = term.replace(/\D/g, '');
    if (numericTerm.length > 0) {
      orFilters.push({ cpf: { contains: numericTerm } });
    }
  }

  const where = {
    ...(orFilters.length ? { OR: orFilters } : {}),
    ...(parsedStatus ? { status: parsedStatus } : {})
  };

  const [total, data] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip: (pageNumber - 1) * sizeNumber,
      take: sizeNumber,
      orderBy: { createdAt: 'desc' },
      select: userSelect
    })
  ]);

  res.json({
    data,
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


