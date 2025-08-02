# CleanConnect - Professional Cleaning Services Marketplace

CleanConnect is a comprehensive marketplace platform that connects homeowners with verified professional cleaning services. Built with Next.js 14, Supabase, and Stripe Connect.

## Features

### For Customers
- **Instant Booking**: Book cleaning services in under 3 minutes
- **Verified Cleaners**: All service providers are background checked and insured
- **Flexible Scheduling**: One-time or recurring cleaning appointments
- **Secure Payments**: Stripe-powered payment processing with buyer protection
- **Quality Guarantee**: 24-hour satisfaction guarantee
- **Real-time Messaging**: Communicate directly with your cleaner
- **Review System**: Rate and review cleaning services

### For Service Providers
- **Professional Dashboard**: Manage bookings, availability, and earnings
- **Stripe Connect Integration**: Direct payouts to your bank account
- **Customer Management**: View customer details and service history
- **Availability Management**: Set your schedule and time slots
- **Performance Analytics**: Track ratings, earnings, and booking metrics

### For Administrators
- **Provider Verification**: Background check and insurance verification workflow
- **Platform Analytics**: Revenue, user growth, and performance metrics
- **Content Management**: Manage services, pricing, and platform content
- **Support Tools**: Customer service and dispute resolution tools

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Row Level Security
- **Payments**: Stripe Connect for marketplace payments
- **Communications**: Twilio for SMS, Resend for emails
- **Maps**: Google Maps API for location services
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account
- Google Maps API key (optional)
- Twilio account (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/cleanconnect.git
   cd cleanconnect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Database & Auth (Supabase)
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   # Payments (Stripe)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   
   # Application
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key
   ```

4. **Set up the database**
   
   Create a new Supabase project and run the database schema:
   ```bash
   # Copy the SQL from docs/Database-Schema.sql and run it in your Supabase SQL editor
   # Then run the seed script
   # Copy the SQL from scripts/seed-database.sql and run it in your Supabase SQL editor
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Setup

The application uses Supabase (PostgreSQL) with Row Level Security enabled. The complete database schema is available in `docs/Database-Schema.sql`.

### Key Tables
- `users` - User accounts and authentication
- `customer_profiles` - Customer-specific data
- `provider_profiles` - Service provider data and verification
- `addresses` - Customer addresses
- `services` - Available cleaning services
- `bookings` - Cleaning appointments
- `transactions` - Payment records
- `reviews` - Customer reviews and ratings
- `messages` - In-app messaging

### Seed Data
Run the seed script to populate initial services and test data:
```sql
-- Copy and run scripts/seed-database.sql in your Supabase SQL editor
```

## API Documentation

The application provides RESTful APIs for all major functionality:

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout

### Bookings
- `GET /api/bookings` - List user bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/[id]` - Get booking details
- `PATCH /api/bookings/[id]` - Update booking

### Services
- `GET /api/services` - List available services
- `GET /api/services/[id]` - Get service details

### Payments
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/webhook` - Stripe webhook handler

## Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Deploy**

### Environment Variables for Production

Make sure to set all required environment variables:
- Database credentials (Supabase)
- Stripe keys (live keys for production)
- External API keys (Google Maps, Twilio)
- Security keys (NextAuth secret)

## Development

### Project Structure
```
├── app/                    # Next.js 14 app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   └── book/              # Booking flow
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── layout/           # Layout components
│   └── booking/          # Booking-specific components
├── lib/                   # Utility libraries
│   ├── supabase.ts       # Database client
│   ├── stripe.ts         # Payment processing
│   └── validations.ts    # Form validation schemas
├── types/                 # TypeScript type definitions
├── docs/                  # Documentation
└── scripts/              # Database and deployment scripts
```

### Code Style
- TypeScript for type safety
- ESLint and Prettier for code formatting
- Tailwind CSS for styling
- Zod for runtime validation

### Testing
```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Business Model

CleanConnect operates on a commission-based model:
- **18% commission** on each completed booking
- **Stripe processing fees** (2.9% + $0.30 per transaction)
- **No subscription fees** for customers or providers
- **Freemium model** with premium features for providers

## Security

- Row Level Security (RLS) enabled on all database tables
- JWT-based authentication with Supabase
- HTTPS enforced in production
- Input validation and sanitization
- Rate limiting on API endpoints
- Secure payment processing with Stripe

## Support

- **Documentation**: Available in the `/docs` directory
- **Issues**: Report bugs and feature requests on GitHub
- **Email**: support@cleanconnect.com

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database powered by [Supabase](https://supabase.com/)
- Payments by [Stripe](https://stripe.com/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)
