# UI/UX Design Document - ZapAgenda Área do Cliente

## Overview

Este documento detalha o design de interface e experiência do usuário para a área do cliente do ZapAgenda, seguindo uma abordagem mobile-first inspirada no WhatsApp Business. O design prioriza simplicidade, profissionalismo e familiaridade para usuários brasileiros.

## Architecture

### Design System Structure

```
src/
├── styles/
│   ├── globals.css           # Variáveis CSS e reset
│   ├── components.css        # Estilos de componentes
│   └── animations.css        # Animações e transições
├── components/
│   ├── ui/
│   │   ├── Button/           # Sistema de botões
│   │   ├── Card/             # Cards reutilizáveis
│   │   ├── Input/            # Campos de formulário
│   │   └── Badge/            # Pills e badges
│   └── client/
│       ├── ClientHeader/     # Cabeçalho da área do cliente
│       ├── DateSelector/     # Seletor de datas
│       ├── TimeSlots/        # Carrossel de horários
│       ├── ServiceCard/      # Cards de serviços
│       └── BookingForm/      # Formulário de agendamento
└── pages/
    └── client/
        ├── ClientBooking.tsx # Página principal de agendamento
        ├── ClientLogin.tsx   # Página de login
        └── ClientDashboard.tsx # Dashboard do cliente
```

### Visual Hierarchy

```
Level 1: Headers (24px, semi-bold)
Level 2: Subheaders (20px, medium)
Level 3: Body Text (16px, regular)
Level 4: Secondary Text (14px, regular)
Level 5: Caption (12px, regular)
```

## Components and Interfaces

### 1. Design System Foundation

#### CSS Variables
```css
:root {
  /* Colors */
  --bg-primary: #FAFAFA;
  --bg-card: #FFFFFF;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --accent-primary: #25d366;
  --accent-secondary: #10b981;
  --border-light: #e5e7eb;
  --border-medium: #d1d5db;
  --shadow-soft: rgba(0,0,0,0.06);
  --shadow-medium: rgba(0,0,0,0.12);
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  
  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 9999px;
  
  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --line-height-tight: 1.2;
  --line-height-normal: 1.5;
  
  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 500ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

#### Base Styles
```css
* {
  box-sizing: border-box;
}

body {
  font-family: var(--font-family);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: var(--line-height-normal);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.container {
  max-width: 400px;
  margin: 0 auto;
  padding: 0 var(--space-md);
}
```

### 2. ClientHeader Component

#### Structure
```typescript
interface ClientHeaderProps {
  companyName: string;
  companySegment: string;
  companyLogo: string;
  onMenuAction: (action: MenuAction) => void;
}

type MenuAction = 'appointments' | 'history' | 'logout';
```

#### Styling
```css
.client-header {
  background: var(--bg-card);
  padding: var(--space-lg) var(--space-md);
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.company-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.company-logo {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  border: 3px solid var(--bg-card);
  box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08);
  margin-bottom: var(--space-sm);
}

.company-name {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
  margin-bottom: var(--space-xs);
}

.company-segment {
  font-size: 14px;
  color: var(--text-secondary);
  text-align: center;
}

.menu-button {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 20px;
  cursor: pointer;
  padding: var(--space-sm);
  border-radius: var(--radius-sm);
  transition: background-color var(--transition-fast);
}

.menu-button:hover {
  background-color: var(--border-light);
}
```

### 3. DateSelector Component

#### Structure
```typescript
interface DateSelectorProps {
  availableDates: Date[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
}

interface DateCardProps {
  date: Date;
  isSelected: boolean;
  isAvailable: boolean;
  onClick: () => void;
}
```

#### Styling
```css
.date-selector {
  padding: var(--space-lg) 0;
}

.date-cards-container {
  display: flex;
  gap: var(--space-sm);
  overflow-x: auto;
  padding: 0 var(--space-md);
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.date-card {
  min-width: 80px;
  padding: var(--space-md) var(--space-sm);
  background: var(--bg-card);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-normal);
  box-shadow: 0 2px 8px var(--shadow-soft);
}

.date-card.selected {
  border-color: var(--accent-primary);
  background: rgba(37, 211, 102, 0.1);
}

.date-card.unavailable {
  opacity: 0.5;
  cursor: not-allowed;
}

.date-card-day {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: var(--space-xs);
  text-transform: uppercase;
  font-weight: 500;
}

.date-card-date {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}
```

### 4. TimeSlots Component

#### Structure
```typescript
interface TimeSlotsProps {
  availableTimes: string[];
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
}

interface TimeSlotState {
  available: boolean;
  selected: boolean;
  time: string;
}
```

#### Styling
```css
.time-slots {
  padding: var(--space-lg) 0;
}

.time-slots-container {
  display: flex;
  gap: var(--space-sm);
  overflow-x: auto;
  padding: 0 var(--space-md);
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.time-slot {
  min-width: 80px;
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-card);
  border: 2px solid var(--accent-primary);
  border-radius: var(--radius-full);
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-normal);
  font-weight: 500;
  white-space: nowrap;
}

.time-slot.selected {
  background: var(--accent-primary);
  color: white;
}

.time-slot.unavailable {
  background: var(--border-light);
  border-color: var(--border-medium);
  color: var(--text-muted);
  cursor: not-allowed;
}

.time-slot:hover:not(.unavailable):not(.selected) {
  background: rgba(37, 211, 102, 0.1);
}
```

### 5. ServiceCard Component

#### Structure
```typescript
interface ServiceCardProps {
  service: {
    id: string;
    name: string;
    duration: number;
    price?: number;
    description?: string;
  };
  isSelected: boolean;
  onSelect: (serviceId: string) => void;
}
```

#### Styling
```css
.service-card {
  background: var(--bg-card);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-md);
  cursor: pointer;
  transition: all var(--transition-normal);
  box-shadow: 0 2px 8px var(--shadow-soft);
}

.service-card.selected {
  border-color: var(--accent-primary);
  background: rgba(37, 211, 102, 0.05);
}

.service-card:hover:not(.selected) {
  border-color: var(--border-medium);
  box-shadow: 0 4px 16px var(--shadow-medium);
}

.service-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-sm);
}

.service-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.service-details {
  display: flex;
  gap: var(--space-md);
  font-size: 14px;
  color: var(--text-secondary);
}

.service-duration::before {
  content: "⏱️ ";
}

.service-price::before {
  content: "💰 ";
}

.service-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-medium);
  border-radius: var(--radius-sm);
  position: relative;
  transition: all var(--transition-fast);
}

.service-card.selected .service-checkbox {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
}

.service-card.selected .service-checkbox::after {
  content: "✓";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}
```

### 6. BookingForm Component

#### Structure
```typescript
interface BookingFormProps {
  onSubmit: (data: BookingFormData) => void;
  loading: boolean;
  clientData?: {
    name: string;
    phone: string;
    email?: string;
  };
}

interface BookingFormData {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}
```

#### Styling
```css
.booking-form {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  margin: var(--space-lg) var(--space-md);
  box-shadow: 0 4px 16px var(--shadow-soft);
}

.form-group {
  margin-bottom: var(--space-lg);
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.form-input {
  width: 100%;
  padding: var(--space-md);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: 16px;
  transition: border-color var(--transition-fast);
  background: var(--bg-card);
}

.form-input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.1);
}

.form-input.error {
  border-color: #ef4444;
}

.form-error {
  color: #ef4444;
  font-size: 12px;
  margin-top: var(--space-xs);
}

.submit-button {
  width: 100%;
  height: 56px;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
}

.submit-button:hover:not(:disabled) {
  background: var(--accent-secondary);
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(37, 211, 102, 0.3);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.submit-button.loading {
  pointer-events: none;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: var(--radius-full);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

## Data Models

### UI State Management

```typescript
interface ClientBookingState {
  // Company Data
  company: {
    name: string;
    segment: string;
    logo: string;
    slug: string;
  };
  
  // Booking Flow State
  selectedDate: Date | null;
  selectedTime: string | null;
  selectedServices: string[];
  
  // Form State
  clientData: {
    name: string;
    phone: string;
    email: string;
  };
  
  // UI State
  loading: {
    dates: boolean;
    times: boolean;
    services: boolean;
    submission: boolean;
  };
  
  errors: {
    [field: string]: string;
  };
  
  // Available Data
  availableDates: Date[];
  availableTimes: string[];
  services: Service[];
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price?: number;
  description?: string;
  isActive: boolean;
}
```

### Animation States

```typescript
interface AnimationState {
  cardEntrance: 'entering' | 'entered' | 'exiting';
  formValidation: 'idle' | 'validating' | 'success' | 'error';
  buttonState: 'idle' | 'loading' | 'success' | 'error';
  pageTransition: 'idle' | 'transitioning';
}
```

## Error Handling

### Form Validation

```typescript
interface ValidationRules {
  name: {
    required: true;
    minLength: 2;
    pattern: /^[a-zA-ZÀ-ÿ\s]+$/;
  };
  phone: {
    required: true;
    pattern: /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
  };
  email: {
    required: false;
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  };
}

interface ValidationError {
  field: string;
  message: string;
  type: 'required' | 'pattern' | 'minLength' | 'custom';
}
```

### Error Display Strategy

```css
.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: var(--space-md);
  border-radius: var(--radius-md);
  font-size: 14px;
  margin-bottom: var(--space-md);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.error-icon {
  color: #dc2626;
  font-size: 16px;
}

.success-message {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
  padding: var(--space-md);
  border-radius: var(--radius-md);
  font-size: 14px;
  margin-bottom: var(--space-md);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
```

## Testing Strategy

### Visual Regression Testing

```typescript
// Storybook stories for visual testing
export default {
  title: 'Client/BookingFlow',
  component: ClientBooking,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const Default = () => <ClientBooking />;
export const WithSelectedDate = () => <ClientBooking initialDate={new Date()} />;
export const LoadingState = () => <ClientBooking loading={true} />;
export const ErrorState = () => <ClientBooking error="Erro ao carregar dados" />;
```

### Accessibility Testing

```typescript
describe('Client Booking Accessibility', () => {
  it('should have proper heading hierarchy', () => {
    render(<ClientBooking />);
    const headings = screen.getAllByRole('heading');
    expect(headings[0]).toHaveAttribute('aria-level', '1');
  });

  it('should have proper form labels', () => {
    render(<BookingForm />);
    expect(screen.getByLabelText('Nome completo')).toBeInTheDocument();
    expect(screen.getByLabelText('Telefone')).toBeInTheDocument();
  });

  it('should have proper focus management', () => {
    render(<ClientBooking />);
    const firstFocusable = screen.getByRole('button', { name: /agendar/i });
    expect(firstFocusable).toHaveFocus();
  });
});
```

### Performance Testing

```typescript
describe('Client Booking Performance', () => {
  it('should render within performance budget', async () => {
    const startTime = performance.now();
    render(<ClientBooking />);
    await waitFor(() => screen.getByText('Agendar Novo Horário'));
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(100); // 100ms budget
  });

  it('should handle large service lists efficiently', () => {
    const manyServices = Array.from({ length: 100 }, (_, i) => ({
      id: `service-${i}`,
      name: `Serviço ${i}`,
      duration: 30,
      price: 50,
    }));
    
    render(<ServiceSelector services={manyServices} />);
    expect(screen.getByText('Serviço 0')).toBeInTheDocument();
  });
});
```

## Implementation Guidelines

### Mobile-First Approach

```css
/* Base styles for mobile (360px+) */
.container {
  padding: var(--space-md);
}

/* Tablet styles (768px+) */
@media (min-width: 768px) {
  .container {
    max-width: 500px;
    padding: var(--space-lg);
  }
  
  .date-cards-container {
    justify-content: center;
  }
}

/* Desktop styles (1024px+) */
@media (min-width: 1024px) {
  .container {
    max-width: 600px;
  }
  
  .booking-form {
    padding: var(--space-xl);
  }
}
```

### Touch Optimization

```css
.touch-target {
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scrollable-horizontal {
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x mandatory;
}

.scroll-item {
  scroll-snap-align: start;
}
```

### Loading States

```css
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-text {
  height: 1em;
  border-radius: 4px;
}

.skeleton-avatar {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
}
```

### Micro-interactions

```css
.button-press {
  transform: scale(0.98);
  transition: transform 0.1s ease;
}

.card-hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px var(--shadow-medium);
  transition: all var(--transition-normal);
}

.success-bounce {
  animation: successBounce 0.6s ease-out;
}

@keyframes successBounce {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
```