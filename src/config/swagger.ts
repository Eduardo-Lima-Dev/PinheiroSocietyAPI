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
  apis: ['./src/routes/*.ts', './src/index.ts'], // Caminhos para os arquivos que contêm anotações do Swagger
};

export const swaggerSpec = swaggerJsdoc(options);
