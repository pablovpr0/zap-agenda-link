# 🧪 PÁGINAS DE TESTE - SISTEMA DE HORÁRIOS

## 📋 PÁGINAS DISPONÍVEIS PARA TESTE

### 1. **Teste Rápido da Função Principal**
🔗 **URL:** `/quick-schedule-test`
- ✅ Testa diretamente a função `checkAvailableTimes()`
- ✅ Usa dados reais da empresa Pablo
- ✅ Mostra logs detalhados no console
- ✅ Interface simples e direta

**Como usar:**
1. Acesse `/quick-schedule-test`
2. Selecione uma data
3. Clique em "Testar Horários"
4. Veja os resultados e logs no console

### 2. **Teste da Área Pública**
🔗 **URL:** `/public-booking-test`
- ✅ Simula a área pública de agendamento
- ✅ Usa o hook `usePublicBooking` completo
- ✅ Mostra informações da empresa
- ✅ Testa o fluxo completo público

**Como usar:**
1. Acesse `/public-booking-test`
2. Aguarde carregar dados da empresa Pablo
3. Selecione uma data
4. Veja se os horários aparecem automaticamente

### 3. **Debug Detalhado**
🔗 **URL:** `/schedule-debug`
- ✅ Debug completo com função personalizada
- ✅ Logs extremamente detalhados
- ✅ Comparação entre funções
- ✅ Análise passo a passo

**Como usar:**
1. Acesse `/schedule-debug`
2. Faça login primeiro
3. Selecione uma data
4. Execute o debug completo

### 4. **Teste Geral do Sistema**
🔗 **URL:** `/booking-system-test`
- ✅ Testa todas as funcionalidades
- ✅ Agendamento manual
- ✅ Configuração de horários
- ✅ Interface administrativa

## 🎯 CENÁRIOS DE TESTE RECOMENDADOS

### **Empresa Pablo (dados configurados):**
- **Segunda a Sexta:** 09:00-18:00 ✅ Deve mostrar horários
- **Sábado e Domingo:** Fechado ❌ Não deve mostrar horários

### **Datas para testar:**
```
Segunda: 2025-01-06 (deve ter horários)
Terça: 2025-01-07 (deve ter horários)
Quarta: 2025-01-08 (deve ter horários)
Quinta: 2025-01-09 (deve ter horários)
Sexta: 2025-01-10 (deve ter horários)
Sábado: 2025-01-11 (não deve ter horários)
Domingo: 2025-01-12 (não deve ter horários)
```

## 🔍 COMO IDENTIFICAR PROBLEMAS

### **Se não aparecem horários em dias úteis:**
1. Abra o console (F12)
2. Procure por erros em vermelho
3. Verifique se há dados na tabela `daily_schedules`
4. Confirme se `company_settings.status_aberto = true`

### **Se aparecem horários em fins de semana:**
1. Verifique configuração na tabela `daily_schedules`
2. Confirme se `is_active = false` para sábado (6) e domingo (0)

### **Logs importantes no console:**
```
🔍 Checking available times with daily schedules
📅 Day of week: X
✅ Active schedule found
⏰ Available times generated
```

## 🚀 FLUXO DE TESTE RECOMENDADO

### **Passo 1: Teste Básico**
1. Acesse `/quick-schedule-test`
2. Teste uma segunda-feira
3. Deve mostrar horários de 09:00 às 18:00

### **Passo 2: Teste Público**
1. Acesse `/public-booking-test`
2. Teste a mesma data
3. Compare os resultados

### **Passo 3: Debug Detalhado**
1. Se houver problemas, acesse `/schedule-debug`
2. Execute debug completo
3. Analise logs detalhados

### **Passo 4: Configuração**
1. Acesse área administrativa
2. Vá para Configurações → Horários
3. Verifique/ajuste configurações

## 📞 TROUBLESHOOTING

### **Problema: "Nenhum horário disponível" sempre**
**Possíveis causas:**
- Empresa não tem `status_aberto = true`
- Não há configuração na tabela `daily_schedules`
- Dia está marcado como `is_active = false`
- Erro na função `checkAvailableTimes`

**Solução:**
1. Teste com `/quick-schedule-test` primeiro
2. Verifique logs no console
3. Confirme dados no banco

### **Problema: Horários aparecem em dias fechados**
**Possíveis causas:**
- Configuração incorreta na tabela `daily_schedules`
- Problema no cálculo do dia da semana

**Solução:**
1. Verifique configuração de horários
2. Confirme `is_active = false` para dias fechados

### **Problema: Área pública não funciona**
**Possíveis causas:**
- Hook `usePublicBooking` com erro
- Políticas RLS bloqueando acesso
- Empresa não encontrada

**Solução:**
1. Compare com `/public-booking-test`
2. Verifique se empresa está ativa
3. Confirme políticas RLS

---

## 🎯 PRÓXIMOS PASSOS

1. **Teste todas as páginas** para identificar onde está o problema
2. **Compare resultados** entre diferentes testes
3. **Analise logs** no console do navegador
4. **Verifique dados** no banco se necessário
5. **Ajuste configurações** conforme identificado

**Status:** 🟡 Sistema implementado, testando sincronização