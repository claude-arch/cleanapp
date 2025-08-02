import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingFlow } from '@/components/booking/booking-flow';

// Mock the step components
jest.mock('@/components/booking/steps/location-step', () => ({
  LocationStep: ({ onUpdate }: any) => (
    <div data-testid="location-step">
      <button onClick={() => onUpdate({ addressId: 'test-address' })}>
        Select Address
      </button>
    </div>
  ),
}));

jest.mock('@/components/booking/steps/service-step', () => ({
  ServiceStep: ({ onUpdate }: any) => (
    <div data-testid="service-step">
      <button onClick={() => onUpdate({ 
        services: [{ serviceId: 'test-service', quantity: 1 }],
        homeDetails: { bedrooms: 2, bathrooms: 1, squareFootage: 1000, floors: 1, pets: false }
      })}>
        Select Service
      </button>
    </div>
  ),
}));

jest.mock('@/components/booking/steps/schedule-step', () => ({
  ScheduleStep: ({ onUpdate }: any) => (
    <div data-testid="schedule-step">
      <button onClick={() => onUpdate({ serviceDate: '2024-12-25T10:00:00Z' })}>
        Select Date
      </button>
    </div>
  ),
}));

jest.mock('@/components/booking/steps/payment-step', () => ({
  PaymentStep: ({ onUpdate, onComplete }: any) => (
    <div data-testid="payment-step">
      <button onClick={() => onUpdate({ paymentMethodId: 'test-payment' })}>
        Select Payment
      </button>
      <button onClick={onComplete}>Complete Booking</button>
    </div>
  ),
}));

describe('BookingFlow Integration', () => {
  const mockOnStepChange = jest.fn();
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders location step initially', () => {
    render(
      <BookingFlow
        currentStep={0}
        onStepChange={mockOnStepChange}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByTestId('location-step')).toBeInTheDocument();
    expect(screen.queryByTestId('service-step')).not.toBeInTheDocument();
  });

  it('progresses through all steps', async () => {
    const user = userEvent.setup();
    let currentStep = 0;
    
    const { rerender } = render(
      <BookingFlow
        currentStep={currentStep}
        onStepChange={(step) => {
          currentStep = step;
          mockOnStepChange(step);
        }}
        onComplete={mockOnComplete}
      />
    );

    // Step 1: Location
    expect(screen.getByTestId('location-step')).toBeInTheDocument();
    await user.click(screen.getByText('Select Address'));
    
    // Continue button should be enabled after selecting address
    const continueButton = screen.getByText('Continue');
    expect(continueButton).not.toBeDisabled();
    
    await user.click(continueButton);
    expect(mockOnStepChange).toHaveBeenCalledWith(1);

    // Re-render with new step
    rerender(
      <BookingFlow
        currentStep={1}
        onStepChange={mockOnStepChange}
        onComplete={mockOnComplete}
      />
    );

    // Step 2: Service
    expect(screen.getByTestId('service-step')).toBeInTheDocument();
    await user.click(screen.getByText('Select Service'));
    await user.click(screen.getByText('Continue'));
    expect(mockOnStepChange).toHaveBeenCalledWith(2);

    // Re-render with new step
    rerender(
      <BookingFlow
        currentStep={2}
        onStepChange={mockOnStepChange}
        onComplete={mockOnComplete}
      />
    );

    // Step 3: Schedule
    expect(screen.getByTestId('schedule-step')).toBeInTheDocument();
    await user.click(screen.getByText('Select Date'));
    await user.click(screen.getByText('Continue'));
    expect(mockOnStepChange).toHaveBeenCalledWith(3);

    // Re-render with new step
    rerender(
      <BookingFlow
        currentStep={3}
        onStepChange={mockOnStepChange}
        onComplete={mockOnComplete}
      />
    );

    // Step 4: Payment
    expect(screen.getByTestId('payment-step')).toBeInTheDocument();
    await user.click(screen.getByText('Select Payment'));
    
    // Complete booking
    await user.click(screen.getByText('Complete Booking'));
    expect(mockOnComplete).toHaveBeenCalled();
  });

  it('allows going back to previous steps', async () => {
    const user = userEvent.setup();
    
    render(
      <BookingFlow
        currentStep={2}
        onStepChange={mockOnStepChange}
        onComplete={mockOnComplete}
      />
    );

    const backButton = screen.getByText('Back');
    await user.click(backButton);
    
    expect(mockOnStepChange).toHaveBeenCalledWith(1);
  });

  it('disables continue button when step is incomplete', () => {
    render(
      <BookingFlow
        currentStep={0}
        onStepChange={mockOnStepChange}
        onComplete={mockOnComplete}
      />
    );

    const continueButton = screen.getByText('Continue');
    expect(continueButton).toBeDisabled();
  });

  it('shows complete booking button on final step', () => {
    render(
      <BookingFlow
        currentStep={3}
        onStepChange={mockOnStepChange}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('Complete Booking')).toBeInTheDocument();
    expect(screen.queryByText('Continue')).not.toBeInTheDocument();
  });

  it('hides back button on first step', () => {
    render(
      <BookingFlow
        currentStep={0}
        onStepChange={mockOnStepChange}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.queryByText('Back')).not.toBeInTheDocument();
  });
});
