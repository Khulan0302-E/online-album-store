import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getErrorMessage } from '../lib/format'
import ProductGrid from '../components/product/ProductGrid'
import CoverImage from '../components/ui/CoverImage'
import { PageSpinner } from '../components/ui/Spinner'
import { EmptyState, ErrorState } from '../components/ui/States'

const PRODUCT_SELECT = 'id, title, price, cover_url, type, artist:artists(id, name), category:categories(id, name)'

export default function ArtistDetail() {
  const { id } = useParams()
  const [artist, setArtist] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    const [artistRes, productsRes] = await Promise.all([
      supabase.from('artists').select('*').eq('id', id).maybeSingle(),
      supabase.from('products').select(PRODUCT_SELECT).eq('artist_id', id).eq('is_active', true).order('release_date', { ascending: false, nullsFirst: false }),
    ])
    setLoading(false)
    const failed = artistRes.error ?? productsRes.error
    if (failed) {
      setError(getErrorMessage(failed))
      return
    }
    setArtist(artistRes.data)
    setProducts(productsRes.data)
  }

  useEffect(() => {
    load()
  }, [id])

  if (loading) return <PageSpinner />

  if (error) {
    return (
      <div className="container-page py-12">
        <ErrorState message={error} onRetry={load} />
      </div>
    )
  }

  if (!artist) {
    return (
      <div className="container-page py-12">
        <EmptyState title="Уран бүтээлч олдсонгүй" action={<Link to="/artists" className="btn btn-primary">Буцах</Link>} />
      </div>
    )
  }

  const albums = products.filter((p) => p.type === 'album')
  const merch = products.filter((p) => p.type === 'merch')

  return (
    <div className="container-page py-10">
      <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
        <CoverImage src={artist.image_url} alt={artist.name} className="h-36 w-36 shrink-0 rounded-full border border-line" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-soft">Уран бүтээлч</p>
          <h1 className="mt-2 text-4xl font-extrabold">{artist.name}</h1>
          {artist.bio && <p className="mt-3 max-w-2xl text-muted">{artist.bio}</p>}
        </div>
      </div>

      {products.length === 0 && (
        <div className="mt-12">
          <EmptyState title="Бүтээгдэхүүн алга" message="Энэ уран бүтээлчийн бүтээгдэхүүн удахгүй нэмэгдэнэ." />
        </div>
      )}

      {albums.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-6 text-2xl font-bold">Цомгууд</h2>
          <ProductGrid products={albums} />
        </section>
      )}

      {merch.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-6 text-2xl font-bold">Мерч</h2>
          <ProductGrid products={merch} />
        </section>
      )}
    </div>
  )
}
