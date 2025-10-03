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
- Documentação completa de todos os endpoints

### ✅ Endpoints documentados

#### **Health Check**
- **GET /health**: Verifica o status da API

#### **Autenticação**
- **POST /auth/login**: Login de administrador

#### **Usuários**
- **GET /users**: Lista todos os usuários
- **POST /users**: Cria um novo usuário

#### **Clientes**
- **GET /clientes**: Lista todos os clientes
- **POST /clientes**: Cria um novo cliente
- **GET /clientes/{id}**: Obtém um cliente por ID
- **PUT /clientes/{id}**: Atualiza um cliente
- **DELETE /clientes/{id}**: Exclui um cliente
- **GET /clientes/buscar**: Busca clientes por nome, CPF ou email

#### **Quadras**
- **GET /quadras**: Lista todas as quadras
- **POST /quadras**: Cria uma nova quadra
- **GET /quadras/{id}**: Obtém uma quadra por ID
- **PUT /quadras/{id}**: Atualiza uma quadra
- **DELETE /quadras/{id}**: Exclui uma quadra
- **GET /quadras/{id}/disponibilidade**: Verifica disponibilidade

#### **Reservas**
- **GET /reservas**: Lista todas as reservas
- **POST /reservas**: Cria uma nova reserva
- **GET /reservas/{id}**: Obtém uma reserva por ID
- **PUT /reservas/{id}/reagendar**: Reagenda uma reserva
- **PUT /reservas/{id}/cancelar**: Cancela uma reserva
- **PUT /reservas/{id}/concluir**: Marca reserva como concluída

#### **Comandas**
- **POST /comandas**: Abre uma nova comanda
- **GET /comandas/{id}**: Obtém uma comanda por ID
- **POST /comandas/{id}/itens**: Adiciona item à comanda
- **POST /comandas/{id}/fechar**: Fecha uma comanda

#### **Produtos**
- **GET /produtos**: Lista todos os produtos
- **POST /produtos**: Cria um novo produto
- **PUT /produtos/{id}**: Atualiza um produto
- **DELETE /produtos/{id}**: Exclui um produto
- **GET /produtos/estoque-baixo**: Lista produtos com estoque baixo
- **PUT /produtos/{id}/estoque**: Atualiza estoque de um produto

#### **Relatórios**
- **GET /relatorios/dashboard**: Dashboard com resumo geral
- **GET /relatorios/faturamento**: Relatório de faturamento por período
- **GET /relatorios/reservas**: Relatório de reservas por período
- **GET /relatorios/clientes**: Relatório de clientes mais ativos
- **GET /relatorios/estoque**: Relatório de estoque

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

## 🎯 Funcionalidades da v3

### ✅ **Sistema Completo Implementado**
1. **Rotas organizadas**: Todos os endpoints em arquivos separados em `src/routes/`
2. **Validação de dados**: Validações robustas em todos os endpoints
3. **Autenticação**: Sistema de login com JWT documentado
4. **Exemplos completos**: Request/response para todos os endpoints
5. **Tags organizadas**: Endpoints organizados por categorias (Clientes, Quadras, Reservas, etc.)

### ✅ **Novos Recursos Documentados**
- **Sistema de Clientes**: CRUD completo com validações
- **Sistema de Quadras**: Gestão e disponibilidade
- **Sistema de Reservas**: Agendamento profissional com preços dinâmicos
- **Relatórios Expandidos**: Dashboard e análises detalhadas
- **Comandas Atualizadas**: Associação com clientes

## 🔗 Links úteis

- [Documentação Swagger/OpenAPI](https://swagger.io/docs/)
- [Swagger JSDoc](https://github.com/Surnet/swagger-jsdoc)
- [Swagger UI Express](https://github.com/scottie1984/swagger-ui-express)
