import Modal from './Modal'
import Spinner from './Spinner'

export default function ConfirmDialog({
  open,
  title = 'Та итгэлтэй байна уу?',
  message,
  confirmText = 'Устгах',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal open={open} onClose={loading ? () => {} : onCancel} title={title} size="max-w-md">
      {message && <p className="text-sm text-muted">{message}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={loading}>
          Болих
        </button>
        <button
          type="button"
          className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading && <Spinner className="h-4 w-4" />}
          {confirmText}
        </button>
      </div>
    </Modal>
  )
}
