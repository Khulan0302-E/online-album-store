import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiMinus, FiPlus, FiShoppingBag } from 'react-icons/fi'
import { supabase } from '../lib/supabase'
import { formatPrice, getErrorMessage, variantLabel, variantPrice } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import TrackList from '../components/product/TrackList'
import CoverImage from '../components/ui/CoverImage'
import Spinner, { PageSpinner } from '../components/ui/Spinner'
import { EmptyState, ErrorState } from '../components/ui/States'

const DETAIL_SELECT = `
  *,
  artist:artists(id, name),
  category:categories(id, name),
  images:product_images(id, url, sort_order),
  variants:product_variants(*),
  tracks(*)
`

function isAvailable(variant) {
  return variant.is_active && (variant.stock === null || variant.stock > 0)
}

export default function ProductDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { addItem } = useCart()
  const navigate = useNavigate()
  const location = useLocation()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [activeImage, setActiveImage] = useState(null)
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    const { data, error: apiError } = await supabase.from('products').select(DETAIL_SELECT).eq('id', id).maybeSingle()
    setLoading(false)

    if (apiError) {
      setError(getErrorMessage(apiError))
      return
    }
    setProduct(data)
    if (data) {
      const firstAvailable = data.variants.find(isAvailable) ?? data.variants[0]
      setSelectedId(firstAvailable?.id ?? null)
      setActiveImage(data.cover_url)
      setQty(1)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const variants = useMemo(() => (product?.variants ?? []).filter((v) => v.is_active), [product])
  const selected = variants.find((v) => v.id === selectedId)
  const maxQty = selected ? Math.min(10, selected.stock ?? 10) : 1
  const gallery = useMemo(() => {
    if (!product) return []
    const extra = [...product.images].sort((a, b) => a.sort_order - b.sort_order).map((img) => img.url)
    return [product.cover_url, ...extra].filter(Boolean)
  }, [product])

  const handleAdd = async () => {
    if (!user) {
      toast('Сагсанд нэмэхийн тулд нэвтэрнэ үү')
      navigate('/login', { state: { from: location } })
      return
    }
    if (!selected || !isAvailable(selected)) {
      toast.error('Сонголтоо хийнэ үү')
      return
    }
    setAdding(true)
    try {
      await addItem(selected.id, qty)
      toast.success('Сагсанд нэмэгдлээ')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setAdding(false)
    }
  }

  if (loading) return <PageSpinner />

  if (error) {
    return (
      <div className="container-page py-12">
        <ErrorState message={error} onRetry={load} />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container-page py-12">
        <EmptyState
          title="Бүтээгдэхүүн олдсонгүй"
          message="Энэ бүтээгдэхүүн устсан эсвэл худалдаанаас хасагдсан байна."
          action={<Link to="/shop" className="btn btn-primary">Дэлгүүр рүү</Link>}
        />
      </div>
    )
  }


  return (
    <div className="container-page py-10">
      <nav className="mb-6 text-sm text-muted">
        <Link to="/shop" className="hover:text-cream">Дэлгүүр</Link>
        <span className="mx-2">/</span>
        <Link to={`/shop?category=${product.category?.id}`} className="hover:text-cream">{product.category?.name}</Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-3xl border border-line">
            <CoverImage src={activeImage} alt={product.title} className="aspect-square w-full" />
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto">
              {gallery.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActiveImage(url)}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${activeImage === url ? 'border-soft' : 'border-transparent'}`}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <Link to={`/artists/${product.artist?.id}`} className="text-sm font-semibold uppercase tracking-wider text-soft hover:underline">
            {product.artist?.name}
          </Link>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{product.title}</h1>
          <p className="mt-4 text-2xl font-bold">{formatPrice(selected ? variantPrice(selected, product) : product.price)}</p>

          {variants.length === 0 ? (
            <p className="mt-8 text-sm text-muted">Одоогоор худалдаанд байхгүй байна.</p>
          ) : product.type === 'album' ? (
            <div className="mt-8">
              {selected && isAvailable(selected) ? (
                selected.stock <= 5 && <p className="text-sm text-amber-700">Зөвхөн {selected.stock} ширхэг үлдсэн</p>
              ) : (
                <p className="text-sm text-red-600">Дууссан</p>
              )}
            </div>
          ) : (
            <div className="mt-8">
              <h3 className="mb-3 text-sm font-semibold">Сонголт</h3>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const available = isAvailable(v)
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={!available}
                      onClick={() => {
                        setSelectedId(v.id)
                        setQty(1)
                      }}
                      className={`chip ${selectedId === v.id ? 'chip-active' : ''} disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through`}
                    >
                      {variantLabel(v)}
                    </button>
                  )
                })}
              </div>
              {selected && selected.stock !== null && selected.stock > 0 && selected.stock <= 5 && (
                <p className="mt-3 text-sm text-amber-700">Зөвхөн {selected.stock} ширхэг үлдсэн</p>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center rounded-full border border-line">
              <button type="button" className="p-3 text-muted hover:text-cream disabled:opacity-40" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Хасах">
                <FiMinus />
              </button>
              <span className="w-8 text-center font-semibold">{qty}</span>
              <button type="button" className="p-3 text-muted hover:text-cream disabled:opacity-40" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty} aria-label="Нэмэх">
                <FiPlus />
              </button>
            </div>
            <button
              type="button"
              className="btn btn-primary flex-1 sm:flex-none"
              onClick={handleAdd}
              disabled={adding || !selected || !isAvailable(selected)}
            >
              {adding ? <Spinner className="h-4 w-4" /> : <FiShoppingBag />}
              Сагсанд нэмэх
            </button>
          </div>

          {product.description && (
            <div className="mt-10">
              <h3 className="mb-2 text-sm font-semibold">Тайлбар</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted">{product.description}</p>
            </div>
          )}

          {product.tracks.length > 0 && (
            <div className="mt-10">
              <h3 className="mb-3 text-sm font-semibold">Дуунууд</h3>
              <TrackList tracks={product.tracks} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
