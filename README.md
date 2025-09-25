# 🏆 PinheiroSocietyAPI

API completa para gestão da Pinheiro Society - sistema de rachas, comandas e usuários.

## 🚀 Funcionalidades

### 👥 **Gestão de Usuários**
- Criação de usuários com roles (ADMIN/USER)
- Login de administradores com JWT
- Senhas criptografadas com bcrypt

### ⚽ **Sistema de Rachas**
- Agendamento de rachas por data, campo e horário
- Horários disponíveis: 18h às 23h
- Nome opcional do usuário que agendou
- Verificação de disponibilidade de slots

### 🧾 **Sistema de Comandas**
- Abertura de comandas com usuário ou nome opcional
- Adição de itens com preços em centavos
- Cálculo automático do total
- Fechamento com forma de pagamento (CASH/PIX/CARD)

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
4. Criar usuário comum
5. Ver horários disponíveis
6. Agendar racha
7. Abrir comanda
8. Adicionar itens
9. Fechar comanda

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
│   ├── rachas.ts           # Gestão de rachas
│   └── comandas.ts         # Gestão de comandas
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

### **Racha**
- `id`, `field`, `date`, `hour` (18-23), `scheduled`, `userName?`

### **Comanda**
- `id`, `userId?`, `customerName?`, `openedAt`, `closedAt?`, `totalCents`, `payment?`, `notes?`

### **ComandaItem**
- `id`, `comandaId`, `description`, `quantity`, `unitCents`

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

## 🕐 Horários de Rachas

- **Horários válidos**: 18h, 19h, 20h, 21h, 22h, 23h
- **Formato de data**: YYYY-MM-DD
- **Verificação**: Use `/rachas/slots` para ver disponibilidade


---

**Desenvolvido para a Pinheiro Society** 🏆
