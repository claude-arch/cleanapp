import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { bookingRequestSchema } from '@/lib/validations';
import { calculateCommission, calculateProcessingFee } from '@/lib/stripe';

export async function GET(request: NextRequest) {
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

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: bookings,
      meta: {
        pagination: {
          page,
          limit,
          total: bookings?.length || 0,
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

    // TODO: Create payment intent with Stripe
    // TODO: Send confirmation email
    // TODO: Notify available providers

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
