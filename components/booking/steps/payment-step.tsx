'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { createSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCardIcon, PlusIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { BookingData } from '../booking-flow';
import { PaymentMethod } from '@/types';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentStepProps {
  data: BookingData;
  onUpdate: (data: Partial<BookingData>) => void;
  onComplete: () => void;
}

function PaymentForm({ data, onUpdate, onComplete }: PaymentStepProps) {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(data.paymentMethodId || '');
  const [showAddCard, setShowAddCard] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stripe = useStripe();
  const elements = useElements();
  const supabase = createSupabaseClient();

  useEffect(() => {
    if (user) {
      loadPaymentMethods();
    }
  }, [user]);

  const loadPaymentMethods = async () => {
    try {
      const { data: methods, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_default', { ascending: false });

      if (error) throw error;

      setPaymentMethods(methods || []);
      
      // Auto-select default payment method
      if (!selectedPaymentMethod && methods?.length > 0) {
        const defaultMethod = methods.find(m => m.is_default) || methods[0];
        setSelectedPaymentMethod(defaultMethod.id);
        onUpdate({ paymentMethodId: defaultMethod.id });
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!stripe || !elements || !user) return;

    setIsProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      // Create payment method with Stripe
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // Save payment method to our database
      const { data: newPaymentMethod, error: dbError } = await supabase
        .from('payment_methods')
        .insert({
          user_id: user.id,
          stripe_payment_method_id: paymentMethod.id,
          type: 'card',
          last_four: paymentMethod.card?.last4,
          brand: paymentMethod.card?.brand,
          exp_month: paymentMethod.card?.exp_month,
          exp_year: paymentMethod.card?.exp_year,
          is_default: paymentMethods.length === 0, // First card is default
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setPaymentMethods(prev => [...prev, newPaymentMethod]);
      setSelectedPaymentMethod(newPaymentMethod.id);
      onUpdate({ paymentMethodId: newPaymentMethod.id });
      setShowAddCard(false);
      toast.success('Payment method added successfully');
    } catch (error: any) {
      console.error('Error adding payment method:', error);
      setError(error.message || 'Failed to add payment method');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentMethodSelect = (paymentMethodId: string) => {
    setSelectedPaymentMethod(paymentMethodId);
    onUpdate({ paymentMethodId });
  };

  const calculatePricing = () => {
    // This would normally be calculated on the server
    // For demo purposes, using mock calculation
    const subtotal = 120; // Mock subtotal
    const commission = subtotal * 0.18;
    const processingFee = subtotal * 0.029 + 0.30;
    const total = subtotal + commission + processingFee;

    return {
      subtotal,
      commission,
      processingFee,
      total,
    };
  };

  const pricing = calculatePricing();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Payment & Confirmation</h2>
        <p className="text-muted-foreground">Review your booking and complete payment.</p>
      </div>

      {/* Pricing Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span>Service subtotal</span>
            <span>{formatCurrency(pricing.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Platform fee (18%)</span>
            <span>{formatCurrency(pricing.commission)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Processing fee</span>
            <span>{formatCurrency(pricing.processingFee)}</span>
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>{formatCurrency(pricing.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCardIcon className="h-5 w-5 mr-2" />
            Payment Method
          </CardTitle>
          <CardDescription>
            Choose how you'd like to pay for your cleaning service.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {paymentMethods.length > 0 && !showAddCard && (
            <div className="space-y-4">
              <RadioGroup value={selectedPaymentMethod} onValueChange={handlePaymentMethodSelect}>
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center space-x-3">
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent">
                        <div className="flex items-center space-x-3">
                          <CreditCardIcon className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {method.brand?.toUpperCase()} •••• {method.last_four}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Expires {method.exp_month}/{method.exp_year}
                            </div>
                          </div>
                        </div>
                        {method.is_default && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {!showAddCard && (
            <Button
              variant="outline"
              onClick={() => setShowAddCard(true)}
              className="w-full"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add New Payment Method
            </Button>
          )}

          {showAddCard && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <Label className="text-sm font-medium mb-4 block">Card Information</Label>
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                    },
                  }}
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddCard(false);
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddPaymentMethod}
                  disabled={isProcessing || !stripe}
                >
                  {isProcessing ? 'Adding...' : 'Add Payment Method'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Terms and Complete */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircleIcon className="h-5 w-5 text-success mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Quality Guarantee</p>
                <p className="text-muted-foreground">
                  If you're not satisfied, we'll send someone back to re-clean within 24 hours at no extra cost.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <CheckCircleIcon className="h-5 w-5 text-success mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Secure Payment</p>
                <p className="text-muted-foreground">
                  Your payment information is encrypted and secure. You'll only be charged after the service is completed.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                By completing this booking, you agree to our{' '}
                <a href="/terms" className="text-primary hover:underline">Terms of Service</a>{' '}
                and{' '}
                <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complete Booking Button */}
      <Button
        onClick={onComplete}
        disabled={!selectedPaymentMethod || isProcessing}
        className="w-full h-12 text-lg bg-success hover:bg-success/90"
      >
        Complete Booking - {formatCurrency(pricing.total)}
      </Button>
    </div>
  );
}

export function PaymentStep(props: PaymentStepProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
}
