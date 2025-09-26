import swaggerJsdoc from 'swagger-jsdoc';
import type { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'PinheiroSocietyAPI',
    version: '1.0.0',
    description: 'API da Pinheiro Society - Documentação completa dos endpoints',
    contact: {
      name: 'Pinheiro Society',
      email: 'contato@pinheirosociety.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor de desenvolvimento'
    }
  ],
  components: {
    schemas: {
      HealthResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'ok'
          },
          name: {
            type: 'string',
            example: 'PinheiroSocietyAPI'
          }
        }
      },
      Racha: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          field: { type: 'string', example: 'Quadra 1' },
          date: { type: 'string', format: 'date-time', example: '2025-01-25T00:00:00.000Z' },
          hour: { type: 'integer', enum: [18,19,20,21,22,23] },
          scheduled: { type: 'boolean', example: true },
          userName: { type: 'string', nullable: true, example: 'João Silva' },
          recorrente: { type: 'boolean', example: false },
          diaSemana: { type: 'integer', nullable: true, example: 1 },
          ativo: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Produto: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Cerveja Skol 350ml' },
          description: { type: 'string', nullable: true, example: 'Cerveja gelada' },
          category: { type: 'string', enum: ['BEBIDA', 'COMIDA', 'SNACK', 'OUTROS'] },
          priceCents: { type: 'integer', example: 500 },
          active: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          estoque: { $ref: '#/components/schemas/Estoque' }
        }
      },
      Estoque: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          produtoId: { type: 'integer', example: 1 },
          quantidade: { type: 'integer', example: 50 },
          minQuantidade: { type: 'integer', example: 10 },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Erro interno do servidor'
          },
          status: {
            type: 'integer',
            example: 500
          }
        }
      }
    }
  }
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/index.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
