import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button } from '../components/ui'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'

export function Profile() {
  const { user, signOut } = useAuthStore()
  const { showToast } = useAppStore()
  const [stats, setStats] = useState({ trips: 0, rating: 5.0, routes: 0 })

  useEffect(() => {
    if (!user) return
    loadStats()
  }, [user])

  const loadStats = async () => {
    if (!user) return
    const { count: tripCount } = await supabase
      .from('trip_passengers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    const { count: routeCount } = await supabase
      .from('routes')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', user.id)
    setStats({
      trips: tripCount || 0,
      rating: user.rating || 5.0,
      routes: routeCount || 0,
    })
  }

  const handleLogout = async () => {
    await signOut()
    showToast('已退出登录')
  }

  if (!user) return null

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      <div className="text-center py-6">
        <div className="w-[72px] h-[72px] rounded-full bg-red-light mx-auto mb-3 flex items-center justify-center text-3xl">
          {user.role === 'driver' ? '🚐' : '👤'}
        </div>
        <div className="text-lg font-bold">{user.name || '用户'}</div>
        <div className="text-[13px] text-text2">{user.phone}</div>
        <div className="flex justify-center gap-2 mt-2">
          <span className="px-2.5 py-1 rounded-full bg-red-light text-red text-xs font-semibold">
            {user.role === 'passenger' ? '乘客' : user.role === 'driver' ? '司机' : '管理员'}
          </span>
        </div>
      </div>

      <Card>
        <div className="flex justify-around text-center py-2">
          <div>
            <div className="text-[22px] font-bold text-red">{stats.trips}</div>
            <div className="text-xs text-text2">累计行程</div>
          </div>
          <div>
            <div className="text-[22px] font-bold text-amber">{stats.rating}</div>
            <div className="text-xs text-text2">评分</div>
          </div>
          <div>
            <div className="text-[22px] font-bold text-cyan">{stats.routes}</div>
            <div className="text-xs text-text2">发起路线</div>
          </div>
        </div>
      </Card>

      <Card className="!p-0 mt-3">
        <MenuItem icon="📋" label="乘车记录" />
        <MenuItem icon="⭐" label="常用路线" />
        <MenuItem icon="💳" label="支付方式" hint="即将推出" />
        <MenuItem icon="⚙️" label="设置" />
        <MenuItem icon="❓" label="帮助与反馈" />
        <MenuItem icon="ℹ️" label="关于西鐵紅van通" hint="v1.0" />
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