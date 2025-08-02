import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { PostgrestError } from '@supabase/supabase-js';

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'INTERNAL_ERROR';
    this.details = details;
    this.name = 'AppError';

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  // Handle custom AppError
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      },
      { status: 400 }
    );
  }

  // Handle Supabase/PostgreSQL errors
  if (isPostgrestError(error)) {
    const statusCode = getPostgrestStatusCode(error);
    return NextResponse.json(
      {
        success: false,
        error: getPostgrestErrorMessage(error),
        code: error.code || 'DATABASE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.details : undefined,
      },
      { status: statusCode }
    );
  }

  // Handle Stripe errors
  if (isStripeError(error)) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code || 'PAYMENT_ERROR',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: getStripeStatusCode(error) }
    );
  }

  // Handle standard JavaScript errors
  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: process.env.NODE_ENV === 'development' 
          ? error.message 
          : 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }

  // Handle unknown errors
  return NextResponse.json(
    {
      success: false,
      error: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    },
    { status: 500 }
  );
}

function isPostgrestError(error: any): error is PostgrestError {
  return error && typeof error === 'object' && 'code' in error && 'message' in error;
}

function getPostgrestStatusCode(error: PostgrestError): number {
  // Map PostgreSQL error codes to HTTP status codes
  switch (error.code) {
    case '23505': // unique_violation
      return 409;
    case '23503': // foreign_key_violation
      return 400;
    case '23502': // not_null_violation
      return 400;
    case '42501': // insufficient_privilege
      return 403;
    case '42P01': // undefined_table
      return 404;
    case '42703': // undefined_column
      return 400;
    default:
      return 500;
  }
}

function getPostgrestErrorMessage(error: PostgrestError): string {
  // Provide user-friendly error messages
  switch (error.code) {
    case '23505':
      return 'A record with this information already exists';
    case '23503':
      return 'Referenced record does not exist';
    case '23502':
      return 'Required field is missing';
    case '42501':
      return 'You do not have permission to perform this action';
    case '42P01':
      return 'Resource not found';
    default:
      return error.message || 'Database error occurred';
  }
}

function isStripeError(error: any): boolean {
  return error && error.type && error.type.startsWith('Stripe');
}

function getStripeStatusCode(error: any): number {
  switch (error.type) {
    case 'StripeCardError':
      return 402; // Payment Required
    case 'StripeRateLimitError':
      return 429; // Too Many Requests
    case 'StripeInvalidRequestError':
      return 400; // Bad Request
    case 'StripeAPIError':
      return 500; // Internal Server Error
    case 'StripeConnectionError':
      return 503; // Service Unavailable
    case 'StripeAuthenticationError':
      return 401; // Unauthorized
    default:
      return 500;
  }
}

// Utility function to create consistent API responses
export function createApiResponse<T>(
  data: T,
  message?: string,
  meta?: any
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message,
    meta,
  });
}

// Utility function to create error responses
export function createErrorResponse(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: code || 'ERROR',
      details,
    },
    { status: statusCode }
  );
}

// Middleware wrapper for API routes
export function withErrorHandling(
  handler: (request: Request, context?: any) => Promise<NextResponse>
) {
  return async (request: Request, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

// Common error instances
export const errors = {
  unauthorized: () => new AppError('Unauthorized', 401, 'UNAUTHORIZED'),
  forbidden: () => new AppError('Forbidden', 403, 'FORBIDDEN'),
  notFound: (resource?: string) => 
    new AppError(`${resource || 'Resource'} not found`, 404, 'NOT_FOUND'),
  badRequest: (message?: string) => 
    new AppError(message || 'Bad request', 400, 'BAD_REQUEST'),
  conflict: (message?: string) => 
    new AppError(message || 'Conflict', 409, 'CONFLICT'),
  tooManyRequests: () => 
    new AppError('Too many requests', 429, 'RATE_LIMIT_EXCEEDED'),
  internal: (message?: string) => 
    new AppError(message || 'Internal server error', 500, 'INTERNAL_ERROR'),
} as const;
