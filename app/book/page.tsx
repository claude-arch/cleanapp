'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BookingFlow } from '@/components/booking/booking-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPinIcon, CalendarDaysIcon, SparklesIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

const steps = [
  {
    id: 'location',
    name: 'Location',
    description: 'Where do you need cleaning?',
    icon: MapPinIcon,
  },
  {
    id: 'service',
    name: 'Service',
    description: 'What type of cleaning?',
    icon: SparklesIcon,
  },
  {
    id: 'schedule',
    name: 'Schedule',
    description: 'When would you like it done?',
    icon: CalendarDaysIcon,
  },
  {
    id: 'payment',
    name: 'Payment',
    description: 'Secure payment & confirmation',
    icon: SparklesIcon,
  },
];

export default function BookPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to sign in with return URL
      router.push('/auth/signin?redirectTo=/book');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-24 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Sign in to book your cleaning
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Create an account or sign in to book professional cleaning services.
            </p>
            <div className="mt-8 flex items-center justify-center gap-x-6">
              <Button asChild>
                <Link href="/auth/signup">Create Account</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/auth/signin?redirectTo=/book">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Progress Steps */}
          <div className="mb-8">
            <nav aria-label="Progress">
              <ol className="flex items-center justify-between">
                {steps.map((step, stepIdx) => (
                  <li key={step.id} className="flex items-center">
                    <div className="flex items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                          stepIdx <= currentStep
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground text-muted-foreground'
                        }`}
                      >
                        <step.icon className="h-5 w-5" />
                      </div>
                      <div className="ml-4 min-w-0 flex-1">
                        <p
                          className={`text-sm font-medium ${
                            stepIdx <= currentStep ? 'text-primary' : 'text-muted-foreground'
                          }`}
                        >
                          {step.name}
                        </p>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                    {stepIdx < steps.length - 1 && (
                      <div
                        className={`ml-6 h-0.5 w-16 ${
                          stepIdx < currentStep ? 'bg-primary' : 'bg-muted'
                        }`}
                      />
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle>Book Your Cleaning Service</CardTitle>
              <CardDescription>
                Follow the steps below to book your professional cleaning service.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BookingFlow
                currentStep={currentStep}
                onStepChange={setCurrentStep}
                onComplete={(bookingData) => {
                  console.log('Booking completed:', bookingData);
                  router.push('/bookings');
                }}
              />
            </CardContent>
          </Card>

          {/* Trust Indicators */}
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <SparklesIcon className="h-6 w-6 text-success" />
              </div>
              <h3 className="mt-4 text-sm font-medium text-foreground">Quality Guaranteed</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                24-hour satisfaction guarantee or we'll re-clean for free
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <SparklesIcon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-sm font-medium text-foreground">Verified Cleaners</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                All cleaners are background checked and insured
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                <SparklesIcon className="h-6 w-6 text-warning" />
              </div>
              <h3 className="mt-4 text-sm font-medium text-foreground">Secure Payment</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Your payment is protected and processed securely
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
