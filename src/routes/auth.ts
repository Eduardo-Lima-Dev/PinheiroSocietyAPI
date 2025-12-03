import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../services/email-service.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticação e login
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login de usuário (ADMIN ou USER)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *       401:
  *         description: Credenciais inválidas
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: 'Credenciais inválidas' });
  
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: 'Credenciais inválidas' });

  const secret = process.env.JWT_SECRET || 'dev-secret';
  const token = jwt.sign({ sub: user.id, role: user.role }, secret, { expiresIn: '8h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Solicita recuperação de senha (envia código de 6 dígitos por email)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email com código de verificação enviado com sucesso
 *       400:
 *         description: Email não fornecido
 *       500:
 *         description: Erro ao enviar email
 */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body as { email: string };

  if (!email) {
    return res.status(400).json({ message: 'Email é obrigatório' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    // Por segurança, sempre retornamos sucesso mesmo se o usuário não existir
    // Isso evita que atacantes descubram quais emails estão cadastrados
    if (!user) {
      return res.json({ message: 'Se o email estiver cadastrado, você receberá um email com código de verificação.' });
    }

    // Gerar código de 6 dígitos (000000 a 999999)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora a partir de agora

    // Salvar código no banco de dados
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetCode,
        resetTokenExpiry,
      },
    });

    // Enviar email com código
    await sendPasswordResetEmail(user.email, resetCode);

    res.json({ message: 'Se o email estiver cadastrado, você receberá um email com código de verificação.' });
  } catch (error) {
    console.error('Erro ao processar recuperação de senha:', error);
    res.status(500).json({ message: 'Erro ao processar solicitação de recuperação de senha' });
  }
});

/**
 * @swagger
 * /auth/verify-code:
 *   post:
 *     tags: [Auth]
 *     summary: Valida o código de verificação de 6 dígitos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário
 *               code:
 *                 type: string
 *                 description: Código de 6 dígitos recebido por email
 *     responses:
 *       200:
 *         description: Código válido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 resetToken:
 *                   type: string
 *                   description: Token temporário para redefinir a senha (válido por 15 minutos)
 *       400:
 *         description: Código inválido ou expirado
 */
router.post('/verify-code', async (req, res) => {
  const { email, code } = req.body as { email: string; code: string };

  if (!email || !code) {
    return res.status(400).json({ message: 'Email e código são obrigatórios' });
  }

  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ message: 'Código inválido. Deve conter exatamente 6 dígitos numéricos' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        email,
        resetToken: code,
        resetTokenExpiry: {
          gt: new Date(), // Código ainda não expirou
        },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Código inválido ou expirado. Verifique se o código está correto e se não expirou (válido por 1 hora)' });
    }

    // Gerar token JWT temporário para redefinir senha (válido por 15 minutos)
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const resetToken = jwt.sign(
      { 
        sub: user.id, 
        email: user.email,
        type: 'password-reset' 
      }, 
      secret, 
      { expiresIn: '15m' }
    );

    // Limpar o código de verificação (já foi usado)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.json({ 
      message: 'Código verificado com sucesso',
      resetToken 
    });
  } catch (error) {
    console.error('Erro ao verificar código:', error);
    res.status(500).json({ message: 'Erro ao verificar código' });
  }
});

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Redefine a senha usando o token de reset (obtido após verificar o código)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [resetToken, newPassword]
 *             properties:
 *               resetToken:
 *                 type: string
 *                 description: Token temporário recebido após verificar o código
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: Nova senha
 *     responses:
 *       200:
 *         description: Senha redefinida com sucesso
 *       400:
 *         description: Token inválido ou expirado, ou senha muito curta
 *       401:
 *         description: Token inválido ou não autorizado
 */
router.post('/reset-password', async (req, res) => {
  const { resetToken, newPassword } = req.body as { resetToken: string; newPassword: string };

  if (!resetToken || !newPassword) {
    return res.status(400).json({ message: 'Token de reset e nova senha são obrigatórios' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'A senha deve ter no mínimo 6 caracteres' });
  }

  try {
    // Verificar e decodificar o token JWT
    const secret = process.env.JWT_SECRET || 'dev-secret';
    let decoded: any;
    
    try {
      decoded = jwt.verify(resetToken, secret);
    } catch (error) {
      return res.status(401).json({ message: 'Token inválido ou expirado. Por favor, solicite um novo código de verificação.' });
    }

    // Verificar se o token é do tipo correto
    if (decoded.type !== 'password-reset') {
      return res.status(401).json({ message: 'Token inválido' });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({ 
      where: { id: decoded.sub } 
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ message: 'Erro ao redefinir senha' });
  }
});

export default router;


