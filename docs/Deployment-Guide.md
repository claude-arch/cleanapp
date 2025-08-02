# CleanConnect - Deployment Guide

## 1. Prerequisites

### 1.1 Required Accounts
- **Vercel Account**: For hosting and deployment
- **Supabase Account**: For database and authentication
- **Stripe Account**: For payment processing
- **Twilio Account**: For SMS notifications
- **Google Cloud Account**: For Maps API
- **GitHub Account**: For version control and CI/CD

### 1.2 Local Development Setup
```bash
# Required software
Node.js 18+
npm or yarn
Git
PostgreSQL (optional, for local development)
```

## 2. Environment Configuration

### 2.1 Environment Variables
Create `.env.local` file in project root:

```bash
# Database & Auth (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres

# Payments (Stripe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Communications
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
RESEND_API_KEY=re_...

# External APIs
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
CHECKR_API_KEY=your-checkr-key

# Monitoring & Analytics
SENTRY_DSN=https://...
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Application
NEXTAUTH_URL=https://cleanconnect.com
NEXTAUTH_SECRET=your-secret-key
NEXT_PUBLIC_APP_URL=https://cleanconnect.com
```

### 2.2 Production Environment Variables
```bash
# Production-specific overrides
NODE_ENV=production
VERCEL_ENV=production

# Security
ALLOWED_ORIGINS=https://cleanconnect.com,https://www.cleanconnect.com
RATE_LIMIT_ENABLED=true
```

## 3. Database Setup

### 3.1 Supabase Project Setup
1. Create new Supabase project
2. Configure authentication providers
3. Set up database schema
4. Configure Row Level Security (RLS)
5. Set up storage buckets

```sql
-- Run the complete schema from Database-Schema.sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create all tables, indexes, and functions
-- (See Database-Schema.sql for complete setup)
```

### 3.2 Database Migrations
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase locally
supabase init

# Link to remote project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > types/supabase.ts
```

## 4. Third-Party Service Configuration

### 4.1 Stripe Setup
```bash
# Install Stripe CLI for webhook testing
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Configure webhooks in Stripe Dashboard:
# - payment_intent.succeeded
# - payment_intent.payment_failed
# - account.updated
# - transfer.created
```

**Stripe Connect Setup:**
1. Enable Express accounts in Stripe Dashboard
2. Configure application settings
3. Set up webhook endpoints
4. Test with Stripe test data

### 4.2 Twilio Configuration
```javascript
// Twilio service configuration
const twilioConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  messagingServiceSid: 'MG...', // Optional: for better delivery
};

// Required Twilio services:
// - SMS messaging
// - Phone number verification
// - Programmable messaging
```

### 4.3 Google Maps Setup
1. Enable required APIs in Google Cloud Console:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Distance Matrix API
2. Configure API key restrictions
3. Set up billing account

### 4.4 Background Check Integration (Checkr)
```javascript
// Checkr API configuration
const checkrConfig = {
  apiKey: process.env.CHECKR_API_KEY,
  environment: 'production', // or 'sandbox'
  packageSlug: 'driver_pro', // Background check package
};
```

## 5. Application Deployment

### 5.1 Vercel Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Configure custom domain
vercel domains add cleanconnect.com
vercel domains add www.cleanconnect.com
```

### 5.2 Vercel Configuration
Create `vercel.json`:
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://cleanconnect.com"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/",
      "has": [
        {
          "type": "host",
          "value": "www.cleanconnect.com"
        }
      ],
      "destination": "https://cleanconnect.com",
      "permanent": true
    }
  ]
}
```

### 5.3 Build Configuration
Update `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: [
      'your-project.supabase.co',
      'lh3.googleusercontent.com',
      'platform-lookaside.fbsbx.com'
    ],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

## 6. CI/CD Pipeline

### 6.1 GitHub Actions Workflow
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linting
        run: npm run lint
        
      - name: Run type checking
        run: npm run type-check
        
      - name: Run unit tests
        run: npm run test
        
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### 6.2 Environment Secrets
Configure in GitHub repository settings:
- `VERCEL_TOKEN`
- `ORG_ID`
- `PROJECT_ID`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- All other production environment variables

## 7. Monitoring & Analytics

### 7.1 Error Tracking (Sentry)
```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

### 7.2 Analytics (PostHog)
```javascript
// lib/analytics.ts
import posthog from 'posthog-js';

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  });
}
```

### 7.3 Uptime Monitoring
Configure Uptime Robot or similar service:
- Monitor main application endpoints
- Check API health endpoints
- Alert on downtime or performance issues

## 8. Security Configuration

### 8.1 SSL/TLS Setup
- Vercel automatically provides SSL certificates
- Configure HSTS headers
- Enable HTTPS redirects

### 8.2 Security Headers
```javascript
// Security headers in next.config.js
const securityHeaders = [
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
  }
];
```

### 8.3 Rate Limiting
```javascript
// middleware.ts
import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
});

export async function middleware(request) {
  const ip = request.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new NextResponse('Rate limit exceeded', { status: 429 });
  }

  return NextResponse.next();
}
```

## 9. Performance Optimization

### 9.1 Caching Strategy
- Static assets: 1 year cache
- API responses: 5 minutes cache
- Database queries: Connection pooling
- CDN: Vercel Edge Network

### 9.2 Image Optimization
```javascript
// next.config.js
module.exports = {
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
```

## 10. Backup & Recovery

### 10.1 Database Backups
- Supabase automatic daily backups
- Point-in-time recovery available
- Manual backup procedures documented

### 10.2 File Storage Backups
- Supabase Storage automatic replication
- Cross-region backup strategy
- Recovery procedures tested monthly

## 11. Launch Checklist

### 11.1 Pre-Launch
- [ ] All environment variables configured
- [ ] Database schema deployed
- [ ] Third-party integrations tested
- [ ] SSL certificates active
- [ ] Monitoring systems configured
- [ ] Backup systems verified
- [ ] Performance testing completed
- [ ] Security audit completed

### 11.2 Launch Day
- [ ] DNS records updated
- [ ] CDN cache cleared
- [ ] Monitoring alerts active
- [ ] Support team notified
- [ ] Rollback plan ready
- [ ] Performance metrics baseline established

### 11.3 Post-Launch
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify all integrations working
- [ ] Review user feedback
- [ ] Plan first iteration improvements

---

**Document Version**: 1.0  
**Last Updated**: August 2025  
**Next Review**: September 2025
