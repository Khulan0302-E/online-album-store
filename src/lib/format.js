export function formatPrice(value) {
  return `${new Intl.NumberFormat('mn-MN').format(Number(value ?? 0))}₮`
}

export function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('mn-MN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export function formatDuration(seconds) {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = String(seconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

export const FORMAT_LABELS = {
  cd: 'CD',
  vinyl: 'Пянз',
  cassette: 'Кассет',
  digital: 'Дижитал',
}

export function variantLabel(variant) {
  const parts = [variant.size, variant.color].filter(Boolean)
  if (parts.length === 0 && variant.format) return FORMAT_LABELS[variant.format]
  return parts.length ? parts.join(' · ') : 'Стандарт'
}

export function variantPrice(variant, product) {
  return Number(variant.price_override ?? product.price)
}

export const ORDER_STATUS = {
  pending: { label: 'Хүлээгдэж буй', className: 'bg-amber-100 text-amber-800' },
  paid: { label: 'Төлөгдсөн', className: 'bg-emerald-100 text-emerald-800' },
  shipped: { label: 'Илгээсэн', className: 'bg-sky-100 text-sky-800' },
  delivered: { label: 'Хүргэгдсэн', className: 'bg-brand/10 text-brand' },
  cancelled: { label: 'Цуцлагдсан', className: 'bg-red-100 text-red-700' },
}

const AUTH_ERRORS = {
  'Invalid login credentials': 'Имэйл эсвэл нууц үг буруу байна',
  'User already registered': 'Энэ имэйлээр бүртгэл үүссэн байна',
  'Email not confirmed': 'Имэйлээ баталгаажуулна уу',
  'Password should be at least 6 characters.': 'Нууц үг 6-аас доошгүй тэмдэгттэй байна',
}

export function getErrorMessage(error) {
  if (!error) return 'Алдаа гарлаа'
  if (AUTH_ERRORS[error.message]) return AUTH_ERRORS[error.message]
  if (error.code === '23503') return 'Холбоотой өгөгдөл байгаа тул энэ үйлдлийг хийх боломжгүй'
  if (error.code === '23505') return 'Давхардсан утга байна'
  if (error.code === '42501') return 'Танд энэ үйлдлийг хийх эрх байхгүй'
  return error.message ?? 'Алдаа гарлаа'
}
