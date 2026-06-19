import { create } from 'zustand'
import type { AppPage, DriverPage, Route, Trip } from '../types'

interface AppState {
  // 乘客端
  passengerPage: AppPage
  setPassengerPage: (page: AppPage) => void
  // 司机端
  driverPage: DriverPage
  setDriverPage: (page: DriverPage) => void
  // 全局
  toast: string | null
  showToast: (msg: string) => void
  // 当前行程
  currentTrip: Trip | null
  setCurrentTrip: (trip: Trip | null) => void
  // 当前路线
  currentRoute: Route | null
  setCurrentRoute: (route: Route | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  passengerPage: 'home',
  setPassengerPage: (page) => set({ passengerPage: page }),
  driverPage: 'explore',
  setDriverPage: (page) => set({ driverPage: page }),
  toast: null,
  showToast: (msg) => {
    set({ toast: msg })
    setTimeout(() => set({ toast: null }), 3000)
  },
  currentTrip: null,
  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  currentRoute: null,
  setCurrentRoute: (route) => set({ currentRoute: route }),
}))