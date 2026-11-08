import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiSearch } from 'react-icons/fi'
import { supabase } from '../lib/supabase'
import { getErrorMessage } from '../lib/format'
import useDebounce from '../hooks/useDebounce'
import CoverImage from '../components/ui/CoverImage'
import { EmptyState, ErrorState } from '../components/ui/States'

export default function Artists() {
  const [artists, setArtists] = useState([])
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      setError(null)
      let query = supabase.from('artists').select('id, name, image_url, products(count)').order('name')
      if (debounced.trim()) query = query.ilike('name', `%${debounced.trim()}%`)
      const { data, error: apiError } = await query
      if (ignore) return
      setLoading(false)
      if (apiError) setError(getErrorMessage(apiError))
      else setArtists(data)
    }
    load()
    return () => {
      ignore = true
    }
  }, [debounced, reloadKey])

  return (
    <div className="container-page py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-3xl font-bold">Уран бүтээлчид</h1>
        <div className="relative sm:w-72">
          <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input type="search" className="input pl-10" placeholder="Нэрээр хайх…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square rounded-full bg-elevated" />
              <div className="mx-auto mt-3 h-4 w-2/3 rounded bg-elevated" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : artists.length === 0 ? (
        <EmptyState icon={FiSearch} title="Уран бүтээлч олдсонгүй" message="Өөр нэрээр хайж үзнэ үү." />
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {artists.map((artist) => (
            <Link key={artist.id} to={`/artists/${artist.id}`} className="group text-center">
              <CoverImage src={artist.image_url} alt={artist.name} className="aspect-square w-full rounded-full border border-line transition group-hover:border-soft" />
              <p className="mt-3 truncate font-semibold group-hover:text-soft">{artist.name}</p>
              <p className="text-xs text-muted">{artist.products?.[0]?.count ?? 0} бүтээгдэхүүн</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
