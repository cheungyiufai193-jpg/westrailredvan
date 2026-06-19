import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Badge, Button, LoadingSpinner, EmptyState } from '../components/ui'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import type { Route } from '../types'

export function Explore() {
  const { user } = useAuthStore()
  const { showToast, setCurrentRoute, setPassengerPage } = useAppStore()
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('全部')

  useEffect(() => {
    loadRoutes()
    const channel = supabase
      .channel('routes-explore')
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
      .limit(50)
    if (data) setRoutes(data as Route[])
    setLoading(false)
  }

  const handleJoinRoute = async (route: Route) => {
    if (!user) return
    if (route.creator_id === user.id) {
      showToast('不能加入自己发起的路线')
      return
    }
    // 加入路线逻辑
    setCurrentRoute(route)
    setPassengerPage('trip')
    showToast('✅ 已加入路线，等待司机认领...')
  }

  const filters = ['全部', '屯门', '元朗', '旺角', '尖沙咀', '铜锣湾', '即将出发']
  const filteredRoutes = filter === '全部' ? routes : routes.filter(r => {
    if (filter === '即将出发') return true
    return r.pickup_name.includes(filter) || r.dropoff_name.includes(filter)
  })

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      <div className="sticky top-0 bg-bg z-10 py-4">
        <h1 className="text-[22px] font-bold mb-3">路线广场</h1>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
                filter === f ? 'bg-red text-white' : 'bg-surface border border-divider text-text2'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filteredRoutes.length === 0 ? (
        <EmptyState icon="🗺️" title="暂无路线" desc="还没有人发起路线，来做第一个吧！" />
      ) : (
        filteredRoutes.map((route) => (
          <Card key={route.id}>
            <div className="flex justify-between items-start mb-3">
              <Badge variant={route.status === 'open' ? 'active' : 'claimed'}>
                {route.status === 'open' ? `招募中 · 尚余${route.max_passengers - route.passenger_count}位` : '已认领'}
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
            <div className="flex gap-4 text-[13px] text-text2 mb-3">
              <span>👤 {route.passenger_count}人已加入</span>
              <span>⏰ {route.preferred_time ? formatTime(route.preferred_time) : '随时出发'}</span>
            </div>
            {route.status === 'open' && (
              <Button size="sm" onClick={() => handleJoinRoute(route)}>
                加入这条路线
              </Button>
            )}
          </Card>
        ))
      )}
    </div>
  )
}

function formatTime(ts: string) {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  return `${Math.floor(mins / 60)}小时前`
}