import ProductCard from './ProductCard'

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square rounded-2xl bg-elevated" />
          <div className="mt-3 h-3 w-1/3 rounded bg-elevated" />
          <div className="mt-2 h-4 w-3/4 rounded bg-elevated" />
          <div className="mt-2 h-3 w-1/2 rounded bg-elevated" />
        </div>
      ))}
    </div>
  )
}

export default function ProductGrid({ products }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
