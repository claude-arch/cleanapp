'use client';

import { useState, useEffect } from 'react';
import { format, addDays, startOfDay, isBefore, isToday } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDaysIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { BookingData } from '../booking-flow';

interface ScheduleStepProps {
  data: BookingData;
  onUpdate: (data: Partial<BookingData>) => void;
}

const timeSlots = [
  '8:00 AM',
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM',
];

const recurringOptions = [
  { value: 'weekly', label: 'Weekly', description: 'Every week on the same day' },
  { value: 'bi_weekly', label: 'Bi-weekly', description: 'Every 2 weeks on the same day' },
  { value: 'monthly', label: 'Monthly', description: 'Every month on the same day' },
];

export function ScheduleStep({ data, onUpdate }: ScheduleStepProps) {
  const [selectedDate, setSelectedDate] = useState<string>(data.serviceDate || '');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(!!data.recurringFrequency);
  const [recurringFrequency, setRecurringFrequency] = useState<string>(data.recurringFrequency || '');
  const [specialInstructions, setSpecialInstructions] = useState<string>(data.specialInstructions || '');
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  useEffect(() => {
    // Generate available dates (next 14 days, excluding today if it's past 2 PM)
    const dates: string[] = [];
    const now = new Date();
    const startDate = isToday(now) && now.getHours() >= 14 ? addDays(now, 1) : now;
    
    for (let i = 0; i < 14; i++) {
      const date = addDays(startDate, i);
      dates.push(format(date, 'yyyy-MM-dd'));
    }
    
    setAvailableDates(dates);
  }, []);

  useEffect(() => {
    // Parse existing serviceDate if it exists
    if (data.serviceDate) {
      const [datePart, timePart] = data.serviceDate.split('T');
      setSelectedDate(datePart);
      if (timePart) {
        const time = format(new Date(data.serviceDate), 'h:mm a');
        setSelectedTime(time);
      }
    }
  }, [data.serviceDate]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    updateServiceDate(date, selectedTime);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    updateServiceDate(selectedDate, time);
  };

  const updateServiceDate = (date: string, time: string) => {
    if (date && time) {
      // Convert time to 24-hour format and create ISO string
      const [timePart, period] = time.split(' ');
      const [hours, minutes] = timePart.split(':');
      let hour24 = parseInt(hours);
      
      if (period === 'PM' && hour24 !== 12) {
        hour24 += 12;
      } else if (period === 'AM' && hour24 === 12) {
        hour24 = 0;
      }
      
      const serviceDateTime = new Date(date);
      serviceDateTime.setHours(hour24, parseInt(minutes), 0, 0);
      
      onUpdate({ 
        serviceDate: serviceDateTime.toISOString(),
        specialInstructions,
        recurringFrequency: isRecurring ? recurringFrequency : undefined,
      });
    }
  };

  const handleRecurringToggle = (recurring: boolean) => {
    setIsRecurring(recurring);
    if (!recurring) {
      setRecurringFrequency('');
      onUpdate({ 
        serviceDate: selectedDate && selectedTime ? new Date(`${selectedDate}T${selectedTime}`).toISOString() : undefined,
        specialInstructions,
        recurringFrequency: undefined,
      });
    }
  };

  const handleRecurringFrequencyChange = (frequency: string) => {
    setRecurringFrequency(frequency);
    onUpdate({ 
      serviceDate: selectedDate && selectedTime ? new Date(`${selectedDate}T${selectedTime}`).toISOString() : undefined,
      specialInstructions,
      recurringFrequency: frequency,
    });
  };

  const handleInstructionsChange = (instructions: string) => {
    setSpecialInstructions(instructions);
    onUpdate({ 
      serviceDate: selectedDate && selectedTime ? new Date(`${selectedDate}T${selectedTime}`).toISOString() : undefined,
      specialInstructions: instructions,
      recurringFrequency: isRecurring ? recurringFrequency : undefined,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">When would you like your cleaning?</h2>
        <p className="text-muted-foreground">Choose your preferred date and time.</p>
      </div>

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarDaysIcon className="h-5 w-5 mr-2" />
            Select Date
          </CardTitle>
          <CardDescription>
            Choose from the next 14 available days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {availableDates.map((date) => {
              const dateObj = new Date(date);
              const isSelected = selectedDate === date;
              
              return (
                <Button
                  key={date}
                  variant={isSelected ? 'default' : 'outline'}
                  className="h-auto p-3 flex flex-col items-center"
                  onClick={() => handleDateSelect(date)}
                >
                  <span className="text-xs font-medium">
                    {format(dateObj, 'EEE')}
                  </span>
                  <span className="text-lg font-bold">
                    {format(dateObj, 'd')}
                  </span>
                  <span className="text-xs">
                    {format(dateObj, 'MMM')}
                  </span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Time Selection */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClockIcon className="h-5 w-5 mr-2" />
              Select Time
            </CardTitle>
            <CardDescription>
              Choose your preferred time slot.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {timeSlots.map((time) => {
                const isSelected = selectedTime === time;
                
                return (
                  <Button
                    key={time}
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => handleTimeSelect(time)}
                  >
                    {time}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recurring Options */}
      {selectedDate && selectedTime && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Recurring Service
            </CardTitle>
            <CardDescription>
              Set up regular cleaning appointments and save time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Button
                variant={!isRecurring ? 'default' : 'outline'}
                onClick={() => handleRecurringToggle(false)}
              >
                One-time
              </Button>
              <Button
                variant={isRecurring ? 'default' : 'outline'}
                onClick={() => handleRecurringToggle(true)}
              >
                Recurring
              </Button>
            </div>

            {isRecurring && (
              <div className="space-y-4">
                <Label>How often would you like cleaning?</Label>
                <RadioGroup value={recurringFrequency} onValueChange={handleRecurringFrequencyChange}>
                  {recurringOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-muted-foreground">{option.description}</div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Special Instructions */}
      {selectedDate && selectedTime && (
        <Card>
          <CardHeader>
            <CardTitle>Special Instructions</CardTitle>
            <CardDescription>
              Any specific requests or important information for your cleaner?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="e.g., Please focus on the kitchen, avoid certain rooms, use eco-friendly products only, etc."
              value={specialInstructions}
              onChange={(e) => handleInstructionsChange(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {selectedDate && selectedTime && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Booking Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Date:</span>
                <span className="font-medium">
                  {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span className="font-medium">{selectedTime}</span>
              </div>
              {isRecurring && recurringFrequency && (
                <div className="flex justify-between">
                  <span>Frequency:</span>
                  <span className="font-medium">
                    {recurringOptions.find(opt => opt.value === recurringFrequency)?.label}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
