import { Link, NavLink, Outlet } from 'react-router-dom'
import { FiArrowLeft, FiBox, FiGrid, FiMic, FiShoppingCart, FiTag, FiUsers } from 'react-icons/fi'
import Logo from '../ui/Logo'

const LINKS = [
  { to: '/admin', label: 'Хянах самбар', icon: FiGrid, end: true },
  { to: '/admin/products', label: 'Бүтээгдэхүүн', icon: FiBox },
  { to: '/admin/categories', label: 'Ангилал', icon: FiTag },
  { to: '/admin/artists', label: 'Уран бүтээлч', icon: FiMic },
  { to: '/admin/orders', label: 'Захиалга', icon: FiShoppingCart },
  { to: '/admin/users', label: 'Хэрэглэгч', icon: FiUsers },
]

function linkClass({ isActive }) {
  return `flex items-center gap-3 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
    isActive ? 'bg-brand/25 text-cream' : 'text-muted hover:bg-elevated hover:text-cream'
  }`
}

export default function AdminLayout() {
  return (
    <div className="min-h-screen lg:flex">
      <aside className="border-b border-line bg-surface lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-4 py-4 lg:px-5 lg:py-6">
          <Logo to="/admin" />
          <span className="rounded-full bg-brand/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-soft">
            Админ
          </span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
          <Link to="/" className="mt-0 flex items-center gap-3 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm text-muted hover:text-cream lg:mt-6">
            <FiArrowLeft className="h-4 w-4" />
            Дэлгүүр рүү
          </Link>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8">
        <Outlet />
      </main>
    </div>
  )
}
