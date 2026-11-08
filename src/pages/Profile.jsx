import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { getErrorMessage } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import Field from '../components/ui/Field'
import Spinner from '../components/ui/Spinner'

const PHONE_RE = /^[0-9]{8}$/

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm({ full_name: profile?.full_name ?? '', phone: profile?.phone ?? '' })
  }, [profile])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const next = {}
    if (form.full_name.trim().length < 2) next.full_name = 'Нэрээ оруулна уу'
    if (form.phone && !PHONE_RE.test(form.phone.trim())) next.phone = 'Утасны дугаар 8 оронтой тоо байна'
    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: form.full_name.trim(), phone: form.phone.trim() || null })
      .eq('id', user.id)
    setSaving(false)

    if (error) {
      toast.error(getErrorMessage(error))
      return
    }
    await refreshProfile()
    toast.success('Хадгалагдлаа')
  }

  return (
    <div className="container-page max-w-2xl py-10">
      <h1 className="mb-8 text-3xl font-bold">Профайл</h1>
      <form onSubmit={handleSubmit} className="card space-y-4 p-6" noValidate>
        <Field label="Имэйл">
          <input className="input opacity-60" value={user?.email ?? ''} disabled />
        </Field>
        <Field label="Овог нэр" error={errors.full_name}>
          <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </Field>
        <Field label="Утас" error={errors.phone}>
          <input className="input" inputMode="numeric" maxLength={8} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving && <Spinner className="h-4 w-4" />}
            Хадгалах
          </button>
        </div>
      </form>
    </div>
  )
}
