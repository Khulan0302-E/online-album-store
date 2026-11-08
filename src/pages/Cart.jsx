import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiShoppingBag, FiTrash2 } from 'react-icons/fi'
import { formatPrice, getErrorMessage, variantLabel, variantPrice } from '../lib/format'
import { useCart } from '../context/CartContext'
import CoverImage from '../components/ui/CoverImage'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { PageSpinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/States'

export default function Cart() {
  const { items, loading, total, updateQty, removeItem } = useCart()
  const navigate = useNavigate()
  const [removing, setRemoving] = useState(null)
  const [busy, setBusy] = useState(false)

  const handleQty = async (item, qty) => {
    try {
      await updateQty(item.variant_id, qty)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const confirmRemove = async () => {
    setBusy(true)
    try {
      await removeItem(removing.variant_id)
      toast.success('Сагснаас хасагдлаа')
      setRemoving(null)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (loading && items.length === 0) return <PageSpinner />

  if (items.length === 0) {
    return (
      <div className="container-page py-12">
        <EmptyState
          icon={FiShoppingBag}
          title="Сагс хоосон байна"
          message="Таалагдсан цомог, мерчээ сагсандаа нэмээрэй."
          action={<Link to="/shop" className="btn btn-primary">Дэлгүүр хэсэх</Link>}
        />
      </div>
    )
  }

  const hasStockIssue = items.some((item) => item.variant.stock !== null && item.qty > item.variant.stock)

  return (
    <div className="container-page py-10">
      <h1 className="mb-8 text-3xl font-bold">Сагс</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="card divide-y divide-line">
          {items.map((item) => {
            const { variant } = item
            const product = variant.product
            const maxQty = Math.min(10, variant.stock ?? 10)
            const overStock = variant.stock !== null && item.qty > variant.stock

            return (
              <div key={item.variant_id} className="flex gap-4 p-4 sm:p-5">
                <Link to={`/products/${product.id}`} className="shrink-0">
                  <CoverImage src={product.cover_url} alt={product.title} className="h-20 w-20 rounded-xl sm:h-24 sm:w-24" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <Link to={`/products/${product.id}`} className="line-clamp-1 font-semibold hover:text-soft">{product.title}</Link>
                    <p className="text-sm text-muted">{variantLabel(variant)}</p>
                    <p className="mt-1 text-sm">{formatPrice(variantPrice(variant, product))}</p>
                    {overStock && (
                      <p className="mt-1 text-xs text-red-400">Нөөцөд {variant.stock} ширхэг л байна</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      className="input w-20 py-2"
                      value={item.qty}
                      onChange={(e) => handleQty(item, Number(e.target.value))}
                      aria-label="Тоо ширхэг"
                    >
                      {Array.from({ length: Math.max(maxQty, item.qty) }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <p className="w-28 text-right font-semibold">
                      {formatPrice(item.qty * variantPrice(variant, product))}
                    </p>
                    <button type="button" onClick={() => setRemoving(item)} className="p-2 text-muted hover:text-red-400" aria-label="Хасах">
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <aside className="card h-fit p-6">
          <h2 className="text-lg font-bold">Нийт дүн</h2>
          <div className="mt-4 flex justify-between text-sm text-muted">
            <span>Барааны тоо</span>
            <span>{items.reduce((s, i) => s + i.qty, 0)}</span>
          </div>
          <div className="mt-4 flex justify-between border-t border-line pt-4 text-lg font-bold">
            <span>Төлөх</span>
            <span>{formatPrice(total)}</span>
          </div>
          <button
            type="button"
            className="btn btn-primary mt-6 w-full"
            disabled={hasStockIssue}
            onClick={() => navigate('/checkout')}
          >
            Захиалах
          </button>
          {hasStockIssue && <p className="mt-3 text-xs text-red-400">Нөөцөөс хэтэрсэн тоо ширхэгийг засна уу.</p>}
        </aside>
      </div>

      <ConfirmDialog
        open={Boolean(removing)}
        title="Сагснаас хасах уу?"
        message={removing ? `"${removing.variant.product.title}" (${variantLabel(removing.variant)}) сагснаас хасагдана.` : ''}
        confirmText="Хасах"
        loading={busy}
        onConfirm={confirmRemove}
        onCancel={() => setRemoving(null)}
      />
    </div>
  )
}
