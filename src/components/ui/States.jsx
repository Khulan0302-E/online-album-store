import { FiAlertTriangle, FiInbox } from 'react-icons/fi'

export function EmptyState({ icon: Icon = FiInbox, title, message, action }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <Icon className="mb-4 h-10 w-10 text-soft" />
      <h3 className="text-lg font-semibold">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="card flex flex-col items-center border-red-500/30 px-6 py-12 text-center">
      <FiAlertTriangle className="mb-4 h-10 w-10 text-red-600" />
      <h3 className="text-lg font-semibold">Алдаа гарлаа</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-ghost mt-6">
          Дахин оролдох
        </button>
      )}
    </div>
  )
}
