import { useEffect, useState } from 'react'
import { useAppStore } from '../stores/appStore'
import { supabase } from '../lib/supabase'
import { Card, Badge, LoadingSpinner, EmptyState } from '../components/ui'
import { MapView } from '../components/ui/MapView'
import type { Route } from '../types'

export function Home() {
  const { setCurrentRoute, setPassengerPage } = useAppStore()
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRoutes()
    const channel = supabase
      .channel('routes-home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'routes' }, () => loadRoutes())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const loadRoutes = async () => {
    const { data } = await supabase
      .from('routes')
      .select('*')
      .in('status', ['open', 'claimed'])
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setRoutes(data as Route[])
    setLoading(false)
  }

  const handleRouteClick = (route: Route) => {
    setCurrentRoute(route)
    setPassengerPage('trip')
  }

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return '刚刚'
    if (mins < 60) return `${mins}分钟前`
    return `${Math.floor(mins / 60)}小时前`
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      <div className="sticky top-0 bg-bg z-10 py-4 flex justify-between items-center">
        <h1 className="text-[22px] font-bold">西鐵紅van通</h1>
        <button className="text-[15px] text-cyan font-medium" onClick={() => setPassengerPage('trip')}>
          当前行程
        </button>
      </div>

      <div className="h-48 rounded-2xl overflow-hidden mb-4">
        <MapView routes={routes} />
      </div>

      <h2 className="text-xl font-bold mb-3">🔥 附近活跃路线</h2>

      {loading ? (
        <LoadingSpinner />
      ) : routes.length === 0 ? (
        <EmptyState icon="🗺️" title="暂无活跃路线" desc="点击下方 + 按钮发起第一条路线吧！" />
      ) : (
        routes.map((route) => (
          <Card key={route.id} onClick={() => handleRouteClick(route)}>
            <div className="flex justify-between items-start mb-3">
              <Badge variant={route.status === 'open' ? 'active' : 'claimed'}>
                {route.status === 'open' ? '招募中' : '已认领'}
              </Badge>
              <span className="text-xs text-text3">{timeAgo(route.created_at)}</span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 rounded-full bg-green shrink-0" />
              <div className="flex-1 border-t-2 border-dashed border-divider relative">
                <span className="absolute right-0 -top-2 text-[10px] text-text3">▶</span>
              </div>
              <div className="w-3 h-3 rounded-full bg-red shrink-0" />
            </div>
            <div className="text-[15px] font-medium mb-2">
              {route.pickup_name} → {route.dropoff_name}
            </div>
            <div className="flex gap-4 text-[13px] text-text2">
              <span>👤 {route.passenger_count}人已加入</span>
              <span>⏰ {route.preferred_time ? formatTime(route.preferred_time) : '随时出发'}</span>
              {route.driver_name && <span>🚐 {route.driver_name}</span>}
            </div>
          </Card>
        ))
      )}
    </div>
  )
}