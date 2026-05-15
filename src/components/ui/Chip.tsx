import { type ReactNode } from 'react'

type Props = {
  label: string
  icon?: ReactNode
  className?: string
}

export function Chip({ label, icon, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border-[0.5px] border-slate-200 bg-white px-2 py-0.5 text-[12px] text-slate-700 ${className}`}
    >
      {icon}
      <span>{label}</span>
    </span>
  )
}
