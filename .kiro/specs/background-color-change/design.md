# Design Document

## Overview

Esta especificação de design detalha a implementação da mudança de cor de fundo para #FAFAFA em todo o aplicativo ZapAgenda. A solução utiliza variáveis CSS centralizadas e uma abordagem sistemática para garantir consistência e facilidade de manutenção.

## Architecture

### Estrutura de Temas CSS

```
src/
├── index.css (variáveis globais)
├── components/
│   ├── ui/ (componentes base)
│   └── [outros componentes]
└── pages/ (páginas da aplicação)
```

### Hierarquia de Aplicação

1. **Variáveis CSS Globais** - Definidas no `index.css`
2. **Classes Utilitárias** - Para aplicação rápida da cor
3. **Componentes Base** - Herdam automaticamente as variáveis
4. **Páginas Específicas** - Aplicam a cor de fundo via classes ou estilos

## Components and Interfaces

### 1. Sistema de Variáveis CSS

**Variáveis Principais:**
```css
:root {
  --app-background: #FAFAFA;
  --app-background-rgb: 250, 250, 250;
  --app-background-contrast: #000000; /* Para garantir contraste */
}
```

**Classes Utilitárias:**
```css
.app-background {
  background-color: var(--app-background);
}

.app-bg {
  background-color: var(--app-background);
}
```

### 2. Componentes Afetados

#### Páginas Principais:
- **Dashboard do Comerciante** - Aplicar fundo via classe CSS
- **Página Pública de Agendamento** - Substituir gradientes por cor sólida
- **Configurações** - Manter consistência visual
- **Relatórios** - Garantir legibilidade

#### Componentes UI:
- **Cards e Modais** - Manter fundo branco com sombras suaves
- **Formulários** - Contraste adequado com inputs
- **Navegação** - Adaptar cores de hover e active

### 3. Estratégia de Implementação

#### Fase 1: Configuração Base
1. Definir variáveis CSS no `index.css`
2. Criar classes utilitárias
3. Testar contraste com elementos existentes

#### Fase 2: Aplicação Sistemática
1. Aplicar em páginas principais (Index, Dashboard)
2. Atualizar página pública de agendamento
3. Verificar componentes de configurações

#### Fase 3: Refinamento
1. Ajustar sombras e bordas para o novo fundo
2. Verificar acessibilidade e contraste
3. Testar em diferentes dispositivos

## Data Models

### Configuração de Tema

```typescript
interface ThemeConfig {
  background: {
    primary: string;    // #FAFAFA
    secondary: string;  // Para variações se necessário
    contrast: string;   // Cor de contraste para textos
  };
  accessibility: {
    minContrast: number; // 4.5 para textos normais
    largeTextContrast: number; // 3.0 para textos grandes
  };
}
```

### Mapeamento de Componentes

```typescript
interface ComponentMapping {
  pages: string[];      // Lista de páginas a serem atualizadas
  components: string[]; // Componentes que precisam de ajustes
  utilities: string[];  // Classes CSS utilitárias criadas
}
```

## Error Handling

### Fallbacks de Cor

```css
.app-background {
  background-color: #FAFAFA;
  background-color: var(--app-background, #FAFAFA);
}
```

### Verificação de Contraste

- Implementar verificações automáticas de contraste
- Logs de aviso para combinações problemáticas
- Fallbacks para cores com contraste inadequado

### Compatibilidade

- Suporte para navegadores que não suportam CSS custom properties
- Fallbacks para cores hexadecimais diretas
- Testes em diferentes dispositivos e resoluções

## Testing Strategy

### Testes Visuais

1. **Verificação Manual:**
   - Navegar por todas as páginas principais
   - Verificar legibilidade de textos
   - Testar em modo claro e escuro (se aplicável)

2. **Testes de Contraste:**
   - Usar ferramentas de acessibilidade (axe-core)
   - Verificar WCAG 2.1 AA compliance
   - Testar com diferentes tamanhos de fonte

3. **Testes Responsivos:**
   - Desktop (1920x1080, 1366x768)
   - Tablet (768x1024)
   - Mobile (375x667, 414x896)

### Testes Automatizados

```typescript
// Exemplo de teste de contraste
describe('Background Color Accessibility', () => {
  it('should maintain adequate contrast ratio', () => {
    const backgroundColor = '#FAFAFA';
    const textColor = '#000000';
    const contrastRatio = calculateContrast(backgroundColor, textColor);
    expect(contrastRatio).toBeGreaterThan(4.5);
  });
});
```

### Checklist de Validação

- [ ] Todas as páginas principais aplicam a nova cor
- [ ] Contraste adequado em todos os textos
- [ ] Elementos interativos permanecem visíveis
- [ ] Sombras e bordas ajustadas para o novo fundo
- [ ] Compatibilidade com diferentes navegadores
- [ ] Performance não impactada
- [ ] Acessibilidade mantida ou melhorada

## Implementation Notes

### Prioridades de Implementação

1. **Alta Prioridade:**
   - Páginas principais (Dashboard, Página Pública)
   - Componentes de formulário
   - Navegação principal

2. **Média Prioridade:**
   - Modais e overlays
   - Componentes de configuração
   - Estados de loading e erro

3. **Baixa Prioridade:**
   - Animações e transições
   - Elementos decorativos
   - Componentes raramente usados

### Considerações de Performance

- Usar variáveis CSS para evitar recálculos
- Minimizar mudanças de layout durante a aplicação
- Otimizar para repaint/reflow mínimos

### Manutenibilidade

- Centralizar todas as definições de cor
- Documentar padrões de uso
- Criar guia de estilo para futuros desenvolvimentos