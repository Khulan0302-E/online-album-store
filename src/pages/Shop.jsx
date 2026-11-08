import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FiFilter, FiSearch, FiX } from 'react-icons/fi'
import { supabase } from '../lib/supabase'
import { getErrorMessage } from '../lib/format'
import useDebounce from '../hooks/useDebounce'
import ProductGrid, { ProductGridSkeleton } from '../components/product/ProductGrid'
import Pagination from '../components/ui/Pagination'
import ShopTypeTabs from '../components/product/ShopTypeTabs'
import RecordsView from './RecordsView'
import { EmptyState, ErrorState } from '../components/ui/States'

const PAGE_SIZE = 12

const SORTS = {
  newest: { label: 'Шинээр нэмэгдсэн', column: 'created_at', ascending: false },
  price_asc: { label: 'Үнэ: багаас их', column: 'price', ascending: true },
  price_desc: { label: 'Үнэ: ихээс бага', column: 'price', ascending: false },
  title: { label: 'Нэрээр (А–Я)', column: 'title', ascending: true },
}

const PRODUCT_SELECT = 'id, title, price, cover_url, type, release_date, created_at, artist:artists(id, name), category:categories(id, name)'

export default function Shop() {
  const [params] = useSearchParams()
  return params.get('type') === 'album' ? <RecordsView /> : <ShopGrid />
}

function ShopGrid() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const type = params.get('type') ?? ''
  const category = params.get('category') ?? ''
  const min = params.get('min') ?? ''
  const max = params.get('max') ?? ''
  const sort = SORTS[params.get('sort')] ? params.get('sort') : 'newest'
  const page = Math.max(1, Number(params.get('page')) || 1)

  const [search, setSearch] = useState(q)
  const debouncedSearch = useDebounce(search)
  const [priceInput, setPriceInput] = useState({ min, max })
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const updateParams = useCallback(
    (changes) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          Object.entries(changes).forEach(([key, value]) => {
            if (value === '' || value == null) next.delete(key)
            else next.set(key, value)
          })
          if (!('page' in changes)) next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  useEffect(() => {
    supabase
      .from('categories')
      .select('id, name, type')
      .order('name')
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  useEffect(() => {
    const value = debouncedSearch.trim()
    if (value !== q) updateParams({ q: value })
  }, [debouncedSearch])

  useEffect(() => {
    let ignore = false

    async function load() {
      setLoading(true)
      setError(null)

      let query = supabase.from('products').select(PRODUCT_SELECT, { count: 'exact' }).eq('is_active', true)

      if (q) query = query.ilike('title', `%${q}%`)
      if (type) query = query.eq('type', type)
      if (category) query = query.eq('category_id', category)
      if (min) query = query.gte('price', min)
      if (max) query = query.lte('price', max)

      const { column, ascending } = SORTS[sort]
      const from = (page - 1) * PAGE_SIZE
      query = query
        .order(column, { ascending, nullsFirst: false })
        .order('id')
        .range(from, from + PAGE_SIZE - 1)

      const { data, count, error: apiError } = await query
      if (ignore) return

      if (apiError) {
        if (page > 1) {
          updateParams({ page: '' })
          return
        }
        setError(getErrorMessage(apiError))
        setLoading(false)
        return
      }

      setProducts(data)
      setTotal(count ?? 0)
      setLoading(false)
    }

    load()
    return () => {
      ignore = true
    }
  }, [q, type, category, min, max, sort, page, reloadKey, updateParams])

  const applyPrice = (e) => {
    e.preventDefault()
    updateParams({ min: priceInput.min, max: priceInput.max })
  }

  const clearFilters = () => {
    setSearch('')
    setPriceInput({ min: '', max: '' })
    setParams(type ? { type } : {}, { replace: true })
  }

  const hasFilters = q || category || min || max
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <ShopTypeTabs active={type} />
      </div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{type === 'merch' ? 'Мерч' : 'Дэлгүүр'}</h1>
          <p className="mt-1 text-sm text-muted">{loading ? 'Хайж байна…' : `${total} бүтээгдэхүүн`}</p>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1 sm:w-72">
            <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              className="input pl-10"
              placeholder="Пянз, мерч хайх…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="button" className="btn btn-ghost lg:hidden" onClick={() => setFiltersOpen((o) => !o)}>
            <FiFilter />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className={`${filtersOpen ? 'block' : 'hidden'} space-y-7 lg:block lg:w-60 lg:shrink-0`}>
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Ангилал</h3>
            <select className="input" value={category} onChange={(e) => updateParams({ category: e.target.value })}>
              <option value="">Бүх ангилал</option>
              {categories
                .filter((c) => !type || c.type === type)
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
          </div>

          <form onSubmit={applyPrice}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Үнэ (₮)</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                className="input"
                placeholder="Доод"
                value={priceInput.min}
                onChange={(e) => setPriceInput({ ...priceInput, min: e.target.value })}
              />
              <span className="text-muted">–</span>
              <input
                type="number"
                min="0"
                className="input"
                placeholder="Дээд"
                value={priceInput.max}
                onChange={(e) => setPriceInput({ ...priceInput, max: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-ghost btn-sm mt-3 w-full">Үнээр шүүх</button>
          </form>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Эрэмбэлэх</h3>
            <select className="input" value={sort} onChange={(e) => updateParams({ sort: e.target.value })}>
              {Object.entries(SORTS).map(([key, s]) => (
                <option key={key} value={key}>{s.label}</option>
              ))}
            </select>
          </div>

          {hasFilters && (
            <button type="button" onClick={clearFilters} className="flex items-center gap-2 text-sm text-soft hover:underline">
              <FiX /> Шүүлтүүр цэвэрлэх
            </button>
          )}
        </aside>

        <section className="min-w-0 flex-1">
          {loading ? (
            <ProductGridSkeleton count={PAGE_SIZE} />
          ) : error ? (
            <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
          ) : products.length === 0 ? (
            <EmptyState
              icon={FiSearch}
              title="Илэрц олдсонгүй"
              message="Хайлтын үг эсвэл шүүлтүүрээ өөрчлөөд дахин оролдоно уу."
              action={
                hasFilters && (
                  <button type="button" className="btn btn-ghost" onClick={clearFilters}>
                    Шүүлтүүр цэвэрлэх
                  </button>
                )
              }
            />
          ) : (
            <>
              <ProductGrid products={products} />
              <Pagination page={page} totalPages={totalPages} onChange={(p) => {
                updateParams({ page: p === 1 ? '' : String(p) })
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }} />
            </>
          )}
        </section>
      </div>
    </div>
  )
}
