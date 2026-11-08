import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiEdit2, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi'
import { supabase } from '../../lib/supabase'
import { formatPrice, getErrorMessage } from '../../lib/format'
import useDebounce from '../../hooks/useDebounce'
import CoverImage from '../../components/ui/CoverImage'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Pagination from '../../components/ui/Pagination'
import { PageSpinner } from '../../components/ui/Spinner'
import { EmptyState, ErrorState } from '../../components/ui/States'

const PAGE_SIZE = 15

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search)
  const [type, setType] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setPage(1)
  }, [debounced, type])

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      setError(null)
      let query = supabase
        .from('products')
        .select('id, title, type, price, cover_url, is_active, artist:artists(name), category:categories(name), product_variants(stock)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
      if (debounced.trim()) query = query.ilike('title', `%${debounced.trim()}%`)
      if (type) query = query.eq('type', type)

      const { data, count, error: apiError } = await query
      if (ignore) return
      setLoading(false)
      if (apiError) {
        setError(getErrorMessage(apiError))
        return
      }
      setProducts(data)
      setTotal(count ?? 0)
    }
    load()
    return () => {
      ignore = true
    }
  }, [debounced, type, page, reloadKey])

  const toggleActive = async (product) => {
    const { error: apiError } = await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id)
    if (apiError) {
      toast.error(getErrorMessage(apiError))
      return
    }
    setProducts((list) => list.map((p) => (p.id === product.id ? { ...p, is_active: !p.is_active } : p)))
  }

  const confirmDelete = async () => {
    setBusy(true)
    const { error: apiError } = await supabase.from('products').delete().eq('id', deleting.id)
    setBusy(false)
    if (apiError) {
      toast.error(
        apiError.code === '23503'
          ? 'Захиалгад орсон бүтээгдэхүүнийг устгах боломжгүй. Оронд нь идэвхгүй болгоно уу.'
          : getErrorMessage(apiError),
      )
      return
    }
    toast.success('Устгагдлаа')
    setDeleting(null)
    setReloadKey((k) => k + 1)
  }

  const stockOf = (product) => {
    const counted = product.product_variants.filter((v) => v.stock !== null)
    if (counted.length === 0) return '∞'
    return counted.reduce((sum, v) => sum + v.stock, 0)
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Бүтээгдэхүүн</h1>
        <Link to="/admin/products/new" className="btn btn-primary">
          <FiPlus /> Шинэ бүтээгдэхүүн
        </Link>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input type="search" className="input pl-10" placeholder="Нэрээр хайх…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-44" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Бүх төрөл</option>
          <option value="album">Цомог</option>
          <option value="merch">Мерч</option>
        </select>
      </div>

      {loading ? (
        <PageSpinner />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : products.length === 0 ? (
        <EmptyState
          title="Бүтээгдэхүүн олдсонгүй"
          action={<Link to="/admin/products/new" className="btn btn-primary">Шинээр нэмэх</Link>}
        />
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Бүтээгдэхүүн</th>
                  <th>Ангилал</th>
                  <th className="text-right">Үнэ</th>
                  <th className="text-right">Нөөц</th>
                  <th>Төлөв</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <CoverImage src={p.cover_url} alt={p.title} className="h-11 w-11 shrink-0 rounded-lg" />
                        <div className="min-w-0">
                          <p className="max-w-56 truncate font-medium">{p.title}</p>
                          <p className="text-xs text-muted">{p.artist?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-muted">{p.category?.name}</td>
                    <td className="text-right">{formatPrice(p.price)}</td>
                    <td className="text-right">{stockOf(p)}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => toggleActive(p)}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.is_active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-line text-muted'}`}
                      >
                        {p.is_active ? 'Идэвхтэй' : 'Нуусан'}
                      </button>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link to={`/admin/products/${p.id}`} className="p-2 text-muted hover:text-cream" aria-label="Засах">
                          <FiEdit2 />
                        </Link>
                        <button type="button" onClick={() => setDeleting(p)} className="p-2 text-muted hover:text-red-400" aria-label="Устгах">
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} onChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Бүтээгдэхүүн устгах уу?"
        message={deleting ? `"${deleting.title}" болон түүний бүх сонголт, зураг, дуу устна. Энэ үйлдлийг буцаах боломжгүй.` : ''}
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
