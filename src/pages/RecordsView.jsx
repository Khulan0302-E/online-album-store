import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowRight, FiSearch, FiShoppingBag, FiX } from 'react-icons/fi'
import { supabase } from '../lib/supabase'
import { formatPrice, getErrorMessage } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import useDebounce from '../hooks/useDebounce'
import CoverflowCarousel from '../components/product/CoverflowCarousel'
import Spinner, { PageSpinner } from '../components/ui/Spinner'
import { EmptyState, ErrorState } from '../components/ui/States'
import ShopTypeTabs from '../components/product/ShopTypeTabs'

const SORTS = {
  newest: { label: 'Шинэ', column: 'created_at', ascending: false },
  price_asc: { label: 'Хямд', column: 'price', ascending: true },
  price_desc: { label: 'Үнэтэй', column: 'price', ascending: false },
  title: { label: 'А–Я', column: 'title', ascending: true },
}

const RECORD_SELECT =
  'id, title, price, cover_url, artist:artists(id, name), tracks(duration_sec), product_variants(id, stock, is_active)'

function minutesOf(tracks) {
  const seconds = tracks.reduce((sum, t) => sum + (t.duration_sec ?? 0), 0)
  return seconds ? Math.round(seconds / 60) : null
}

function availableVariant(record) {
  return record.product_variants.find((v) => v.is_active && (v.stock === null || v.stock > 0))
}

export default function RecordsView() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const min = params.get('min') ?? ''
  const max = params.get('max') ?? ''
  const sort = SORTS[params.get('sort')] ? params.get('sort') : 'newest'

  const { user } = useAuth()
  const { addItem } = useCart()
  const navigate = useNavigate()
  const location = useLocation()

  const [search, setSearch] = useState(q)
  const debouncedSearch = useDebounce(search)
  const [priceInput, setPriceInput] = useState({ min, max })

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [active, setActive] = useState(0)
  const [adding, setAdding] = useState(false)

  const updateParams = useCallback(
    (changes) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          Object.entries(changes).forEach(([key, value]) => {
            if (value === '' || value == null) next.delete(key)
            else next.set(key, value)
          })
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  useEffect(() => {
    const value = debouncedSearch.trim()
    if (value !== q) updateParams({ q: value })
  }, [debouncedSearch])

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      setError(null)
      let query = supabase.from('products').select(RECORD_SELECT).eq('is_active', true).eq('type', 'album')
      if (q) query = query.ilike('title', `%${q}%`)
      if (min) query = query.gte('price', min)
      if (max) query = query.lte('price', max)
      const { column, ascending } = SORTS[sort]
      query = query.order(column, { ascending }).order('id').limit(60)

      const { data, error: apiError } = await query
      if (ignore) return
      setLoading(false)
      if (apiError) {
        setError(getErrorMessage(apiError))
        return
      }
      setRecords(data)
      setActive(0)
    }
    load()
    return () => {
      ignore = true
    }
  }, [q, min, max, sort, reloadKey])

  const applyPrice = (e) => {
    e.preventDefault()
    updateParams({ min: priceInput.min, max: priceInput.max })
  }

  const clearFilters = () => {
    setSearch('')
    setPriceInput({ min: '', max: '' })
    setParams({ type: 'album' }, { replace: true })
  }

  const hasFilters = q || min || max || sort !== 'newest'
  const current = records[Math.min(active, records.length - 1)]
  const minutes = current ? minutesOf(current.tracks) : null
  const variant = current ? availableVariant(current) : null

  const handleAdd = async () => {
    if (!user) {
      toast('Сагсанд нэмэхийн тулд нэвтэрнэ үү')
      navigate('/login', { state: { from: location } })
      return
    }
    setAdding(true)
    try {
      await addItem(variant.id, 1)
      toast.success('Сагсанд нэмэгдлээ')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setAdding(false)
    }
  }

  const slides = records.map((r) => ({ id: r.id, src: r.cover_url, alt: r.title }))
  const carouselKey = `${q}|${min}|${max}|${sort}|${records.length}`

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(31,78,140,0.12),transparent)]" />

      <div className="container-page relative py-10">
        <div className="flex justify-center">
          <ShopTypeTabs active="album" />
        </div>

        <header className="mt-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-soft">Хөвөө Records</p>
          <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">Пянзны цуглуулга</h1>
          <p className="mt-2 text-sm text-muted">{loading ? 'Ачаалж байна…' : `${records.length} пянз`}</p>
        </header>

        <div className="mx-auto mt-8 flex max-w-4xl flex-col gap-3 rounded-3xl border border-line bg-surface/80 p-3 backdrop-blur md:flex-row md:items-center md:rounded-full md:p-2">
          <div className="relative flex-1">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              className="w-full rounded-full bg-transparent py-2.5 pl-11 pr-4 text-sm outline-none placeholder:text-muted/70"
              placeholder="Пянз хайх…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="hidden h-6 w-px bg-line md:block" />

          <div className="flex gap-1 overflow-x-auto" role="group" aria-label="Эрэмбэлэх">
            {Object.entries(SORTS).map(([key, s]) => (
              <button
                key={key}
                type="button"
                onClick={() => updateParams({ sort: key === 'newest' ? '' : key })}
                className={`whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                  sort === key ? 'bg-brand text-white' : 'text-muted hover:text-cream'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="hidden h-6 w-px bg-line md:block" />

          <form onSubmit={applyPrice} className="flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              className="w-full rounded-full bg-elevated px-3 py-2 text-xs outline-none placeholder:text-muted/70 focus:ring-2 focus:ring-soft/30 md:w-24"
              placeholder="₮ доод"
              value={priceInput.min}
              onChange={(e) => setPriceInput({ ...priceInput, min: e.target.value })}
            />
            <span className="text-muted">–</span>
            <input
              type="number"
              min="0"
              className="w-full rounded-full bg-elevated px-3 py-2 text-xs outline-none placeholder:text-muted/70 focus:ring-2 focus:ring-soft/30 md:w-24"
              placeholder="₮ дээд"
              value={priceInput.max}
              onChange={(e) => setPriceInput({ ...priceInput, max: e.target.value })}
            />
            <button type="submit" className="rounded-full border border-line px-3 py-2 text-xs font-semibold hover:border-soft">
              Шүүх
            </button>
          </form>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center justify-center gap-1 rounded-full px-3 py-2 text-xs text-soft hover:underline"
            >
              <FiX /> Цэвэрлэх
            </button>
          )}
        </div>

        <section className="mt-4">
          {loading ? (
            <PageSpinner />
          ) : error ? (
            <div className="mt-8">
              <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
            </div>
          ) : records.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                icon={FiSearch}
                title="Пянз олдсонгүй"
                message="Хайлтын үг эсвэл үнийн хязгаараа өөрчлөөд үзнэ үү."
                action={hasFilters && <button type="button" className="btn btn-ghost" onClick={clearFilters}>Шүүлтүүр цэвэрлэх</button>}
              />
            </div>
          ) : (
            <>
              <CoverflowCarousel
                key={carouselKey}
                slides={slides}
                loop={records.length > 2}
                onSelect={setActive}
                onActivate={(i) => navigate(`/products/${records[i].id}`)}
              />

              {current && (
                <div key={current.id} className="mx-auto flex max-w-sm flex-col items-center text-center motion-safe:animate-[fade-in_0.35s_ease]">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-soft">{current.artist?.name}</p>
                  <h2 className="mt-2 text-2xl font-extrabold">{current.title}</h2>

                  <dl className="mt-6 w-full max-w-[260px] divide-y divide-line border-y border-line text-sm">
                    <div className="flex justify-between py-2">
                      <dt className="text-muted">Дуу</dt>
                      <dd className="font-medium">{current.tracks.length || '—'}</dd>
                    </div>
                    {minutes && (
                      <div className="flex justify-between py-2">
                        <dt className="text-muted">Урт</dt>
                        <dd className="font-medium">{minutes} мин</dd>
                      </div>
                    )}
                    <div className="flex justify-between py-2">
                      <dt className="text-muted">Үнэ</dt>
                      <dd className="font-semibold text-soft">{formatPrice(current.price)}</dd>
                    </div>
                  </dl>

                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Link to={`/products/${current.id}`} className="btn btn-ghost">
                      Дэлгэрэнгүй <FiArrowRight />
                    </Link>
                    <button type="button" className="btn btn-primary" onClick={handleAdd} disabled={!variant || adding}>
                      {adding ? <Spinner className="h-4 w-4" /> : <FiShoppingBag />}
                      {variant ? 'Сагсанд нэмэх' : 'Дууссан'}
                    </button>
                  </div>

                  <p className="mt-6 font-display text-xs font-semibold tabular-nums text-muted">
                    {String(active + 1).padStart(2, '0')} / {String(records.length).padStart(2, '0')}
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
