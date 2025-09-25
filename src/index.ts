import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import usersRouter from './routes/users.js';
import rachasRouter from './routes/rachas.js';
import comandasRouter from './routes/comandas.js';
import authRouter from './routes/auth.js';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Configuração do Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'PinheiroSocietyAPI - Documentação'
}));

// Rotas principais
app.use('/users', usersRouter);
app.use('/rachas', rachasRouter);
app.use('/comandas', comandasRouter);
app.use('/auth', authRouter);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Verifica o status da API
 *     description: Endpoint para verificar se a API está funcionando corretamente
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API funcionando corretamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', name: 'PinheiroSocietyAPI' });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log('🚀 Servidor rodando em http://localhost:' + port);
  console.log('📚 Documentação Swagger disponível em http://localhost:' + port + '/api-docs');
});
