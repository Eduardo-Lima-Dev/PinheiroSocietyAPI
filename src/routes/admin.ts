import { Router } from 'express';
import { processarReservasVencidas, verificarReservasVencidas } from '../services/reservas-service.js';
import reservasJob from '../jobs/reservas-job.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Todas as rotas administrativas requerem autenticação ADMIN
router.use(requireAuth);
router.use(requireAdmin);

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Endpoints administrativos para gerenciamento do sistema
 */

/**
 * @swagger
 * /admin/reservas/processar-vencidas:
 *   post:
 *     tags: [Admin]
 *     summary: Processa reservas vencidas manualmente
 *     description: Marca automaticamente todas as reservas ativas que passaram da data como CONCLUÍDA
 *     responses:
 *       200:
 *         description: Processamento concluído
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 processadas:
 *                   type: integer
 *                 mensagem:
 *                   type: string
 *                 reservas:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       cliente:
 *                         type: string
 *                       quadra:
 *                         type: string
 *                       data:
 *                         type: string
 *                       hora:
 *                         type: integer
 */
router.post('/reservas/processar-vencidas', async (req, res) => {
  try {
    const resultado = await processarReservasVencidas();
    res.json(resultado);
  } catch (error: any) {
    console.error('Erro ao processar reservas vencidas:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /admin/reservas/verificar-vencidas:
 *   get:
 *     tags: [Admin]
 *     summary: Verifica quantas reservas estão vencidas
 *     description: Lista todas as reservas ativas que passaram da data (sem processar)
 *     responses:
 *       200:
 *         description: Lista de reservas vencidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 quantidade:
 *                   type: integer
 *                 reservas:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       cliente:
 *                         type: string
 *                       quadra:
 *                         type: string
 *                       data:
 *                         type: string
 *                       hora:
 *                         type: integer
 *                       precoCents:
 *                         type: integer
 */
router.get('/reservas/verificar-vencidas', async (req, res) => {
  try {
    const resultado = await verificarReservasVencidas();
    res.json(resultado);
  } catch (error: any) {
    console.error('Erro ao verificar reservas vencidas:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /admin/jobs/reservas/status:
 *   get:
 *     tags: [Admin]
 *     summary: Verifica status do job automático de reservas
 *     responses:
 *       200:
 *         description: Status do job
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isRunning:
 *                   type: boolean
 *                 schedule:
 *                   type: string
 *                 timezone:
 *                   type: string
 *                 description:
 *                   type: string
 */
router.get('/jobs/reservas/status', (req, res) => {
  try {
    const status = reservasJob.getStatus();
    res.json(status);
  } catch (error: any) {
    console.error('Erro ao verificar status do job:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /admin/jobs/reservas/executar:
 *   post:
 *     tags: [Admin]
 *     summary: Executa o job de reservas manualmente
 *     responses:
 *       200:
 *         description: Job executado com sucesso
 *       500:
 *         description: Erro na execução do job
 */
router.post('/jobs/reservas/executar', async (req, res) => {
  try {
    await reservasJob.runManual();
    res.json({ message: 'Job executado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao executar job manualmente:', error);
    res.status(500).json({ 
      message: 'Erro na execução do job',
      error: error.message 
    });
  }
});

export default router;
