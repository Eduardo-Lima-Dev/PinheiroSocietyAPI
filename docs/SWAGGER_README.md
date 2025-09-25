# 📚 Documentação Swagger - PinheiroSocietyAPI

## 🚀 Como usar

### 1. Iniciar o servidor
```bash
npm run dev
```

### 2. Acessar a documentação
Após iniciar o servidor, acesse:
- **Documentação Swagger**: http://localhost:3000/api-docs
- **Endpoint de Health**: http://localhost:3000/health

## 📋 Funcionalidades implementadas

### ✅ Configuração completa do Swagger
- Swagger UI integrado na rota `/api-docs`
- Configuração personalizada com tema limpo
- Esquemas de resposta definidos

### ✅ Endpoint documentado
- **GET /health**: Verifica o status da API
  - Resposta: `{ "status": "ok", "name": "PinheiroSocietyAPI" }`

## 🔧 Como adicionar novos endpoints

### 1. Documentar o endpoint
Adicione comentários JSDoc antes da rota:

```typescript
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lista todos os usuários
 *     description: Retorna uma lista de todos os usuários cadastrados
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lista de usuários retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
app.get('/users', (req, res) => {
  // implementação da rota
});
```

### 2. Definir esquemas
Adicione novos esquemas no arquivo `src/config/swagger.ts`:

```typescript
components: {
  schemas: {
    User: {
      type: 'object',
      properties: {
        id: {
          type: 'integer',
          example: 1
        },
        name: {
          type: 'string',
          example: 'João Silva'
        },
        email: {
          type: 'string',
          example: 'joao@email.com'
        }
      }
    }
  }
}
```

## 📦 Dependências instaladas

- `swagger-jsdoc`: Gera especificação OpenAPI a partir de comentários JSDoc
- `swagger-ui-express`: Interface web para visualizar a documentação
- `@types/swagger-jsdoc`: Tipos TypeScript para swagger-jsdoc
- `@types/swagger-ui-express`: Tipos TypeScript para swagger-ui-express

## 🎯 Próximos passos

1. **Criar rotas organizadas**: Mover endpoints para arquivos separados em `src/routes/`
2. **Adicionar validação**: Integrar com Zod para validação de dados
3. **Autenticação**: Documentar endpoints de autenticação
4. **Exemplos**: Adicionar mais exemplos de request/response
5. **Tags**: Organizar endpoints por categorias (Users, Products, etc.)

## 🔗 Links úteis

- [Documentação Swagger/OpenAPI](https://swagger.io/docs/)
- [Swagger JSDoc](https://github.com/Surnet/swagger-jsdoc)
- [Swagger UI Express](https://github.com/scottie1984/swagger-ui-express)
