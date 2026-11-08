import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiCreditCard } from 'react-icons/fi'
import { supabase } from '../lib/supabase'
import { formatDate, formatPrice, getErrorMessage } from '../lib/format'
import StatusBadge from '../components/ui/StatusBadge'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { PageSpinner } from '../components/ui/Spinner'
import { EmptyState, ErrorState } from '../components/ui/States'

export default function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    const { data, error: apiError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .maybeSingle()
    setLoading(false)
    if (apiError) setError(getErrorMessage(apiError))
    else setOrder(data)
  }

  useEffect(() => {
    load()
  }, [id])

  const handleCancel = async () => {
    setCancelling(true)
    const { error: apiError } = await supabase.rpc('cancel_order', { p_order_id: id })
    setCancelling(false)
    setConfirmOpen(false)
    if (apiError) {
      toast.error(getErrorMessage(apiError))
      return
    }
    toast.success('Захиалга цуцлагдлаа')
    load()
  }

  if (loading) return <PageSpinner />

  if (error) {
    return (
      <div className="container-page py-12">
        <ErrorState message={error} onRetry={load} />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container-page py-12">
        <EmptyState title="Захиалга олдсонгүй" action={<Link to="/orders" className="btn btn-primary">Захиалгууд</Link>} />
      </div>
    )
  }

  return (
    <div className="container-page py-10">
      <Link to="/orders" className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-cream">
        <FiArrowLeft /> Захиалгууд
      </Link>

      <div className="mb-8 flex flex-wrap items-center gap-4">
        <h1 className="text-3xl font-bold">#{order.id.slice(0, 8).toUpperCase()}</h1>
        <StatusBadge status={order.status} />
        <span className="text-sm text-muted">{formatDate(order.created_at)}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="card overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Бараа</th>
                  <th>Тоо</th>
                  <th className="text-right">Үнэ</th>
                  <th className="text-right">Дүн</th>
                </tr>
              </thead>
              <tbody>
                {order.order_items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <p className="font-medium">{item.product_title}</p>
                      <p className="text-xs text-muted">{item.variant_label}</p>
                    </td>
                    <td>{item.qty}</td>
                    <td className="text-right">{formatPrice(item.unit_price)}</td>
                    <td className="text-right font-semibold">{formatPrice(item.qty * item.unit_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {order.needs_shipping && (
            <div className="card p-6">
              <h2 className="mb-3 font-bold">Хүргэлт</h2>
              <p className="text-sm">{order.shipping_name}</p>
              <p className="text-sm text-muted">{order.shipping_phone}</p>
              <p className="mt-1 text-sm text-muted">{order.shipping_address}</p>
            </div>
          )}
        </div>

        <aside className="card h-fit p-6">
          <div className="flex justify-between text-lg font-bold">
            <span>Нийт</span>
            <span>{formatPrice(order.total)}</span>
          </div>

          {order.status === 'pending' && (
            <>
              <button type="button" className="btn btn-primary mt-6 w-full" disabled title="QPay төлбөр удахгүй нэмэгдэнэ">
                <FiCreditCard /> QPay-ээр төлөх
              </button>
              <p className="mt-2 text-center text-xs text-muted">Төлбөрийн систем удахгүй холбогдоно.</p>
              <button type="button" className="btn btn-ghost mt-4 w-full" onClick={() => setConfirmOpen(true)}>
                Захиалга цуцлах
              </button>
            </>
          )}

          {order.paid_at && <p className="mt-4 text-sm text-muted">Төлсөн: {formatDate(order.paid_at)}</p>}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Захиалга цуцлах уу?"
        message="Цуцалсан захиалгыг сэргээх боломжгүй."
        confirmText="Цуцлах"
        loading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
