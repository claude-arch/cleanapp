'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/app/providers';
import { addressSchema, type AddressFormData } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PlusIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { BookingData } from '../booking-flow';
import { Address } from '@/types';
import toast from 'react-hot-toast';

interface LocationStepProps {
  data: BookingData;
  onUpdate: (data: Partial<BookingData>) => void;
}

export function LocationStep({ data, onUpdate }: LocationStepProps) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(data.addressId || '');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createSupabaseClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: 'Home',
      isDefault: false,
    },
  });

  useEffect(() => {
    if (user) {
      loadAddresses();
    }
  }, [user]);

  const loadAddresses = async () => {
    try {
      const { data: addressData, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_default', { ascending: false });

      if (error) throw error;

      setAddresses(addressData || []);
      
      // Auto-select default address if none selected
      if (!selectedAddressId && addressData?.length > 0) {
        const defaultAddress = addressData.find(addr => addr.is_default) || addressData[0];
        setSelectedAddressId(defaultAddress.id);
        onUpdate({ addressId: defaultAddress.id });
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitAddress = async (formData: AddressFormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      const { data: newAddress, error } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          label: formData.label,
          street_address: formData.streetAddress,
          apartment: formData.apartment,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode,
          is_default: formData.isDefault,
        })
        .select()
        .single();

      if (error) throw error;

      // If this is set as default, update other addresses
      if (formData.isDefault) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .neq('id', newAddress.id);
      }

      setAddresses(prev => [...prev, newAddress]);
      setSelectedAddressId(newAddress.id);
      onUpdate({ addressId: newAddress.id });
      setShowAddForm(false);
      reset();
      toast.success('Address added successfully');
    } catch (error) {
      console.error('Error adding address:', error);
      toast.error('Failed to add address');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    onUpdate({ addressId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Where do you need cleaning?</h2>
        <p className="text-muted-foreground">Select an address or add a new one.</p>
      </div>

      {addresses.length > 0 && !showAddForm && (
        <div className="space-y-4">
          <RadioGroup value={selectedAddressId} onValueChange={handleAddressSelect}>
            {addresses.map((address) => (
              <div key={address.id} className="flex items-center space-x-3">
                <RadioGroupItem value={address.id} id={address.id} />
                <Label htmlFor={address.id} className="flex-1 cursor-pointer">
                  <Card className="p-4 hover:bg-accent">
                    <div className="flex items-start space-x-3">
                      <MapPinIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{address.label}</span>
                          {address.is_default && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {address.street_address}
                          {address.apartment && `, ${address.apartment}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {address.city}, {address.state} {address.zip_code}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}

      {!showAddForm && (
        <Button
          variant="outline"
          onClick={() => setShowAddForm(true)}
          className="w-full"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add New Address
        </Button>
      )}

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Address</CardTitle>
            <CardDescription>
              Enter the address where you need cleaning services.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmitAddress)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="label">Address Label</Label>
                <Input
                  id="label"
                  placeholder="e.g., Home, Office"
                  {...register('label')}
                  className={errors.label ? 'border-destructive' : ''}
                />
                {errors.label && (
                  <p className="text-sm text-destructive">{errors.label.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="streetAddress">Street Address</Label>
                <Input
                  id="streetAddress"
                  placeholder="123 Main St"
                  {...register('streetAddress')}
                  className={errors.streetAddress ? 'border-destructive' : ''}
                />
                {errors.streetAddress && (
                  <p className="text-sm text-destructive">{errors.streetAddress.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="apartment">Apartment/Unit (Optional)</Label>
                <Input
                  id="apartment"
                  placeholder="Apt 4B"
                  {...register('apartment')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="San Francisco"
                    {...register('city')}
                    className={errors.city ? 'border-destructive' : ''}
                  />
                  {errors.city && (
                    <p className="text-sm text-destructive">{errors.city.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="CA"
                    {...register('state')}
                    className={errors.state ? 'border-destructive' : ''}
                  />
                  {errors.state && (
                    <p className="text-sm text-destructive">{errors.state.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  placeholder="94102"
                  {...register('zipCode')}
                  className={errors.zipCode ? 'border-destructive' : ''}
                />
                {errors.zipCode && (
                  <p className="text-sm text-destructive">{errors.zipCode.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Address'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
