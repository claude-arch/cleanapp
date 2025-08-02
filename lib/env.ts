import { z } from 'zod';

const envSchema = z.object({
  // Database & Auth (Supabase)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),
  
  // Payments (Stripe)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_', 'Invalid Stripe publishable key'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_', 'Invalid Stripe secret key'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_', 'Invalid Stripe webhook secret').optional(),
  
  // Application
  NEXT_PUBLIC_APP_URL: z.string().url('Invalid app URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters'),
  
  // External APIs (Optional)
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  
  // Analytics (Optional)
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
  
  // Rate Limiting (Optional)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
    throw new Error(
      `❌ Invalid environment variables:\n${missingVars.join('\n')}\n\nPlease check your .env.local file.`
    );
  }
  throw error;
}

export { env };

// Helper functions for environment checks
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Feature flags based on environment variables
export const features = {
  googleMaps: !!env.GOOGLE_MAPS_API_KEY,
  sms: !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN),
  email: !!env.RESEND_API_KEY,
  analytics: !!(env.NEXT_PUBLIC_GA_ID || env.NEXT_PUBLIC_POSTHOG_KEY),
  rateLimit: !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN),
} as const;

// Validate required features for production
if (isProduction) {
  const requiredFeatures = ['email'] as const;
  const missingFeatures = requiredFeatures.filter(feature => !features[feature]);
  
  if (missingFeatures.length > 0) {
    console.warn(
      `⚠️  Missing optional features in production: ${missingFeatures.join(', ')}`
    );
  }
}

// Export validated environment variables
export const config = {
  supabase: {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  },
  stripe: {
    publishableKey: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  },
  app: {
    url: env.NEXT_PUBLIC_APP_URL,
    secret: env.NEXTAUTH_SECRET,
  },
  external: {
    googleMaps: env.GOOGLE_MAPS_API_KEY,
    twilio: {
      accountSid: env.TWILIO_ACCOUNT_SID,
      authToken: env.TWILIO_AUTH_TOKEN,
      phoneNumber: env.TWILIO_PHONE_NUMBER,
    },
    resend: env.RESEND_API_KEY,
  },
  analytics: {
    googleAnalytics: env.NEXT_PUBLIC_GA_ID,
    posthog: {
      key: env.NEXT_PUBLIC_POSTHOG_KEY,
      host: env.NEXT_PUBLIC_POSTHOG_HOST,
    },
  },
  redis: {
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  },
} as const;
