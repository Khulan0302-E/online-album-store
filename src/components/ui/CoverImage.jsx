export default function CoverImage({ src, alt, className = '' }) {
  if (src) {
    return <img src={src} alt={alt} loading="lazy" className={`object-cover ${className}`} />
  }

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-brand/60 via-surface to-ink ${className}`}
      aria-label={alt}
    >
      <img src="/khuvuu-mark.svg" alt="" className="w-1/3 opacity-40" />
    </div>
  )
}
