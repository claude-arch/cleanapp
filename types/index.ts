import { Database } from './database';

// Database types
export type User = Database['public']['Tables']['users']['Row'];
export type CustomerProfile = Database['public']['Tables']['customer_profiles']['Row'];
export type ProviderProfile = Database['public']['Tables']['provider_profiles']['Row'];
export type Address = Database['public']['Tables']['addresses']['Row'];
export type Service = Database['public']['Tables']['services']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];
export type BookingItem = Database['public']['Tables']['booking_items']['Row'];
export type PaymentMethod = Database['public']['Tables']['payment_methods']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];

// Enums
export type UserRole = Database['public']['Enums']['user_role'];
export type VerificationStatus = Database['public']['Enums']['verification_status'];
export type ServiceCategory = Database['public']['Enums']['service_category'];
export type BookingStatus = Database['public']['Enums']['booking_status'];
export type RecurringFrequency = Database['public']['Enums']['recurring_frequency'];
export type PaymentMethodType = Database['public']['Enums']['payment_method_type'];
export type TransactionStatus = Database['public']['Enums']['transaction_status'];
export type PayoutStatus = Database['public']['Enums']['payout_status'];
export type MessageType = Database['public']['Enums']['message_type'];
export type NotificationType = Database['public']['Enums']['notification_type'];

// Extended types with relationships
export interface BookingWithDetails extends Booking {
  customer: CustomerProfile & { user: User };
  provider?: ProviderProfile & { user: User };
  address: Address;
  booking_items: BookingItem[];
  transaction?: Transaction;
  reviews?: Review[];
}

export interface ProviderWithDetails extends ProviderProfile {
  user: User;
  reviews: Review[];
  availability: ProviderAvailability;
}

export interface CustomerWithDetails extends CustomerProfile {
  user: User;
  addresses: Address[];
  payment_methods: PaymentMethod[];
}

// Home details structure
export interface HomeDetails {
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  floors: number;
  pets: boolean;
  petDetails?: string;
  accessInstructions?: string;
}

// Provider availability structure
export interface ProviderAvailability {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
  exceptions: AvailabilityException[];
}

export interface TimeSlot {
  start: string; // HH:MM format
  end: string;   // HH:MM format
}

export interface AvailabilityException {
  date: string; // YYYY-MM-DD format
  type: 'unavailable' | 'custom';
  timeSlots?: TimeSlot[];
  reason?: string;
}

// Booking flow types
export interface BookingRequest {
  addressId: string;
  serviceDate: string;
  services: {
    serviceId: string;
    quantity: number;
  }[];
  homeDetails: HomeDetails;
  specialInstructions?: string;
  paymentMethodId: string;
  recurringFrequency?: RecurringFrequency;
}

export interface BookingPricing {
  subtotal: number;
  commission: number;
  processingFee: number;
  discountAmount: number;
  total: number;
}

// Search and filtering
export interface ProviderSearchParams {
  lat: number;
  lng: number;
  radius: number;
  serviceDate: string;
  minRating?: number;
  sortBy?: 'rating' | 'price' | 'distance';
  page?: number;
  limit?: number;
}

export interface ProviderSearchResult {
  id: string;
  businessName: string;
  description: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  distance: number;
  availability: {
    nextAvailable: string;
    timeSlots: string[];
  };
  verification: {
    backgroundCheck: boolean;
    insurance: boolean;
    verified: boolean;
  };
  photos: string[];
}

// API Response types
export interface ApiResponse<T> {
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

export interface ApiError {
  success: false;
  error: {
    type: string;
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  };
}

// Form types
export interface SignUpForm {
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone: string;
  businessName?: string; // For providers
  agreeToTerms: boolean;
}

export interface SignInForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface AddressForm {
  label: string;
  streetAddress: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

export interface ReviewForm {
  bookingId: string;
  rating: number;
  comment: string;
  photos?: File[];
}

// Notification types
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: any;
  readAt?: string;
  sentAt: string;
  expiresAt?: string;
}

// Message types
export interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  content: string;
  messageType: MessageType;
  attachments?: string[];
  readAt?: string;
  sentAt: string;
}

// Analytics types
export interface BookingAnalytics {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  averageRating: number;
  totalRevenue: number;
  conversionRate: number;
}

export interface ProviderAnalytics {
  totalEarnings: number;
  completedBookings: number;
  averageRating: number;
  responseTime: number;
  cancellationRate: number;
  utilizationRate: number;
}

// Error types
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}
