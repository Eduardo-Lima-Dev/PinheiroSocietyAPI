# 🏆 PinheiroSocietyAPI

API completa para gestão da Pinheiro Society - sistema de reservas, comandas, clientes e usuários.

## 🚀 Funcionalidades

### 👥 **Gestão de Usuários**
- Criação de usuários com roles (ADMIN/USER)
- Login de administradores com JWT
- Senhas criptografadas com bcrypt
- Recuperação de senha por email

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
   
   # Configurações de email para recuperação de senha
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="autenticacaoc@gmail.com"  # Email usado para autenticação SMTP
   SMTP_PASS="sua-senha-de-app"  # Use senha de app do Gmail
   SMTP_FROM="autenticacaoc@gmail.com"  # Opcional, usa SMTP_USER se não definido
   FRONTEND_URL="http://localhost:3000"  # URL do frontend para links de recuperação
   NODE_ENV="development"  # Em desenvolvimento, todos os emails são redirecionados para limaduduh34@gmail.com
   ```
   
   **Nota:** Em modo de desenvolvimento (`NODE_ENV !== 'production'`), todos os emails são automaticamente redirecionados para `limaduduh34@gmail.com`, mas a autenticação SMTP continua usando o email configurado em `SMTP_USER`.

### 📧 **Como obter a Senha de Aplicativo do Gmail (SMTP_PASS)**

Para usar o Gmail como servidor SMTP, você precisa criar uma **Senha de Aplicativo**. Siga estes passos:

1. **Ative a Verificação em Duas Etapas** (obrigatório)
   - Acesse: https://myaccount.google.com/security
   - Role até "Como fazer login no Google"
   - Clique em "Verificação em duas etapas"
   - Siga as instruções para ativar (pode usar autenticação por app, SMS ou email)

2. **Crie uma Senha de Aplicativo**
   - Acesse: https://myaccount.google.com/apppasswords
   - Ou vá em: Conta Google → Segurança → Verificação em duas etapas → Senhas de app
   - Selecione "App": escolha "Outro (nome personalizado)"
   - Digite um nome (ex: "PinheiroSocietyAPI")
   - Clique em "Gerar"

3. **Copie a Senha Gerada**
   - O Google mostrará uma senha de 16 caracteres (sem espaços)
   - Exemplo: `abcd efgh ijkl mnop`
   - **Copie essa senha completa** (sem os espaços ou remova os espaços manualmente)
   - Essa é a senha que você deve usar no `SMTP_PASS`

4. **Configure no .env**
   ```env
   SMTP_USER="autenticacaoc@gmail.com"
   SMTP_PASS="abcdefghijklmnop"  # Cole a senha de 16 caracteres aqui (sem espaços)
   ```

**⚠️ Importante:**
- A senha de aplicativo é diferente da sua senha normal do Gmail
- Você só verá a senha uma vez - guarde-a com segurança
- Se perder, você precisará gerar uma nova
- Cada aplicativo pode ter sua própria senha de aplicativo

**🔒 Alternativa (menos seguro):**
Se não quiser usar verificação em duas etapas, você pode ativar "Acesso a apps menos seguros" nas configurações do Google, mas isso não é recomendado por questões de segurança.

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
│   ├── auth.ts             # Autenticação (login, recuperação de senha)
│   ├── users.ts            # Gestão de usuários
├── services/
│   └── email-service.ts    # Serviço de envio de emails
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

### **Recuperação de Senha**

O fluxo de recuperação de senha possui 3 etapas:

#### 1. Solicitar recuperação de senha (envia código de 6 dígitos)
```bash
POST /auth/forgot-password
{
  "email": "usuario@pinheirosociety.com"
}
```

**Resposta:**
```json
{
  "message": "Se o email estiver cadastrado, você receberá um email com código de verificação."
}
```

O sistema enviará um email com um **código de 6 dígitos** (ex: `123456`). Este código expira em 1 hora.

#### 2. Verificar código de verificação
```bash
POST /auth/verify-code
{
  "email": "usuario@pinheirosociety.com",
  "code": "123456"
}
```

**Resposta (sucesso):**
```json
{
  "message": "Código verificado com sucesso",
  "resetToken": "jwt-token-temporario-aqui"
}
```

**Resposta (erro):**
```json
{
  "message": "Código inválido ou expirado. Verifique se o código está correto e se não expirou (válido por 1 hora)"
}
```

**Nota:** 
- O código de verificação expira em 1 hora
- O código deve conter exatamente 6 dígitos numéricos (000000 a 999999)
- Após verificar o código, você receberá um `resetToken` válido por 15 minutos
- O código é invalidado após ser verificado (não pode ser reutilizado)

#### 3. Redefinir senha com token de reset
```bash
POST /auth/reset-password
{
  "resetToken": "jwt-token-temporario-aqui",
  "newPassword": "novaSenha123"
}
```

**Resposta:**
```json
{
  "message": "Senha redefinida com sucesso"
}
```

**Erros possíveis:**
- `400`: Token de reset e nova senha são obrigatórios
- `400`: A senha deve ter no mínimo 6 caracteres
- `401`: Token inválido ou expirado (válido por 15 minutos)

**Nota:** 
- O `resetToken` expira em 15 minutos após a verificação do código
- Para usar Gmail, você precisará criar uma "Senha de App" nas configurações de segurança da sua conta Google

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
