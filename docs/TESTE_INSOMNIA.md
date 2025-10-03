# 🧪 Guia de Testes - Insomnia

## 📥 Como importar a coleção

1. **Abra o Insomnia**
2. **Clique em "Create" → "Import From" → "File"**
3. **Selecione o arquivo**: `insomnia_collection.json`
4. **A coleção "PinheiroSocietyAPI" será criada**

## 🚀 Como testar

### 1. **Inicie o servidor**
```bash
npm run dev
```

### 2. **Configure o ambiente**
- A coleção já vem com a variável `base_url` configurada para `http://localhost:3000`
- Para teste em produção, altere para `https://pinheiro-society-api.vercel.app`

### 3. **Sequência de testes recomendada**

#### **Health Check**
- ✅ **GET /health** - Verifica se a API está funcionando

#### **Autenticação**
- ✅ **POST /auth/login** - Login de admin

#### **Usuários**
- ✅ **POST /users** (Criar Admin) - Cria um administrador
- ✅ **GET /users** - Lista todos os usuários

#### **Clientes**
1. ✅ **POST /clientes** - Criar cliente
2. ✅ **GET /clientes** - Listar clientes
3. ✅ **GET /clientes/buscar?q=Maria** - Buscar cliente
4. ✅ **PUT /clientes/1** - Atualizar cliente
5. ✅ **DELETE /clientes/1** - Excluir cliente

#### **Quadras**
1. ✅ **POST /quadras** - Criar quadra
2. ✅ **GET /quadras** - Listar quadras
3. ✅ **GET /quadras/1/disponibilidade?data=2025-01-27** - Verificar disponibilidade
4. ✅ **PUT /quadras/1** - Atualizar quadra
5. ✅ **DELETE /quadras/1** - Excluir quadra

#### **Reservas**
1. ✅ **POST /reservas** - Criar reserva
2. ✅ **GET /reservas** - Listar reservas
3. ✅ **PUT /reservas/1/reagendar** - Reagendar reserva
4. ✅ **PUT /reservas/1/cancelar** - Cancelar reserva
5. ✅ **PUT /reservas/1/concluir** - Concluir reserva

#### **Comandas**
1. ✅ **POST /comandas** - Abrir comanda para cliente
2. ✅ **GET /comandas/1** - Ver detalhes da comanda
3. ✅ **POST /comandas/1/itens** (Produto) - Adicionar produto do estoque
4. ✅ **POST /comandas/1/itens** (Customizado) - Adicionar item customizado
5. ✅ **POST /comandas/1/fechar** - Fechar comanda

#### **Relatórios**
1. ✅ **GET /relatorios/dashboard** - Dashboard geral
2. ✅ **GET /relatorios/faturamento** - Relatório de faturamento
3. ✅ **GET /relatorios/reservas** - Relatório de reservas
4. ✅ **GET /relatorios/clientes** - Relatório de clientes
5. ✅ **GET /relatorios/estoque** - Relatório de estoque

## 📋 Dados de exemplo incluídos

### **Usuários**
- **Admin**: admin@pinheirosociety.com / admin123

### **Clientes**
- **Nome**: Maria Santos
- **CPF**: 12345678901
- **Email**: maria@email.com
- **Telefone**: (11) 99999-9999

### **Quadras**
- **Nome**: Quadra 1
- **Status**: Ativa

### **Reservas**
- **Data**: 2025-01-27
- **Hora**: 14h (preço: R$ 100,00 - horário diurno)
- **Hora**: 19h (preço: R$ 110,00 - horário noturno)
- **Cliente**: Obrigatório
- **Status**: ATIVA, CANCELADA, CONCLUIDA

### **Comandas**
- **Cliente**: Associado a cliente cadastrado
- **Produto do estoque**: Usa produtoId
- **Item customizado**: Usa description + unitCents
- **Pagamento**: PIX (opções: CASH, PIX, CARD)

## 🔧 Dicas importantes

### **IDs dinâmicos**
- Após criar clientes, use o ID retornado nas reservas e comandas
- Após criar quadras, use o ID retornado nas reservas
- Após criar produtos, use o ID retornado nos itens da comanda
- Após criar comandas, use o ID retornado nos endpoints de itens

### **Horários válidos**
- Reservas podem ser agendadas entre 8h e 23h
- Use o endpoint `/quadras/{id}/disponibilidade` para ver disponibilidade
- Preços dinâmicos: R$ 100,00 (até 17h) / R$ 110,00 (após 17h)

### **Valores monetários**
- Todos os preços são em **centavos**
- Exemplo: R$ 5,00 = 500 centavos
- Reservas: R$ 100,00 = 10000 centavos / R$ 110,00 = 11000 centavos

### **Estoque**
- Produtos são criados com estoque automaticamente
- Comandas verificam estoque antes de adicionar itens
- Use `/relatorios/estoque` para alertas

### **Reservas**
- Cliente é obrigatório para todas as reservas
- Reagendamento mantém histórico e recalcula preços
- Status: ATIVA (padrão), CANCELADA, CONCLUIDA

### **Códigos de resposta**
- **200**: Sucesso
- **201**: Criado com sucesso
- **400**: Dados inválidos ou estoque insuficiente
- **404**: Não encontrado
- **409**: Conflito (email duplicado, horário ocupado)

## 🐛 Troubleshooting

### **Erro de conexão**
- Verifique se o servidor está rodando (`npm run dev`)
- Confirme a porta (padrão: 3000)
- Para produção: https://pinheiro-society-api.vercel.app

### **Erro de banco**
- Execute: `npx prisma generate`
- Verifique se o PostgreSQL está rodando
- Execute as migrações: `npx prisma migrate dev`

### **Erro de estoque**
- Verifique se o produto existe e está ativo
- Confirme se há quantidade suficiente no estoque
- Use `/produtos/estoque-baixo` para ver alertas

### **Erro de validação**
- Verifique se todos os campos obrigatórios estão preenchidos
- Confirme os tipos de dados (string, number, boolean)
- Para produtos: category deve ser BEBIDA, COMIDA, SNACK ou OUTROS

## 📚 Documentação adicional

- **Swagger UI**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health
- **Produção**: https://pinheiro-society-api.vercel.app/api-docs

## 🆕 Novidades da v3

### **Sistema de Clientes**
- ✅ Cadastro completo (nome, CPF, email, telefone)
- ✅ CRUD completo com validações
- ✅ Busca por nome, CPF ou email
- ✅ Associação com comandas e reservas

### **Sistema de Quadras**
- ✅ Cadastro e gerenciamento de quadras
- ✅ Controle de disponibilidade por data/hora
- ✅ Verificação de conflitos de agendamento

### **Sistema de Reservas**
- ✅ Agendamento profissional de quadras
- ✅ Preços dinâmicos (R$ 100 até 17h / R$ 110 após 17h)
- ✅ Horários amplos (8h às 23h)
- ✅ Reagendamento com validações
- ✅ Status detalhado (ATIVA, CANCELADA, CONCLUIDA)

### **Relatórios Expandidos**
- ✅ Relatórios de reservas por período
- ✅ Análise de clientes mais ativos
- ✅ Controle de estoque detalhado
- ✅ Dashboard com dados de reservas

### **Comandas Atualizadas**
- ✅ Associação com clientes cadastrados
- ✅ Produtos do estoque
- ✅ Itens customizados
- ✅ Verificação de estoque
- ✅ Cálculo automático de totais
