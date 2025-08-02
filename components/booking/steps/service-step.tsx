'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSupabaseClient } from '@/lib/supabase';
import { homeDetailsSchema, type HomeDetails } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircleIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { BookingData } from '../booking-flow';
import { Service } from '@/types';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ServiceStepProps {
  data: BookingData;
  onUpdate: (data: Partial<BookingData>) => void;
}

export function ServiceStep({ data, onUpdate }: ServiceStepProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<Array<{ serviceId: string; quantity: number }>>(
    data.services || []
  );
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createSupabaseClient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<HomeDetails>({
    resolver: zodResolver(homeDetailsSchema),
    defaultValues: data.homeDetails || {
      bedrooms: 2,
      bathrooms: 1,
      squareFootage: 1000,
      floors: 1,
      pets: false,
    },
  });

  const watchPets = watch('pets');

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const { data: serviceData, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;

      setServices(serviceData || []);
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Failed to load services');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitHomeDetails = (homeDetails: HomeDetails) => {
    onUpdate({ 
      homeDetails,
      services: selectedServices,
    });
  };

  const toggleService = (serviceId: string) => {
    const existingIndex = selectedServices.findIndex(s => s.serviceId === serviceId);
    
    if (existingIndex >= 0) {
      // Remove service
      const newServices = selectedServices.filter(s => s.serviceId !== serviceId);
      setSelectedServices(newServices);
    } else {
      // Add service
      const newServices = [...selectedServices, { serviceId, quantity: 1 }];
      setSelectedServices(newServices);
    }
  };

  const updateServiceQuantity = (serviceId: string, quantity: number) => {
    if (quantity < 1) {
      toggleService(serviceId);
      return;
    }

    const newServices = selectedServices.map(s =>
      s.serviceId === serviceId ? { ...s, quantity } : s
    );
    setSelectedServices(newServices);
  };

  const calculateTotal = () => {
    const homeDetails = watch();
    let total = 0;

    selectedServices.forEach(selectedService => {
      const service = services.find(s => s.id === selectedService.serviceId);
      if (service) {
        const basePrice = service.base_price * selectedService.quantity;
        const sqftPrice = service.price_per_sqft * homeDetails.squareFootage * selectedService.quantity;
        total += basePrice + sqftPrice;
      }
    });

    return total;
  };

  const isServiceSelected = (serviceId: string) => {
    return selectedServices.some(s => s.serviceId === serviceId);
  };

  const getServiceQuantity = (serviceId: string) => {
    const service = selectedServices.find(s => s.serviceId === serviceId);
    return service?.quantity || 1;
  };

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
        <h2 className="text-2xl font-bold text-foreground">What type of cleaning do you need?</h2>
        <p className="text-muted-foreground">Select your services and tell us about your home.</p>
      </div>

      {/* Service Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Choose Your Services</h3>
        <div className="grid gap-4">
          {services.map((service) => {
            const isSelected = isServiceSelected(service.id);
            const quantity = getServiceQuantity(service.id);
            
            return (
              <Card 
                key={service.id} 
                className={`cursor-pointer transition-colors ${
                  isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-accent'
                }`}
                onClick={() => toggleService(service.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`mt-1 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                        <CheckCircleIcon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold">{service.name}</h4>
                          <Badge variant="secondary">{service.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {service.description}
                        </p>
                        {service.features && (
                          <ul className="mt-2 text-sm text-muted-foreground">
                            {service.features.slice(0, 3).map((feature, index) => (
                              <li key={index} className="flex items-center">
                                <span className="w-1 h-1 bg-muted-foreground rounded-full mr-2"></span>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(service.base_price)}
                        {service.price_per_sqft > 0 && (
                          <span className="text-sm text-muted-foreground">
                            + {formatCurrency(service.price_per_sqft)}/sqft
                          </span>
                        )}
                      </p>
                      {isSelected && (
                        <div className="flex items-center space-x-2 mt-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateServiceQuantity(service.id, quantity - 1)}
                          >
                            <MinusIcon className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateServiceQuantity(service.id, quantity + 1)}
                          >
                            <PlusIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Home Details Form */}
      <Card>
        <CardHeader>
          <CardTitle>Tell us about your home</CardTitle>
          <CardDescription>
            This helps us provide accurate pricing and match you with the right cleaner.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmitHomeDetails)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="1"
                  {...register('bedrooms', { valueAsNumber: true })}
                  className={errors.bedrooms ? 'border-destructive' : ''}
                />
                {errors.bedrooms && (
                  <p className="text-sm text-destructive">{errors.bedrooms.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="1"
                  step="0.5"
                  {...register('bathrooms', { valueAsNumber: true })}
                  className={errors.bathrooms ? 'border-destructive' : ''}
                />
                {errors.bathrooms && (
                  <p className="text-sm text-destructive">{errors.bathrooms.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="squareFootage">Square Footage</Label>
                <Input
                  id="squareFootage"
                  type="number"
                  min="100"
                  {...register('squareFootage', { valueAsNumber: true })}
                  className={errors.squareFootage ? 'border-destructive' : ''}
                />
                {errors.squareFootage && (
                  <p className="text-sm text-destructive">{errors.squareFootage.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="floors">Number of Floors</Label>
                <Input
                  id="floors"
                  type="number"
                  min="1"
                  {...register('floors', { valueAsNumber: true })}
                  className={errors.floors ? 'border-destructive' : ''}
                />
                {errors.floors && (
                  <p className="text-sm text-destructive">{errors.floors.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pets"
                  {...register('pets')}
                />
                <Label htmlFor="pets">I have pets</Label>
              </div>

              {watchPets && (
                <div className="space-y-2">
                  <Label htmlFor="petDetails">Pet Details (Optional)</Label>
                  <Textarea
                    id="petDetails"
                    placeholder="Tell us about your pets (type, size, any special considerations)"
                    {...register('petDetails')}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessInstructions">Access Instructions (Optional)</Label>
              <Textarea
                id="accessInstructions"
                placeholder="Any special instructions for accessing your home (gate codes, parking, etc.)"
                {...register('accessInstructions')}
              />
            </div>

            {/* Pricing Summary */}
            {selectedServices.length > 0 && (
              <div className="border-t pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Estimated Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Final price may vary based on actual conditions and selected cleaner
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={selectedServices.length === 0}>
              Continue to Scheduling
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
