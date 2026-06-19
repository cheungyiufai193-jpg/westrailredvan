import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, LoadingSpinner } from '../components/ui'
import { MapView } from '../components/ui/MapView'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import type { TripPassenger } from '../types'

export function DriverActive() {
  const { user, driverProfile } = useAuthStore()
  const { showToast } = useAppStore()
  const [activeTrip, setActiveTrip] = useState<any>(null)
  const [passengers, setPassengers] = useState<TripPassenger[]>([])
  const [remainingSeats, setRemainingSeats] = useState(driverProfile?.total_seats || 16)
  const [loading, setLoading] = useState(true)
  const [driverPos, setDriverPos] = useState<[number, number]>([22.37, 114.12])

  // 获取当前位置
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setDriverPos([pos.coords.latitude, pos.coords.longitude]),
        () => {},
        { enableHighAccuracy: true }
      )
    }
  }, [])

  useEffect(() => {
    if (!user) return
    loadActiveTrip()
    const channel = supabase
      .channel('driver-active')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_passengers' }, () => loadActiveTrip())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  const loadActiveTrip = async () => {
    if (!user) return
    const { data: trips } = await supabase
      .from('trips')
      .select('*, routes(*)')
      .eq('driver_id', user.id)
      .in('status', ['pending', 'picking_up', 'en_route'])
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (trips && trips.length > 0) {
      setActiveTrip(trips[0])
      const { data: pax } = await supabase
        .from('trip_passengers')
        .select('*')
        .eq('trip_id', trips[0].id)
      if (pax) {
        setPassengers(pax as TripPassenger[])
        const pickedUp = pax.filter((p: any) => p.status === 'picked_up').length
        setRemainingSeats((driverProfile?.total_seats || 16) - pickedUp)
      }
    }
    setLoading(false)
  }

  const handleCheckIn = async (pax: TripPassenger) => {
    await supabase
      .from('trip_passengers')
      .update({ status: 'picked_up', picked_up_at: new Date().toISOString() })
      .eq('id', pax.id)
    showToast('✅ 乘客已确认上车')
    loadActiveTrip()
  }

  const handleDepart = async () => {
    if (!activeTrip) return
    await supabase.from('trips').update({ status: 'en_route', started_at: new Date().toISOString() }).eq('id', activeTrip.id)
    await supabase.from('routes').update({ status: 'in_progress' }).eq('id', activeTrip.route_id)
    showToast('🚀 已出发！')
    loadActiveTrip()
  }

  const handleComplete = async () => {
    if (!activeTrip) return
    await supabase.from('trips').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', activeTrip.id)
    await supabase.from('routes').update({ status: 'completed' }).eq('id', activeTrip.route_id)
    showToast('✅ 行程已完成！')
    loadActiveTrip()
  }

  // 长按归零
  const resetTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const [resetProgress, setResetProgress] = useState(0)

  const startReset = useCallback(() => {
    resetTimer.current = setInterval(() => {
      setResetProgress(prev => {
        if (prev >= 100) {
          clearInterval(resetTimer.current!)
          showToast('🔄 座位已全部归零')
          return 0
        }
        return prev + 5
      })
    }, 100)
  }, [])

  const cancelReset = useCallback(() => {
    if (resetTimer.current) {
      clearInterval(resetTimer.current)
      resetTimer.current = null
    }
    if (resetProgress < 100) setResetProgress(0)
  }, [resetProgress])

  if (loading) return <LoadingSpinner />
  if (!activeTrip) {
    return (
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="text-center py-10">
          <div className="text-5xl mb-4">🚐</div>
          <div className="text-lg font-semibold mb-2">暂无进行中的行程</div>
          <div className="text-sm text-text2">去路线广场认领路线或发布空车吧</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      <Card className="bg-gradient-to-br from-red to-red-dark text-white !p-5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-3.5 h-3.5 rounded-full bg-orange shadow-[0_0_8px_rgba(251,140,0,0.5)]" />
          <span className="text-base font-semibold">行程中</span>
        </div>
        <div className="text-sm opacity-80">
          {activeTrip.routes?.pickup_name} → {activeTrip.routes?.dropoff_name}
        </div>
      </Card>

      {/* 座位数 */}
      <Card className="text-center !py-5">
        <div className="text-5xl font-extrabold text-red">{remainingSeats}</div>
        <div className="text-sm text-text2 mt-1">剩余空位 / 总座位 {driverProfile?.total_seats || 16}</div>
      </Card>

      <div className="h-32 rounded-2xl overflow-hidden mb-3">
        <MapView center={driverPos} zoom={14} markerPosition={driverPos} markerLabel="你的位置" />
      </div>

      {/* 乘客列表 */}
      <Card>
        <div className="flex justify-between items-center mb-3">
          <span className="text-base font-bold">乘客列表 ({passengers.length})</span>
          <span className="text-[13px] text-text2">
            需核销 {passengers.filter(p => p.status === 'waiting').length} 人
          </span>
        </div>
        {passengers.map(pax => (
          <div key={pax.id} className="flex items-center gap-3 py-3 border-b border-divider last:border-b-0">
            <div className="w-10 h-10 rounded-full bg-red-light flex items-center justify-center text-base shrink-0">👤</div>
            <div className="flex-1">
              <div className="text-sm font-semibold">乘客</div>
              <div className="text-xs text-text2">{pax.status === 'waiting' ? '等待上车' : pax.status === 'picked_up' ? '已上车' : '已完成'}</div>
            </div>
            <button
              onClick={() => handleCheckIn(pax)}
              className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-base transition-colors ${
                pax.status === 'picked_up' ? 'bg-green border-green text-white' : 'border-divider bg-white'
              }`}
            >
              ✓
            </button>
          </div>
        ))}
      </Card>

      <div className="flex gap-3 mt-3">
        <Button variant="secondary" onClick={handleDepart}>🚀 出发</Button>
        <Button variant="primary" onClick={handleComplete}>✅ 完成行程</Button>
      </div>

      {/* 长按归零 */}
      <Card className="mt-3">
        <div className="text-sm font-semibold text-text2 mb-2">长按归零（到站后重置座位）</div>
        <div
          className="w-full h-12 bg-bg rounded-xl overflow-hidden relative cursor-pointer select-none"
          onMouseDown={startReset}
          onMouseUp={cancelReset}
          onMouseLeave={cancelReset}
          onTouchStart={startReset}
          onTouchEnd={cancelReset}
        >
          <div
            className="h-full bg-gradient-to-r from-red to-red-dark rounded-xl transition-[width] duration-100"
            style={{ width: `${resetProgress}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">
            {resetProgress >= 100 ? '✅ 归零完成' : resetProgress > 0 ? '长按中...' : '长按 2 秒归零'}
          </div>
        </div>
      </Card>
    </div>
  )
}