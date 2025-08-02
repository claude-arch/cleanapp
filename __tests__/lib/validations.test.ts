import { 
  signUpSchema, 
  signInSchema, 
  addressSchema, 
  bookingRequestSchema,
  homeDetailsSchema 
} from '@/lib/validations';

describe('Validation Schemas', () => {
  describe('signUpSchema', () => {
    const validSignUpData = {
      email: 'test@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      role: 'customer' as const,
      firstName: 'John',
      lastName: 'Doe',
      phone: '1234567890',
      agreeToTerms: true,
    };

    it('should validate correct signup data', () => {
      const result = signUpSchema.safeParse(validSignUpData);
      expect(result.success).toBe(true);
    });

    it('should require business name for providers', () => {
      const providerData = { ...validSignUpData, role: 'provider' as const };
      const result = signUpSchema.safeParse(providerData);
      expect(result.success).toBe(false);

      const withBusinessName = { ...providerData, businessName: 'Test Business' };
      const validResult = signUpSchema.safeParse(withBusinessName);
      expect(validResult.success).toBe(true);
    });

    it('should validate password confirmation', () => {
      const invalidData = { ...validSignUpData, confirmPassword: 'DifferentPassword' };
      const result = signUpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require terms agreement', () => {
      const invalidData = { ...validSignUpData, agreeToTerms: false };
      const result = signUpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('signInSchema', () => {
    it('should validate correct signin data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      };
      const result = signInSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require email and password', () => {
      const invalidData = { email: '', password: '' };
      const result = signInSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('addressSchema', () => {
    const validAddress = {
      label: 'Home',
      streetAddress: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
    };

    it('should validate correct address', () => {
      const result = addressSchema.safeParse(validAddress);
      expect(result.success).toBe(true);
    });

    it('should validate ZIP code format', () => {
      const invalidZip = { ...validAddress, zipCode: '123' };
      const result = addressSchema.safeParse(invalidZip);
      expect(result.success).toBe(false);

      const validZipExtended = { ...validAddress, zipCode: '94102-1234' };
      const validResult = addressSchema.safeParse(validZipExtended);
      expect(validResult.success).toBe(true);
    });
  });

  describe('homeDetailsSchema', () => {
    const validHomeDetails = {
      bedrooms: 2,
      bathrooms: 1,
      squareFootage: 1000,
      floors: 1,
      pets: false,
    };

    it('should validate correct home details', () => {
      const result = homeDetailsSchema.safeParse(validHomeDetails);
      expect(result.success).toBe(true);
    });

    it('should require minimum values', () => {
      const invalidData = {
        bedrooms: 0,
        bathrooms: 0,
        squareFootage: 50,
        floors: 0,
        pets: false,
      };
      const result = homeDetailsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('bookingRequestSchema', () => {
    const validBookingRequest = {
      addressId: 'addr-123',
      serviceDate: '2024-12-25T10:00:00Z',
      services: [{ serviceId: 'svc-123', quantity: 1 }],
      homeDetails: {
        bedrooms: 2,
        bathrooms: 1,
        squareFootage: 1000,
        floors: 1,
        pets: false,
      },
      paymentMethodId: 'pm-123',
    };

    it('should validate correct booking request', () => {
      const result = bookingRequestSchema.safeParse(validBookingRequest);
      expect(result.success).toBe(true);
    });

    it('should require at least one service', () => {
      const invalidData = { ...validBookingRequest, services: [] };
      const result = bookingRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate service quantity', () => {
      const invalidData = {
        ...validBookingRequest,
        services: [{ serviceId: 'svc-123', quantity: 0 }],
      };
      const result = bookingRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
