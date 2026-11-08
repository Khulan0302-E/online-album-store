import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi'
import { supabase } from '../../lib/supabase'
import { getErrorMessage } from '../../lib/format'
import { uploadFile } from '../../lib/storage'
import ImageUpload from '../../components/admin/ImageUpload'
import CoverImage from '../../components/ui/CoverImage'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Field from '../../components/ui/Field'
import Modal from '../../components/ui/Modal'
import Spinner, { PageSpinner } from '../../components/ui/Spinner'
import { EmptyState, ErrorState } from '../../components/ui/States'

const EMPTY = { id: null, name: '', bio: '', image_url: '' }

export default function AdminArtists() {
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [editing, setEditing] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    const { data, error: apiError } = await supabase
      .from('artists')
      .select('id, name, bio, image_url, products(count)')
      .order('name')
    setLoading(false)
    if (apiError) setError(getErrorMessage(apiError))
    else setArtists(data)
  }

  useEffect(() => {
    load()
  }, [])

  const openForm = (artist) => {
    setEditing(artist ? { id: artist.id, name: artist.name, bio: artist.bio ?? '', image_url: artist.image_url ?? '' } : EMPTY)
    setImageFile(null)
    setFormError('')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (editing.name.trim().length < 2) {
      setFormError('Нэр 2-оос доошгүй тэмдэгттэй байна')
      return
    }
    setSaving(true)
    try {
      let imageUrl = editing.image_url || null
      if (imageFile) imageUrl = await uploadFile('images', 'artists', imageFile)

      const payload = { name: editing.name.trim(), bio: editing.bio.trim() || null, image_url: imageUrl }
      const { error: apiError } = editing.id
        ? await supabase.from('artists').update(payload).eq('id', editing.id)
        : await supabase.from('artists').insert(payload)
      if (apiError) throw apiError

      toast.success('Хадгалагдлаа')
      setEditing(null)
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    setBusy(true)
    const { error: apiError } = await supabase.from('artists').delete().eq('id', deleting.id)
    setBusy(false)
    if (apiError) {
      toast.error(apiError.code === '23503' ? 'Бүтээгдэхүүнтэй уран бүтээлчийг устгах боломжгүй' : getErrorMessage(apiError))
      return
    }
    toast.success('Устгагдлаа')
    setDeleting(null)
    load()
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Уран бүтээлч</h1>
        <button type="button" className="btn btn-primary" onClick={() => openForm(null)}>
          <FiPlus /> Шинэ
        </button>
      </div>

      {loading ? (
        <PageSpinner />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : artists.length === 0 ? (
        <EmptyState
          title="Уран бүтээлч алга"
          message="Бүтээгдэхүүн нэмэхээс өмнө уран бүтээлч үүсгэнэ."
          action={<button type="button" className="btn btn-primary" onClick={() => openForm(null)}>Нэмэх</button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {artists.map((artist) => (
            <div key={artist.id} className="card flex items-center gap-4 p-4">
              <CoverImage src={artist.image_url} alt={artist.name} className="h-14 w-14 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{artist.name}</p>
                <p className="text-xs text-muted">{artist.products?.[0]?.count ?? 0} бүтээгдэхүүн</p>
              </div>
              <button type="button" onClick={() => openForm(artist)} className="p-2 text-muted hover:text-cream" aria-label="Засах">
                <FiEdit2 />
              </button>
              <button type="button" onClick={() => setDeleting(artist)} className="p-2 text-muted hover:text-red-600" aria-label="Устгах">
                <FiTrash2 />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={Boolean(editing)} onClose={() => !saving && setEditing(null)} title={editing?.id ? 'Уран бүтээлч засах' : 'Шинэ уран бүтээлч'}>
        {editing && (
          <form onSubmit={handleSave} className="space-y-4" noValidate>
            <ImageUpload
              rounded
              currentUrl={editing.image_url}
              onFileChange={setImageFile}
              onClear={() => setEditing((a) => ({ ...a, image_url: '' }))}
            />
            <Field label="Нэр" error={formError}>
              <input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </Field>
            <Field label="Танилцуулга">
              <textarea rows={4} className="input" value={editing.bio} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} />
            </Field>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)} disabled={saving}>Болих</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving && <Spinner className="h-4 w-4" />}
                Хадгалах
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Уран бүтээлч устгах уу?"
        message={deleting ? `"${deleting.name}" устгагдана. Энэ үйлдлийг буцаах боломжгүй.` : ''}
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
