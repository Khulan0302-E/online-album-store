import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

function pageNumbers(page, totalPages) {
  const pages = new Set([1, totalPages, page - 1, page, page + 1])
  return [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)
}

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const numbers = pageNumbers(page, totalPages)

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Хуудаслалт">
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Өмнөх"
      >
        <FiChevronLeft />
      </button>
      {numbers.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - numbers[i - 1] > 1 && <span className="px-1 text-muted">…</span>}
          <button
            type="button"
            onClick={() => onChange(n)}
            className={`h-8 min-w-8 rounded-full px-2 text-sm font-semibold transition ${
              n === page ? 'bg-brand text-white' : 'text-muted hover:text-cream'
            }`}
          >
            {n}
          </button>
        </span>
      ))}
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Дараах"
      >
        <FiChevronRight />
      </button>
    </nav>
  )
}
