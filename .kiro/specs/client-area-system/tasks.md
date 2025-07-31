# Implementation Plan

- [ ] 1. Setup database schema and migrations
  - Create client_sessions table for managing client authentication
  - Add has_account, last_login, and account_status columns to existing clients table
  - Create optimized indexes for phone lookups and session management
  - Write migration scripts to update existing client records
  - _Requirements: 7.1, 7.3_

- [ ] 2. Implement client authentication service
  - Create clientAuthService.ts with phone-based login functionality
  - Implement session token generation and validation
  - Add rate limiting for login attempts (5 attempts per hour per IP)
  - Create phone number validation and sanitization utilities
  - _Requirements: 2.2, 2.3, 2.4_

- [ ] 3. Create client authentication hook
  - Implement useClientAuth hook for managing authentication state
  - Add session persistence using localStorage/sessionStorage
  - Handle automatic session refresh and expiration
  - Implement logout functionality with session cleanup
  - _Requirements: 2.1, 2.3, 3.4_

- [ ] 4. Build client login page
  - Create ClientLogin.tsx with phone number input form
  - Implement client lookup and authentication flow
  - Add error handling for invalid phones and account issues
  - Create redirect logic for successful authentication
  - _Requirements: 2.1, 2.2, 2.4_

- [ ] 5. Implement automatic client registration
  - Modify public booking form to detect new vs existing clients
  - Add automatic account creation on first successful booking
  - Update client record with has_account flag when account is created
  - Send welcome notification to new client accounts
  - _Requirements: 1.2, 1.3, 1.4_

- [ ] 6. Create client dashboard layout
  - Build ClientDashboard.tsx as main client area page
  - Implement ClientHeader.tsx with company branding and client menu
  - Create responsive layout for desktop and mobile devices
  - Add navigation structure for different client sections
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 7. Build client appointments management
  - Create ClientAppointments.tsx to display upcoming appointments
  - Implement AppointmentCard.tsx component for individual appointment display
  - Add appointment cancellation functionality for eligible bookings
  - Create real-time updates for appointment status changes
  - _Requirements: 4.1, 4.3, 4.4_

- [ ] 8. Implement client booking history
  - Create ClientHistory.tsx to show past and cancelled appointments
  - Add filtering and sorting options for appointment history
  - Implement pagination for large appointment lists
  - Create export functionality for appointment history
  - _Requirements: 4.2, 4.3_

- [ ] 9. Build new appointment booking for clients
  - Create NewBookingForm.tsx with pre-filled client data
  - Implement service selection and availability checking
  - Add calendar integration for date/time selection
  - Create booking confirmation and notification system
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 10. Implement client profile management
  - Create ClientProfile.tsx for viewing and editing client information
  - Add form validation for profile updates (name, phone, email)
  - Implement phone number change with uniqueness validation
  - Create profile update confirmation and audit logging
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 11. Integrate with merchant dashboard
  - Update merchant client list to show accounts with has_account flag
  - Add client activity tracking in merchant dashboard
  - Create notifications for merchant when clients use self-service
  - Update appointment sources to distinguish client area bookings
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 12. Add routing and navigation
  - Create client area routes in App.tsx (/client/:slug/*)
  - Implement protected routes that require client authentication
  - Add navigation guards and redirect logic for unauthenticated access
  - Create breadcrumb navigation for client area sections
  - _Requirements: 3.2, 3.3_

- [ ] 13. Implement security and session management
  - Add CSRF protection for client area forms
  - Implement secure session storage and automatic cleanup
  - Add client activity logging for security auditing
  - Create session timeout warnings and automatic logout
  - _Requirements: 2.3, 7.4_

- [ ] 14. Add error handling and loading states
  - Create error boundaries for client area components
  - Implement loading states for all async operations
  - Add user-friendly error messages for common scenarios
  - Create offline detection and graceful degradation
  - _Requirements: 2.4, 5.3_

- [ ] 15. Create responsive mobile interface
  - Optimize client area layout for mobile devices
  - Implement touch-friendly navigation and interactions
  - Add mobile-specific features like swipe gestures
  - Test and optimize performance on mobile devices
  - _Requirements: 3.1, 3.2_

- [ ] 16. Add comprehensive testing
  - Write unit tests for authentication service and hooks
  - Create integration tests for booking flow and profile management
  - Add end-to-end tests for complete client journey
  - Implement accessibility testing for client area components
  - _Requirements: 7.3, 7.4_