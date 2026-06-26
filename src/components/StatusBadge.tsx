import type { StatusPengajuan } from '@/types'
import { STATUS_LABEL, STATUS_COLOR } from '@/types'

export default function StatusBadge({ status }: { status: StatusPengajuan }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_COLOR[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  )
}
