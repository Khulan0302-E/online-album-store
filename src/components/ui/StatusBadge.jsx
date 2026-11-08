import { ORDER_STATUS } from '../../lib/format'

export default function StatusBadge({ status }) {
  const config = ORDER_STATUS[status] ?? { label: status, className: 'bg-line text-muted' }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  )
}
