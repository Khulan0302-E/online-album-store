import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { getErrorMessage } from '../../lib/format'
import Field from '../../components/ui/Field'
import Spinner from '../../components/ui/Spinner'
import AuthCard from './AuthCard'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!EMAIL_RE.test(email)) {
      setError('Имэйл хаяг буруу байна')
      return
    }
    setError('')
    setSubmitting(true)
    const { error: apiError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setSubmitting(false)

    if (apiError) {
      toast.error(getErrorMessage(apiError))
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <AuthCard title="Имэйлээ шалгана уу" subtitle="Нууц үг сэргээх холбоосыг таны имэйл рүү илгээлээ.">
        <Link to="/login" className="btn btn-ghost w-full">Нэвтрэх хуудас руу буцах</Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Нууц үг сэргээх"
      subtitle="Бүртгэлтэй имэйлээ оруулбал сэргээх холбоос илгээнэ"
      footer={<Link to="/login" className="text-soft hover:underline">Нэвтрэх хуудас руу буцах</Link>}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Имэйл" error={error}>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
          {submitting && <Spinner className="h-4 w-4" />}
          Холбоос илгээх
        </button>
      </form>
    </AuthCard>
  )
}
