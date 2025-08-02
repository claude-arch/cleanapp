import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { bookingRequestSchema } from '@/lib/validations';
import { calculateCommission, calculateProcessingFee } from '@/lib/stripe';
import { withErrorHandling, errors, createApiResponse } from '@/lib/api-error-handler';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = createSupabaseServerClient();

  // Get user from session
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw errors.unauthorized();
  }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    
    const offset = (page - 1) * limit;

    let query = supabase
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
        ),
        address:addresses!bookings_address_id_fkey(*),
        booking_items(*),
        transaction:transactions(*)
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: bookings, error, count } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', user.id);

    if (countError) {
      console.error('Error getting booking count:', countError);
    }

    return NextResponse.json({
      success: true,
      data: bookings,
      meta: {
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / limit),
          hasNext: page * limit < (totalCount || 0),
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Bookings API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate request data
    const validationResult = bookingRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const bookingData = validationResult.data;

    // Calculate pricing
    let subtotal = 0;
    const bookingItems = [];

    for (const serviceItem of bookingData.services) {
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceItem.serviceId)
        .single();

      if (serviceError || !service) {
        return NextResponse.json(
          { success: false, error: `Service not found: ${serviceItem.serviceId}` },
          { status: 400 }
        );
      }

      const basePrice = service.base_price * serviceItem.quantity;
      const sqftPrice = service.price_per_sqft * bookingData.homeDetails.squareFootage * serviceItem.quantity;
      const totalPrice = basePrice + sqftPrice;
      
      subtotal += totalPrice;
      
      bookingItems.push({
        service_id: service.id,
        name: service.name,
        quantity: serviceItem.quantity,
        unit_price: basePrice + sqftPrice,
        total_price: totalPrice,
      });
    }

    const commission = calculateCommission(subtotal);
    const processingFee = calculateProcessingFee(subtotal);
    const totalAmount = subtotal + commission + processingFee;

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        customer_id: user.id,
        address_id: bookingData.addressId,
        service_date: bookingData.serviceDate,
        duration_minutes: 120, // Default duration, could be calculated
        status: 'pending',
        subtotal,
        commission,
        processing_fee: processingFee,
        discount_amount: 0,
        total_amount: totalAmount,
        special_instructions: bookingData.specialInstructions,
        home_details: bookingData.homeDetails,
        recurring_booking_id: bookingData.recurringFrequency ? null : null, // TODO: Handle recurring
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json(
        { success: false, error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    // Create booking items
    const bookingItemsWithBookingId = bookingItems.map(item => ({
      ...item,
      booking_id: booking.id,
    }));

    const { error: itemsError } = await supabase
      .from('booking_items')
      .insert(bookingItemsWithBookingId);

    if (itemsError) {
      console.error('Error creating booking items:', itemsError);
      // Rollback booking
      await supabase.from('bookings').delete().eq('id', booking.id);
      return NextResponse.json(
        { success: false, error: 'Failed to create booking items' },
        { status: 500 }
      );
    }

    // Create payment intent with Stripe
    try {
      const { createPaymentIntent } = await import('@/lib/stripe');
      const paymentIntent = await createPaymentIntent(
        totalAmount,
        user.id,
        '', // Provider will be assigned later
        booking.id,
        bookingData.paymentMethodId
      );

      // Update booking with payment intent
      await supabase
        .from('bookings')
        .update({
          stripe_payment_intent_id: paymentIntent.id,
          status: 'payment_pending'
        })
        .eq('id', booking.id);
    } catch (paymentError) {
      console.error('Payment intent creation failed:', paymentError);
      // Don't fail the booking creation, just log the error
    }

    // Send confirmation email
    try {
      const { sendBookingConfirmationEmail } = await import('@/lib/email');
      await sendBookingConfirmationEmail(user.id, booking.id);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    // Notify available providers
    try {
      const { notifyAvailableProviders } = await import('@/lib/notifications');
      await notifyAvailableProviders(booking.id);
    } catch (notificationError) {
      console.error('Provider notification failed:', notificationError);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...booking,
        booking_items: bookingItemsWithBookingId,
      },
    });
  } catch (error) {
    console.error('Create booking API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
