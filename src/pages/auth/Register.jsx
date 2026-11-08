import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { getErrorMessage } from '../../lib/format'
import { useAuth } from '../../context/AuthContext'
import Field from '../../components/ui/Field'
import Spinner from '../../components/ui/Spinner'
import AuthCard from './AuthCard'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Register() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [sentTo, setSentTo] = useState('')

  if (user && !submitting) return <Navigate to="/" replace />

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const validate = () => {
    const next = {}
    if (form.fullName.trim().length < 2) next.fullName = 'Нэрээ оруулна уу'
    if (!EMAIL_RE.test(form.email)) next.email = 'Имэйл хаяг буруу байна'
    if (form.password.length < 6) next.password = 'Нууц үг 6-аас доошгүй тэмдэгттэй байна'
    if (form.password !== form.confirm) next.confirm = 'Нууц үг таарахгүй байна'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: { full_name: form.fullName.trim() },
        emailRedirectTo: window.location.origin,
      },
    })
    setSubmitting(false)

    if (error) {
      toast.error(getErrorMessage(error))
      return
    }

    if (data.session) {
      toast.success('Бүртгэл амжилттай үүслээ')
      navigate('/', { replace: true })
    } else {
      setSentTo(form.email.trim())
    }
  }

  if (sentTo) {
    return (
      <AuthCard title="Имэйлээ шалгана уу" subtitle={`${sentTo} хаяг руу баталгаажуулах холбоос илгээлээ.`}>
        <Link to="/login" className="btn btn-primary w-full">Нэвтрэх хуудас руу</Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Бүртгүүлэх"
      subtitle="Захиалга хийж, түүхээ хянахын тулд бүртгүүлнэ үү"
      footer={
        <>
          Бүртгэлтэй юу?{' '}
          <Link to="/login" className="font-semibold text-soft hover:underline">Нэвтрэх</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Овог нэр" error={errors.fullName}>
          <input className="input" autoComplete="name" value={form.fullName} onChange={set('fullName')} />
        </Field>
        <Field label="Имэйл" error={errors.email}>
          <input type="email" className="input" autoComplete="email" value={form.email} onChange={set('email')} />
        </Field>
        <Field label="Нууц үг" error={errors.password}>
          <input type="password" className="input" autoComplete="new-password" value={form.password} onChange={set('password')} />
        </Field>
        <Field label="Нууц үг давтах" error={errors.confirm}>
          <input type="password" className="input" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
        </Field>
        <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
          {submitting && <Spinner className="h-4 w-4" />}
          Бүртгүүлэх
        </button>
      </form>
    </AuthCard>
  )
}
