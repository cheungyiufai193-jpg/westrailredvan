import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, EmptyState } from '../components/ui'
import { MapView } from '../components/ui/MapView'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'

export function TripTracker() {
  const { user } = useAuthStore()
  const { currentRoute, showToast } = useAppStore()
  const [driver, setDriver] = useState<any>(null)

  useEffect(() => {
    loadTrip()
  }, [currentRoute?.id])

  const loadTrip = async () => {
    if (!currentRoute) return
    if (currentRoute.claimed_by) {
      const { data: driverData } = await supabase
        .from('users')
        .select('*, driver_profiles(*)')
        .eq('id', currentRoute.claimed_by)
        .single()
      setDriver(driverData)
    }
  }

  const handleCancel = async () => {
    if (!currentRoute || !user) return
    if (currentRoute.creator_id !== user.id) {
      showToast('只有路线发起人才能取消')
      return
    }
    await supabase.from('routes').update({ status: 'cancelled' }).eq('id', currentRoute.id)
    showToast('路线已取消')
  }

  if (!currentRoute) {
    return (
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <EmptyState icon="🚐" title="暂无行程" desc="发起或加入一条路线开始你的旅程" />
      </div>
    )
  }

  const statusSteps = [
    { label: '路线已发布', done: true, time: new Date(currentRoute.created_at).toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' }) },
    { label: currentRoute.claimed_by ? '司机已认领' : '等待司机认领', done: !!currentRoute.claimed_by, time: currentRoute.claimed_by ? '已认领' : '等待中' },
    { label: '等待上车', done: currentRoute.status === 'in_progress', time: currentRoute.status === 'in_progress' ? '司机已出发' : '等待中' },
  ]

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      <div className="sticky top-0 bg-bg z-10 py-4 flex justify-between items-center">
        <h1 className="text-[22px] font-bold">行程追踪</h1>
        <button className="text-[15px] text-red font-medium" onClick={handleCancel}>取消行程</button>
      </div>

      {currentRoute.claimed_by && driver && (
        <Card className="bg-gradient-to-br from-red to-red-dark text-white !p-5">
          <div className="text-[13px] opacity-80 mb-1">司机已认领</div>
          <div className="text-2xl font-bold mb-3">
            {currentRoute.status === 'in_progress' ? '司机正在赶来' : '等待司机出发'}
          </div>
          <div className="flex items-center gap-3 bg-white/15 rounded-xl p-3">
            <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center text-xl">🚐</div>
            <div className="flex-1">
              <div className="font-semibold">{driver.name || '司机'}</div>
              <div className="text-[13px] opacity-70">
                车牌：{driver.driver_profiles?.vehicle_plate || '待更新'} · {driver.driver_profiles?.vehicle_model || '丰田 Coaster'}
              </div>
            </div>
            <div className="text-sm">⭐ {driver.rating || '5.0'}</div>
          </div>
        </Card>
      )}

      <div className="h-40 rounded-2xl overflow-hidden my-4">
        <MapView
          center={[currentRoute.pickup_lat, currentRoute.pickup_lng]}
          zoom={14}
          markerPosition={[currentRoute.pickup_lat, currentRoute.pickup_lng]}
          markerLabel="上车点"
        />
      </div>

      <Card>
        {statusSteps.map((step, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-3.5 h-3.5 rounded-full ${step.done ? 'bg-green' : i === statusSteps.findIndex(s => !s.done) ? 'bg-red shadow-[0_0_0_4px_rgba(229,57,53,0.2)]' : 'bg-divider'}`} />
              {i < statusSteps.length - 1 && <div className={`w-0.5 h-8 ${step.done ? 'bg-green' : 'bg-divider'}`} />}
            </div>
            <div className="pb-4">
              <div className={`text-sm font-semibold ${step.done ? 'text-green' : 'text-text'}`}>{step.label}</div>
              <div className="text-xs text-text2">{step.time}</div>
            </div>
          </div>
        ))}
      </Card>

      <div className="flex gap-3 mt-3">
        <Button variant="secondary" onClick={() => showToast('已联系司机')}>💬 联系司机</Button>
        <Button onClick={() => showToast('确认上车')}>✅ 确认上车</Button>
      </div>
    </div>
  )
}