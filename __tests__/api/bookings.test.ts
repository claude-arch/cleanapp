import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/bookings/route';
import { createSupabaseServerClient } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  createSupabaseServerClient: jest.fn(),
}));

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => ({
          range: jest.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => ({
          data: { id: 'booking-123' },
          error: null,
        })),
      })),
    })),
  })),
};

describe('/api/bookings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createSupabaseServerClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('GET /api/bookings', () => {
    it('should return bookings for authenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const { req } = createMocks({
        method: 'GET',
        url: '/api/bookings',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 401 for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const { req } = createMocks({
        method: 'GET',
        url: '/api/bookings',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/bookings', () => {
    const validBookingData = {
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

    it('should create booking with valid data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Mock service lookup
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                id: 'svc-123',
                name: 'Standard Cleaning',
                base_price: 60,
                price_per_sqft: 0.08,
              },
              error: null,
            })),
          })),
        })),
      });

      const { req } = createMocks({
        method: 'POST',
        url: '/api/bookings',
        body: validBookingData,
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('booking-123');
    });

    it('should return 400 for invalid data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const invalidData = { ...validBookingData, services: [] };

      const { req } = createMocks({
        method: 'POST',
        url: '/api/bookings',
        body: invalidData,
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });
});
