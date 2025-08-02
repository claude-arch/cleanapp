import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client-side Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Client component client (for use in client components)
export const createSupabaseClient = () => 
  createClientComponentClient<Database>();

// Server component client (for use in server components)
export const createSupabaseServerClient = () =>
  createServerComponentClient<Database>({ cookies });

// Service role client (for admin operations)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Auth helpers
export const getUser = async () => {
  const supabase = createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  
  return user;
};

export const getSession = async () => {
  const supabase = createSupabaseServerClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  
  return session;
};

// Database helpers
export const getUserProfile = async (userId: string) => {
  const supabase = createSupabaseServerClient();
  
  // First get the user record
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (userError || !user) {
    return null;
  }
  
  // Then get the appropriate profile based on role
  if (user.role === 'customer') {
    const { data: profile, error: profileError } = await supabase
      .from('customer_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    return profileError ? null : { ...user, profile };
  } else if (user.role === 'provider') {
    const { data: profile, error: profileError } = await supabase
      .from('provider_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    return profileError ? null : { ...user, profile };
  }
  
  return user;
};

export const createUserProfile = async (
  userId: string,
  role: 'customer' | 'provider',
  profileData: any
) => {
  const supabase = createSupabaseServerClient();
  
  if (role === 'customer') {
    const { data, error } = await supabase
      .from('customer_profiles')
      .insert({
        user_id: userId,
        ...profileData,
      })
      .select()
      .single();
      
    return { data, error };
  } else if (role === 'provider') {
    const { data, error } = await supabase
      .from('provider_profiles')
      .insert({
        user_id: userId,
        ...profileData,
      })
      .select()
      .single();
      
    return { data, error };
  }
  
  return { data: null, error: new Error('Invalid role') };
};

// Storage helpers
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File
) => {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    
  if (error) {
    throw error;
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
    
  return { data, publicUrl };
};

export const deleteFile = async (bucket: string, path: string) => {
  const supabase = createSupabaseClient();
  
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);
    
  if (error) {
    throw error;
  }
};

// Real-time helpers
export const subscribeToBookingUpdates = (
  bookingId: string,
  callback: (payload: any) => void
) => {
  const supabase = createSupabaseClient();
  
  return supabase
    .channel(`booking-${bookingId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `id=eq.${bookingId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToMessages = (
  bookingId: string,
  callback: (payload: any) => void
) => {
  const supabase = createSupabaseClient();
  
  return supabase
    .channel(`messages-${bookingId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `booking_id=eq.${bookingId}`,
      },
      callback
    )
    .subscribe();
};

// Error handling
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  
  if (error.code === 'PGRST116') {
    return 'No data found';
  }
  
  if (error.code === '23505') {
    return 'This record already exists';
  }
  
  if (error.code === '23503') {
    return 'Referenced record does not exist';
  }
  
  return error.message || 'An unexpected error occurred';
};
