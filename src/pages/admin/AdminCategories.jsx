import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi'
import { supabase } from '../../lib/supabase'
import { getErrorMessage } from '../../lib/format'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Field from '../../components/ui/Field'
import Modal from '../../components/ui/Modal'
import Spinner, { PageSpinner } from '../../components/ui/Spinner'
import { EmptyState, ErrorState } from '../../components/ui/States'

const TYPE_LABELS = { album: 'Пянз', merch: 'Мерч' }

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [editing, setEditing] = useState(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    const { data, error: apiError } = await supabase
      .from('categories')
      .select('id, name, type, products(count)')
      .order('type')
      .order('name')
    setLoading(false)
    if (apiError) setError(getErrorMessage(apiError))
    else setCategories(data)
  }

  useEffect(() => {
    load()
  }, [])

  const openForm = (category) => {
    setEditing(category ? { id: category.id, name: category.name, type: category.type } : { id: null, name: '', type: 'merch' })
    setFormError('')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const name = editing.name.trim()
    if (name.length < 2) {
      setFormError('Нэр 2-оос доошгүй тэмдэгттэй байна')
      return
    }
    setSaving(true)
    const payload = { name, type: editing.type }
    const { error: apiError } = editing.id
      ? await supabase.from('categories').update(payload).eq('id', editing.id)
      : await supabase.from('categories').insert(payload)
    setSaving(false)

    if (apiError) {
      if (apiError.code === '23505') setFormError('Ийм нэртэй ангилал аль хэдийн байна')
      else toast.error(getErrorMessage(apiError))
      return
    }
    toast.success('Хадгалагдлаа')
    setEditing(null)
    load()
  }

  const confirmDelete = async () => {
    setBusy(true)
    const { error: apiError } = await supabase.from('categories').delete().eq('id', deleting.id)
    setBusy(false)
    if (apiError) {
      toast.error(apiError.code === '23503' ? 'Бүтээгдэхүүнтэй ангиллыг устгах боломжгүй' : getErrorMessage(apiError))
      return
    }
    toast.success('Устгагдлаа')
    setDeleting(null)
    load()
  }

  const groups = ['album', 'merch'].map((type) => ({
    type,
    items: categories.filter((c) => c.type === type),
  }))

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Ангилал</h1>
        <button type="button" className="btn btn-primary" onClick={() => openForm(null)}>
          <FiPlus /> Шинэ ангилал
        </button>
      </div>

      {loading ? (
        <PageSpinner />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : categories.length === 0 ? (
        <EmptyState
          title="Ангилал алга"
          action={<button type="button" className="btn btn-primary" onClick={() => openForm(null)}>Нэмэх</button>}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {groups.map(({ type, items }) => (
            <section key={type} className="card">
              <h2 className="border-b border-line px-5 py-4 font-bold">{TYPE_LABELS[type]}</h2>
              {items.length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted">Ангилал алга</p>
              ) : (
                <ul className="divide-y divide-line">
                  {items.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="flex-1 font-medium">{c.name}</span>
                      <span className="text-xs text-muted">{c.products?.[0]?.count ?? 0} бүтээгдэхүүн</span>
                      <button type="button" onClick={() => openForm(c)} className="p-2 text-muted hover:text-cream" aria-label="Засах">
                        <FiEdit2 />
                      </button>
                      <button type="button" onClick={() => setDeleting(c)} className="p-2 text-muted hover:text-red-600" aria-label="Устгах">
                        <FiTrash2 />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => !saving && setEditing(null)}
        title={editing?.id ? 'Ангилал засах' : 'Шинэ ангилал'}
        size="max-w-md"
      >
        {editing && (
          <form onSubmit={handleSave} className="space-y-4" noValidate>
            <div>
              <span className="mb-1.5 block text-sm font-medium text-cream/90">Төрөл</span>
              <div className="flex gap-2">
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setEditing({ ...editing, type: value })}
                    className={`chip ${editing.type === value ? 'chip-active' : ''}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <Field label="Нэр" error={formError}>
              <input
                className="input"
                placeholder="Жишээ: Hoodie, Постер, Стикер"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                autoFocus
              />
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
        title="Ангилал устгах уу?"
        message={deleting ? `"${deleting.name}" ангилал устгагдана.` : ''}
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
