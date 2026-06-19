import { type ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  disabled?: boolean
  className?: string
}

export function Button({ children, onClick, variant = 'primary', size = 'md', fullWidth = true, disabled, className = '' }: ButtonProps) {
  const base = 'font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-red text-white hover:bg-red-dark',
    secondary: 'bg-transparent text-red border-1.5 border-red active:bg-red-light',
    danger: 'bg-transparent text-red border-1.5 border-red active:bg-red-light',
  }
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3.5 text-base',
    lg: 'px-8 py-4 text-lg',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  )
}

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`bg-surface rounded-2xl p-4 mb-3 shadow-sm ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  prefix,
  error,
}: {
  label?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  prefix?: string
  error?: string
}) {
  return (
    <div className="mb-4">
      {label && <label className="block text-[13px] font-semibold text-text2 mb-1.5">{label}</label>}
      <div className="flex gap-3">
        {prefix && (
          <div className="w-[72px] h-12 border-1.5 border-divider rounded-xl bg-bg flex items-center justify-center text-[15px] font-semibold text-text shrink-0">
            {prefix}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`flex-1 h-12 border-1.5 ${error ? 'border-red' : 'border-divider focus:border-red'} rounded-xl px-3.5 text-[15px] text-text bg-surface outline-none transition-colors placeholder:text-text3`}
        />
      </div>
      {error && <p className="text-red text-xs mt-1">{error}</p>}
    </div>
  )
}

export function Badge({ children, variant = 'active' }: { children: ReactNode; variant?: 'active' | 'pending' | 'claimed' | 'new' }) {
  const variants = {
    active: 'bg-[#E8F5E9] text-green',
    pending: 'bg-[#FFF3E0] text-orange',
    claimed: 'bg-[#E3F2FD] text-[#1E88E5]',
    new: 'bg-red-light text-red',
  }
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  )
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-3 border-red border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export function EmptyState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="text-center py-10 px-5">
      <div className="text-5xl mb-4">{icon}</div>
      <div className="text-lg font-semibold text-text mb-2">{title}</div>
      <div className="text-sm text-text2">{desc}</div>
    </div>
  )
}