import { type ConversationRow } from '@/types/conversation'

type Props = { quotes: ConversationRow['customer_verbatim'] }

export function DrawerVerbatim({ quotes }: Props) {
  const arr = Array.isArray(quotes) ? quotes : []
  if (arr.length === 0) {
    return (
      <div className="text-[13px] italic text-slate-400">
        No customer quotes captured.
      </div>
    )
  }
  return (
    <ul className="space-y-3">
      {arr.map((q, i) => (
        <li
          key={i}
          className="border-l-2 border-slate-200 pl-3 text-[14px] leading-[1.6] text-slate-700"
        >
          &ldquo;{q}&rdquo;
        </li>
      ))}
    </ul>
  )
}
