import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Badge, Button, LoadingSpinner, EmptyState } from '../components/ui'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import type { Route } from '../types'

export function DriverHome() {
  const { user, driverProfile } = useAuthStore()
  const { showToast, setDriverPage } = useAppStore()
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRoutes()
    const channel = supabase
      .channel('driver-routes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'routes' }, () => loadRoutes())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const loadRoutes = async () => {
    const { data } = await supabase
      .from('routes')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setRoutes(data as Route[])
    setLoading(false)
  }

  const handleClaim = async (route: Route) => {
    if (!user || !driverProfile) return
    if (!driverProfile.verified) {
      showToast('请等待管理员审核通过后再接单')
      return
    }
    const { error } = await supabase
      .from('routes')
      .update({ claimed_by: user.id, status: 'claimed', updated_at: new Date().toISOString() })
      .eq('id', route.id)
    
    if (error) {
      showToast('认领失败：' + error.message)
      return
    }

    // 创建行程
    const { error: tripError } = await supabase.from('trips').insert({
      route_id: route.id,
      driver_id: user.id,
      status: 'pending',
    })
    if (tripError) {
      showToast('创建行程失败：' + tripError.message)
      return
    }

    showToast('🚀 路线已认领！前往接乘客')
    setDriverPage('active')
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
      {/* 状态切换 */}
      <Card className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-3.5 h-3.5 rounded-full ${driverProfile?.status === 'online' ? 'bg-green shadow-[0_0_8px_rgba(67,160,71,0.5)]' : 'bg-text3'}`} />
          <span className="text-base font-semibold">{driverProfile?.status === 'online' ? '营业中' : '已收工'}</span>
        </div>
        <button
          onClick={() => {/* toggle status */}}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
            driverProfile?.status === 'online' ? 'bg-red text-white' : 'bg-[#E8F5E9] text-green'
          }`}
        >
          {driverProfile?.status === 'online' ? '收工' : '开工'}
        </button>
      </Card>

      <div className="flex gap-2 overflow-x-auto py-3">
        {['全部', '屯门', '元朗', '旺角', '尖沙咀', '即将出发'].map(f => (
          <button key={f} className="px-4 py-2 rounded-full bg-surface border border-divider text-sm text-text2 font-medium whitespace-nowrap">
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : routes.length === 0 ? (
        <EmptyState icon="🗺️" title="暂无待认领路线" desc="目前没有乘客发起的新路线" />
      ) : (
        routes.map((route) => (
          <Card key={route.id} className="border-l-4 border-red">
            <div className="flex justify-between items-start mb-3">
              <Badge variant="new">🆕 新发布</Badge>
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
              <span>⏰ {route.preferred_time ? new Date(route.preferred_time).toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' }) : '随时出发'}</span>
            </div>
            <Button size="sm" onClick={() => handleClaim(route)}>
              🚀 认领这条路线
            </Button>
          </Card>
        ))
      )}
    </div>
  )
}