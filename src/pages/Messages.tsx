import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { Card, EmptyState } from '../components/ui'
import type { Message } from '../types'

export function Messages() {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    if (!user) return
    loadMessages()
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, () => loadMessages())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  const loadMessages = async () => {
    if (!user) return
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) {
      setMessages(data as Message[])
    }
  }

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return '刚刚'
    if (mins < 60) return `${mins}分钟前`
    if (mins < 1440) return `${Math.floor(mins / 60)}小时前`
    return `${Math.floor(mins / 1440)}天前`
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      <div className="sticky top-0 bg-bg z-10 py-4">
        <h1 className="text-[22px] font-bold">消息</h1>
      </div>

      {messages.length === 0 ? (
        <EmptyState icon="💬" title="暂无消息" desc="当你加入路线或司机认领后，消息会出现在这里" />
      ) : (
        <Card className="!p-0">
          {messages.filter(m => m.type === 'system').slice(0, 5).map(msg => (
            <div key={msg.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-divider last:border-b-0">
              <div className="w-10 h-10 rounded-full bg-[#E3F2FD] flex items-center justify-center text-lg shrink-0">
                {msg.read ? '📋' : '🔔'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">系统通知</div>
                <div className="text-[13px] text-text2 truncate">{msg.content}</div>
              </div>
              <div className="text-xs text-text3 shrink-0">{timeAgo(msg.created_at)}</div>
            </div>
          ))}
          {messages.filter(m => m.type === 'text').slice(0, 5).map(msg => (
            <div key={msg.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-divider last:border-b-0">
              <div className="w-10 h-10 rounded-full bg-red-light flex items-center justify-center text-lg shrink-0">
                🚐
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{msg.sender_name || '用户'}</div>
                <div className="text-[13px] text-text2 truncate">{msg.content}</div>
              </div>
              <div className="text-xs text-text3 shrink-0">{timeAgo(msg.created_at)}</div>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}