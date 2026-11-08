import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { getErrorMessage } from '../../lib/format'
import { useAuth } from '../../context/AuthContext'
import Field from '../../components/ui/Field'
import Spinner from '../../components/ui/Spinner'
import { PageSpinner } from '../../components/ui/Spinner'
import AuthCard from './AuthCard'

export default function ResetPassword() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <PageSpinner />

  if (!user) {
    return (
      <AuthCard title="Холбоос хүчингүй" subtitle="Сэргээх холбоосын хугацаа дууссан эсвэл буруу байна.">
        <Link to="/forgot-password" className="btn btn-primary w-full">Дахин илгээх</Link>
      </AuthCard>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const next = {}
    if (password.length < 6) next.password = 'Нууц үг 6-аас доошгүй тэмдэгттэй байна'
    if (password !== confirm) next.confirm = 'Нууц үг таарахгүй байна'
    setErrors(next)
    if (Object.keys(next).length) return

    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSubmitting(false)

    if (error) {
      toast.error(getErrorMessage(error))
      return
    }
    toast.success('Нууц үг шинэчлэгдлээ')
    navigate('/', { replace: true })
  }

  return (
    <AuthCard title="Шинэ нууц үг" subtitle="Шинэ нууц үгээ оруулна уу">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Шинэ нууц үг" error={errors.password}>
          <input type="password" className="input" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Нууц үг давтах" error={errors.confirm}>
          <input type="password" className="input" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
          {submitting && <Spinner className="h-4 w-4" />}
          Хадгалах
        </button>
      </form>
    </AuthCard>
  )
}
