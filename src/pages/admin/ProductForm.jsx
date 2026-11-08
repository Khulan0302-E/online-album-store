import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiChevronDown, FiChevronUp, FiMusic, FiPlus, FiTrash2, FiX } from 'react-icons/fi'
import { supabase } from '../../lib/supabase'
import { formatDuration, getErrorMessage } from '../../lib/format'
import { AUDIO_RULES, IMAGE_RULES, uploadFile, validateFile } from '../../lib/storage'
import ImageUpload from '../../components/admin/ImageUpload'
import Field from '../../components/ui/Field'
import Spinner, { PageSpinner } from '../../components/ui/Spinner'
import { ErrorState } from '../../components/ui/States'

const EMPTY_FORM = {
  type: 'album',
  title: '',
  artist_id: '',
  category_id: '',
  price: '',
  release_date: '',
  description: '',
  is_active: true,
  cover_url: '',
}

function newVariant(type) {
  return {
    key: crypto.randomUUID(),
    id: null,
    format: type === 'album' ? 'vinyl' : '',
    size: '',
    color: '',
    sku: '',
    price_override: '',
    stock: '0',
    is_active: true,
  }
}

function newTrack() {
  return { key: crypto.randomUUID(), title: '', duration: '', preview_url: '', file: null }
}

function parseDuration(value) {
  const text = value.trim()
  if (!text) return null
  const match = text.match(/^(\d{1,2}):([0-5]\d)$/)
  if (!match) return undefined
  return Number(match[1]) * 60 + Number(match[2])
}

function parseTrackLines(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const withoutNumber = line.replace(/^\d+\s*[.)-]?\s*/, '')
      const durationMatch = withoutNumber.match(/\s*[-–]?\s*(\d{1,2}:[0-5]\d)$/)
      return {
        ...newTrack(),
        title: durationMatch ? withoutNumber.slice(0, durationMatch.index).trim() : withoutNumber,
        duration: durationMatch ? durationMatch[1] : '',
      }
    })
    .filter((track) => track.title)
}

export default function ProductForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [coverFile, setCoverFile] = useState(null)
  const [variants, setVariants] = useState([newVariant('album')])
  const [removedVariantIds, setRemovedVariantIds] = useState([])
  const [hiddenVariantIds, setHiddenVariantIds] = useState([])
  const [images, setImages] = useState([])
  const [removedImageIds, setRemovedImageIds] = useState([])
  const [tracks, setTracks] = useState([])
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkText, setBulkText] = useState('')

  const [artists, setArtists] = useState([])
  const [categories, setCategories] = useState([])

  const albumCategory = categories.find((c) => c.type === 'album')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setLoadError(null)
    setRemovedVariantIds([])
    setHiddenVariantIds([])
    setRemovedImageIds([])
    setCoverFile(null)

    const [artistsRes, categoriesRes] = await Promise.all([
      supabase.from('artists').select('id, name').order('name'),
      supabase.from('categories').select('id, name, type').order('name'),
    ])
    const lookupError = artistsRes.error ?? categoriesRes.error
    if (lookupError) {
      setLoadError(getErrorMessage(lookupError))
      setLoading(false)
      return
    }
    setArtists(artistsRes.data)
    setCategories(categoriesRes.data)

    if (isEdit) {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_variants(*), product_images(*), tracks(*)')
        .eq('id', id)
        .single()
      if (error) {
        setLoadError(getErrorMessage(error))
        setLoading(false)
        return
      }
      setForm({
        type: data.type,
        title: data.title,
        artist_id: data.artist_id,
        category_id: String(data.category_id),
        price: String(data.price),
        release_date: data.release_date ?? '',
        description: data.description ?? '',
        is_active: data.is_active,
        cover_url: data.cover_url ?? '',
      })
      const loadedVariants = [...data.product_variants]
          .sort((a, b) => a.created_at.localeCompare(b.created_at))
          .map((v) => ({
            key: v.id,
            id: v.id,
            format: v.format ?? '',
            size: v.size ?? '',
            color: v.color ?? '',
            sku: v.sku ?? '',
            price_override: v.price_override === null ? '' : String(v.price_override),
            stock: v.stock === null ? '0' : String(v.stock),
            is_active: v.is_active,
          }))
      if (data.type === 'album') {
        const [first, ...rest] = loadedVariants
        setVariants([first ?? newVariant('album')])
        setHiddenVariantIds(rest.map((v) => v.id))
      } else {
        setVariants(loadedVariants.length ? loadedVariants : [newVariant('merch')])
      }
      setImages(
        [...data.product_images]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((img) => ({ key: img.id, id: img.id, url: img.url, file: null })),
      )
      setTracks(
        [...data.tracks]
          .sort((a, b) => a.track_no - b.track_no)
          .map((t) => ({
            key: t.id,
            title: t.title,
            duration: formatDuration(t.duration_sec),
            preview_url: t.preview_url ?? '',
            file: null,
          })),
      )
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [id])

  const setField = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
  }

  const updateVariant = (key, field, value) => {
    setVariants((list) => list.map((v) => (v.key === key ? { ...v, [field]: value } : v)))
  }

  const removeVariant = (variant) => {
    if (variant.id) setRemovedVariantIds((ids) => [...ids, variant.id])
    setVariants((list) => list.filter((v) => v.key !== variant.key))
  }

  const addImages = (e) => {
    const files = [...(e.target.files ?? [])]
    e.target.value = ''
    for (const file of files) {
      const error = validateFile(file, IMAGE_RULES)
      if (error) {
        toast.error(`${file.name}: ${error}`)
        continue
      }
      setImages((list) => [...list, { key: crypto.randomUUID(), id: null, url: URL.createObjectURL(file), file }])
    }
  }

  const removeImage = (image) => {
    if (image.id) setRemovedImageIds((ids) => [...ids, image.id])
    if (image.file) URL.revokeObjectURL(image.url)
    setImages((list) => list.filter((img) => img.key !== image.key))
  }

  const updateTrack = (key, field, value) => {
    setTracks((list) => list.map((t) => (t.key === key ? { ...t, [field]: value } : t)))
  }

  const selectTrackFile = (key, file) => {
    if (!file) return
    const error = validateFile(file, AUDIO_RULES)
    if (error) {
      toast.error(error)
      return
    }
    updateTrack(key, 'file', file)
  }

  const validate = () => {
    const next = {}
    if (!form.title.trim()) next.title = 'Нэр оруулна уу'
    if (!form.artist_id) next.artist_id = 'Уран бүтээлч сонгоно уу'
    if (form.type === 'merch' && !form.category_id) next.category_id = 'Ангилал сонгоно уу'
    if (form.type === 'album' && !albumCategory) next.title = 'Админ → Ангилал хэсэгт "Пянз" төрлийн ангилал үүсгэнэ үү'
    if (form.price === '' || Number(form.price) < 0) next.price = 'Үнэ 0-ээс их байна'

    if (variants.length === 0) next.variants = 'Дор хаяж нэг сонголт нэмнэ үү'

    const seen = new Set()
    variants.forEach((v) => {
      if (v.stock === '' || Number(v.stock) < 0 || !Number.isInteger(Number(v.stock))) {
        next.variants = 'Нөөц 0 эсвэл түүнээс их бүхэл тоо байна'
      }
      const combo = [v.size.trim(), v.color.trim()].join('|')
      if (seen.has(combo)) next.variants = 'Ижил сонголт давхардсан байна'
      seen.add(combo)
    })

    if (form.type === 'album' && tracks.some((t) => !t.title.trim())) {
      next.tracks = 'Дуу бүрийн нэрийг оруулна уу'
    }
    if (form.type === 'album' && tracks.some((t) => parseDuration(t.duration) === undefined)) {
      next.tracks = 'Үргэлжлэх хугацааг 3:45 хэлбэрээр бичнэ үү'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const saveRelations = async (productId) => {
    if (removedVariantIds.length) {
      const { error } = await supabase.from('product_variants').delete().in('id', removedVariantIds)
      if (error) {
        if (error.code === '23503') throw new Error('Захиалгад орсон сонголтыг устгах боломжгүй. Оронд нь идэвхгүй болгоно уу.')
        throw error
      }
    }

    if (hiddenVariantIds.length) {
      const { error } = await supabase.from('product_variants').update({ is_active: false }).in('id', hiddenVariantIds)
      if (error) throw error
    }

    const toRow = (v) => ({
      product_id: productId,
      format: form.type === 'album' ? 'vinyl' : null,
      size: form.type === 'album' ? null : v.size.trim() || null,
      color: form.type === 'album' ? null : v.color.trim() || null,
      sku: v.sku.trim() || null,
      price_override: null,
      stock: Number(v.stock),
      is_active: v.is_active,
    })

    const existing = variants.filter((v) => v.id).map((v) => ({ id: v.id, ...toRow(v) }))
    const created = variants.filter((v) => !v.id).map(toRow)

    if (existing.length) {
      const { error } = await supabase.from('product_variants').upsert(existing)
      if (error) throw error
    }
    if (created.length) {
      const { error } = await supabase.from('product_variants').insert(created)
      if (error) throw error
    }

    if (removedImageIds.length) {
      const { error } = await supabase.from('product_images').delete().in('id', removedImageIds)
      if (error) throw error
    }
    const newImages = images.filter((img) => img.file)
    if (newImages.length) {
      const offset = images.length - newImages.length
      const rows = []
      for (const [index, img] of newImages.entries()) {
        const url = await uploadFile('images', 'products', img.file)
        rows.push({ product_id: productId, url, sort_order: offset + index })
      }
      const { error } = await supabase.from('product_images').insert(rows)
      if (error) throw error
    }

    const { error: trackDeleteError } = await supabase.from('tracks').delete().eq('product_id', productId)
    if (trackDeleteError) throw trackDeleteError
    if (form.type === 'album' && tracks.length) {
      const rows = []
      for (const [index, track] of tracks.entries()) {
        const previewUrl = track.file ? await uploadFile('previews', productId, track.file) : track.preview_url || null
        rows.push({
          product_id: productId,
          track_no: index + 1,
          title: track.title.trim(),
          duration_sec: parseDuration(track.duration),
          preview_url: previewUrl,
        })
      }
      const { error } = await supabase.from('tracks').insert(rows)
      if (error) throw error
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Формын алдааг засна уу')
      return
    }

    setSaving(true)
    let productId = id

    try {
      let coverUrl = form.cover_url || null
      if (coverFile) coverUrl = await uploadFile('images', 'products', coverFile)

      const payload = {
        type: form.type,
        title: form.title.trim(),
        artist_id: form.artist_id,
        category_id: form.type === 'album' ? albumCategory.id : Number(form.category_id),
        price: Number(form.price),
        release_date: form.type === 'album' ? form.release_date || null : null,
        description: form.description.trim() || null,
        is_active: form.is_active,
        cover_url: coverUrl,
      }

      if (isEdit) {
        const { error } = await supabase.from('products').update(payload).eq('id', id)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('products').insert(payload).select('id').single()
        if (error) throw error
        productId = data.id
      }

      await saveRelations(productId)
      toast.success(isEdit ? 'Хадгалагдлаа' : 'Бүтээгдэхүүн нэмэгдлээ')
      navigate('/admin/products')
    } catch (err) {
      toast.error(getErrorMessage(err))
      if (!isEdit && productId) navigate(`/admin/products/${productId}`, { replace: true })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageSpinner />
  if (loadError) return <ErrorState message={loadError} onRetry={load} />

  const isAlbum = form.type === 'album'

  const addBulkTracks = () => {
    const parsed = parseTrackLines(bulkText)
    if (parsed.length === 0) {
      toast.error('Дууны нэр олдсонгүй')
      return
    }
    setTracks((list) => [...list, ...parsed])
    setBulkText('')
    setBulkOpen(false)
    toast.success(`${parsed.length} дуу нэмэгдлээ`)
  }

  const moveTrack = (index, delta) => {
    setTracks((list) => {
      const next = [...list]
      const target = index + delta
      if (target < 0 || target >= next.length) return list
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-5xl">
      <Link to="/admin/products" className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-cream">
        <FiArrowLeft /> Бүтээгдэхүүн
      </Link>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{isEdit ? 'Бүтээгдэхүүн засах' : 'Шинэ бүтээгдэхүүн'}</h1>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving && <Spinner className="h-4 w-4" />}
          Хадгалах
        </button>
      </div>

      <section className="card space-y-5 p-6">
        <h2 className="font-bold">Үндсэн мэдээлэл</h2>

        <div className="flex gap-2">
          {[
            { value: 'album', label: 'Пянз' },
            { value: 'merch', label: 'Мерч' },
          ].map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                setForm((f) => {
                  const current = categories.find((c) => String(c.id) === f.category_id)
                  const keep = current && current.type === t.value
                  const onlyOne = categories.filter((c) => c.type === t.value)
                  return {
                    ...f,
                    type: t.value,
                    category_id: keep ? f.category_id : onlyOne.length === 1 ? String(onlyOne[0].id) : '',
                  }
                })
                if (t.value === 'album') {
                  setVariants((list) => {
                    const [first, ...rest] = list
                    const hidden = rest.filter((v) => v.id).map((v) => v.id)
                    if (hidden.length) setHiddenVariantIds((ids) => [...ids, ...hidden])
                    return [{ ...(first ?? newVariant('album')), format: 'vinyl', size: '', color: '' }]
                  })
                }
              }}
              className={`chip ${form.type === t.value ? 'chip-active' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Нэр" error={errors.title} className="sm:col-span-2">
            <input className="input" value={form.title} onChange={setField('title')} />
          </Field>
          <Field label="Уран бүтээлч" error={errors.artist_id}>
            <select className="input" value={form.artist_id} onChange={setField('artist_id')}>
              <option value="">Сонгох…</option>
              {artists.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </Field>
          {!isAlbum && (
            <Field
              label="Ангилал"
              error={errors.category_id}
              hint={<Link to="/admin/categories" className="text-soft hover:underline">Шинэ ангилал нэмэх</Link>}
            >
              <select className="input" value={form.category_id} onChange={setField('category_id')}>
                <option value="">Сонгох…</option>
                {categories
                  .filter((c) => c.type === 'merch')
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </Field>
          )}
          <Field label="Үнэ (₮)" error={errors.price}>
            <input type="number" min="0" className="input" value={form.price} onChange={setField('price')} />
          </Field>
          {isAlbum && (
            <Field label="Нөөц (ширхэг)" error={errors.variants}>
              <input
                type="number"
                min="0"
                step="1"
                className="input"
                value={variants[0]?.stock ?? ''}
                onChange={(e) => variants[0] && updateVariant(variants[0].key, 'stock', e.target.value)}
              />
            </Field>
          )}
          <Field label="Тайлбар" className="sm:col-span-2">
            <textarea rows={4} className="input" value={form.description} onChange={setField('description')} />
          </Field>
        </div>

        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-[#1f4e8c]" checked={form.is_active} onChange={setField('is_active')} />
          Дэлгүүрт харуулах
        </label>
      </section>

      {isAlbum && (
        <section className="card mt-6 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold">Дууны жагсаалт</h2>
              <p className="text-xs text-muted">Дарааллаар нь оруулна. Хугацааг 3:45 хэлбэрээр. Preview: MP3, 5MB хүртэл (заавал биш).</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setBulkOpen((open) => !open)}>
                Жагсаалт буулгах
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTracks((list) => [...list, newTrack()])}>
                <FiPlus /> Дуу нэмэх
              </button>
            </div>
          </div>

          {bulkOpen && (
            <div className="mb-4 rounded-xl border border-line bg-elevated p-4">
              <textarea
                rows={6}
                className="input font-mono"
                placeholder={'Мөр бүрт нэг дуу:\n1. Шөнийн долгион 3:34\n2. Гэрлэн дохио 3:07\nХөвөх'}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
              />
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setBulkOpen(false)}>Болих</button>
                <button type="button" className="btn btn-primary btn-sm" onClick={addBulkTracks}>Жагсаалтад нэмэх</button>
              </div>
            </div>
          )}

          {tracks.length === 0 ? (
            <p className="text-sm text-muted">Дуу нэмээгүй байна.</p>
          ) : (
            <div className="space-y-2">
              {tracks.map((t, index) => (
                <div key={t.key} className="flex flex-wrap items-center gap-2 rounded-xl bg-elevated p-2.5">
                  <div className="flex flex-col">
                    <button type="button" onClick={() => moveTrack(index, -1)} disabled={index === 0} className="px-1 text-muted hover:text-cream disabled:opacity-30" aria-label="Дээш">
                      <FiChevronUp />
                    </button>
                    <button type="button" onClick={() => moveTrack(index, 1)} disabled={index === tracks.length - 1} className="px-1 text-muted hover:text-cream disabled:opacity-30" aria-label="Доош">
                      <FiChevronDown />
                    </button>
                  </div>
                  <span className="w-6 text-right text-sm text-muted">{index + 1}</span>
                  <input className="input min-w-40 flex-1 py-2" placeholder="Дууны нэр" value={t.title} onChange={(e) => updateTrack(t.key, 'title', e.target.value)} />
                  <input className="input w-24 py-2 text-center" placeholder="3:45" value={t.duration} onChange={(e) => updateTrack(t.key, 'duration', e.target.value)} />
                  <label className="btn btn-ghost btn-sm cursor-pointer">
                    <FiMusic />
                    {t.file ? t.file.name.slice(0, 14) : t.preview_url ? 'Preview солих' : 'Preview'}
                    <input type="file" accept={AUDIO_RULES.accept} className="hidden" onChange={(e) => selectTrackFile(t.key, e.target.files?.[0])} />
                  </label>
                  <button type="button" onClick={() => setTracks((list) => list.filter((x) => x.key !== t.key))} className="p-2 text-muted hover:text-red-600" aria-label="Устгах">
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
          )}
          {errors.tracks && <p className="mt-3 text-sm text-red-600">{errors.tracks}</p>}
        </section>
      )}

      <section className="card mt-6 p-6">
        <h2 className="mb-5 font-bold">Зураг</h2>
        <ImageUpload
          label="Нүүр зураг"
          currentUrl={form.cover_url}
          onFileChange={setCoverFile}
          onClear={() => setForm((f) => ({ ...f, cover_url: '' }))}
        />

        <div className="mt-6">
          <span className="mb-2 block text-sm font-medium">Нэмэлт зургууд</span>
          <div className="flex flex-wrap gap-3">
            {images.map((img) => (
              <div key={img.key} className="relative h-24 w-24 overflow-hidden rounded-xl border border-line">
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(img)}
                  className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-red-600"
                  aria-label="Хасах"
                >
                  <FiX className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-line text-muted hover:border-soft">
              <FiPlus className="h-6 w-6" />
              <input type="file" accept={IMAGE_RULES.accept} multiple className="hidden" onChange={addImages} />
            </label>
          </div>
        </div>
      </section>


      {!isAlbum && (
        <section className="card mt-6 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold">Хэмжээ, өнгө ба нөөц</h2>
              <p className="text-xs text-muted">Хэмжээ, өнгө тус бүрийг нэг мөрөөр. Pin мэт нэг төрлийн бараанд нэг мөр хангалттай.</p>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setVariants((list) => [...list, newVariant('merch')])}>
              <FiPlus /> Нэмэх
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="table-base min-w-[520px]">
              <thead>
                <tr>
                  <th>Хэмжээ</th>
                  <th>Өнгө</th>
                  <th>Нөөц</th>
                  <th>Идэвхтэй</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr key={v.key}>
                    <td>
                      <input className="input py-2" placeholder="M" value={v.size} onChange={(e) => updateVariant(v.key, 'size', e.target.value)} />
                    </td>
                    <td>
                      <input className="input py-2" placeholder="Хар" value={v.color} onChange={(e) => updateVariant(v.key, 'color', e.target.value)} />
                    </td>
                    <td>
                      <input type="number" min="0" step="1" className="input w-24 py-2" value={v.stock} onChange={(e) => updateVariant(v.key, 'stock', e.target.value)} />
                    </td>
                    <td>
                      <input type="checkbox" className="h-4 w-4 accent-[#1f4e8c]" checked={v.is_active} onChange={(e) => updateVariant(v.key, 'is_active', e.target.checked)} />
                    </td>
                    <td>
                      <button type="button" onClick={() => removeVariant(v)} className="p-2 text-muted hover:text-red-600" aria-label="Устгах">
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {errors.variants && <p className="mt-3 text-sm text-red-600">{errors.variants}</p>}
        </section>
      )}

      <div className="mt-8 flex justify-end gap-3">
        <Link to="/admin/products" className="btn btn-ghost">Болих</Link>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving && <Spinner className="h-4 w-4" />}
          Хадгалах
        </button>
      </div>
    </form>
  )
}
