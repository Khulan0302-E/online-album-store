export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="container-page flex min-h-[75vh] items-center justify-center py-12">
      <div className="card w-full max-w-md p-7 sm:p-9">
        <img src="/khuvuu-mark.svg" alt="" className="mx-auto mb-5 h-12 w-12" />
        <h1 className="text-center text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1.5 text-center text-sm text-muted">{subtitle}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
      </div>
    </div>
  )
}
