import { useState, useCallback } from 'react'
import { Button, Input } from '../components/ui'
import { MapView } from '../components/ui/MapView'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import { supabase } from '../lib/supabase'

export function CreateRoute() {
  const { user } = useAuthStore()
  const { showToast, setPassengerPage } = useAppStore()
  const [pickup, setPickup] = useState({ name: '屯门市中心', lat: 22.392, lng: 113.975 })
  const [dropoff, setDropoff] = useState({ name: '旺角', lat: 22.319, lng: 114.169 })
  const [selectingPickup, setSelectingPickup] = useState(true)
  const [passengers, setPassengers] = useState(1)
  const [preferredTime, setPreferredTime] = useState('now')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (selectingPickup) {
      setPickup({ ...pickup, lat, lng })
    } else {
      setDropoff({ ...dropoff, lat, lng })
    }
  }, [selectingPickup, pickup, dropoff])

  const handlePublish = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { error } = await supabase.from('routes').insert({
        type: 'passenger',
        creator_id: user.id,
        pickup_name: pickup.name,
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        pickup_address: pickup.name,
        dropoff_name: dropoff.name,
        dropoff_lat: dropoff.lat,
        dropoff_lng: dropoff.lng,
        dropoff_address: dropoff.name,
        passenger_count: 1,
        max_passengers: passengers,
        preferred_time: preferredTime === 'now' ? new Date().toISOString() : new Date(Date.now() + 3600000).toISOString(),
        notes,
        status: 'open',
      }).select()

      if (error) throw error
      showToast('🚀 路线已发布！等待司机认领...')
      setPassengerPage('trip')
    } catch (e: any) {
      showToast('发布失败：' + e.message)
    }
    setLoading(false)
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      <div className="sticky top-0 bg-bg z-10 py-4 flex justify-between items-center">
        <h1 className="text-[22px] font-bold">发起路线</h1>
        <button className="text-[15px] text-cyan font-medium" onClick={() => setPassengerPage('home')}>取消</button>
      </div>

      <div className="mb-4">
        <label className="block text-[13px] font-semibold text-text2 mb-1.5">
          {selectingPickup ? '📍 选择上车点（点击地图）' : '📍 选择目的地（点击地图）'}
        </label>
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setSelectingPickup(true)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${selectingPickup ? 'bg-red text-white' : 'bg-surface text-text2 border border-divider'}`}
          >
            上车点：{pickup.name}
          </button>
          <button
            onClick={() => setSelectingPickup(false)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${!selectingPickup ? 'bg-red text-white' : 'bg-surface text-text2 border border-divider'}`}
          >
            目的地：{dropoff.name}
          </button>
        </div>
        <div className="h-40 rounded-2xl overflow-hidden">
          <MapView
            onMapClick={handleMapClick}
            markerPosition={selectingPickup ? [pickup.lat, pickup.lng] : [dropoff.lat, dropoff.lng]}
            markerLabel={selectingPickup ? '上车点' : '目的地'}
            zoom={12}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-[13px] font-semibold text-text2 mb-1.5">乘车人数</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(n => (
            <button
              key={n}
              onClick={() => setPassengers(n)}
              className={`w-11 h-11 rounded-full text-base font-semibold transition-colors ${
                passengers === n ? 'bg-red text-white' : 'bg-surface border border-divider text-text'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-[13px] font-semibold text-text2 mb-1.5">期望出发时间</label>
        <div className="flex gap-2 flex-wrap">
          {['now', '15min', '30min', '1hour'].map(t => (
            <button
              key={t}
              onClick={() => setPreferredTime(t)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                preferredTime === t ? 'bg-red text-white' : 'bg-surface border border-divider text-text'
              }`}
            >
              {t === 'now' ? '现在' : t === '15min' ? '15分钟后' : t === '30min' ? '30分钟后' : '1小时后'}
            </button>
          ))}
        </div>
      </div>

      <Input
        label="备注（选填）"
        value={notes}
        onChange={setNotes}
        placeholder="例如：有大件行李、需要儿童座椅..."
      />

      <Button onClick={handlePublish} disabled={loading}>
        {loading ? '发布中...' : '🚀 发布路线，等待司机认领'}
      </Button>
      <p className="text-center text-xs text-text3 mt-2">
        发布后路线将进入路线广场，附近司机可浏览并认领
      </p>
    </div>
  )
}