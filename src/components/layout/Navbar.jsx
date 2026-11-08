import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { FiLogOut, FiMenu, FiPackage, FiSettings, FiShoppingBag, FiUser, FiX } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import Logo from '../ui/Logo'

const NAV_LINKS = [
  { to: '/shop', label: 'Дэлгүүр' },
  { to: '/shop?type=album', label: 'Пянз' },
  { to: '/shop?type=merch', label: 'Мерч' },
  { to: '/artists', label: 'Уран бүтээлчид' },
]

function navClass({ isActive }) {
  return `text-sm font-medium transition ${isActive ? 'text-cream' : 'text-muted hover:text-cream'}`
}

function isLinkActive(link, location) {
  const [path, query = ''] = link.to.split('?')
  if (location.pathname !== path) return false
  const type = new URLSearchParams(location.search).get('type') ?? ''
  return type === (new URLSearchParams(query).get('type') ?? '')
}

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth()
  const { count } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname, location.search])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className={navClass({ isActive: isLinkActive(link, location) })}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/cart" className="relative rounded-full p-2 text-muted hover:text-cream" aria-label="Сагс">
            <FiShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="hidden items-center gap-1 md:flex">
              {isAdmin && (
                <Link to="/admin" className="rounded-full p-2 text-muted hover:text-cream" title="Админ">
                  <FiSettings className="h-5 w-5" />
                </Link>
              )}
              <Link to="/orders" className="rounded-full p-2 text-muted hover:text-cream" title="Захиалгууд">
                <FiPackage className="h-5 w-5" />
              </Link>
              <Link to="/profile" className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-muted hover:text-cream">
                <FiUser className="h-4 w-4" />
                <span className="max-w-28 truncate">{profile?.full_name || 'Профайл'}</span>
              </Link>
              <button type="button" onClick={handleSignOut} className="rounded-full p-2 text-muted hover:text-cream" title="Гарах">
                <FiLogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link to="/login" className="btn btn-ghost btn-sm">Нэвтрэх</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Бүртгүүлэх</Link>
            </div>
          )}

          <button
            type="button"
            className="rounded-full p-2 text-muted hover:text-cream md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Цэс"
          >
            {menuOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-line md:hidden">
          <nav className="container-page flex flex-col gap-4 py-5">
            {NAV_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className={navClass({ isActive: isLinkActive(link, location) })}>
                {link.label}
              </Link>
            ))}
            <div className="my-1 border-t border-line" />
            {user ? (
              <>
                {isAdmin && <NavLink to="/admin" className={navClass}>Админ самбар</NavLink>}
                <NavLink to="/orders" className={navClass}>Миний захиалгууд</NavLink>
                <NavLink to="/profile" className={navClass}>Профайл</NavLink>
                <button type="button" onClick={handleSignOut} className="text-left text-sm font-medium text-muted hover:text-cream">
                  Гарах
                </button>
              </>
            ) : (
              <div className="flex gap-3">
                <Link to="/login" className="btn btn-ghost btn-sm flex-1">Нэвтрэх</Link>
                <Link to="/register" className="btn btn-primary btn-sm flex-1">Бүртгүүлэх</Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
