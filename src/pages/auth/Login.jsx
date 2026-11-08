import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { getErrorMessage } from '../../lib/format'
import { useAuth } from '../../context/AuthContext'
import Field from '../../components/ui/Field'
import Spinner from '../../components/ui/Spinner'
import AuthCard from './AuthCard'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname ?? '/'

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  if (user && !submitting) return <Navigate to={from} replace />

  const validate = () => {
    const next = {}
    if (!EMAIL_RE.test(form.email)) next.email = 'Имэйл хаяг буруу байна'
    if (!form.password) next.password = 'Нууц үгээ оруулна уу'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    })
    setSubmitting(false)

    if (error) {
      toast.error(getErrorMessage(error))
      return
    }
    toast.success('Тавтай морил!')
    navigate(from, { replace: true })
  }

  return (
    <AuthCard
      title="Нэвтрэх"
      subtitle="Хөвөө-д тавтай морил"
      footer={
        <>
          Бүртгэлгүй юу?{' '}
          <Link to="/register" className="font-semibold text-soft hover:underline">Бүртгүүлэх</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Имэйл" error={errors.email}>
          <input
            type="email"
            className="input"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Нууц үг" error={errors.password}>
          <input
            type="password"
            className="input"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm text-soft hover:underline">Нууц үгээ мартсан уу?</Link>
        </div>
        <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
          {submitting && <Spinner className="h-4 w-4" />}
          Нэвтрэх
        </button>
      </form>
    </AuthCard>
  )
}
