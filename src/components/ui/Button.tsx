import { type ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'disabled'

type Props = {
  variant: ButtonVariant
  onClick?: () => void
  children: ReactNode
  title?: string
  className?: string
  type?: 'button' | 'submit'
}

export function Button({
  variant, onClick, children, title, className = '', type = 'button',
}: Props) {
  const cls =
    variant === 'primary'
      ? 'bg-cyan-500 text-white hover:bg-cyan-600'
      : variant === 'secondary'
        ? 'border-[0.5px] border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
        : 'border-[0.5px] border-slate-200 bg-white text-slate-400 cursor-not-allowed'
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={variant === 'disabled'}
      title={title}
      className={`rounded-md px-3 py-1.5 text-[13px] transition-colors duration-150 ${cls} ${className}`}
    >
      {children}
    </button>
  )
}
