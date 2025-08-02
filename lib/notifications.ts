import { createSupabaseServerClient } from './supabase';
import { sendProviderNotificationEmail } from './email';
import { calculateDistance } from './utils';

export async function notifyAvailableProviders(bookingId: string) {
  try {
    const supabase = createSupabaseServerClient();
    
    // Get booking details with address
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        address:addresses!bookings_address_id_fkey(*)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    // Find available providers in the area
    const availableProviders = await findAvailableProviders(
      booking.address.latitude,
      booking.address.longitude,
      new Date(booking.service_date),
      booking.duration_minutes
    );

    // Send notifications to providers
    const notificationPromises = availableProviders.map(async (provider) => {
      try {
        // Send email notification
        await sendProviderNotificationEmail(provider.user_id, bookingId);
        
        // Create in-app notification
        await supabase.from('notifications').insert({
          user_id: provider.user_id,
          type: 'booking_opportunity',
          title: 'New Booking Opportunity',
          message: `A new cleaning job is available on ${new Date(booking.service_date).toLocaleDateString()}`,
          data: { bookingId },
          is_read: false,
        });

        // Send SMS if provider has SMS notifications enabled
        if (provider.preferences?.notifications?.sms) {
          await sendSMSNotification(provider.phone, bookingId);
        }

        return { providerId: provider.user_id, success: true };
      } catch (error) {
        console.error(`Failed to notify provider ${provider.user_id}:`, error);
        return { providerId: provider.user_id, success: false, error };
      }
    });

    const results = await Promise.allSettled(notificationPromises);
    
    // Log notification results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`Notified ${successful} providers successfully, ${failed} failed for booking ${bookingId}`);
    
    return {
      total: availableProviders.length,
      successful,
      failed,
    };
  } catch (error) {
    console.error('Provider notification error:', error);
    throw error;
  }
}

async function findAvailableProviders(
  latitude: number,
  longitude: number,
  serviceDate: Date,
  durationMinutes: number
) {
  const supabase = createSupabaseServerClient();
  
  // Get all verified providers
  const { data: providers, error } = await supabase
    .from('provider_profiles')
    .select(`
      *,
      user:users!provider_profiles_user_id_fkey(phone),
      preferences
    `)
    .eq('verification_status', 'verified')
    .eq('is_active', true);

  if (error || !providers) {
    throw new Error('Failed to fetch providers');
  }

  // Filter providers by distance and availability
  const availableProviders = providers.filter(provider => {
    // Check service radius
    if (provider.service_address_lat && provider.service_address_lng) {
      const distance = calculateDistance(
        latitude,
        longitude,
        provider.service_address_lat,
        provider.service_address_lng
      );
      
      if (distance > provider.service_radius) {
        return false;
      }
    }

    // Check availability
    return isProviderAvailable(provider, serviceDate, durationMinutes);
  });

  return availableProviders;
}

function isProviderAvailable(
  provider: any,
  serviceDate: Date,
  durationMinutes: number
): boolean {
  const dayOfWeek = serviceDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const serviceTime = serviceDate.getHours() * 60 + serviceDate.getMinutes();
  const endTime = serviceTime + durationMinutes;

  // Check regular availability
  const dayAvailability = provider.availability[dayOfWeek];
  if (!dayAvailability || dayAvailability.length === 0) {
    return false;
  }

  // Check if service time fits in any available slot
  const hasAvailableSlot = dayAvailability.some((slot: any) => {
    const [startHour, startMinute] = slot.start.split(':').map(Number);
    const [endHour, endMinute] = slot.end.split(':').map(Number);
    
    const slotStart = startHour * 60 + startMinute;
    const slotEnd = endHour * 60 + endMinute;
    
    return serviceTime >= slotStart && endTime <= slotEnd;
  });

  if (!hasAvailableSlot) {
    return false;
  }

  // Check for exceptions (holidays, time off, etc.)
  const dateString = serviceDate.toISOString().split('T')[0];
  const hasException = provider.availability.exceptions?.some((exception: any) => {
    return exception.date === dateString && exception.type === 'unavailable';
  });

  return !hasException;
}

async function sendSMSNotification(phone: string, bookingId: string) {
  try {
    const { Twilio } = await import('twilio');
    const client = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await client.messages.create({
      body: `New cleaning job available! Check your CleanConnect app for details. Job ID: ${bookingId}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
  } catch (error) {
    console.error('SMS notification error:', error);
    // Don't throw - SMS is optional
  }
}

export async function sendBookingStatusUpdate(
  bookingId: string,
  status: string,
  message: string
) {
  try {
    const supabase = createSupabaseServerClient();
    
    // Get booking with customer info
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:customer_profiles!bookings_customer_id_fkey(
          *,
          user:users!customer_profiles_user_id_fkey(*)
        )
      `)
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      throw new Error('Booking not found');
    }

    // Create notification
    await supabase.from('notifications').insert({
      user_id: booking.customer_id,
      type: 'booking_update',
      title: `Booking ${status}`,
      message,
      data: { bookingId, status },
      is_read: false,
    });

    // Send email if customer has email notifications enabled
    if (booking.customer.preferences?.notifications?.email !== false) {
      // TODO: Implement status update email
    }

    // Send SMS if enabled
    if (booking.customer.preferences?.notifications?.sms && booking.customer.user.phone) {
      await sendSMSNotification(booking.customer.user.phone, bookingId);
    }
  } catch (error) {
    console.error('Booking status update notification error:', error);
    throw error;
  }
}

export async function sendProviderAssignmentNotification(
  bookingId: string,
  providerId: string
) {
  try {
    const supabase = createSupabaseServerClient();
    
    // Get booking and provider info
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:customer_profiles!bookings_customer_id_fkey(
          *,
          user:users!customer_profiles_user_id_fkey(*)
        ),
        provider:provider_profiles!bookings_provider_id_fkey(
          *,
          user:users!provider_profiles_user_id_fkey(*)
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    // Notify customer about provider assignment
    await supabase.from('notifications').insert({
      user_id: booking.customer_id,
      type: 'provider_assigned',
      title: 'Cleaner Assigned',
      message: `${booking.provider.business_name} has been assigned to your booking`,
      data: { bookingId, providerId },
      is_read: false,
    });

    // Notify provider about booking acceptance
    await supabase.from('notifications').insert({
      user_id: providerId,
      type: 'booking_accepted',
      title: 'Booking Confirmed',
      message: `You've been assigned a cleaning job on ${new Date(booking.service_date).toLocaleDateString()}`,
      data: { bookingId },
      is_read: false,
    });

  } catch (error) {
    console.error('Provider assignment notification error:', error);
    throw error;
  }
}
