import { Link } from 'react-router-dom'

const TABS = [
  { value: '', label: 'Бүгд', to: '/shop' },
  { value: 'album', label: 'Пянз', to: '/shop?type=album' },
  { value: 'merch', label: 'Мерч', to: '/shop?type=merch' },
]

export default function ShopTypeTabs({ active = '' }) {
  return (
    <nav className="inline-flex rounded-full border border-line bg-surface p-1" aria-label="Бүтээгдэхүүний төрөл">
      {TABS.map((tab) => (
        <Link
          key={tab.value}
          to={tab.to}
          aria-current={active === tab.value ? 'page' : undefined}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
            active === tab.value ? 'bg-brand text-white' : 'text-muted hover:text-cream'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
