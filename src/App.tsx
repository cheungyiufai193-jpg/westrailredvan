import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { useAuthStore } from './stores/authStore'
import { useAppStore } from './stores/appStore'
import { Login } from './pages/Login'
import { Home } from './pages/Home'
import { Explore } from './pages/Explore'
import { CreateRoute } from './pages/CreateRoute'
import { TripTracker } from './pages/Trip'
import { Messages } from './pages/Messages'
import { Profile } from './pages/Profile'
import { DriverHome } from './pages/DriverHome'
import { DriverActive } from './pages/DriverActive'
import { DriverPublish } from './pages/DriverPublish'
import { DriverProfile } from './pages/DriverProfile'
import { AdminPanel } from './pages/AdminPanel'
import { LoadingSpinner } from './components/ui'
import type { User } from './types'

export default function App() {
  const { user, setUser, setDriverProfile, loading } = useAuthStore()
  const { passengerPage, setPassengerPage, driverPage, setDriverPage, toast } = useAppStore()
  const [initializing, setInitializing] = useState(true)

  // 初始化 auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUser(session.user.id)
      } else {
        setInitializing(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUser(session.user.id)
      } else {
        setUser(null)
        setDriverProfile(null)
        setInitializing(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUser = async (userId: string) => {
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (userData) {
      setUser(userData as User)
      if (userData.role === 'driver') {
        const { data: profile } = await supabase
          .from('driver_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()
        if (profile) setDriverProfile(profile as any)
      }
    }
    setInitializing(false)
  }

  // 管理员隐藏入口：连续点击标题 5 次
  const [adminClicks, setAdminClicks] = useState(0)
  const [showAdmin, setShowAdmin] = useState(false)

  const handleAdminAccess = () => {
    if (user?.role === 'admin') {
      setShowAdmin(!showAdmin)
      return
    }
    const newClicks = adminClicks + 1
    setAdminClicks(newClicks)
    if (newClicks >= 5) {
      setShowAdmin(true)
      setAdminClicks(0)
    }
    setTimeout(() => {
      if (newClicks < 5) setAdminClicks(0)
    }, 2000)
  }

  if (initializing || loading) {
    return (
      <div className="h-full flex items-center justify-center bg-surface">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="h-full bg-surface">
        <BrandBar />
        <Login />
      </div>
    )
  }

  // 司机端
  if (user.role === 'driver') {
    return (
      <div className="h-full flex flex-col bg-bg">
        <BrandBar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {driverPage === 'explore' && <DriverHome />}
          {driverPage === 'active' && <DriverActive />}
          {driverPage === 'publish' && <DriverPublish />}
          {driverPage === 'messages' && <Messages />}
          {driverPage === 'profile' && <DriverProfile />}
        </div>
        <BottomNav
          items={[
            { key: 'explore', icon: '🗺️', label: '路线广场', badge: true },
            { key: 'active', icon: '🚐', label: '当前行程' },
            { key: 'publish', icon: '📢', label: '发布空车' },
            { key: 'messages', icon: '💬', label: '消息' },
            { key: 'profile', icon: '👤', label: '我的' },
          ]}
          active={driverPage}
          onChange={(key) => setDriverPage(key as any)}
        />
        {toast && <Toast message={toast} />}
      </div>
    )
  }

  // 管理员
  if (showAdmin) {
    return (
      <div className="h-full flex flex-col bg-bg">
        <BrandBar />
        <div className="flex-1 overflow-hidden">
          <AdminPanel />
        </div>
        <button
          className="absolute top-4 right-4 z-20 px-3 py-1.5 bg-surface rounded-lg text-sm shadow-sm"
          onClick={() => setShowAdmin(false)}
        >
          退出管理
        </button>
        {toast && <Toast message={toast} />}
      </div>
    )
  }

  // 乘客端
  return (
    <div className="h-full flex flex-col bg-bg">
      <BrandBar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {passengerPage === 'home' && <Home />}
        {passengerPage === 'explore' && <Explore />}
        {passengerPage === 'create' && <CreateRoute />}
        {passengerPage === 'trip' && <TripTracker />}
        {passengerPage === 'messages' && <Messages />}
        {passengerPage === 'profile' && <Profile />}
      </div>
      {/* FAB */}
      {passengerPage === 'home' && (
        <button
          onClick={() => setPassengerPage('create')}
          className="absolute bottom-24 right-5 w-14 h-14 rounded-full bg-red text-white text-[28px] flex items-center justify-center shadow-lg shadow-red/40 z-10 active:scale-90 transition-transform animate-pulse-ring"
        >
          ＋
        </button>
      )}
      <BottomNav
        items={[
          { key: 'home', icon: '🏠', label: '首页' },
          { key: 'explore', icon: '🗺️', label: '路线广场' },
          { key: 'create', icon: '➕', label: '发起' },
          { key: 'messages', icon: '💬', label: '消息', badge: true },
          { key: 'profile', icon: '👤', label: '我的' },
        ]}
        active={passengerPage}
        onChange={(key) => {
          setPassengerPage(key as any)
          if (key === 'home') handleAdminAccess()
        }}
      />
      {toast && <Toast message={toast} />}
    </div>
  )
}

function BrandBar() {
  return (
    <div className="bg-red text-white text-center py-2 px-4 safe-top shrink-0">
      <div className="text-lg font-bold tracking-wide">西鐵紅van通</div>
      <div className="text-[11px] opacity-90">浚鍵管理有限公司</div>
      <div className="text-[10px] opacity-70">開發者-大輝</div>
    </div>
  )
}

function BottomNav({ items, active, onChange }: {
  items: { key: string; icon: string; label: string; badge?: boolean }[]
  active: string
  onChange: (key: string) => void
}) {
  return (
    <nav className="h-20 bg-surface border-t border-divider flex justify-around items-start pt-2 safe-bottom">
      {items.map(item => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={`flex flex-col items-center gap-1 text-[10px] px-3 py-1 transition-colors relative ${
            active === item.key ? 'text-red' : 'text-text3'
          }`}
        >
          <span className="text-[22px]">{item.icon}</span>
          <span>{item.label}</span>
          {item.badge && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-red" />
          )}
        </button>
      ))}
    </nav>
  )
}

function Toast({ message }: { message: string }) {
  return (
    <div className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-text text-white px-6 py-3 rounded-2xl text-sm font-medium z-50 whitespace-nowrap animate-toast-in">
      {message}
    </div>
  )
}