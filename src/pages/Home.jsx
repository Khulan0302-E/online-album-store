import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiArrowRight, FiChevronDown } from 'react-icons/fi'
import { supabase } from '../lib/supabase'
import { formatPrice, getErrorMessage } from '../lib/format'
import ProductGrid, { ProductGridSkeleton } from '../components/product/ProductGrid'
import CoverImage from '../components/ui/CoverImage'
import DiscCascadeCarousel from '../components/product/DiscCascadeCarousel'
import { EmptyState, ErrorState } from '../components/ui/States'

const PRODUCT_SELECT = 'id, title, price, cover_url, type, artist:artists(id, name), category:categories(id, name)'

function toDiscItem(record) {
  const seconds = record.tracks.reduce((sum, t) => sum + (t.duration_sec ?? 0), 0)
  const credits = [{ label: 'Уран бүтээлч', value: record.artist?.name ?? '—' }]
  if (record.tracks.length) credits.push({ label: 'Дуу', value: `${record.tracks.length}` })
  if (seconds) credits.push({ label: 'Урт', value: `${Math.round(seconds / 60)} мин` })
  credits.push({ label: 'Үнэ', value: formatPrice(record.price) })
  return {
    id: record.id,
    title: record.title,
    src: record.cover_url || undefined,
    alt: record.title,
    credits,
    fine: `${record.artist?.name ?? ''} · khuvuu.mn`,
  }
}

function FeaturedRecords() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [active, setActive] = useState(0)

  useEffect(() => {
    supabase
      .from('products')
      .select('id, title, price, cover_url, artist:artists(name), tracks(duration_sec)')
      .eq('type', 'album')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => setItems((data ?? []).map(toDiscItem)))
  }, [])

  if (items.length === 0) return null

  const current = items[Math.min(active, items.length - 1)]

  return (
    <section className="mt-12">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="text-2xl font-bold">Онцлох пянз</h2>
        <Link to={`/products/${current.id}`} className="text-sm text-soft hover:underline">
          {current.title} — дэлгэрэнгүй
        </Link>
      </div>
      <div className="overflow-hidden rounded-3xl border border-line">
        <DiscCascadeCarousel
          items={items}
          height="clamp(460px, 72svh, 680px)"
          defaultIndex={0}
          loop={items.length > 2}
          autoplay={4500}
          reviews={false}
          background="radial-gradient(120% 90% at 50% 40%, #151a24, #0b0d12)"
          color="#f4f1ea"
          serif='"Montserrat", ui-sans-serif, system-ui, sans-serif'
          sans='"Inter", ui-sans-serif, system-ui, sans-serif'
          display='"Oswald", "Montserrat", "Arial Narrow", sans-serif'
          fontHref="https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&display=swap"
          onIndexChange={setActive}
          onSelect={(item) => navigate(`/products/${item.id}`)}
        />
      </div>
    </section>
  )
}

export default function Home() {
  const [products, setProducts] = useState([])
  const [artists, setArtists] = useState([])
  const [categories, setCategories] = useState([])
  const [merchOpen, setMerchOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    const [productsRes, artistsRes, categoriesRes] = await Promise.all([
      supabase.from('products').select(PRODUCT_SELECT).eq('is_active', true).order('created_at', { ascending: false }).limit(8),
      supabase.from('artists').select('id, name, image_url').order('created_at', { ascending: false }).limit(6),
      supabase.from('categories').select('id, name, type').order('name'),
    ])
    setLoading(false)

    const failed = productsRes.error ?? artistsRes.error ?? categoriesRes.error
    if (failed) {
      setError(getErrorMessage(failed))
      return
    }
    setProducts(productsRes.data)
    setArtists(artistsRes.data)
    setCategories(categoriesRes.data)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute -right-32 top-1/2 h-[560px] w-[560px] -translate-y-1/2 opacity-30 sm:opacity-60">
          <img src="/khuvuu-mark.svg" alt="" className="h-full w-full" />
        </div>
        <div className="container-page relative py-20 sm:py-28">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-soft">Пянз · Мерч</p>
          <h1 className="max-w-xl text-4xl font-extrabold leading-tight sm:text-6xl">
            Хөгжимдөө <span className="text-soft">хөвж</span> ор.
          </h1>
          <p className="mt-5 max-w-md text-muted">
            Монгол уран бүтээлчдийн пянз болон албан ёсны мерчийг нэг дороос.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/shop?type=album" className="btn btn-primary">
              Пянз үзэх <FiArrowRight />
            </Link>
            <Link to="/shop?type=merch" className="btn btn-ghost">Мерч</Link>
          </div>
        </div>
      </section>

      <div className="container-page">
        <div className="mt-10">
          <div className="flex flex-wrap gap-2">
            <Link to="/shop?type=album" className="chip">Пянз</Link>
            <button
              type="button"
              onClick={() => setMerchOpen((open) => !open)}
              className={`chip inline-flex items-center gap-1.5 ${merchOpen ? 'chip-active' : ''}`}
              aria-expanded={merchOpen}
            >
              Мерч
              <FiChevronDown className={`transition ${merchOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
          {merchOpen && (
            <div className="mt-3 flex flex-wrap gap-2 border-l-2 border-brand pl-3">
              <Link to="/shop?type=merch" className="chip text-soft">Бүх мерч</Link>
              {categories
                .filter((c) => c.type === 'merch')
                .map((c) => (
                  <Link key={c.id} to={`/shop?type=merch&category=${c.id}`} className="chip">
                    {c.name}
                  </Link>
                ))}
            </div>
          )}
        </div>

        <FeaturedRecords />

        <section className="mt-12">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold">Шинээр нэмэгдсэн</h2>
            <Link to="/shop" className="text-sm text-soft hover:underline">Бүгдийг харах</Link>
          </div>
          {loading ? (
            <ProductGridSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : products.length === 0 ? (
            <EmptyState title="Бүтээгдэхүүн алга" message="Удахгүй шинэ пянз, мерч нэмэгдэнэ." />
          ) : (
            <ProductGrid products={products} />
          )}
        </section>

        {artists.length > 0 && (
          <section className="mt-16">
            <div className="mb-6 flex items-end justify-between">
              <h2 className="text-2xl font-bold">Уран бүтээлчид</h2>
              <Link to="/artists" className="text-sm text-soft hover:underline">Бүгдийг харах</Link>
            </div>
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
              {artists.map((artist) => (
                <Link key={artist.id} to={`/artists/${artist.id}`} className="group text-center">
                  <CoverImage src={artist.image_url} alt={artist.name} className="aspect-square w-full rounded-full border border-line" />
                  <p className="mt-2 truncate text-sm font-medium group-hover:text-soft">{artist.name}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
