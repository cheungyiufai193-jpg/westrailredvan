import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button } from '../components/ui'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'

export function DriverProfile() {
  const { user, driverProfile, signOut, refreshDriverProfile } = useAuthStore()
  const { showToast } = useAppStore()
  const [stats, setStats] = useState({ trips: 0, passengers: 0, earnings: 0 })

  useEffect(() => {
    if (!user) return
    loadStats()
  }, [user])

  const loadStats = async () => {
    if (!user) return
    const { count } = await supabase
      .from('trips')
      .select('*', { count: 'exact', head: true })
      .eq('driver_id', user.id)
    setStats({ trips: driverProfile?.today_trips || count || 0, passengers: driverProfile?.today_passengers || 0, earnings: 0 })
  }

  const toggleStatus = async () => {
    if (!user || !driverProfile) return
    const newStatus = driverProfile.status === 'online' ? 'offline' : 'online'
    await supabase.from('driver_profiles').update({ status: newStatus }).eq('user_id', user.id)
    await refreshDriverProfile()
    showToast(newStatus === 'online' ? '✅ 已恢复营业' : '🛑 已收工')
  }

  const handleLogout = async () => {
    await signOut()
    showToast('已退出登录')
  }

  if (!user) return null

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      <Card className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-3.5 h-3.5 rounded-full ${driverProfile?.status === 'online' ? 'bg-green shadow-[0_0_8px_rgba(67,160,71,0.5)]' : 'bg-text3'}`} />
          <span className="text-base font-semibold">{driverProfile?.status === 'online' ? '营业中' : '已收工'}</span>
        </div>
        <button
          onClick={toggleStatus}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
            driverProfile?.status === 'online' ? 'bg-red text-white' : 'bg-[#E8F5E9] text-green'
          }`}
        >
          {driverProfile?.status === 'online' ? '收工' : '开工'}
        </button>
      </Card>

      <div className="flex items-center gap-3 py-4">
        <div className="w-14 h-14 rounded-full bg-red-light flex items-center justify-center text-2xl">🚐</div>
        <div>
          <div className="text-lg font-bold">{user.name || '司机'}</div>
          <div className="text-[13px] text-text2">
            车牌 {driverProfile?.vehicle_plate || '待更新'} · {driverProfile?.vehicle_model || '丰田 Coaster'} · {driverProfile?.total_seats || 16}座
          </div>
          <div className="text-[13px] text-amber">⭐ {user.rating || '5.0'} · 累计 {stats.trips} 单</div>
        </div>
      </div>

      <Card>
        <div className="flex justify-around text-center py-2">
          <div>
            <div className="text-[22px] font-bold text-red">{stats.trips}</div>
            <div className="text-xs text-text2">今日接单</div>
          </div>
          <div>
            <div className="text-[22px] font-bold text-amber">{stats.passengers}</div>
            <div className="text-xs text-text2">今日载客</div>
          </div>
          <div>
            <div className="text-[22px] font-bold text-cyan">{stats.earnings}</div>
            <div className="text-xs text-text2">今日收入</div>
          </div>
        </div>
      </Card>

      <Card className="!p-0 mt-3">
        <MenuItem icon="📋" label="历史行程" />
        <MenuItem icon="🚐" label="车辆信息" />
        <MenuItem icon="💰" label="收入明细" hint="即将推出" />
        <MenuItem icon="⚙️" label="设置" />
        <MenuItem icon="❓" label="帮助" />
      </Card>

      <Card className="mt-3 !bg-[#FFF8E1] text-center">
        <div className="text-2xl mb-2">☕</div>
        <div className="text-sm font-semibold text-text mb-1">如果這個app好用就請大輝飲杯咖啡啦</div>
        <div className="text-xs text-text2 mb-3">同埋請支持開發者</div>
        <div className="bg-white rounded-xl p-3 text-left">
          <div className="text-xs text-text2 mb-1">轉數快 FPS</div>
          <div className="text-lg font-bold text-red mb-2">122891914</div>
          <div className="text-[11px] text-text3">收款人：大輝</div>
        </div>
      </Card>

      <div className="mt-4 mb-6">
        <Button variant="secondary" onClick={handleLogout}>退出登录</Button>
      </div>
    </div>
  )
}

function MenuItem({ icon, label, hint }: { icon: string; label: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-divider last:border-b-0 cursor-pointer hover:bg-bg/50">
      <div className="flex items-center gap-3">
        <span>{icon}</span>
        <span className="text-[15px]">{label}</span>
      </div>
      <span className="text-sm text-text3">{hint || '›'}</span>
    </div>
  )
}