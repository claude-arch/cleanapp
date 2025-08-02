import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize rate limiter
const ratelimit = process.env.UPSTASH_REDIS_REST_URL
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
    })
  : null;

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/bookings',
  '/messages',
  '/settings',
  '/api/bookings',
  '/api/profile',
  '/api/messages',
  '/api/payments',
  '/api/reviews',
];

// Admin routes that require admin role
const adminRoutes = [
  '/admin',
  '/api/admin',
];

// Provider routes that require provider role
const providerRoutes = [
  '/provider',
  '/api/provider',
];

// API routes with specific rate limits
const apiRateLimits = {
  '/api/auth': { requests: 5, window: '1 m' },
  '/api/bookings': { requests: 10, window: '1 h' },
  '/api/search': { requests: 60, window: '1 m' },
  '/api/payments': { requests: 20, window: '1 h' },
};

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;

  // Apply rate limiting
  if (ratelimit && process.env.RATE_LIMIT_ENABLED === 'true') {
    const ip = req.ip ?? '127.0.0.1';
    
    // Check for specific API rate limits
    const apiRoute = Object.keys(apiRateLimits).find(route => 
      pathname.startsWith(route)
    );
    
    if (apiRoute) {
      const { requests, window } = apiRateLimits[apiRoute as keyof typeof apiRateLimits];
      const specificRateLimit = new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(requests, window),
        analytics: true,
      });
      
      const { success, limit, reset, remaining } = await specificRateLimit.limit(
        `${apiRoute}_${ip}`
      );
      
      if (!success) {
        return new NextResponse('Rate limit exceeded', {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(reset).toISOString(),
          },
        });
      }
      
      // Add rate limit headers to successful responses
      res.headers.set('X-RateLimit-Limit', limit.toString());
      res.headers.set('X-RateLimit-Remaining', remaining.toString());
      res.headers.set('X-RateLimit-Reset', new Date(reset).toISOString());
    } else {
      // Apply general rate limiting
      const { success, limit, reset, remaining } = await ratelimit.limit(ip);
      
      if (!success) {
        return new NextResponse('Rate limit exceeded', {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(reset).toISOString(),
          },
        });
      }
      
      res.headers.set('X-RateLimit-Limit', limit.toString());
      res.headers.set('X-RateLimit-Remaining', remaining.toString());
      res.headers.set('X-RateLimit-Reset', new Date(reset).toISOString());
    }
  }

  // Handle authentication for protected routes
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  const isAdminRoute = adminRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  const isProviderRoute = providerRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (isProtectedRoute || isAdminRoute || isProviderRoute) {
    const supabase = createMiddlewareClient({ req, res });
    
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Redirect to login if no session
    if (!session) {
      const redirectUrl = new URL('/auth/signin', req.url);
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Get user profile to check role
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    // Check admin access
    if (isAdminRoute && user?.role !== 'admin') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Check provider access
    if (isProviderRoute && user?.role !== 'provider') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Add user info to headers for API routes
    if (pathname.startsWith('/api/')) {
      res.headers.set('X-User-ID', session.user.id);
      res.headers.set('X-User-Role', user?.role || 'customer');
      res.headers.set('X-User-Email', session.user.email || '');
    }
  }

  // Handle CORS for API routes
  if (pathname.startsWith('/api/')) {
    const origin = req.headers.get('origin');
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
    
    if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
      res.headers.set('Access-Control-Allow-Origin', origin || '*');
    }
    
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    res.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    res.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    );

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: res.headers });
    }
  }

  // Security headers
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  
  if (req.nextUrl.protocol === 'https:') {
    res.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
