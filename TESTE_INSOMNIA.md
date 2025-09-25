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
- Se usar porta diferente, altere no ambiente "Base Environment"

### 3. **Sequência de testes recomendada**

#### **Health Check**
- ✅ **GET /health** - Verifica se a API está funcionando

#### **Usuários**
1. ✅ **POST /users** (Criar Usuário) - Cria um usuário comum
2. ✅ **POST /users** (Criar Admin) - Cria um administrador
3. ✅ **GET /users** - Lista todos os usuários

#### **Rachas**
1. ✅ **GET /rachas/slots** - Ver horários disponíveis
2. ✅ **POST /rachas** - Agendar um racha

#### **Comandas**
1. ✅ **POST /comandas** - Abrir uma comanda
2. ✅ **GET /comandas/1** - Ver detalhes da comanda
3. ✅ **POST /comandas/1/itens** - Adicionar item
4. ✅ **POST /comandas/1/fechar** - Fechar comanda

## 📋 Dados de exemplo incluídos

### **Usuários**
- **Usuário comum**: joao@email.com / 123456
- **Admin**: admin@pinheirosociety.com / admin123

### **Rachas**
- **Data**: 2025-01-25
- **Campo**: Quadra 1
- **Horário**: 18h (válido: 18-23h)

### **Comandas**
- **Item exemplo**: Cerveja Skol 350ml (R$ 5,00)
- **Pagamento**: PIX (opções: CASH, PIX, CARD)

## 🔧 Dicas importantes

### **IDs dinâmicos**
- Após criar usuários, use o ID retornado nas comandas
- Após criar comandas, use o ID retornado nos endpoints de itens

### **Horários válidos**
- Rachas só podem ser agendados entre 18h e 23h
- Use o endpoint `/rachas/slots` para ver disponibilidade

### **Valores monetários**
- Todos os preços são em **centavos**
- Exemplo: R$ 5,00 = 500 centavos

### **Códigos de resposta**
- **200**: Sucesso
- **201**: Criado com sucesso
- **400**: Dados inválidos
- **404**: Não encontrado
- **409**: Conflito (email duplicado, horário ocupado)

## 🐛 Troubleshooting

### **Erro de conexão**
- Verifique se o servidor está rodando (`npm run dev`)
- Confirme a porta (padrão: 3000)

### **Erro de banco**
- Execute: `npx prisma generate`
- Verifique se o PostgreSQL está rodando

### **Erro de validação**
- Verifique se todos os campos obrigatórios estão preenchidos
- Confirme os tipos de dados (string, number, etc.)

## 📚 Documentação adicional

- **Swagger UI**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health
