import { z } from 'zod';

// Auth schemas
export const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string(),
  role: z.enum(['customer', 'provider'], {
    required_error: 'Please select a role',
  }),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number')
    .min(10, 'Phone number must be at least 10 digits'),
  businessName: z.string().optional(),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine((data) => {
  if (data.role === 'provider' && !data.businessName) {
    return false;
  }
  return true;
}, {
  message: 'Business name is required for service providers',
  path: ['businessName'],
});

export const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Profile schemas
export const customerProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number')
    .min(10, 'Phone number must be at least 10 digits'),
  dateOfBirth: z.string().optional(),
  emergencyContact: z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string(),
  }).optional(),
  preferences: z.object({
    notifications: z.object({
      email: z.boolean(),
      sms: z.boolean(),
      push: z.boolean(),
    }),
    cleaningPreferences: z.object({
      ecoFriendly: z.boolean(),
      petFriendly: z.boolean(),
      allergyFriendly: z.boolean(),
    }),
  }).optional(),
});

export const providerProfileSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  hourlyRate: z.number().min(15, 'Hourly rate must be at least $15'),
  serviceRadius: z.number().min(5).max(50, 'Service radius must be between 5 and 50 miles'),
  availability: z.object({
    monday: z.array(z.object({
      start: z.string(),
      end: z.string(),
    })),
    tuesday: z.array(z.object({
      start: z.string(),
      end: z.string(),
    })),
    wednesday: z.array(z.object({
      start: z.string(),
      end: z.string(),
    })),
    thursday: z.array(z.object({
      start: z.string(),
      end: z.string(),
    })),
    friday: z.array(z.object({
      start: z.string(),
      end: z.string(),
    })),
    saturday: z.array(z.object({
      start: z.string(),
      end: z.string(),
    })),
    sunday: z.array(z.object({
      start: z.string(),
      end: z.string(),
    })),
    exceptions: z.array(z.object({
      date: z.string(),
      type: z.enum(['unavailable', 'custom']),
      timeSlots: z.array(z.object({
        start: z.string(),
        end: z.string(),
      })).optional(),
      reason: z.string().optional(),
    })),
  }),
});

// Address schema
export const addressSchema = z.object({
  label: z.string().min(1, 'Address label is required'),
  streetAddress: z.string().min(1, 'Street address is required'),
  apartment: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
  isDefault: z.boolean().optional(),
});

// Booking schemas
export const homeDetailsSchema = z.object({
  bedrooms: z.number().min(1, 'At least 1 bedroom is required'),
  bathrooms: z.number().min(1, 'At least 1 bathroom is required'),
  squareFootage: z.number().min(100, 'Square footage must be at least 100'),
  floors: z.number().min(1, 'At least 1 floor is required'),
  pets: z.boolean(),
  petDetails: z.string().optional(),
  accessInstructions: z.string().optional(),
});

export const bookingRequestSchema = z.object({
  addressId: z.string().min(1, 'Address is required'),
  serviceDate: z.string().min(1, 'Service date is required'),
  services: z.array(z.object({
    serviceId: z.string(),
    quantity: z.number().min(1),
  })).min(1, 'At least one service is required'),
  homeDetails: homeDetailsSchema,
  specialInstructions: z.string().optional(),
  paymentMethodId: z.string().min(1, 'Payment method is required'),
  recurringFrequency: z.enum(['weekly', 'bi_weekly', 'monthly']).optional(),
});

// Review schema
export const reviewSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  rating: z.number().min(1, 'Rating is required').max(5, 'Rating cannot exceed 5'),
  comment: z.string().min(10, 'Comment must be at least 10 characters'),
  photos: z.array(z.instanceof(File)).optional(),
});

// Message schema
export const messageSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  content: z.string().min(1, 'Message content is required'),
  messageType: z.enum(['text', 'image', 'system']).default('text'),
  attachments: z.array(z.instanceof(File)).optional(),
});

// Search schemas
export const providerSearchSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  radius: z.number().min(1).max(50).default(25),
  serviceDate: z.string(),
  minRating: z.number().min(1).max(5).optional(),
  sortBy: z.enum(['rating', 'price', 'distance']).default('rating'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(10),
});

// Payment method schema
export const paymentMethodSchema = z.object({
  stripePaymentMethodId: z.string().min(1, 'Payment method ID is required'),
  isDefault: z.boolean().optional(),
});

// Admin schemas
export const verifyProviderSchema = z.object({
  providerId: z.string().min(1, 'Provider ID is required'),
  verificationStatus: z.enum(['verified', 'rejected']),
  notes: z.string().optional(),
});

// File upload schema
export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  bucket: z.string().min(1, 'Bucket is required'),
  path: z.string().min(1, 'Path is required'),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Date range schema
export const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: 'Start date must be before end date',
});

// Notification preferences schema
export const notificationPreferencesSchema = z.object({
  email: z.boolean(),
  sms: z.boolean(),
  push: z.boolean(),
  bookingReminders: z.boolean(),
  paymentNotifications: z.boolean(),
  reviewRequests: z.boolean(),
  marketingEmails: z.boolean(),
});

// Contact form schema
export const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  type: z.enum(['general', 'support', 'billing', 'partnership']).default('general'),
});

// Export types
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type CustomerProfileData = z.infer<typeof customerProfileSchema>;
export type ProviderProfileData = z.infer<typeof providerProfileSchema>;
export type AddressFormData = z.infer<typeof addressSchema>;
export type BookingRequestData = z.infer<typeof bookingRequestSchema>;
export type ReviewFormData = z.infer<typeof reviewSchema>;
export type MessageFormData = z.infer<typeof messageSchema>;
export type ProviderSearchData = z.infer<typeof providerSearchSchema>;
export type PaymentMethodData = z.infer<typeof paymentMethodSchema>;
export type ContactFormData = z.infer<typeof contactFormSchema>;
