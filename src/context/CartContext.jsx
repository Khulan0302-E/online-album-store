import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { getErrorMessage, variantPrice } from '../lib/format'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

const CART_SELECT = `
  qty,
  variant_id,
  variant:product_variants (
    id, size, color, format, stock, price_override, is_active,
    product:products ( id, title, price, cover_url, type )
  )
`

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const loadCart = useCallback(async () => {
    if (!user) {
      setItems([])
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('cart_items')
      .select(CART_SELECT)
      .eq('user_id', user.id)
      .order('created_at')
    setLoading(false)

    if (error) {
      toast.error(getErrorMessage(error))
      return
    }
    setItems(data.filter((item) => item.variant?.product))
  }, [user])

  useEffect(() => {
    loadCart()
  }, [loadCart])

  const addItem = async (variantId, qty = 1) => {
    const existing = items.find((item) => item.variant_id === variantId)
    const newQty = Math.min((existing?.qty ?? 0) + qty, 10)
    const { error } = await supabase
      .from('cart_items')
      .upsert({ user_id: user.id, variant_id: variantId, qty: newQty })
    if (error) throw error
    await loadCart()
  }

  const updateQty = async (variantId, qty) => {
    const { error } = await supabase
      .from('cart_items')
      .update({ qty })
      .eq('user_id', user.id)
      .eq('variant_id', variantId)
    if (error) throw error
    await loadCart()
  }

  const removeItem = async (variantId) => {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)
      .eq('variant_id', variantId)
    if (error) throw error
    await loadCart()
  }

  const count = items.reduce((sum, item) => sum + item.qty, 0)
  const total = items.reduce((sum, item) => sum + item.qty * variantPrice(item.variant, item.variant.product), 0)
  const needsShipping = items.some((item) => item.variant.format !== 'digital')

  const value = { items, loading, count, total, needsShipping, addItem, updateQty, removeItem, reload: loadCart }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart-г CartProvider дотор ашиглана')
  return context
}
