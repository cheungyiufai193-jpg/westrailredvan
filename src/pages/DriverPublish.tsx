import { useState, useCallback } from 'react'
import { Button, Input } from '../components/ui'
import { MapView } from '../components/ui/MapView'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import { supabase } from '../lib/supabase'

export function DriverPublish() {
  const { user } = useAuthStore()
  const { showToast } = useAppStore()
  const [pickup, setPickup] = useState({ name: '屯门市中心', lat: 22.392, lng: 113.975 })
  const [dropoff, setDropoff] = useState({ name: '旺角', lat: 22.319, lng: 114.169 })
  const [selectingPickup, setSelectingPickup] = useState(true)
  const [seats, setSeats] = useState(4)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (selectingPickup) {
      setPickup(p => ({ ...p, lat, lng }))
    } else {
      setDropoff(d => ({ ...d, lat, lng }))
    }
  }, [selectingPickup])

  const handlePublish = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { error } = await supabase.from('routes').insert({
        type: 'driver',
        creator_id: user.id,
        pickup_name: pickup.name,
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        pickup_address: pickup.name,
        dropoff_name: dropoff.name,
        dropoff_lat: dropoff.lat,
        dropoff_lng: dropoff.lng,
        dropoff_address: dropoff.name,
        passenger_count: 0,
        max_passengers: seats,
        notes,
        status: 'open',
        claimed_by: user.id,
      })
      if (error) throw error
      showToast('🚐 空车路线已发布！乘客可加入你的路线')
    } catch (e: any) {
      showToast('发布失败：' + e.message)
    }
    setLoading(false)
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      <div className="sticky top-0 bg-bg z-10 py-4">
        <h1 className="text-[22px] font-bold">发布空车路线</h1>
      </div>

      <div className="bg-[#FFF3E0] border border-[#FFE0B2] rounded-xl p-3 mb-4">
        <div className="text-[13px] text-orange">💡 发布空车路线后，乘客可浏览并加入你的路线</div>
      </div>

      <div className="mb-4">
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setSelectingPickup(true)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${selectingPickup ? 'bg-red text-white' : 'bg-surface text-text2 border border-divider'}`}
          >
            起点：{pickup.name}
          </button>
          <button
            onClick={() => setSelectingPickup(false)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${!selectingPickup ? 'bg-red text-white' : 'bg-surface text-text2 border border-divider'}`}
          >
            终点：{dropoff.name}
          </button>
        </div>
        <div className="h-32 rounded-2xl overflow-hidden">
          <MapView
            onMapClick={handleMapClick}
            markerPosition={selectingPickup ? [pickup.lat, pickup.lng] : [dropoff.lat, dropoff.lng]}
            zoom={12}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-[13px] font-semibold text-text2 mb-1.5">空位数</label>
        <div className="flex gap-2">
          {[4, 8, 12, 16].map(n => (
            <button
              key={n}
              onClick={() => setSeats(n)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                seats === n ? 'bg-red text-white' : 'bg-surface border border-divider text-text'
              }`}
            >
              {n}位
            </button>
          ))}
        </div>
      </div>

      <Input
        label="备注（选填）"
        value={notes}
        onChange={setNotes}
        placeholder="例如：经停荃湾、可载大件行李..."
      />

      <Button onClick={handlePublish} disabled={loading}>
        {loading ? '发布中...' : '🚐 发布空车路线'}
      </Button>
    </div>
  )
}