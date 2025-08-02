import { Resend } from 'resend';
import { createSupabaseServerClient } from './supabase';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

export async function sendBookingConfirmationEmail(userId: string, bookingId: string) {
  try {
    const supabase = createSupabaseServerClient();
    
    // Get booking details
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:customer_profiles!bookings_customer_id_fkey(*),
        address:addresses!bookings_address_id_fkey(*),
        booking_items(*, service:services(*))
      `)
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      throw new Error('Booking not found');
    }

    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (!user?.email) {
      throw new Error('User email not found');
    }

    const emailTemplate = generateBookingConfirmationEmail(booking, user.email);
    
    const { data, error: emailError } = await resend.emails.send({
      from: 'CleanConnect <bookings@cleanconnect.com>',
      to: emailTemplate.to,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    if (emailError) {
      throw emailError;
    }

    return data;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}

export async function sendProviderNotificationEmail(providerId: string, bookingId: string) {
  try {
    const supabase = createSupabaseServerClient();
    
    const { data: provider, error } = await supabase
      .from('provider_profiles')
      .select(`
        *,
        user:users!provider_profiles_user_id_fkey(email)
      `)
      .eq('user_id', providerId)
      .single();

    if (error || !provider?.user?.email) {
      throw new Error('Provider not found');
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        address:addresses!bookings_address_id_fkey(*),
        booking_items(*, service:services(*))
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    const emailTemplate = generateProviderNotificationEmail(booking, provider.user.email);
    
    const { data, error: emailError } = await resend.emails.send({
      from: 'CleanConnect <opportunities@cleanconnect.com>',
      to: emailTemplate.to,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    if (emailError) {
      throw emailError;
    }

    return data;
  } catch (error) {
    console.error('Provider notification email error:', error);
    throw error;
  }
}

function generateBookingConfirmationEmail(booking: any, email: string): EmailTemplate {
  const serviceDate = new Date(booking.service_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const serviceTime = new Date(booking.service_date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const services = booking.booking_items
    .map((item: any) => `<li>${item.service.name} (${item.quantity}x)</li>`)
    .join('');

  return {
    to: email,
    subject: `Booking Confirmation - ${serviceDate}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Booking Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .booking-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✨ CleanConnect</h1>
              <h2>Booking Confirmed!</h2>
            </div>
            
            <div class="content">
              <p>Hi there!</p>
              <p>Your cleaning service has been successfully booked. Here are the details:</p>
              
              <div class="booking-details">
                <h3>Booking Details</h3>
                <p><strong>Date:</strong> ${serviceDate}</p>
                <p><strong>Time:</strong> ${serviceTime}</p>
                <p><strong>Address:</strong> ${booking.address.street_address}, ${booking.address.city}, ${booking.address.state}</p>
                <p><strong>Services:</strong></p>
                <ul>${services}</ul>
                <p><strong>Total:</strong> $${booking.total_amount.toFixed(2)}</p>
              </div>
              
              <p>We'll match you with a verified cleaner and send you their details 24 hours before your appointment.</p>
              
              <p>Questions? Reply to this email or contact our support team.</p>
              
              <p>Thank you for choosing CleanConnect!</p>
            </div>
            
            <div class="footer">
              <p>CleanConnect - Professional Cleaning Services</p>
              <p>This email was sent to ${email}</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

function generateProviderNotificationEmail(booking: any, email: string): EmailTemplate {
  const serviceDate = new Date(booking.service_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return {
    to: email,
    subject: `New Booking Opportunity - ${serviceDate}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Booking Opportunity</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .booking-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .cta { text-align: center; margin: 20px 0; }
            .button { background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💼 CleanConnect</h1>
              <h2>New Booking Opportunity!</h2>
            </div>
            
            <div class="content">
              <p>A new cleaning job is available in your area!</p>
              
              <div class="booking-details">
                <h3>Job Details</h3>
                <p><strong>Date:</strong> ${serviceDate}</p>
                <p><strong>Location:</strong> ${booking.address.city}, ${booking.address.state}</p>
                <p><strong>Estimated Earnings:</strong> $${(booking.total_amount * 0.82).toFixed(2)}</p>
                <p><strong>Duration:</strong> ${booking.duration_minutes} minutes</p>
              </div>
              
              <div class="cta">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/provider/bookings/${booking.id}" class="button">
                  View & Accept Job
                </a>
              </div>
              
              <p><small>This opportunity is available to multiple providers. First come, first served!</small></p>
            </div>
            
            <div class="footer">
              <p>CleanConnect Provider Network</p>
              <p>This email was sent to ${email}</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}
