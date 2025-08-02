'use client';

import { useState } from 'react';
import { LocationStep } from './steps/location-step';
import { ServiceStep } from './steps/service-step';
import { ScheduleStep } from './steps/schedule-step';
import { PaymentStep } from './steps/payment-step';
import { Button } from '@/components/ui/button';
import { BookingRequestData } from '@/lib/validations';
import { HomeDetails } from '@/types';

interface BookingFlowProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete: (bookingData: BookingRequestData) => void;
}

export interface BookingData {
  // Location data
  addressId?: string;
  address?: {
    streetAddress: string;
    apartment?: string;
    city: string;
    state: string;
    zipCode: string;
  };
  
  // Service data
  services: Array<{
    serviceId: string;
    quantity: number;
  }>;
  homeDetails?: HomeDetails;
  
  // Schedule data
  serviceDate?: string;
  recurringFrequency?: 'weekly' | 'bi_weekly' | 'monthly';
  
  // Payment data
  paymentMethodId?: string;
  
  // Additional data
  specialInstructions?: string;
}

export function BookingFlow({ currentStep, onStepChange, onComplete }: BookingFlowProps) {
  const [bookingData, setBookingData] = useState<BookingData>({
    services: [],
  });

  const updateBookingData = (data: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      onStepChange(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!bookingData.addressId || !bookingData.serviceDate || !bookingData.paymentMethodId) {
      return;
    }

    const completeBookingData: BookingRequestData = {
      addressId: bookingData.addressId,
      serviceDate: bookingData.serviceDate,
      services: bookingData.services,
      homeDetails: bookingData.homeDetails || {
        bedrooms: 2,
        bathrooms: 1,
        squareFootage: 1000,
        floors: 1,
        pets: false,
      },
      specialInstructions: bookingData.specialInstructions,
      paymentMethodId: bookingData.paymentMethodId,
      recurringFrequency: bookingData.recurringFrequency,
    };

    onComplete(completeBookingData);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Location
        return bookingData.addressId || bookingData.address;
      case 1: // Service
        return bookingData.services.length > 0 && bookingData.homeDetails;
      case 2: // Schedule
        return bookingData.serviceDate;
      case 3: // Payment
        return bookingData.paymentMethodId;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <LocationStep
            data={bookingData}
            onUpdate={updateBookingData}
          />
        );
      case 1:
        return (
          <ServiceStep
            data={bookingData}
            onUpdate={updateBookingData}
          />
        );
      case 2:
        return (
          <ScheduleStep
            data={bookingData}
            onUpdate={updateBookingData}
          />
        );
      case 3:
        return (
          <PaymentStep
            data={bookingData}
            onUpdate={updateBookingData}
            onComplete={handleComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Step Content */}
      <div className="min-h-[400px]">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div>
          {currentStep > 0 && (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {currentStep < 3 ? (
            <Button 
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Continue
            </Button>
          ) : (
            <Button 
              onClick={handleComplete}
              disabled={!canProceed()}
              className="bg-success hover:bg-success/90"
            >
              Complete Booking
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
