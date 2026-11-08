import { Fragment, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { supabase } from '../../lib/supabase'
import { formatDate, formatPrice, getErrorMessage, ORDER_STATUS } from '../../lib/format'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Pagination from '../../components/ui/Pagination'
import StatusBadge from '../../components/ui/StatusBadge'
import { PageSpinner } from '../../components/ui/Spinner'
import { EmptyState, ErrorState } from '../../components/ui/States'

const PAGE_SIZE = 15

const NEXT_STATUS = {
  paid: { status: 'shipped', label: 'Илгээсэн болгох' },
  shipped: { status: 'delivered', label: 'Хүргэгдсэн болгох' },
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [expanded, setExpanded] = useState(null)
  const [cancelling, setCancelling] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setPage(1)
  }, [status])

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      setError(null)
      let query = supabase
        .from('orders')
        .select('*, customer:profiles(full_name, email), order_items(id, product_title, variant_label, qty, unit_price)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
      if (status) query = query.eq('status', status)

      const { data, count, error: apiError } = await query
      if (ignore) return
      setLoading(false)
      if (apiError) {
        setError(getErrorMessage(apiError))
        return
      }
      setOrders(data)
      setTotal(count ?? 0)
    }
    load()
    return () => {
      ignore = true
    }
  }, [status, page, reloadKey])

  const advance = async (order) => {
    const next = NEXT_STATUS[order.status]
    const { error: apiError } = await supabase.from('orders').update({ status: next.status }).eq('id', order.id)
    if (apiError) {
      toast.error(getErrorMessage(apiError))
      return
    }
    toast.success('Төлөв шинэчлэгдлээ')
    setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, status: next.status } : o)))
  }

  const confirmCancel = async () => {
    setBusy(true)
    const { error: apiError } = await supabase.rpc('cancel_order', { p_order_id: cancelling.id })
    setBusy(false)
    if (apiError) {
      toast.error(getErrorMessage(apiError))
      return
    }
    toast.success('Захиалга цуцлагдлаа')
    setCancelling(null)
    setReloadKey((k) => k + 1)
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Захиалга</h1>
        <select className="input sm:w-52" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Бүх төлөв</option>
          {Object.entries(ORDER_STATUS).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <PageSpinner />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : orders.length === 0 ? (
        <EmptyState title="Захиалга олдсонгүй" />
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Дугаар</th>
                  <th>Хэрэглэгч</th>
                  <th>Огноо</th>
                  <th className="text-right">Дүн</th>
                  <th>Төлөв</th>
                  <th className="text-right">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <Fragment key={order.id}>
                    <tr>
                      <td>
                        <button
                          type="button"
                          className="flex items-center gap-2 font-semibold hover:text-soft"
                          onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                        >
                          {expanded === order.id ? <FiChevronUp /> : <FiChevronDown />}
                          #{order.id.slice(0, 8).toUpperCase()}
                        </button>
                      </td>
                      <td>
                        <p>{order.customer?.full_name || '—'}</p>
                        <p className="text-xs text-muted">{order.customer?.email}</p>
                      </td>
                      <td className="whitespace-nowrap text-muted">{formatDate(order.created_at)}</td>
                      <td className="text-right font-semibold">{formatPrice(order.total)}</td>
                      <td><StatusBadge status={order.status} /></td>
                      <td>
                        <div className="flex justify-end gap-2">
                          {NEXT_STATUS[order.status] && (
                            <button type="button" className="btn btn-ghost btn-sm whitespace-nowrap" onClick={() => advance(order)}>
                              {NEXT_STATUS[order.status].label}
                            </button>
                          )}
                          {['pending', 'paid'].includes(order.status) && (
                            <button type="button" className="btn btn-sm whitespace-nowrap text-red-300 hover:text-red-200" onClick={() => setCancelling(order)}>
                              Цуцлах
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expanded === order.id && (
                      <tr>
                        <td colSpan={6} className="bg-elevated/50">
                          <div className="grid gap-4 py-2 sm:grid-cols-2">
                            <ul className="space-y-1.5 text-sm">
                              {order.order_items.map((item) => (
                                <li key={item.id} className="flex justify-between gap-4">
                                  <span>
                                    {item.product_title} <span className="text-muted">({item.variant_label}) × {item.qty}</span>
                                  </span>
                                  <span>{formatPrice(item.qty * item.unit_price)}</span>
                                </li>
                              ))}
                            </ul>
                            {order.needs_shipping ? (
                              <div className="text-sm text-muted">
                                <p className="text-cream">{order.shipping_name} · {order.shipping_phone}</p>
                                <p>{order.shipping_address}</p>
                              </div>
                            ) : (
                              <p className="text-sm text-muted">Дижитал захиалга, хүргэлтгүй</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} onChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={Boolean(cancelling)}
        title="Захиалга цуцлах уу?"
        message="Захиалгын бараанууд нөөцөд буцаж нэмэгдэнэ. Энэ үйлдлийг буцаах боломжгүй."
        confirmText="Цуцлах"
        loading={busy}
        onConfirm={confirmCancel}
        onCancel={() => setCancelling(null)}
      />
    </div>
  )
}
