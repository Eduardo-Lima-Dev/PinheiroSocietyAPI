import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Estender o tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: 'ADMIN' | 'USER';
      };
    }
  }
}

/**
 * Middleware de autenticação JWT
 * Verifica se o token está presente e válido
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: 'Token de autenticação não fornecido' });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({ message: 'Token de autenticação inválido' });
    }

    const secret = process.env.JWT_SECRET || 'dev-secret';
    const decoded = jwt.verify(token, secret);
    
    // Verificar se o token decodificado tem a estrutura esperada
    if (typeof decoded === 'string' || !decoded || typeof decoded !== 'object') {
      return res.status(401).json({ message: 'Token inválido' });
    }
    
    const payload = decoded as unknown as { sub: number; role: 'ADMIN' | 'USER' };
    
    if (!payload.sub || !payload.role) {
      return res.status(401).json({ message: 'Token inválido: estrutura incorreta' });
    }

    // Adicionar informações do usuário à requisição
    req.user = {
      id: payload.sub,
      role: payload.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Token inválido ou expirado' });
    }
    return res.status(500).json({ message: 'Erro ao verificar autenticação' });
  }
};

/**
 * Middleware para verificar se o usuário é ADMIN
 * Deve ser usado após requireAuth
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Autenticação necessária' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem realizar esta ação' });
  }

  next();
};

/**
 * Middleware para verificar se o usuário é USER ou ADMIN
 * Útil para rotas que precisam de autenticação mas aceitam ambos os roles
 * Deve ser usado após requireAuth
 */
export const requireUser = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Autenticação necessária' });
  }

  if (req.user.role !== 'USER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Acesso negado' });
  }

  next();
};

