# CleanConnect - API Specification

## 1. Overview

The CleanConnect API is a RESTful service that provides endpoints for managing users, bookings, payments, and all platform functionality. All endpoints return JSON responses and use standard HTTP status codes.

**Base URL**: `https://cleanconnect.com/api/v1`  
**Authentication**: Bearer token (JWT)  
**Content-Type**: `application/json`

## 2. Authentication

### 2.1 Sign Up
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "role": "customer", // or "provider"
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "role": "customer",
      "emailVerified": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here"
  }
}
```

### 2.2 Sign In
```http
POST /auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### 2.3 Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token_here"
}
```

## 3. User Management

### 3.1 Get User Profile
```http
GET /users/profile
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "role": "customer",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "avatar": "https://storage.url/avatar.jpg",
      "preferences": {
        "notifications": {
          "email": true,
          "sms": true,
          "push": false
        }
      }
    },
    "createdAt": "2025-08-01T10:00:00Z"
  }
}
```

### 3.2 Update User Profile
```http
PUT /users/profile
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890",
  "preferences": {
    "notifications": {
      "email": true,
      "sms": false
    }
  }
}
```

## 4. Address Management

### 4.1 List Addresses
```http
GET /addresses
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "addr_123",
      "label": "Home",
      "streetAddress": "123 Main St",
      "apartment": "Apt 2B",
      "city": "San Francisco",
      "state": "CA",
      "zipCode": "94105",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "isDefault": true
    }
  ]
}
```

### 4.2 Create Address
```http
POST /addresses
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "label": "Office",
  "streetAddress": "456 Business Ave",
  "city": "San Francisco",
  "state": "CA",
  "zipCode": "94107",
  "isDefault": false
}
```

## 5. Services Catalog

### 5.1 List Services
```http
GET /services
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "service_123",
      "name": "Standard Cleaning",
      "description": "Regular house cleaning including all rooms",
      "category": "standard",
      "basePrice": 80.00,
      "pricePerSqft": 0.10,
      "durationMinutes": 120,
      "features": [
        "Vacuum all floors",
        "Dust surfaces",
        "Clean bathrooms",
        "Kitchen cleaning"
      ]
    },
    {
      "id": "service_124",
      "name": "Deep Cleaning",
      "description": "Thorough cleaning including baseboards, inside appliances",
      "category": "deep",
      "basePrice": 150.00,
      "pricePerSqft": 0.15,
      "durationMinutes": 240
    }
  ]
}
```

## 6. Booking Management

### 6.1 Create Booking
```http
POST /bookings
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "addressId": "addr_123",
  "serviceDate": "2025-08-15T10:00:00Z",
  "services": [
    {
      "serviceId": "service_123",
      "quantity": 1
    }
  ],
  "homeDetails": {
    "bedrooms": 3,
    "bathrooms": 2,
    "squareFootage": 1200
  },
  "specialInstructions": "Please use eco-friendly products",
  "paymentMethodId": "pm_123"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "booking_123",
    "status": "confirmed",
    "serviceDate": "2025-08-15T10:00:00Z",
    "customer": {
      "id": "user_123",
      "name": "John Doe",
      "phone": "+1234567890"
    },
    "provider": {
      "id": "provider_456",
      "businessName": "Sparkle Clean Co",
      "rating": 4.8,
      "phone": "+1987654321"
    },
    "address": {
      "streetAddress": "123 Main St",
      "city": "San Francisco",
      "state": "CA"
    },
    "services": [
      {
        "name": "Standard Cleaning",
        "price": 120.00
      }
    ],
    "pricing": {
      "subtotal": 120.00,
      "commission": 21.60,
      "processingFee": 3.78,
      "total": 145.38
    },
    "paymentIntent": "pi_stripe_payment_intent_id"
  }
}
```

### 6.2 List Bookings
```http
GET /bookings?status=confirmed&page=1&limit=10
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `status`: Filter by booking status (pending, confirmed, completed, cancelled)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 50)
- `startDate`: Filter bookings from this date (ISO 8601)
- `endDate`: Filter bookings until this date (ISO 8601)

### 6.3 Get Booking Details
```http
GET /bookings/{bookingId}
Authorization: Bearer {accessToken}
```

### 6.4 Cancel Booking
```http
POST /bookings/{bookingId}/cancel
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "reason": "Schedule conflict",
  "refundRequested": true
}
```

## 7. Provider Search

### 7.1 Search Providers
```http
GET /providers/search?lat=37.7749&lng=-122.4194&radius=25&serviceDate=2025-08-15T10:00:00Z
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `lat`: Latitude of service location
- `lng`: Longitude of service location
- `radius`: Search radius in miles (default: 25)
- `serviceDate`: Requested service date/time
- `minRating`: Minimum provider rating (1-5)
- `sortBy`: Sort order (rating, price, distance)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "provider_456",
      "businessName": "Sparkle Clean Co",
      "description": "Professional cleaning service with 5+ years experience",
      "rating": 4.8,
      "reviewCount": 127,
      "hourlyRate": 35.00,
      "distance": 2.3,
      "availability": {
        "nextAvailable": "2025-08-15T09:00:00Z",
        "timeSlots": [
          "2025-08-15T09:00:00Z",
          "2025-08-15T10:00:00Z",
          "2025-08-15T11:00:00Z"
        ]
      },
      "verification": {
        "backgroundCheck": true,
        "insurance": true,
        "verified": true
      },
      "photos": [
        "https://storage.url/provider-photo1.jpg"
      ]
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "totalPages": 2
    }
  }
}
```

## 8. Payment Management

### 8.1 List Payment Methods
```http
GET /payment-methods
Authorization: Bearer {accessToken}
```

### 8.2 Add Payment Method
```http
POST /payment-methods
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "stripePaymentMethodId": "pm_stripe_payment_method_id",
  "isDefault": true
}
```

### 8.3 Create Payment Intent
```http
POST /payments/create-intent
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "bookingId": "booking_123",
  "paymentMethodId": "pm_123"
}
```

## 9. Reviews & Ratings

### 9.1 Create Review
```http
POST /reviews
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "bookingId": "booking_123",
  "rating": 5,
  "comment": "Excellent service! Very thorough and professional.",
  "photos": [
    "https://storage.url/review-photo1.jpg"
  ]
}
```

### 9.2 List Reviews
```http
GET /reviews?providerId=provider_456&page=1&limit=10
Authorization: Bearer {accessToken}
```

## 10. Messaging

### 10.1 Get Messages
```http
GET /messages/{bookingId}
Authorization: Bearer {accessToken}
```

### 10.2 Send Message
```http
POST /messages
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "bookingId": "booking_123",
  "content": "I'll be running 10 minutes late",
  "type": "text"
}
```

## 11. Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": {
    "type": "VALIDATION_ERROR",
    "code": "INVALID_EMAIL",
    "message": "Please provide a valid email address",
    "details": {
      "field": "email",
      "value": "invalid-email"
    },
    "timestamp": "2025-08-01T10:00:00Z",
    "requestId": "req_123456"
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Common Error Codes
- `INVALID_EMAIL` - Email format is invalid
- `EMAIL_ALREADY_EXISTS` - Email is already registered
- `INVALID_CREDENTIALS` - Login credentials are incorrect
- `TOKEN_EXPIRED` - Access token has expired
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `BOOKING_NOT_FOUND` - Booking does not exist
- `PROVIDER_UNAVAILABLE` - Provider is not available at requested time
- `PAYMENT_FAILED` - Payment processing failed
- `RATE_LIMIT_EXCEEDED` - Too many requests from client

## 12. Rate Limiting

All API endpoints are rate limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute per IP
- **Booking creation**: 10 requests per hour per user
- **General endpoints**: 100 requests per minute per user
- **Search endpoints**: 60 requests per minute per user

Rate limit headers are included in all responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1625097600
```

---

**Document Version**: 1.0  
**Last Updated**: August 2025  
**Next Review**: September 2025
