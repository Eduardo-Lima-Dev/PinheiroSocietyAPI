# 🔄 Sistema Automático de Reservas Vencidas

## 📋 **Funcionalidade Implementada**

O sistema agora possui **processamento automático** de reservas vencidas que marca automaticamente todas as reservas ativas que passaram da data como **CONCLUÍDA**.

## 🚀 **Como Funciona**

### **1. Execução Automática**
- **Frequência:** Diariamente às **02:00 da manhã**
- **Timezone:** America/Sao_Paulo
- **Processo:** Verifica todas as reservas ativas com data anterior ao dia atual
- **Ação:** Marca como CONCLUÍDA com observação automática

### **2. Critérios de Processamento**
- ✅ Status = `ATIVA`
- ✅ Data < hoje (qualquer hora do dia anterior)
- ✅ Não processa reservas já canceladas ou concluídas

## 🛠️ **Arquivos Criados**

### **Scripts:**
- `scripts/processar-reservas-vencidas.js` - Script standalone para execução manual
- `src/jobs/reservas-job.js` - Job automático com cron
- `src/services/reservas-service.js` - Serviço de processamento
- `src/routes/admin.ts` - Endpoints administrativos

### **Dependências:**
- `node-cron` - Para execução agendada

## 📊 **Endpoints Administrativos**

### **1. Verificar Reservas Vencidas**
```http
GET {{ _.base_url }}/admin/reservas/verificar-vencidas
```
**Resposta:**
```json
{
  "quantidade": 3,
  "reservas": [
    {
      "id": 1,
      "cliente": "João Silva",
      "quadra": "Quadra 1",
      "data": "15/01/2025",
      "hora": 14,
      "precoCents": 10000
    }
  ]
}
```

### **2. Processar Reservas Vencidas (Manual)**
```http
POST {{ _.base_url }}/admin/reservas/processar-vencidas
```
**Resposta:**
```json
{
  "processadas": 3,
  "mensagem": "3 reservas processadas com sucesso",
  "reservas": [
    {
      "id": 1,
      "cliente": "João Silva",
      "quadra": "Quadra 1",
      "data": "15/01/2025",
      "hora": 14
    }
  ]
}
```

### **3. Status do Job Automático**
```http
GET {{ _.base_url }}/admin/jobs/reservas/status
```
**Resposta:**
```json
{
  "isRunning": true,
  "schedule": "0 2 * * *",
  "timezone": "America/Sao_Paulo",
  "description": "Processamento diário de reservas vencidas às 02:00"
}
```

### **4. Executar Job Manualmente**
```http
POST {{ _.base_url }}/admin/jobs/reservas/executar
```

## 🔧 **Execução Manual**

### **Via Script Standalone:**
```bash
node scripts/processar-reservas-vencidas.js
```

### **Via Endpoint:**
```bash
curl -X POST http://localhost:3000/admin/reservas/processar-vencidas
```

## 📅 **Exemplo Prático**

### **Cenário:**
- **Hoje:** 18/01/2025
- **Reserva:** 16/01/2025 às 14h (status: ATIVA)

### **Antes da implementação:**
```json
{
  "id": 1,
  "data": "2025-01-16",
  "hora": 14,
  "status": "ATIVA" // ❌ Permanece ativa indefinidamente
}
```

### **Após processamento automático:**
```json
{
  "id": 1,
  "data": "2025-01-16",
  "hora": 14,
  "status": "CONCLUIDA", // ✅ Marcada automaticamente
  "observacoes": "Marcada automaticamente como concluída após vencimento"
}
```

## 🎯 **Benefícios**

### **1. Automatização**
- ✅ Não precisa intervenção manual
- ✅ Execução diária automática
- ✅ Horário otimizado (02:00 - baixo uso)

### **2. Integridade dos Dados**
- ✅ Status sempre atualizado
- ✅ Horários liberados automaticamente
- ✅ Relatórios precisos

### **3. Experiência do Usuário**
- ✅ Disponibilidade correta das quadras
- ✅ Não há "horários fantasma" ocupados
- ✅ Sistema sempre sincronizado

### **4. Controle Administrativo**
- ✅ Endpoints para monitoramento
- ✅ Execução manual quando necessário
- ✅ Logs detalhados do processamento

## 🔍 **Monitoramento**

### **Logs do Sistema:**
```
🔄 Iniciando processamento de reservas vencidas...
📋 Encontradas 3 reservas vencidas:
  - ID 1: João Silva - Quadra 1 - 16/01/2025 às 14h
  - ID 2: Maria Santos - Quadra 2 - 17/01/2025 às 16h
✅ 3 reservas marcadas como CONCLUÍDA automaticamente.

📊 Resumo do processamento:
  - Total de reservas processadas: 3
  - Data de referência: 18/01/2025
  - Status aplicado: CONCLUÍDA
```

### **Verificação de Status:**
```bash
curl http://localhost:3000/admin/jobs/reservas/status
```

## ⚙️ **Configuração**

### **Horário de Execução:**
- **Cron:** `0 2 * * *` (02:00 todos os dias)
- **Timezone:** America/Sao_Paulo
- **Pode ser alterado** no arquivo `src/jobs/reservas-job.js`

### **Inicialização:**
O job é iniciado automaticamente quando o servidor sobe:
```typescript
// In src/index.ts
reservasJob.start();
```

## 🚨 **Importante**

1. **Backup:** Sempre faça backup antes de processar em produção
2. **Teste:** Teste primeiro em ambiente de desenvolvimento
3. **Monitoramento:** Monitore os logs para verificar funcionamento
4. **Horário:** O horário pode ser ajustado conforme necessidade

---

**✅ Sistema implementado e funcionando!**  
**🔄 Reservas vencidas serão processadas automaticamente todos os dias às 02:00**
