import { Link } from 'react-router-dom'

export default function Logo({ to = '/', className = '' }) {
  return (
    <Link to={to} className={`flex items-center gap-2.5 ${className}`}>
      <img src="/khuvuu-mark.svg" alt="" className="h-9 w-9" />
      <span className="font-display text-xl font-bold tracking-wide">Хөвөө</span>
    </Link>
  )
}
