import { test, expect } from '@playwright/test';

test.describe('Booking Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('**/auth/getUser', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
            },
          },
          error: null,
        }),
      });
    });

    // Mock services API
    await page.route('**/api/services', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'service-1',
              name: 'Standard Cleaning',
              description: 'Regular house cleaning',
              base_price: 60,
              price_per_sqft: 0.08,
              category: 'standard',
            },
          ],
        }),
      });
    });

    // Mock addresses API
    await page.route('**/addresses**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'address-1',
              label: 'Home',
              street_address: '123 Main St',
              city: 'San Francisco',
              state: 'CA',
              zip_code: '94102',
              is_default: true,
            },
          ]),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'new-address-id',
            label: 'New Address',
          }),
        });
      }
    });
  });

  test('complete booking flow', async ({ page }) => {
    await page.goto('/book');

    // Wait for page to load
    await expect(page.getByText('Book Your Cleaning Service')).toBeVisible();

    // Step 1: Location
    await expect(page.getByText('Where do you need cleaning?')).toBeVisible();
    
    // Select existing address
    await page.getByText('Home').click();
    await page.getByText('Continue').click();

    // Step 2: Service Selection
    await expect(page.getByText('What type of cleaning do you need?')).toBeVisible();
    
    // Select standard cleaning
    await page.getByText('Standard Cleaning').click();
    
    // Fill home details
    await page.fill('input[name="bedrooms"]', '2');
    await page.fill('input[name="bathrooms"]', '1');
    await page.fill('input[name="squareFootage"]', '1000');
    await page.fill('input[name="floors"]', '1');
    
    await page.getByText('Continue to Scheduling').click();

    // Step 3: Schedule
    await expect(page.getByText('When would you like your cleaning?')).toBeVisible();
    
    // Select date (first available date)
    await page.locator('[data-testid="date-option"]').first().click();
    
    // Select time
    await page.getByText('10:00 AM').click();
    
    await page.getByText('Continue').click();

    // Step 4: Payment
    await expect(page.getByText('Payment & Confirmation')).toBeVisible();
    
    // Mock payment method selection
    await page.route('**/payment_methods**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'pm-1',
            last_four: '4242',
            brand: 'visa',
            exp_month: 12,
            exp_year: 2025,
            is_default: true,
          },
        ]),
      });
    });

    // Mock booking creation
    await page.route('**/api/bookings', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'booking-123',
              status: 'pending',
            },
          }),
        });
      }
    });

    // Complete booking
    await page.getByText('Complete Booking').click();

    // Should redirect to bookings page or show success
    await expect(page).toHaveURL(/\/bookings|\/dashboard/);
  });

  test('add new address during booking', async ({ page }) => {
    await page.goto('/book');

    // Step 1: Add new address
    await page.getByText('Add New Address').click();
    
    await page.fill('input[name="label"]', 'Office');
    await page.fill('input[name="streetAddress"]', '456 Business Ave');
    await page.fill('input[name="city"]', 'San Francisco');
    await page.fill('input[name="state"]', 'CA');
    await page.fill('input[name="zipCode"]', '94105');
    
    await page.getByText('Add Address').click();
    
    // Should show success and continue
    await expect(page.getByText('Continue')).toBeEnabled();
  });

  test('validates required fields', async ({ page }) => {
    await page.goto('/book');

    // Try to continue without selecting address
    await expect(page.getByText('Continue')).toBeDisabled();

    // Select address and continue
    await page.getByText('Home').click();
    await page.getByText('Continue').click();

    // Try to continue without selecting service
    await expect(page.getByText('Continue to Scheduling')).toBeDisabled();
  });

  test('shows pricing calculation', async ({ page }) => {
    await page.goto('/book');

    // Complete location step
    await page.getByText('Home').click();
    await page.getByText('Continue').click();

    // Select service and fill details
    await page.getByText('Standard Cleaning').click();
    await page.fill('input[name="squareFootage"]', '1200');

    // Should show estimated total
    await expect(page.getByText(/Estimated Total:/)).toBeVisible();
    await expect(page.getByText(/\$156\.00/)).toBeVisible(); // $60 + (1200 * $0.08)
  });

  test('handles API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/services', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal server error',
        }),
      });
    });

    await page.goto('/book');

    // Should show error message
    await expect(page.getByText(/Failed to load services/)).toBeVisible();
  });
});
