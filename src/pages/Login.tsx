import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { Button, Input, Card } from '../components/ui'

export function Login() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp' | 'role'>('phone')
  const [role, setRole] = useState<'passenger' | 'driver' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn, verifyOtp } = useAuthStore()

  const handleSendOtp = async () => {
    if (!/^[5-9]\d{7}$/.test(phone)) {
      setError('请输入有效的香港手机号码（8位数）')
      return
    }
    setLoading(true)
    setError('')
    try {
      await signIn(phone)
      setStep('otp')
    } catch (e: any) {
      setError(e.message || '发送验证码失败')
    }
    setLoading(false)
  }

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('请输入6位数验证码')
      return
    }
    setLoading(true)
    setError('')
    try {
      if (role) {
        await verifyOtp(phone, otp, role)
      }
    } catch (e: any) {
      setError(e.message || '验证失败')
    }
    setLoading(false)
  }

  return (
    <div className="flex-1 bg-surface flex flex-col items-center justify-center px-6 overflow-y-auto">
      <div className="w-full max-w-[320px] text-center">
        <div className="text-5xl mb-4">🚐</div>
        <h1 className="text-[28px] font-bold text-text mb-1">西鐵紅van通</h1>
        <p className="text-[15px] text-text2 mb-8">香港紅Van社區拼車平台</p>

        {step === 'phone' && (
          <div className="animate-fade-in-up">
            <Input
              label="手机号码"
              value={phone}
              onChange={setPhone}
              placeholder="请输入手机号码"
              prefix="+852"
              error={error}
            />
            <Button onClick={handleSendOtp} disabled={loading}>
              {loading ? '发送中...' : '获取验证码'}
            </Button>
          </div>
        )}

        {step === 'otp' && (
          <div className="animate-fade-in-up">
            <p className="text-sm text-text2 mb-4">验证码已发送至 +852 {phone}</p>
            <Input
              label="验证码"
              value={otp}
              onChange={setOtp}
              placeholder="请输入6位数验证码"
              type="text"
              error={error}
            />
            {!role ? (
              <>
                <p className="text-sm text-text2 mb-3">请选择你的身份</p>
                <div className="flex gap-3 mb-3">
                  <Card className="flex-1 text-center" onClick={() => setRole('passenger')}>
                    <div className="text-2xl mb-1">👤</div>
                    <div className={`text-sm font-semibold ${role === 'passenger' ? 'text-red' : 'text-text'}`}>我是乘客</div>
                  </Card>
                  <Card className="flex-1 text-center" onClick={() => setRole('driver')}>
                    <div className="text-2xl mb-1">🚐</div>
                    <div className={`text-sm font-semibold ${role === 'driver' ? 'text-red' : 'text-text'}`}>我是司机</div>
                  </Card>
                </div>
              </>
            ) : (
              <p className="text-sm text-green mb-3">已选择：{role === 'passenger' ? '乘客' : '司机'}</p>
            )}
            <Button onClick={handleVerifyOtp} disabled={loading || !role}>
              {loading ? '验证中...' : '登录'}
            </Button>
            <button className="mt-3 text-cyan text-sm cursor-pointer" onClick={() => setStep('phone')}>
              ← 重新输入手机号
            </button>
          </div>
        )}
      </div>
    </div>
  )
}