# 📍 LOCALIZAÇÃO DO SISTEMA DE HORÁRIOS POR DIA DA SEMANA

## 🎯 ONDE ESTÁ IMPLEMENTADO

### 1. **Componente Principal de Configuração**
📁 **Arquivo:** `src/components/settings/ScheduleSettings.tsx`
- ✅ Interface completa para configurar horários por dia
- ✅ Switches para ativar/desativar cada dia
- ✅ Campos de horário de abertura e fechamento
- ✅ Configuração de intervalos de almoço
- ✅ Função "Copiar para todos os dias"
- ✅ Salvamento automático no banco de dados

### 2. **Integração no Painel de Configurações**
📁 **Arquivo:** `src/components/SettingsPanel.tsx`
- ✅ Aba "Horários" no painel principal
- ✅ Integrado no sistema de tabs
- ✅ Acessível via área administrativa

### 3. **Banco de Dados**
📁 **Tabela:** `daily_schedules`
```sql
- id (UUID)
- company_id (UUID) 
- day_of_week (INTEGER 0-6)
- is_active (BOOLEAN)
- start_time (TIME)
- end_time (TIME)
- lunch_start (TIME)
- lunch_end (TIME)
- has_lunch_break (BOOLEAN)
```

### 4. **Serviços de Backend**
📁 **Arquivo:** `src/services/publicBookingService.ts`
- ✅ Função `checkAvailableTimes()` atualizada
- ✅ Consulta horários por dia da semana
- ✅ Considera intervalos de almoço
- ✅ Filtra horários ocupados

### 5. **Hook de Horários Disponíveis**
📁 **Arquivo:** `src/hooks/useAvailableTimes.ts`
- ✅ Função `generateAvailableTimesForDate()` atualizada
- ✅ Usa o novo sistema de daily_schedules
- ✅ Integração com área pública

## 🔧 COMO ACESSAR E USAR

### Para Configurar Horários:
1. **Login na área administrativa**
2. **Ir para "Configurações"**
3. **Clicar na aba "Horários"**
4. **Configurar cada dia individualmente:**
   - Ativar/desativar o dia
   - Definir horário de abertura
   - Definir horário de fechamento
   - Configurar intervalo de almoço (opcional)
5. **Clicar em "Salvar Alterações"**

### Para Testar o Sistema:
1. **Acesse:** `/schedule-debug` - Página de debug detalhado
2. **Acesse:** `/booking-system-test` - Testes gerais do sistema

## 📋 EXEMPLO DE CONFIGURAÇÃO

```
Segunda-feira: 08:00-18:00 (Almoço: 12:00-13:00)
Terça-feira: 09:00-17:00 (Sem almoço)
Quarta-feira: FECHADO
Quinta-feira: 08:00-16:00 (Almoço: 12:00-14:00)
Sexta-feira: 09:00-15:00
Sábado: 09:00-13:00
Domingo: FECHADO
```

## 🔄 FLUXO DE SINCRONIZAÇÃO

1. **Admin configura horários** → `ScheduleSettings.tsx`
2. **Dados salvos no banco** → `daily_schedules` table
3. **Área pública consulta** → `checkAvailableTimes()`
4. **Horários exibidos** → `TimeSelection.tsx`

## 🐛 DEBUG E TESTES

### Páginas de Teste:
- `/schedule-debug` - Debug detalhado com logs
- `/booking-system-test` - Testes gerais do sistema

### Logs no Console:
- Abra F12 no navegador
- Vá para a aba Console
- Teste o agendamento público
- Verifique os logs detalhados

## ⚠️ POSSÍVEIS PROBLEMAS

### Se não aparecem horários na área pública:

1. **Verificar se há configuração para o dia:**
   ```sql
   SELECT * FROM daily_schedules WHERE company_id = 'SEU_ID';
   ```

2. **Verificar se o dia está ativo:**
   ```sql
   SELECT * FROM daily_schedules 
   WHERE company_id = 'SEU_ID' 
   AND day_of_week = X 
   AND is_active = true;
   ```

3. **Verificar políticas RLS:**
   - Área pública precisa acessar daily_schedules
   - Verificar se company_settings.status_aberto = true

4. **Testar função diretamente:**
   ```javascript
   import { checkAvailableTimes } from '@/services/publicBookingService';
   const times = await checkAvailableTimes('company_id', '2025-01-08', 60);
   console.log(times);
   ```

## 🎯 STATUS ATUAL

✅ **IMPLEMENTADO E FUNCIONAL:**
- Configuração por dia da semana
- Interface administrativa
- Banco de dados estruturado
- Integração com área pública
- Sistema de debug

⚠️ **POSSÍVEL PROBLEMA:**
- Sincronização entre configuração e área pública
- Verificar se RLS policies estão corretas
- Testar com dados reais

## 📞 PRÓXIMOS PASSOS

1. **Testar na página `/schedule-debug`**
2. **Verificar logs no console**
3. **Confirmar dados no banco**
4. **Testar área pública de agendamento**