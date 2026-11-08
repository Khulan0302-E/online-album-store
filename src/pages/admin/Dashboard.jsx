import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiAlertTriangle, FiDollarSign, FiShoppingCart, FiUsers } from 'react-icons/fi'
import { supabase } from '../../lib/supabase'
import { formatPrice, getErrorMessage, ORDER_STATUS } from '../../lib/format'
import { PageSpinner } from '../../components/ui/Spinner'
import { ErrorState } from '../../components/ui/States'

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 text-muted">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/25 text-soft">
          <Icon />
        </span>
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-4 font-display text-2xl font-bold">{value}</p>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    const { data, error: apiError } = await supabase.rpc('admin_dashboard_stats')
    setLoading(false)
    if (apiError) setError(getErrorMessage(apiError))
    else setStats(data)
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) return <PageSpinner />
  if (error) return <ErrorState message={error} onRetry={load} />

  const byCategory = stats.revenue_by_category ?? []
  const maxCategory = Math.max(1, ...byCategory.map((c) => Number(c.revenue)))

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Хянах самбар</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={FiDollarSign} label="Нийт орлого" value={formatPrice(stats.total_revenue)} />
        <StatCard icon={FiShoppingCart} label="Захиалга" value={stats.order_count} />
        <StatCard icon={FiUsers} label="Хэрэглэгч" value={stats.user_count} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="mb-5 font-bold">Захиалгын төлөв</h2>
          <div className="space-y-3">
            {Object.entries(ORDER_STATUS).map(([key, { label }]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-muted">{label}</span>
                <span className="font-semibold">{stats.orders_by_status?.[key] ?? 0}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="mb-5 font-bold">Ангиллаар орлого</h2>
          {byCategory.length === 0 ? (
            <p className="text-sm text-muted">Төлөгдсөн захиалга хараахан алга.</p>
          ) : (
            <div className="space-y-4">
              {byCategory.map((c) => (
                <div key={c.name}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span>{c.name}</span>
                    <span className="text-muted">{formatPrice(c.revenue)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-elevated">
                    <div className="h-2 rounded-full bg-soft" style={{ width: `${(Number(c.revenue) / maxCategory) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="card mt-6 overflow-x-auto">
        <div className="flex items-center gap-2 px-6 pt-6">
          <FiAlertTriangle className="text-amber-300" />
          <h2 className="font-bold">Нөөц багассан</h2>
        </div>
        {stats.low_stock?.length ? (
          <table className="table-base mt-3">
            <thead>
              <tr>
                <th>Бүтээгдэхүүн</th>
                <th>Сонголт</th>
                <th className="text-right">Үлдэгдэл</th>
              </tr>
            </thead>
            <tbody>
              {stats.low_stock.map((row, i) => (
                <tr key={i}>
                  <td>{row.title}</td>
                  <td className="text-muted">{row.variant || 'Стандарт'}</td>
                  <td className={`text-right font-semibold ${row.stock === 0 ? 'text-red-400' : 'text-amber-300'}`}>{row.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-6 pb-6 pt-3 text-sm text-muted">Бүх барааны нөөц хангалттай байна.</p>
        )}
        <div className="px-6 py-4">
          <Link to="/admin/products" className="text-sm text-soft hover:underline">Бүтээгдэхүүн удирдах</Link>
        </div>
      </section>
    </div>
  )
}
