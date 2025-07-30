# ZapAgenda Technical Design Document

## Overview

ZapAgenda is a multi-tenant SaaS scheduling platform built with React, TypeScript, Vite, and Supabase. The system provides a dual-environment architecture: an authenticated administrative panel for business owners and public booking interfaces accessible via unique slug-based URLs. The platform enables businesses to manage services, schedules, and appointments while providing customers with a frictionless booking experience.

**Current Tech Stack:**
- Frontend: React 18 + TypeScript + Vite
- UI Components: Radix UI + Tailwind CSS + shadcn/ui
- Backend: Supabase (PostgreSQL + Auth + Storage + Real-time)
- State Management: TanStack Query (React Query)
- Form Handling: React Hook Form + Zod validation
- Routing: React Router DOM

## Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Admin Panel<br/>Authenticated] 
        B[Public Booking Page<br/>/{slug}]
    end
    
    subgraph "Application Layer"
        C[React App<br/>Vite + TypeScript]
        D[TanStack Query<br/>State Management]
        E[React Router<br/>Routing]
    end
    
    subgraph "Backend Services"
        F[Supabase Auth<br/>Authentication]
        G[Supabase Database<br/>PostgreSQL]
        H[Supabase Storage<br/>File Storage]
        I[Supabase Realtime<br/>Live Updates]
    end
    
    A --> C
    B --> C
    C --> D
    C --> E
    D --> F
    D --> G
    D --> H
    D --> I
```

### Multi-Tenant Architecture

The system implements a **shared database, shared schema** multi-tenancy model with data isolation through Row Level Security (RLS) policies:

- **Tenant Identification**: Each business is identified by their `company_id` (UUID) which references `auth.users.id`
- **Data Isolation**: RLS policies ensure data access is restricted by `company_id`
- **Public Access**: Specific policies allow public read access for booking functionality
- **Slug-based Routing**: Each business gets a unique slug for their public booking page

## Components and Interfaces

### Database Schema

#### Core Tables

```sql
-- Business profiles (extends auth.users)
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  company_name TEXT,
  business_type TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Business configuration and public settings
company_settings (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES profiles(id),
  slug TEXT UNIQUE NOT NULL,
  working_days INTEGER[],
  working_hours_start TIME,
  working_hours_end TIME,
  lunch_break_enabled BOOLEAN,
  lunch_start_time TIME,
  lunch_end_time TIME,
  appointment_interval INTEGER,
  max_simultaneous_appointments INTEGER,
  advance_booking_limit INTEGER,
  theme_color TEXT,
  welcome_message TEXT,
  logo_url TEXT,
  cover_image_url TEXT
)

-- Services offered by businesses
services (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER DEFAULT 60,
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true
)

-- Team members/professionals
professionals (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true
)

-- Customer information
clients (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  notes TEXT
)

-- Appointment bookings
appointments (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES profiles(id),
  client_id UUID REFERENCES clients(id),
  service_id UUID REFERENCES services(id),
  professional_id UUID REFERENCES professionals(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration INTEGER DEFAULT 60,
  status TEXT DEFAULT 'confirmed',
  notes TEXT
)
```

#### Optimized Indexes

```sql
-- Performance-critical indexes
CREATE INDEX idx_appointments_date_time ON appointments(company_id, appointment_date, appointment_time);
CREATE INDEX idx_appointments_professional_date ON appointments(professional_id, appointment_date);
CREATE INDEX idx_company_settings_slug ON company_settings(slug);
CREATE INDEX idx_services_company_active ON services(company_id, is_active);
CREATE INDEX idx_professionals_company_active ON professionals(company_id, is_active);
```

### Row Level Security (RLS) Policies

#### Multi-Tenant Data Isolation

```sql
-- Admin access: Companies can only access their own data
CREATE POLICY "Companies manage own data" ON [table]
FOR ALL TO authenticated
USING (company_id = auth.uid());

-- Public read access for booking functionality
CREATE POLICY "Public can view active services" ON services
FOR SELECT TO public
USING (is_active = true);

CREATE POLICY "Public can view company settings" ON company_settings
FOR SELECT TO public
USING (true);

-- Public booking: Allow anonymous appointment creation
CREATE POLICY "Public can create appointments" ON appointments
FOR INSERT TO public
WITH CHECK (true);

-- Public client creation for bookings
CREATE POLICY "Public can insert clients" ON clients
FOR INSERT TO public
WITH CHECK (true);
```

### Frontend Architecture

#### Route Structure

```typescript
// Admin routes (authenticated)
/admin/dashboard
/admin/services
/admin/appointments
/admin/professionals
/admin/settings

// Public routes (no auth required)
/{slug} - Public booking page
/{slug}/book - Booking form
/{slug}/confirmation - Booking confirmation
```

#### Component Hierarchy

```
App
├── AdminLayout (Protected)
│   ├── Dashboard
│   ├── ServicesManager
│   ├── AppointmentsManager
│   ├── ProfessionalsManager
│   └── SettingsManager
└── PublicLayout
    ├── BookingPage
    ├── BookingForm
    └── ConfirmationPage
```

## Data Models

### Availability Calculation Logic

The core scheduling logic calculates available time slots by:

1. **Base Schedule**: Start with business working hours and days
2. **Lunch Breaks**: Remove lunch break periods if enabled
3. **Existing Appointments**: Remove already booked slots
4. **Professional Availability**: Consider professional-specific schedules
5. **Service Duration**: Ensure sufficient time for service completion
6. **Advance Booking**: Respect booking limit settings

```typescript
interface AvailabilityCalculator {
  calculateAvailableSlots(params: {
    companyId: string;
    serviceId: string;
    professionalId?: string;
    date: Date;
    duration: number;
  }): Promise<TimeSlot[]>;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  professionalId?: string;
}
```

### Booking Flow Data Model

```typescript
interface BookingRequest {
  companySlug: string;
  serviceId: string;
  professionalId?: string;
  appointmentDate: string;
  appointmentTime: string;
  client: {
    name: string;
    phone: string;
    email?: string;
  };
  notes?: string;
}

interface BookingResponse {
  success: boolean;
  appointmentId?: string;
  error?: string;
  conflictDetails?: {
    suggestedSlots: TimeSlot[];
  };
}
```

## Error Handling

### Concurrency Control

**Double-booking Prevention:**
- Use database transactions with row-level locking
- Implement optimistic locking with version fields
- Real-time slot validation before booking confirmation

```sql
-- Prevent double booking with unique constraint
CREATE UNIQUE INDEX idx_unique_appointment_slot 
ON appointments(company_id, professional_id, appointment_date, appointment_time)
WHERE status != 'cancelled';
```

### Error Categories

1. **Validation Errors**: Invalid input data, business rule violations
2. **Availability Errors**: Slot no longer available, scheduling conflicts
3. **Authentication Errors**: Unauthorized access, expired sessions
4. **System Errors**: Database connectivity, external service failures

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
  };
}
```

## Testing Strategy

### Testing Pyramid

#### Unit Tests
- **Data Models**: Validation logic, business rules
- **Utilities**: Date/time calculations, slug generation
- **Components**: Individual UI component behavior
- **Services**: API client functions, data transformations

#### Integration Tests
- **Database Operations**: CRUD operations with RLS policies
- **Authentication Flow**: Login, logout, session management
- **Booking Flow**: End-to-end appointment creation
- **Multi-tenancy**: Data isolation verification

#### End-to-End Tests
- **Public Booking Journey**: Complete customer booking flow
- **Admin Management**: Business owner administrative tasks
- **Cross-tenant Isolation**: Verify data separation
- **Performance**: Load testing for concurrent bookings

### Test Data Strategy

```typescript
// Test data factories for consistent test setup
interface TestDataFactory {
  createCompany(overrides?: Partial<Company>): Company;
  createService(companyId: string, overrides?: Partial<Service>): Service;
  createAppointment(params: AppointmentParams): Appointment;
  createTimeSlots(date: Date, businessHours: BusinessHours): TimeSlot[];
}
```

## Performance Optimization

### Database Performance

#### Query Optimization
- **Indexed Queries**: All date/time and slug lookups use indexes
- **Query Batching**: Combine related queries to reduce round trips
- **Connection Pooling**: Supabase handles connection management
- **Read Replicas**: Consider for high-traffic scenarios

#### Caching Strategy

```typescript
// TanStack Query caching configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Cache keys for different data types
const CACHE_KEYS = {
  companySettings: (slug: string) => ['company', slug],
  availableSlots: (companyId: string, date: string) => ['slots', companyId, date],
  services: (companyId: string) => ['services', companyId],
} as const;
```

### Frontend Performance

#### Code Splitting
```typescript
// Lazy load admin and public sections
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const PublicBooking = lazy(() => import('./pages/PublicBooking'));
```

#### Bundle Optimization
- **Tree Shaking**: Remove unused code
- **Asset Optimization**: Compress images, minimize CSS/JS
- **CDN Delivery**: Serve static assets from CDN

### Real-time Updates

```typescript
// Supabase real-time subscriptions for live updates
const useRealtimeAppointments = (companyId: string) => {
  useEffect(() => {
    const subscription = supabase
      .channel('appointments')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'appointments',
        filter: `company_id=eq.${companyId}`,
      }, (payload) => {
        // Update local cache
        queryClient.invalidateQueries(['appointments', companyId]);
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, [companyId]);
};
```

## Security Considerations

### Authentication & Authorization

#### Admin Panel Security
- **JWT Tokens**: Supabase handles token management
- **Session Management**: Automatic token refresh
- **Role-based Access**: Company owner permissions only

#### Public Booking Security
- **Rate Limiting**: Prevent booking spam
- **Input Validation**: Sanitize all user inputs
- **CSRF Protection**: Built into Supabase client

### Data Protection

#### Row Level Security Implementation
```sql
-- Comprehensive RLS policies for data isolation
CREATE POLICY "tenant_isolation" ON appointments
FOR ALL TO authenticated
USING (company_id = auth.uid())
WITH CHECK (company_id = auth.uid());

-- Public booking policies with restrictions
CREATE POLICY "public_booking_insert" ON appointments
FOR INSERT TO public
WITH CHECK (
  -- Validate appointment is within business hours
  appointment_time BETWEEN 
    (SELECT working_hours_start FROM company_settings WHERE id = company_id) AND
    (SELECT working_hours_end FROM company_settings WHERE id = company_id)
);
```

#### Input Sanitization
```typescript
// Zod schemas for validation
const BookingSchema = z.object({
  serviceId: z.string().uuid(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointmentTime: z.string().regex(/^\d{2}:\d{2}$/),
  client: z.object({
    name: z.string().min(2).max(100),
    phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/),
    email: z.string().email().optional(),
  }),
});
```

### Infrastructure Security

#### Environment Configuration
```typescript
// Environment variables for sensitive data
const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  app: {
    environment: import.meta.env.MODE,
    baseUrl: import.meta.env.VITE_APP_BASE_URL,
  },
};
```

#### Content Security Policy
```html
<!-- CSP headers for XSS protection -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline';
               img-src 'self' data: https:;">
```

## Scalability Architecture

### Horizontal Scaling

#### Database Scaling
- **Read Replicas**: Distribute read queries across replicas
- **Connection Pooling**: Supabase handles connection management
- **Query Optimization**: Efficient indexes and query patterns

#### Application Scaling
- **Stateless Design**: No server-side session storage
- **CDN Integration**: Static asset delivery
- **Edge Functions**: Consider for high-traffic regions

### Monitoring & Observability

#### Performance Metrics
```typescript
// Performance monitoring setup
const performanceMonitor = {
  trackPageLoad: (pageName: string, loadTime: number) => {
    // Track page load performance
  },
  trackApiCall: (endpoint: string, duration: number, status: number) => {
    // Track API performance
  },
  trackBookingConversion: (step: string, success: boolean) => {
    // Track booking funnel
  },
};
```

#### Health Checks
- **Database Connectivity**: Monitor Supabase connection
- **API Response Times**: Track query performance
- **Error Rates**: Monitor booking failures
- **User Experience**: Track booking completion rates

This design provides a robust, scalable foundation for the ZapAgenda system while maintaining the existing visual identity and user experience requirements.