export interface User {
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

export interface DriverProfile {
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

export interface Route {
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
  creator_name?: string
  creator_phone?: string
  driver_name?: string
  driver_plate?: string
  driver_rating?: number
}

export interface Trip {
  id: string
  route_id: string
  driver_id: string
  status: 'pending' | 'picking_up' | 'en_route' | 'completed' | 'cancelled'
  started_at: string | null
  completed_at: string | null
  created_at: string
  route?: Route
  passengers?: TripPassenger[]
}

export interface TripPassenger {
  id: string
  trip_id: string
  user_id: string
  status: 'waiting' | 'picked_up' | 'completed' | 'no_show'
  joined_at: string
  picked_up_at: string | null
  user_name?: string
  user_phone?: string
}

export interface Message {
  id: string
  trip_id: string | null
  sender_id: string
  receiver_id: string | null
  type: 'text' | 'system'
  content: string
  read: boolean
  created_at: string
  sender_name?: string
}

export type AppPage = 'home' | 'explore' | 'create' | 'trip' | 'messages' | 'profile'

export type DriverPage = 'explore' | 'active' | 'publish' | 'messages' | 'profile'

export type AdminPage = 'dashboard' | 'drivers' | 'blacklist'