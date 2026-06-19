import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          phone: string
          name: string
          avatar: string
          role: 'passenger' | 'driver' | 'admin'
          rating: number
          total_trips: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phone: string
          name?: string
          avatar?: string
          role?: 'passenger' | 'driver' | 'admin'
        }
      }
      driver_profiles: {
        Row: {
          user_id: string
          status: 'online' | 'offline' | 'busy'
          vehicle_plate: string
          vehicle_model: string
          total_seats: number
          verified: boolean
          blocked: boolean
          last_active_at: string
          today_trips: number
          today_passengers: number
        }
        Insert: {
          user_id: string
          status?: 'online' | 'offline' | 'busy'
          vehicle_plate?: string
          total_seats?: number
        }
      }
      routes: {
        Row: {
          id: string
          type: 'passenger' | 'driver'
          creator_id: string
          pickup_name: string
          pickup_lat: number
          pickup_lng: number
          pickup_address: string
          dropoff_name: string
          dropoff_lat: number
          dropoff_lng: number
          dropoff_address: string
          passenger_count: number
          max_passengers: number
          preferred_time: string
          status: 'open' | 'claimed' | 'in_progress' | 'completed' | 'cancelled'
          claimed_by: string | null
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'passenger' | 'driver'
          creator_id: string
          pickup_name: string
          pickup_lat: number
          pickup_lng: number
          pickup_address?: string
          dropoff_name: string
          dropoff_lat: number
          dropoff_lng: number
          dropoff_address?: string
          passenger_count?: number
          max_passengers?: number
          preferred_time?: string
          notes?: string
        }
      }
      trips: {
        Row: {
          id: string
          route_id: string
          driver_id: string
          status: 'pending' | 'picking_up' | 'en_route' | 'completed' | 'cancelled'
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
      }
      trip_passengers: {
        Row: {
          id: string
          trip_id: string
          user_id: string
          status: 'waiting' | 'picked_up' | 'completed' | 'no_show'
          joined_at: string
          picked_up_at: string | null
        }
      }
      messages: {
        Row: {
          id: string
          trip_id: string | null
          sender_id: string
          receiver_id: string | null
          type: 'text' | 'system'
          content: string
          read: boolean
          created_at: string
        }
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at: string
        }
      }
    }
  }
}