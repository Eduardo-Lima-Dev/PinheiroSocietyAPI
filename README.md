# 🏆 PinheiroSocietyAPI

API completa para gestão da Pinheiro Society - sistema de reservas, comandas, clientes e usuários.

## 🚀 Funcionalidades

### 👥 **Gestão de Usuários**
- Criação de usuários com roles (ADMIN/USER)
- Login de administradores com JWT
- Senhas criptografadas com bcrypt

### 👤 **Gestão de Clientes**
- Cadastro completo de clientes (nome, CPF, email, telefone)
- CRUD completo com validações
- Busca por nome, CPF ou email
- Associação com comandas e reservas

### 🏟️ **Gestão de Quadras**
- Cadastro e gerenciamento de quadras
- Controle de disponibilidade por data/hora
- Verificação de conflitos de agendamento

### 🎯 **Sistema de Reservas**
- Agendamento profissional de quadras
- **Preços dinâmicos**: R$ 100,00 (até 17h) / R$ 110,00 (após 17h)
- Horários amplos: 8h às 23h
- Reagendamento com validações
- Status: ATIVA, CANCELADA, CONCLUIDA
- Cliente obrigatório para todas as reservas

### 🧾 **Sistema de Comandas**
- Abertura de comandas associadas a clientes
- Adição de itens com preços em centavos
- Cálculo automático do total
- Fechamento com forma de pagamento (CASH/PIX/CARD)
- Controle de estoque integrado

### 📊 **Relatórios Administrativos**
- Relatórios financeiros por período
- Análise de reservas e ocupação
- Relatórios de clientes mais ativos
- Controle de estoque e alertas
- Dashboard com resumo geral

## 🛠️ Tecnologias

- **Node.js** + **TypeScript**
- **Express.js** - Framework web
- **Prisma** - ORM e migrações
- **PostgreSQL** - Banco de dados
- **Swagger** - Documentação da API
- **JWT** - Autenticação
- **bcryptjs** - Criptografia de senhas

## 📋 Pré-requisitos

- Node.js >= 18
- PostgreSQL
- npm

## ⚙️ Instalação

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd PinheiroSocietyAPI
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure o banco de dados**
   ```bash
   # Crie um arquivo .env na raiz do projeto
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/pinheiro_society"
   JWT_SECRET="seu-jwt-secret-aqui"
   PORT=3000
   ```

4. **Execute as migrações**
   ```bash
   npx prisma migrate dev
   ```

5. **Inicie o servidor**
   ```bash
   npm run dev
   ```

## 📚 Documentação

### 🔗 **Links Úteis**
- **Swagger UI**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health

### 📖 **Documentação Detalhada**
- [📋 Guia de Testes com Insomnia](./docs/TESTE_INSOMNIA.md)
- [📚 Documentação Swagger](./docs/SWAGGER_README.md)

## 🧪 Testando a API

### **Coleção do Insomnia**
Importe o arquivo `insomnia_collection.json` no Insomnia para testar todos os endpoints.

### **Sequência de Testes Recomendada**
1. Health Check
2. Criar usuário admin
3. Login de admin
4. Criar cliente
5. Criar quadra
6. Ver disponibilidade da quadra
7. Criar reserva
8. Reagendar reserva
9. Abrir comanda para cliente
10. Adicionar itens
11. Fechar comanda
12. Gerar relatórios

## 🗂️ Estrutura do Projeto

```
src/
├── config/
│   └── swagger.ts          # Configuração do Swagger
├── generated/
│   └── prisma/             # Client Prisma gerado
├── lib/
│   └── prisma.ts           # Conexão com banco
├── routes/
│   ├── auth.ts             # Autenticação (login)
│   ├── users.ts            # Gestão de usuários
│   ├── clientes.ts         # Gestão de clientes
│   ├── quadras.ts          # Gestão de quadras
│   ├── reservas.ts         # Gestão de reservas
│   ├── comandas.ts         # Gestão de comandas
│   ├── produtos.ts         # Gestão de produtos
│   └── relatorios.ts       # Relatórios administrativos
└── index.ts                # Servidor principal

prisma/
├── migrations/             # Migrações do banco
└── schema.prisma          # Schema do banco
```

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Inicia em modo desenvolvimento
npm run build        # Compila TypeScript
npm run start        # Inicia versão compilada
npm run prisma:generate  # Gera client Prisma
npm run prisma:migrate   # Executa migrações
npm run prisma:studio    # Abre Prisma Studio
```

## 📊 Modelos de Dados

### **User**
- `id`, `name`, `email`, `password`, `role` (ADMIN/USER)

### **Cliente**
- `id`, `nomeCompleto`, `cpf`, `email`, `telefone`, `createdAt`, `updatedAt`

### **Quadra**
- `id`, `nome`, `ativa`, `createdAt`, `updatedAt`

### **Reserva**
- `id`, `clienteId`, `quadraId`, `data`, `hora`, `precoCents`, `status` (ATIVA/CANCELADA/CONCLUIDA), `observacoes?`

### **Comanda**
- `id`, `clienteId?`, `openedAt`, `closedAt?`, `totalCents`, `payment?`, `notes?`

### **ComandaItem**
- `id`, `comandaId`, `description`, `quantity`, `unitCents`, `produtoId?`

### **Produto**
- `id`, `name`, `description?`, `category`, `priceCents`, `active`

### **Estoque**
- `id`, `produtoId`, `quantidade`, `minQuantidade`

## 🔐 Autenticação

### **Login de Admin**
```bash
POST /auth/login
{
  "email": "admin@pinheirosociety.com",
  "password": "admin123"
}
```

**Resposta:**
```json
{
  "token": "jwt-token-aqui",
  "user": { "id": 1, "name": "Admin", "email": "admin@...", "role": "ADMIN" }
}
```

## 💰 Sistema Monetário

Todos os valores são armazenados em **centavos** para evitar problemas de ponto flutuante:
- R$ 5,00 = 500 centavos
- R$ 10,50 = 1050 centavos

## 🕐 Sistema de Reservas

- **Horários válidos**: 8h às 23h (horário comercial completo)
- **Preços dinâmicos**: 
  - R$ 100,00 até 17h (horário diurno)
  - R$ 110,00 das 17h às 23h (horário noturno)
- **Formato de data**: YYYY-MM-DD
- **Verificação**: Use `/quadras/{id}/disponibilidade` para ver disponibilidade
- **Reagendamento**: Use `/reservas/{id}/reagendar` para alterar data/hora


---

**Desenvolvido para a Pinheiro Society** 🏆
