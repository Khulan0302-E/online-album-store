import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { formatPrice, getErrorMessage, variantLabel, variantPrice } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import Field from '../components/ui/Field'
import Spinner, { PageSpinner } from '../components/ui/Spinner'

const PHONE_RE = /^[0-9]{8}$/

export default function Checkout() {
  const { profile } = useAuth()
  const { items, total, needsShipping, loading, reload } = useCart()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    address: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  if (loading && items.length === 0) return <PageSpinner />
  if (items.length === 0 && !submitting) return <Navigate to="/cart" replace />

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const validate = () => {
    const next = {}
    if (needsShipping) {
      if (form.name.trim().length < 2) next.name = 'Хүлээн авагчийн нэрийг оруулна уу'
      if (!PHONE_RE.test(form.phone.trim())) next.phone = 'Утасны дугаар 8 оронтой тоо байна'
      if (form.address.trim().length < 10) next.address = 'Хаягаа дэлгэрэнгүй бичнэ үү (дүүрэг, хороо, байр)'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    const { data: orderId, error } = await supabase.rpc('create_order_from_cart', {
      p_shipping_name: needsShipping ? form.name.trim() : null,
      p_shipping_phone: needsShipping ? form.phone.trim() : null,
      p_shipping_address: needsShipping ? form.address.trim() : null,
    })

    if (error) {
      setSubmitting(false)
      toast.error(getErrorMessage(error))
      return
    }

    await reload()
    toast.success('Захиалга үүслээ')
    navigate(`/orders/${orderId}`, { replace: true })
  }

  return (
    <div className="container-page py-10">
      <h1 className="mb-8 text-3xl font-bold">Захиалга баталгаажуулах</h1>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_380px]" noValidate>
        <div className="card p-6">
          {needsShipping ? (
            <>
              <h2 className="mb-5 text-lg font-bold">Хүргэлтийн мэдээлэл</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Хүлээн авагч" error={errors.name}>
                  <input className="input" value={form.name} onChange={set('name')} />
                </Field>
                <Field label="Утас" error={errors.phone}>
                  <input className="input" inputMode="numeric" maxLength={8} value={form.phone} onChange={set('phone')} />
                </Field>
                <Field label="Хаяг" error={errors.address} className="sm:col-span-2">
                  <textarea rows={3} className="input" placeholder="Дүүрэг, хороо, байр, орц, тоот" value={form.address} onChange={set('address')} />
                </Field>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold">Дижитал захиалга</h2>
              <p className="mt-2 text-sm text-muted">
                Таны сагсанд зөвхөн дижитал цомог байгаа тул хүргэлт шаардлагагүй. Төлбөр төлөгдсөний дараа цомгоо татаж авна.
              </p>
            </>
          )}
        </div>

        <aside className="card h-fit p-6">
          <h2 className="mb-4 text-lg font-bold">Захиалгын дүн</h2>
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.variant_id} className="flex justify-between gap-4 text-sm">
                <span className="min-w-0">
                  <span className="line-clamp-1">{item.variant.product.title}</span>
                  <span className="text-muted">{variantLabel(item.variant)} × {item.qty}</span>
                </span>
                <span className="shrink-0">{formatPrice(item.qty * variantPrice(item.variant, item.variant.product))}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex justify-between border-t border-line pt-4 text-lg font-bold">
            <span>Нийт</span>
            <span>{formatPrice(total)}</span>
          </div>
          <button type="submit" className="btn btn-primary mt-6 w-full" disabled={submitting}>
            {submitting && <Spinner className="h-4 w-4" />}
            Захиалга үүсгэх
          </button>
        </aside>
      </form>
    </div>
  )
}
