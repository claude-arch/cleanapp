# CleanConnect - Technical Architecture Documentation

## 1. System Overview

CleanConnect is a modern, scalable marketplace platform built with a microservices-oriented architecture using Next.js, Supabase, and cloud-native technologies. The system is designed for high availability, security, and rapid scaling.

### Architecture Principles
- **API-First Design**: All functionality exposed through RESTful APIs
- **Mobile-First**: Progressive Web App with offline capabilities
- **Security by Design**: Zero-trust security model with end-to-end encryption
- **Scalability**: Horizontal scaling with auto-scaling infrastructure
- **Observability**: Comprehensive monitoring, logging, and alerting

## 2. High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │   Mobile PWA    │    │   Admin Panel   │
│   (Next.js)     │    │   (Next.js)     │    │   (Next.js)     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │     API Gateway           │
                    │     (Next.js API)         │
                    └─────────────┬─────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
    ┌─────┴─────┐         ┌───────┴───────┐       ┌───────┴───────┐
    │ Supabase  │         │   Stripe      │       │  Third-Party  │
    │ Database  │         │   Payments    │       │   Services    │
    │ Auth      │         │   Connect     │       │   (SMS, Maps) │
    │ Storage   │         │               │       │               │
    └───────────┘         └───────────────┘       └───────────────┘
```

## 3. Technology Stack

### 3.1 Frontend Stack
```typescript
// Core Framework
Next.js 14.0+          // React framework with App Router
React 18+              // UI library
TypeScript 5.0+        // Type safety

// Styling & UI
Tailwind CSS 3.3+      // Utility-first CSS framework
Headless UI            // Unstyled, accessible UI components
Framer Motion          // Animation library
React Hook Form        // Form handling
Zod                    // Schema validation

// State Management
Zustand                // Lightweight state management
React Query            // Server state management
```

### 3.2 Backend Stack
```typescript
// Runtime & Framework
Node.js 18+            // JavaScript runtime
Next.js API Routes     // Serverless API endpoints

// Database & Auth
Supabase               // Backend-as-a-Service
PostgreSQL 15+         // Primary database
Supabase Auth          // Authentication service
Supabase Storage       // File storage

// External Services
Stripe Connect         // Payment processing
Twilio                 // SMS notifications
Resend                 // Email delivery
Google Maps API        // Location services
Checkr API             // Background checks
```

### 3.3 Infrastructure Stack
```yaml
# Hosting & Deployment
Vercel:                # Frontend hosting and serverless functions
  - Edge Network       # Global CDN
  - Auto-scaling       # Automatic scaling
  - Preview deploys    # Branch previews

# Database & Storage
Supabase:
  - PostgreSQL         # Primary database
  - Real-time          # WebSocket connections
  - Edge Functions     # Serverless functions
  - Storage            # File storage

# Monitoring & Analytics
PostHog:               # Product analytics
Sentry:                # Error tracking
Uptime Robot:          # Uptime monitoring
Vercel Analytics:      # Performance monitoring
```

## 4. Database Design

### 4.1 Core Schema
```sql
-- Users and Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Profiles
CREATE TABLE customer_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    emergency_contact JSONB,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Provider Profiles
CREATE TABLE provider_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(200) NOT NULL,
    description TEXT,
    hourly_rate DECIMAL(8,2),
    service_radius INTEGER DEFAULT 25, -- miles
    verification_status verification_status DEFAULT 'pending',
    verified_at TIMESTAMP WITH TIME ZONE,
    insurance_expires_at DATE,
    background_check_expires_at DATE,
    availability JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Addresses
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(50) DEFAULT 'Home',
    street_address VARCHAR(255) NOT NULL,
    apartment VARCHAR(50),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    country VARCHAR(50) DEFAULT 'US',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services Catalog
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price DECIMAL(8,2) NOT NULL,
    price_per_sqft DECIMAL(6,4) DEFAULT 0,
    duration_minutes INTEGER NOT NULL,
    category service_category NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES users(id),
    provider_id UUID REFERENCES users(id),
    address_id UUID NOT NULL REFERENCES addresses(id),
    service_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status booking_status DEFAULT 'pending',
    subtotal DECIMAL(10,2) NOT NULL,
    commission DECIMAL(10,2) NOT NULL,
    processing_fee DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    recurring_booking_id UUID REFERENCES recurring_bookings(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Booking Items (Services within a booking)
CREATE TABLE booking_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id),
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(8,2) NOT NULL,
    total_price DECIMAL(8,2) NOT NULL
);

-- Recurring Bookings
CREATE TABLE recurring_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES users(id),
    provider_id UUID REFERENCES users(id),
    address_id UUID NOT NULL REFERENCES addresses(id),
    frequency recurring_frequency NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    preferred_time TIME,
    preferred_day_of_week INTEGER, -- 0-6 (Sunday-Saturday)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Methods
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_payment_method_id VARCHAR(255) NOT NULL,
    type payment_method_type NOT NULL,
    last_four VARCHAR(4),
    brand VARCHAR(50),
    exp_month INTEGER,
    exp_year INTEGER,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    commission DECIMAL(10,2) NOT NULL,
    processing_fee DECIMAL(10,2) NOT NULL,
    status transaction_status DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payouts
CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    stripe_transfer_id VARCHAR(255),
    status payout_status DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    reviewer_id UUID NOT NULL REFERENCES users(id),
    reviewee_id UUID NOT NULL REFERENCES users(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    photos TEXT[], -- Array of image URLs
    response TEXT, -- Response from reviewee
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    sender_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    message_type message_type DEFAULT 'text',
    attachments TEXT[], -- Array of file URLs
    read_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4.2 Custom Types
```sql
-- Enums
CREATE TYPE user_role AS ENUM ('customer', 'provider', 'admin');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE service_category AS ENUM ('standard', 'deep', 'move_in', 'move_out', 'add_on');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE recurring_frequency AS ENUM ('weekly', 'bi_weekly', 'monthly');
CREATE TYPE payment_method_type AS ENUM ('card', 'bank_account');
CREATE TYPE transaction_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');
CREATE TYPE payout_status AS ENUM ('pending', 'paid', 'failed');
CREATE TYPE message_type AS ENUM ('text', 'image', 'system');
CREATE TYPE notification_type AS ENUM ('booking', 'payment', 'review', 'system');
```

### 4.3 Indexes and Performance
```sql
-- Performance Indexes
CREATE INDEX idx_bookings_customer_date ON bookings(customer_id, service_date);
CREATE INDEX idx_bookings_provider_date ON bookings(provider_id, service_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_addresses_user_default ON addresses(user_id, is_default);
CREATE INDEX idx_reviews_reviewee_rating ON reviews(reviewee_id, rating);
CREATE INDEX idx_transactions_booking ON transactions(booking_id);
CREATE INDEX idx_messages_booking_sent ON messages(booking_id, sent_at);

-- Geospatial Index for location-based queries
CREATE INDEX idx_addresses_location ON addresses USING GIST(
    ll_to_earth(latitude, longitude)
);

-- Full-text search indexes
CREATE INDEX idx_providers_search ON provider_profiles USING GIN(
    to_tsvector('english', business_name || ' ' || COALESCE(description, ''))
);
```

## 5. API Design

### 5.1 RESTful API Structure
```typescript
// Base URL: https://cleanconnect.com/api/v1

// Authentication
POST   /auth/signup
POST   /auth/signin
POST   /auth/signout
POST   /auth/refresh
POST   /auth/forgot-password
POST   /auth/reset-password

// Users
GET    /users/profile
PUT    /users/profile
DELETE /users/account
POST   /users/upload-avatar

// Addresses
GET    /addresses
POST   /addresses
PUT    /addresses/:id
DELETE /addresses/:id

// Services
GET    /services
GET    /services/:id

// Bookings
GET    /bookings
POST   /bookings
GET    /bookings/:id
PUT    /bookings/:id
DELETE /bookings/:id
POST   /bookings/:id/cancel
POST   /bookings/:id/complete

// Payments
GET    /payment-methods
POST   /payment-methods
DELETE /payment-methods/:id
POST   /payments/create-intent
POST   /payments/confirm

// Reviews
GET    /reviews
POST   /reviews
GET    /reviews/:id

// Messages
GET    /messages/:bookingId
POST   /messages
PUT    /messages/:id/read

// Provider-specific
GET    /providers/search
GET    /providers/:id
PUT    /providers/availability
GET    /providers/earnings
GET    /providers/payouts

// Admin
GET    /admin/users
GET    /admin/bookings
GET    /admin/analytics
POST   /admin/verify-provider
```

### 5.2 API Response Format
```typescript
// Success Response
interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// Error Response
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// Example Usage
GET /bookings?page=1&limit=10
{
  "success": true,
  "data": [
    {
      "id": "booking_123",
      "customer": { ... },
      "provider": { ... },
      "service_date": "2025-08-15T10:00:00Z",
      "status": "confirmed",
      "total_amount": 120.00
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5
    }
  }
}
```

## 6. Security Architecture

### 6.1 Authentication & Authorization
```typescript
// JWT Token Structure
interface JWTPayload {
  sub: string;        // User ID
  email: string;      // User email
  role: 'customer' | 'provider' | 'admin';
  iat: number;        // Issued at
  exp: number;        // Expires at
}

// Role-Based Access Control
const permissions = {
  customer: ['read:own_bookings', 'create:bookings', 'read:providers'],
  provider: ['read:own_bookings', 'update:own_profile', 'read:earnings'],
  admin: ['read:all', 'write:all', 'delete:all']
};
```

### 6.2 Data Protection
- **Encryption at Rest**: All sensitive data encrypted using AES-256
- **Encryption in Transit**: TLS 1.3 for all communications
- **PII Protection**: Personal data encrypted with separate keys
- **Payment Security**: PCI DSS compliance via Stripe
- **File Upload Security**: Virus scanning and content validation

### 6.3 Security Headers
```typescript
// Next.js Security Headers
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];
```

## 7. Performance & Scalability

### 7.1 Caching Strategy
```typescript
// Multi-layer Caching
const cachingLayers = {
  // CDN Cache (Vercel Edge)
  static: '1 year',
  api: '5 minutes',
  
  // Application Cache (Redis)
  userSessions: '24 hours',
  providerAvailability: '1 hour',
  servicesCatalog: '6 hours',
  
  // Database Cache
  queryCache: '15 minutes',
  connectionPool: 'persistent'
};
```

### 7.2 Database Optimization
- **Connection Pooling**: PgBouncer for connection management
- **Read Replicas**: Separate read/write operations
- **Query Optimization**: Indexed queries and query analysis
- **Data Archival**: Automated archival of old bookings and messages

### 7.3 Monitoring & Observability
```typescript
// Performance Monitoring
const monitoring = {
  // Application Performance
  responseTime: '< 500ms (95th percentile)',
  errorRate: '< 0.1%',
  uptime: '99.9%',
  
  // Database Performance
  queryTime: '< 100ms (average)',
  connectionUtilization: '< 80%',
  
  // Business Metrics
  bookingConversion: '> 15%',
  customerRetention: '> 60%',
  providerUtilization: '> 20 hours/week'
};
```

## 8. Deployment & DevOps

### 8.1 CI/CD Pipeline
```yaml
# GitHub Actions Workflow
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Tests
        run: |
          npm ci
          npm run test
          npm run test:e2e
          
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### 8.2 Environment Configuration
```typescript
// Environment Variables
const config = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  
  // Payments
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  
  // Communications
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  
  // External APIs
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  CHECKR_API_KEY: process.env.CHECKR_API_KEY,
  
  // Monitoring
  SENTRY_DSN: process.env.SENTRY_DSN,
  POSTHOG_KEY: process.env.POSTHOG_KEY
};
```

## 9. Testing Strategy

### 9.1 Testing Pyramid
```typescript
// Unit Tests (70%)
describe('BookingService', () => {
  it('should calculate total price correctly', () => {
    const booking = new BookingService();
    const result = booking.calculateTotal({
      basePrice: 100,
      addOns: [{ price: 20 }, { price: 15 }],
      commission: 0.18
    });
    expect(result.total).toBe(159.30); // Including commission
  });
});

// Integration Tests (20%)
describe('Booking API', () => {
  it('should create booking with payment', async () => {
    const response = await request(app)
      .post('/api/bookings')
      .send(mockBookingData)
      .expect(201);

    expect(response.body.data.status).toBe('confirmed');
    expect(response.body.data.payment_intent).toBeDefined();
  });
});

// E2E Tests (10%)
describe('Booking Flow', () => {
  it('should complete full booking process', async () => {
    await page.goto('/book');
    await page.fill('[data-testid=address]', '123 Main St');
    await page.click('[data-testid=standard-clean]');
    await page.click('[data-testid=book-now]');

    await expect(page.locator('[data-testid=confirmation]')).toBeVisible();
  });
});
```

### 9.2 Performance Testing
```typescript
// Load Testing with Artillery
const loadTest = {
  config: {
    target: 'https://cleanconnect.com',
    phases: [
      { duration: 60, arrivalRate: 10 },  // Warm up
      { duration: 300, arrivalRate: 50 }, // Sustained load
      { duration: 60, arrivalRate: 100 }  // Peak load
    ]
  },
  scenarios: [
    {
      name: 'Booking Flow',
      weight: 70,
      flow: [
        { get: { url: '/' } },
        { post: { url: '/api/bookings', json: '{{ bookingData }}' } }
      ]
    }
  ]
};
```

## 10. Error Handling & Logging

### 10.1 Error Classification
```typescript
// Error Types
enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTH_ERROR',
  AUTHORIZATION = 'AUTHZ_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT_EXCEEDED',
  EXTERNAL_API = 'EXTERNAL_API_ERROR',
  DATABASE = 'DATABASE_ERROR',
  INTERNAL = 'INTERNAL_SERVER_ERROR'
}

// Error Response Format
interface ErrorResponse {
  success: false;
  error: {
    type: ErrorType;
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
  };
}
```

### 10.2 Logging Strategy
```typescript
// Structured Logging
const logger = {
  info: (message: string, meta?: object) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      requestId: getRequestId(),
      ...meta
    }));
  },

  error: (error: Error, meta?: object) => {
    console.error(JSON.stringify({
      level: 'error',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      requestId: getRequestId(),
      ...meta
    }));
  }
};
```

## 11. Backup & Disaster Recovery

### 11.1 Backup Strategy
- **Database Backups**: Daily automated backups with 30-day retention
- **File Storage Backups**: Real-time replication across multiple regions
- **Configuration Backups**: Version-controlled infrastructure as code
- **Recovery Testing**: Monthly disaster recovery drills

### 11.2 Business Continuity
- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 1 hour
- **Failover Strategy**: Automated failover to backup region
- **Communication Plan**: Automated status page updates

---

**Document Version**: 1.0
**Last Updated**: August 2025
**Next Review**: September 2025
