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
- A coleção já vem com a variável `base_url` configurada para `https://pinheiro-society-api.vercel.app`
- Para teste local, altere para `http://localhost:3000`

### 3. **Sequência de testes recomendada**

#### **Health Check**
- ✅ **GET /health** - Verifica se a API está funcionando

#### **Autenticação**
- ✅ **POST /auth/login** - Login de admin

#### **Usuários**
- ✅ **POST /users** (Criar Admin) - Cria um administrador
- ✅ **GET /users** - Lista todos os usuários

#### **Produtos e Estoque**
1. ✅ **POST /produtos** - Criar produto com estoque
2. ✅ **GET /produtos** - Listar produtos
3. ✅ **GET /produtos/estoque-baixo** - Ver produtos com estoque baixo
4. ✅ **PUT /produtos/1/estoque** - Atualizar estoque

#### **Rachas**
1. ✅ **GET /rachas/slots** - Ver horários disponíveis
2. ✅ **POST /rachas** - Agendar racha normal
3. ✅ **POST /rachas** (Recorrente) - Agendar racha recorrente
4. ✅ **GET /rachas** - Listar rachas
5. ✅ **POST /rachas/1/desativar** - Desativar rachas recorrentes

#### **Comandas**
1. ✅ **POST /comandas** - Abrir comanda
2. ✅ **GET /comandas/1** - Ver detalhes da comanda
3. ✅ **POST /comandas/1/itens** (Produto) - Adicionar produto do estoque
4. ✅ **POST /comandas/1/itens** (Customizado) - Adicionar item customizado
5. ✅ **POST /comandas/1/fechar** - Fechar comanda

#### **Relatórios**
1. ✅ **GET /relatorios/dashboard** - Dashboard geral
2. ✅ **GET /relatorios/faturamento** - Relatório de faturamento
3. ✅ **GET /relatorios/rachas** - Relatório de rachas

## 📋 Dados de exemplo incluídos

### **Usuários**
- **Admin**: admin@pinheirosociety.com / admin123

### **Produtos**
- **Cerveja Skol 350ml**: R$ 5,00 (BEBIDA)
- **Hambúrguer Artesanal**: R$ 15,00 (COMIDA)

### **Rachas**
- **Data**: 2025-01-25
- **Campo**: Quadra 1
- **Horário**: 18h (válido: 18-23h)
- **Recorrente**: Cria 12 semanas automaticamente

### **Comandas**
- **Produto do estoque**: Usa produtoId
- **Item customizado**: Usa description + unitCents
- **Pagamento**: PIX (opções: CASH, PIX, CARD)

## 🔧 Dicas importantes

### **IDs dinâmicos**
- Após criar usuários, use o ID retornado nas comandas
- Após criar produtos, use o ID retornado nos itens da comanda
- Após criar comandas, use o ID retornado nos endpoints de itens

### **Horários válidos**
- Rachas só podem ser agendados entre 18h e 23h
- Use o endpoint `/rachas/slots` para ver disponibilidade

### **Valores monetários**
- Todos os preços são em **centavos**
- Exemplo: R$ 5,00 = 500 centavos

### **Estoque**
- Produtos são criados com estoque automaticamente
- Comandas verificam estoque antes de adicionar itens
- Use `/produtos/estoque-baixo` para alertas

### **Rachas Recorrentes**
- Marcando `recorrente: true` cria 12 semanas
- Use `/rachas/:id/desativar` para parar recorrência
- Rachas recorrentes têm `diaSemana` (0=domingo, 6=sábado)

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

## 🆕 Novidades da v2

### **Sistema de Estoque**
- ✅ Produtos com categorias
- ✅ Controle de quantidade
- ✅ Alertas de estoque baixo
- ✅ Integração com comandas

### **Rachas Recorrentes**
- ✅ Agendamento semanal automático
- ✅ Desativação de recorrência
- ✅ Controle por dia da semana

### **Relatórios**
- ✅ Faturamento por período
- ✅ Produtos mais vendidos
- ✅ Estatísticas de rachas
- ✅ Dashboard geral

### **Comandas Melhoradas**
- ✅ Produtos do estoque
- ✅ Itens customizados
- ✅ Verificação de estoque
- ✅ Cálculo automático de totais
