import { 
  formatCurrency, 
  formatDate, 
  validateEmail, 
  validatePassword,
  calculateDistance,
  formatPhoneNumber,
  validatePhoneNumber
} from '@/lib/utils';

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(100)).toBe('$100.00');
      expect(formatCurrency(99.99)).toBe('$99.99');
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should handle different currencies', () => {
      expect(formatCurrency(100, 'EUR')).toBe('€100.00');
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2024-01-15T10:30:00Z');

    it('should format date in short format', () => {
      const result = formatDate(testDate, 'short');
      expect(result).toMatch(/Jan 15, 2024/);
    });

    it('should format date in long format', () => {
      const result = formatDate(testDate, 'long');
      expect(result).toMatch(/Monday, January 15, 2024/);
    });

    it('should format time', () => {
      const result = formatDate(testDate, 'time');
      expect(result).toMatch(/10:30 AM/);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      expect(validatePassword('Password123')).toBe(true);
      expect(validatePassword('MySecure1Pass')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(validatePassword('password')).toBe(false); // no uppercase or number
      expect(validatePassword('PASSWORD')).toBe(false); // no lowercase or number
      expect(validatePassword('Pass1')).toBe(false); // too short
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between coordinates', () => {
      // San Francisco to Los Angeles (approximately 347 miles)
      const distance = calculateDistance(37.7749, -122.4194, 34.0522, -118.2437);
      expect(distance).toBeCloseTo(347, 0);
    });

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(37.7749, -122.4194, 37.7749, -122.4194);
      expect(distance).toBe(0);
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format US phone numbers', () => {
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
      expect(formatPhoneNumber('123-456-7890')).toBe('(123) 456-7890');
    });

    it('should return original for invalid format', () => {
      expect(formatPhoneNumber('123')).toBe('123');
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate 10-digit phone numbers', () => {
      expect(validatePhoneNumber('1234567890')).toBe(true);
      expect(validatePhoneNumber('(123) 456-7890')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhoneNumber('123')).toBe(false);
      expect(validatePhoneNumber('12345678901')).toBe(false);
    });
  });
});
