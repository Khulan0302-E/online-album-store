import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiSearch } from 'react-icons/fi'
import { supabase } from '../../lib/supabase'
import { formatDate, getErrorMessage } from '../../lib/format'
import { useAuth } from '../../context/AuthContext'
import useDebounce from '../../hooks/useDebounce'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Pagination from '../../components/ui/Pagination'
import { PageSpinner } from '../../components/ui/Spinner'
import { EmptyState, ErrorState } from '../../components/ui/States'

const PAGE_SIZE = 20

export default function AdminUsers() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [changing, setChanging] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setPage(1)
  }, [debounced])

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      setError(null)
      let query = supabase
        .from('profiles')
        .select('id, email, full_name, phone, role, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

      const term = debounced.trim().replace(/[,()]/g, '')
      if (term) query = query.or(`email.ilike.%${term}%,full_name.ilike.%${term}%`)

      const { data, count, error: apiError } = await query
      if (ignore) return
      setLoading(false)
      if (apiError) {
        setError(getErrorMessage(apiError))
        return
      }
      setUsers(data)
      setTotal(count ?? 0)
    }
    load()
    return () => {
      ignore = true
    }
  }, [debounced, page, reloadKey])

  const confirmRoleChange = async () => {
    setBusy(true)
    const { error: apiError } = await supabase.from('profiles').update({ role: changing.role }).eq('id', changing.user.id)
    setBusy(false)
    if (apiError) {
      toast.error(getErrorMessage(apiError))
      return
    }
    toast.success('Эрх шинэчлэгдлээ')
    setUsers((list) => list.map((u) => (u.id === changing.user.id ? { ...u, role: changing.role } : u)))
    setChanging(null)
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Хэрэглэгч</h1>
        <div className="relative sm:w-72">
          <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input type="search" className="input pl-10" placeholder="Имэйл, нэрээр хайх…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <PageSpinner />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : users.length === 0 ? (
        <EmptyState title="Хэрэглэгч олдсонгүй" />
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Хэрэглэгч</th>
                  <th>Утас</th>
                  <th>Бүртгүүлсэн</th>
                  <th>Эрх</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <p className="font-medium">{u.full_name || '—'}</p>
                      <p className="text-xs text-muted">{u.email}</p>
                    </td>
                    <td className="text-muted">{u.phone || '—'}</td>
                    <td className="whitespace-nowrap text-muted">{formatDate(u.created_at)}</td>
                    <td>
                      <select
                        className="input w-36 py-2"
                        value={u.role}
                        disabled={u.id === user.id}
                        title={u.id === user.id ? 'Өөрийн эрхийг өөрчлөх боломжгүй' : undefined}
                        onChange={(e) => setChanging({ user: u, role: e.target.value })}
                      >
                        <option value="user">Хэрэглэгч</option>
                        <option value="admin">Админ</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} onChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={Boolean(changing)}
        title="Эрх өөрчлөх үү?"
        message={changing ? `${changing.user.email} хэрэглэгчийг "${changing.role === 'admin' ? 'Админ' : 'Хэрэглэгч'}" болгоно.` : ''}
        confirmText="Өөрчлөх"
        danger={false}
        loading={busy}
        onConfirm={confirmRoleChange}
        onCancel={() => setChanging(null)}
      />
    </div>
  )
}
