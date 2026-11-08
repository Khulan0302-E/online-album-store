import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="container-page flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <img src="/khuvuu-mark.svg" alt="" className="h-8 w-8" />
          <div>
            <p className="font-display font-bold">Хөвөө</p>
            <p className="text-xs text-muted">Пянз ба уран бүтээлчдийн мерч</p>
          </div>
        </div>
        <nav className="flex flex-wrap gap-5 text-sm text-muted">
          <Link to="/shop" className="hover:text-cream">Дэлгүүр</Link>
          <Link to="/artists" className="hover:text-cream">Уран бүтээлчид</Link>
          <Link to="/orders" className="hover:text-cream">Захиалга</Link>
        </nav>
        <p className="text-xs text-muted">© {new Date().getFullYear()} khuvuu.mn</p>
      </div>
    </footer>
  )
}
