export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          phone: string | null
          role: 'customer' | 'provider' | 'admin'
          email_verified: boolean
          phone_verified: boolean
          is_active: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          phone?: string | null
          role?: 'customer' | 'provider' | 'admin'
          email_verified?: boolean
          phone_verified?: boolean
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          phone?: string | null
          role?: 'customer' | 'provider' | 'admin'
          email_verified?: boolean
          phone_verified?: boolean
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customer_profiles: {
        Row: {
          user_id: string
          first_name: string
          last_name: string
          date_of_birth: string | null
          avatar_url: string | null
          emergency_contact: Json | null
          preferences: Json
          total_bookings: number
          total_spent: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          first_name: string
          last_name: string
          date_of_birth?: string | null
          avatar_url?: string | null
          emergency_contact?: Json | null
          preferences?: Json
          total_bookings?: number
          total_spent?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          first_name?: string
          last_name?: string
          date_of_birth?: string | null
          avatar_url?: string | null
          emergency_contact?: Json | null
          preferences?: Json
          total_bookings?: number
          total_spent?: number
          created_at?: string
          updated_at?: string
        }
      }
      provider_profiles: {
        Row: {
          user_id: string
          business_name: string
          description: string | null
          hourly_rate: number | null
          service_radius: number
          verification_status: 'pending' | 'verified' | 'rejected'
          verified_at: string | null
          insurance_expires_at: string | null
          background_check_expires_at: string | null
          availability: Json
          rating: number
          review_count: number
          total_earnings: number
          total_bookings: number
          response_time_minutes: number
          cancellation_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          business_name: string
          description?: string | null
          hourly_rate?: number | null
          service_radius?: number
          verification_status?: 'pending' | 'verified' | 'rejected'
          verified_at?: string | null
          insurance_expires_at?: string | null
          background_check_expires_at?: string | null
          availability?: Json
          rating?: number
          review_count?: number
          total_earnings?: number
          total_bookings?: number
          response_time_minutes?: number
          cancellation_rate?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          business_name?: string
          description?: string | null
          hourly_rate?: number | null
          service_radius?: number
          verification_status?: 'pending' | 'verified' | 'rejected'
          verified_at?: string | null
          insurance_expires_at?: string | null
          background_check_expires_at?: string | null
          availability?: Json
          rating?: number
          review_count?: number
          total_earnings?: number
          total_bookings?: number
          response_time_minutes?: number
          cancellation_rate?: number
          created_at?: string
          updated_at?: string
        }
      }
      addresses: {
        Row: {
          id: string
          user_id: string | null
          label: string
          street_address: string
          apartment: string | null
          city: string
          state: string
          zip_code: string
          country: string
          latitude: number | null
          longitude: number | null
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          label?: string
          street_address: string
          apartment?: string | null
          city: string
          state: string
          zip_code: string
          country?: string
          latitude?: number | null
          longitude?: number | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          label?: string
          street_address?: string
          apartment?: string | null
          city?: string
          state?: string
          zip_code?: string
          country?: string
          latitude?: number | null
          longitude?: number | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          name: string
          description: string | null
          base_price: number
          price_per_sqft: number
          duration_minutes: number
          category: 'standard' | 'deep' | 'move_in' | 'move_out' | 'add_on'
          features: string[] | null
          requirements: string[] | null
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          base_price: number
          price_per_sqft?: number
          duration_minutes: number
          category: 'standard' | 'deep' | 'move_in' | 'move_out' | 'add_on'
          features?: string[] | null
          requirements?: string[] | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          base_price?: number
          price_per_sqft?: number
          duration_minutes?: number
          category?: 'standard' | 'deep' | 'move_in' | 'move_out' | 'add_on'
          features?: string[] | null
          requirements?: string[] | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          customer_id: string
          provider_id: string | null
          address_id: string
          service_date: string
          duration_minutes: number
          status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          subtotal: number
          commission: number
          processing_fee: number
          discount_amount: number
          total_amount: number
          special_instructions: string | null
          home_details: Json
          recurring_booking_id: string | null
          assigned_at: string | null
          started_at: string | null
          completed_at: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          provider_id?: string | null
          address_id: string
          service_date: string
          duration_minutes: number
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          subtotal: number
          commission: number
          processing_fee: number
          discount_amount?: number
          total_amount: number
          special_instructions?: string | null
          home_details?: Json
          recurring_booking_id?: string | null
          assigned_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          provider_id?: string | null
          address_id?: string
          service_date?: string
          duration_minutes?: number
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          subtotal?: number
          commission?: number
          processing_fee?: number
          discount_amount?: number
          total_amount?: number
          special_instructions?: string | null
          home_details?: Json
          recurring_booking_id?: string | null
          assigned_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      booking_items: {
        Row: {
          id: string
          booking_id: string
          service_id: string | null
          addon_id: string | null
          name: string
          quantity: number
          unit_price: number
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          service_id?: string | null
          addon_id?: string | null
          name: string
          quantity?: number
          unit_price: number
          total_price: number
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          service_id?: string | null
          addon_id?: string | null
          name?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string
        }
      }
      payment_methods: {
        Row: {
          id: string
          user_id: string
          stripe_payment_method_id: string
          type: 'card' | 'bank_account'
          last_four: string | null
          brand: string | null
          exp_month: number | null
          exp_year: number | null
          billing_address: Json | null
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_payment_method_id: string
          type: 'card' | 'bank_account'
          last_four?: string | null
          brand?: string | null
          exp_month?: number | null
          exp_year?: number | null
          billing_address?: Json | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_payment_method_id?: string
          type?: 'card' | 'bank_account'
          last_four?: string | null
          brand?: string | null
          exp_month?: number | null
          exp_year?: number | null
          billing_address?: Json | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          booking_id: string
          stripe_payment_intent_id: string | null
          amount: number
          commission: number
          processing_fee: number
          net_amount: number
          status: 'pending' | 'succeeded' | 'failed' | 'refunded'
          failure_reason: string | null
          processed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          stripe_payment_intent_id?: string | null
          amount: number
          commission: number
          processing_fee: number
          net_amount: number
          status?: 'pending' | 'succeeded' | 'failed' | 'refunded'
          failure_reason?: string | null
          processed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          stripe_payment_intent_id?: string | null
          amount?: number
          commission?: number
          processing_fee?: number
          net_amount?: number
          status?: 'pending' | 'succeeded' | 'failed' | 'refunded'
          failure_reason?: string | null
          processed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          booking_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment: string | null
          photos: string[] | null
          response: string | null
          response_at: string | null
          is_public: boolean
          is_featured: boolean
          helpful_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment?: string | null
          photos?: string[] | null
          response?: string | null
          response_at?: string | null
          is_public?: boolean
          is_featured?: boolean
          helpful_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          reviewer_id?: string
          reviewee_id?: string
          rating?: number
          comment?: string | null
          photos?: string[] | null
          response?: string | null
          response_at?: string | null
          is_public?: boolean
          is_featured?: boolean
          helpful_count?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_commission: {
        Args: {
          booking_amount: number
        }
        Returns: number
      }
      calculate_processing_fee: {
        Args: {
          booking_amount: number
        }
        Returns: number
      }
    }
    Enums: {
      user_role: 'customer' | 'provider' | 'admin'
      verification_status: 'pending' | 'verified' | 'rejected'
      service_category: 'standard' | 'deep' | 'move_in' | 'move_out' | 'add_on'
      booking_status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
      recurring_frequency: 'weekly' | 'bi_weekly' | 'monthly'
      payment_method_type: 'card' | 'bank_account'
      transaction_status: 'pending' | 'succeeded' | 'failed' | 'refunded'
      payout_status: 'pending' | 'paid' | 'failed'
      message_type: 'text' | 'image' | 'system'
      notification_type: 'booking' | 'payment' | 'review' | 'system'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
