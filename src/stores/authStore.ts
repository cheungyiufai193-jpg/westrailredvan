import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User, DriverProfile } from '../types'

const APP_PASSWORD = 'pinvan2024'
const ADMIN_PASSWORD = 'Fai64989786'

interface AuthState {
  user: User | null
  driverProfile: DriverProfile | null
  loading: boolean
  error: string | null
  setUser: (user: User | null) => void
  setDriverProfile: (profile: DriverProfile | null) => void
  signIn: (phone: string, adminPassword?: string) => Promise<void>
  signInAsDriver: (phone: string) => Promise<void>
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

  signIn: async (phone: string, adminPassword?: string) => {
    set({ loading: true, error: null })
    
    const formattedPhone = phone.startsWith('+852') ? phone : `+852${phone}`
    const email = `852${phone.replace(/[^0-9]/g, '')}@pinvan.app`
    const isAdmin = !!adminPassword
    
    try {
      if (isAdmin) {
        if (adminPassword !== ADMIN_PASSWORD) {
          set({ error: '密碼錯誤', loading: false })
          throw new Error('密碼錯誤')
        }
      }

      const password = isAdmin ? ADMIN_PASSWORD : APP_PASSWORD

      let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        const { data: _signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (signUpError) {
          set({ error: signUpError.message, loading: false })
          throw signUpError
        }

        const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (retryError) {
          set({ error: retryError.message, loading: false })
          throw retryError
        }

        signInData = retryData
      }

      if (!signInData?.user) {
        set({ error: '登入失敗', loading: false })
        throw new Error('登入失敗')
      }

      const userId = signInData.user.id
      const role = isAdmin ? 'admin' : 'passenger'

      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      let user: User

      if (existingUser) {
        user = existingUser as User
        if (isAdmin) {
          await supabase.from('users').update({
            role: 'admin',
            phone: formattedPhone,
            updated_at: new Date().toISOString(),
          }).eq('id', user.id)
          user.role = 'admin'
        } else {
          await supabase.from('users').update({
            phone: formattedPhone,
            updated_at: new Date().toISOString(),
          }).eq('id', user.id)
        }
      } else {
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: userId,
            phone: formattedPhone,
            role,
            name: phone.slice(-4),
          })
          .select('*')
          .single()

        if (createError) {
          set({ error: createError.message, loading: false })
          throw createError
        }

        user = newUser as User
      }

      set({ user, loading: false, error: null })

      if (user.role === 'driver') {
        await get().refreshDriverProfile()
      }
    } catch (e: any) {
      set({ loading: false })
      throw e
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, driverProfile: null })
  },

  signInAsDriver: async (phone: string) => {
    set({ loading: true, error: null })
    
    const formattedPhone = phone.startsWith('+852') ? phone : `+852${phone}`
    const email = `852${phone.replace(/[^0-9]/g, '')}@pinvan.app`
    
    try {
      // 先嘗試登入
      let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: APP_PASSWORD,
      })

      if (signInError) {
        // 創建新用戶
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: APP_PASSWORD,
        })

        if (signUpError) {
          set({ error: signUpError.message, loading: false })
          throw signUpError
        }

        const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password: APP_PASSWORD,
        })

        if (retryError) {
          set({ error: retryError.message, loading: false })
          throw retryError
        }

        signInData = retryData
      }

      if (!signInData?.user) {
        set({ error: '登入失敗', loading: false })
        throw new Error('登入失敗')
      }

      const userId = signInData.user.id

      // 檢查是否已有用戶記錄
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      let user: User

      if (existingUser) {
        user = existingUser as User
        await supabase.from('users').update({
          phone: formattedPhone,
          updated_at: new Date().toISOString(),
        }).eq('id', user.id)
      } else {
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: userId,
            phone: formattedPhone,
            role: 'driver',
            name: `司機 ${phone.slice(-4)}`,
          })
          .select('*')
          .single()

        if (createError) {
          set({ error: createError.message, loading: false })
          throw createError
        }

        user = newUser as User

        // 創建司機檔案（未審核）
        await supabase.from('driver_profiles').insert({
          user_id: user.id,
          status: 'offline',
          total_seats: 16,
          verified: false,
        })
      }

      set({ user, loading: false, error: null })
      await get().refreshDriverProfile()
    } catch (e: any) {
      set({ loading: false })
      throw e
    }
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