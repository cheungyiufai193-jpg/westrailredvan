import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, Badge, LoadingSpinner, EmptyState } from '../components/ui'
import { useAppStore } from '../stores/appStore'
import type { User, DriverProfile } from '../types'

export function AdminPanel() {
  const { showToast } = useAppStore()
  const [tab, setTab] = useState<'dashboard' | 'drivers' | 'blacklist'>('dashboard')
  const [pendingDrivers, setPendingDrivers] = useState<(User & { driver_profiles: DriverProfile })[]>([])
  const [stats, setStats] = useState({ onlineDrivers: 0, activeRoutes: 0, todayTrips: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [tab])

  const loadData = async () => {
    setLoading(true)
    // 统计数据
    const { count: onlineCount } = await supabase.from('driver_profiles').select('*', { count: 'exact', head: true }).eq('status', 'online')
    const { count: routeCount } = await supabase.from('routes').select('*', { count: 'exact', head: true }).eq('status', 'open')
    setStats({ onlineDrivers: onlineCount || 0, activeRoutes: routeCount || 0, todayTrips: 0 })

    // 待审核司机
    const { data: drivers } = await supabase
      .from('users')
      .select('*, driver_profiles(*)')
      .eq('role', 'driver')
      .eq('driver_profiles.verified', false)
    if (drivers) setPendingDrivers(drivers as any)

    setLoading(false)
  }

  const handleApprove = async (driverId: string) => {
    await supabase.from('driver_profiles').update({ verified: true }).eq('user_id', driverId)
    showToast('✅ 司机已审核通过')
    loadData()
  }

  const handleReject = async (_driverId: string) => {
    showToast('已拒绝该司机')
  }

  const tabs = [
    { key: 'dashboard' as const, label: '数据看板', icon: '📊' },
    { key: 'drivers' as const, label: '司机审核', icon: '👨‍✈️' },
    { key: 'blacklist' as const, label: '黑名单', icon: '🚫' },
  ]

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      <div className="sticky top-0 bg-bg z-10 py-4">
        <h1 className="text-[22px] font-bold mb-3">管理后台</h1>
        <div className="flex gap-2">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                tab === t.key ? 'bg-red text-white' : 'bg-surface text-text2 border border-divider'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'dashboard' && (
        <div>
          <Card>
            <div className="flex justify-around text-center py-2">
              <div>
                <div className="text-2xl font-bold text-green">{stats.onlineDrivers}</div>
                <div className="text-xs text-text2">在线司机</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red">{stats.activeRoutes}</div>
                <div className="text-xs text-text2">活跃路线</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-cyan">{stats.todayTrips}</div>
                <div className="text-xs text-text2">今日行程</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'drivers' && (
        loading ? <LoadingSpinner /> : pendingDrivers.length === 0 ? (
          <EmptyState icon="✅" title="没有待审核的司机" desc="所有司机已审核" />
        ) : (
          pendingDrivers.map(d => (
            <Card key={d.id}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-semibold">{d.name || '司机'}</div>
                  <div className="text-xs text-text2">{d.phone}</div>
                </div>
                <Badge variant="pending">待审核</Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleApprove(d.id)}>✅ 批准</Button>
                <Button size="sm" variant="danger" onClick={() => handleReject(d.id)}>❌ 拒绝</Button>
              </div>
            </Card>
          ))
        )
      )}

      {tab === 'blacklist' && (
        <EmptyState icon="🚫" title="黑名单管理" desc="暂无被封禁用户" />
      )}
    </div>
  )
}