import { Link } from 'react-router-dom'
import { formatPrice } from '../../lib/format'
import CoverImage from '../ui/CoverImage'

export default function ProductCard({ product }) {
  return (
    <Link to={`/products/${product.id}`} className="group block">
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <CoverImage
          src={product.cover_url}
          alt={product.title}
          className="aspect-square w-full transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="mt-3 space-y-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-soft">{product.category?.name}</p>
        <h3 className="line-clamp-1 font-sans font-semibold text-cream transition group-hover:text-soft">
          {product.title}
        </h3>
        <p className="line-clamp-1 text-sm text-muted">{product.artist?.name}</p>
        <p className="pt-1 font-semibold">{formatPrice(product.price)}</p>
      </div>
    </Link>
  )
}
