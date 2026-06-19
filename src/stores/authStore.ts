import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User, DriverProfile } from '../types'

interface AuthState {
  user: User | null
  driverProfile: DriverProfile | null
  loading: boolean
  error: string | null
  setUser: (user: User | null) => void
  setDriverProfile: (profile: DriverProfile | null) => void
  signIn: (phone: string) => Promise<void>
  verifyOtp: (phone: string, token: string, role: 'passenger' | 'driver') => Promise<void>
  signOut: () => Promise<void>
  refreshDriverProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  driverProfile: null,
  loading: true,
  error: null,

  setUser: (user) => set({ user }),
  setDriverProfile: (profile) => set({ driverProfile: profile }),

  signIn: async (phone: string) => {
    set({ loading: true, error: null })
    const formattedPhone = phone.startsWith('+852') ? phone : `+852${phone}`
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    })
    if (error) {
      set({ error: error.message, loading: false })
      throw error
    }
    set({ loading: false })
  },

  verifyOtp: async (phone: string, token: string, role: 'passenger' | 'driver') => {
    set({ loading: true, error: null })
    const formattedPhone = phone.startsWith('+852') ? phone : `+852${phone}`
    
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token,
      type: 'sms',
    })
    
    if (error) {
      set({ error: error.message, loading: false })
      throw error
    }

    if (!data.user) {
      set({ error: '验证失败', loading: false })
      throw new Error('验证失败')
    }

    // 创建或更新用户
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    let user: User

    if (existingUser) {
      user = existingUser as User
      if (user.role !== role) {
        await supabase.from('users').update({ role, updated_at: new Date().toISOString() }).eq('id', user.id)
        user.role = role
      }
    } else {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          phone: formattedPhone,
          role,
          name: role === 'driver' ? '司机' : `乘客 ${phone.slice(-4)}`,
        })
        .select('*')
        .single()
      
      if (createError) {
        set({ error: createError.message, loading: false })
        throw createError
      }
      user = newUser as User

      // 如果是司机，创建司机档案
      if (role === 'driver') {
        await supabase.from('driver_profiles').insert({
          user_id: user.id,
          status: 'offline',
          total_seats: 16,
        })
      }
    }

    set({ user, loading: false, error: null })

    // 如果是司机，加载司机档案
    if (role === 'driver') {
      await get().refreshDriverProfile()
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, driverProfile: null })
  },

  refreshDriverProfile: async () => {
    const { user } = get()
    if (!user || user.role !== 'driver') return
    
    const { data } = await supabase
      .from('driver_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (data) {
      set({ driverProfile: data as DriverProfile })
    }
  },
}))