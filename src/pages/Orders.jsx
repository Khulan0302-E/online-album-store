import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiChevronRight, FiPackage } from 'react-icons/fi'
import { supabase } from '../lib/supabase'
import { formatDate, formatPrice, getErrorMessage } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/ui/StatusBadge'
import { PageSpinner } from '../components/ui/Spinner'
import { EmptyState, ErrorState } from '../components/ui/States'

export default function Orders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    const { data, error: apiError } = await supabase
      .from('orders')
      .select('id, status, total, created_at, order_items(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setLoading(false)
    if (apiError) setError(getErrorMessage(apiError))
    else setOrders(data)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="container-page py-10">
      <h1 className="mb-8 text-3xl font-bold">Миний захиалгууд</h1>

      {loading ? (
        <PageSpinner />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={FiPackage}
          title="Захиалга алга"
          message="Та одоогоор захиалга хийгээгүй байна."
          action={<Link to="/shop" className="btn btn-primary">Дэлгүүр хэсэх</Link>}
        />
      ) : (
        <div className="card divide-y divide-line">
          {orders.map((order) => (
            <Link key={order.id} to={`/orders/${order.id}`} className="flex items-center gap-4 p-4 transition hover:bg-elevated sm:p-5">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">#{order.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-sm text-muted">
                  {formatDate(order.created_at)} · {order.order_items?.[0]?.count ?? 0} төрлийн бараа
                </p>
              </div>
              <StatusBadge status={order.status} />
              <p className="hidden w-28 text-right font-semibold sm:block">{formatPrice(order.total)}</p>
              <FiChevronRight className="text-muted" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
