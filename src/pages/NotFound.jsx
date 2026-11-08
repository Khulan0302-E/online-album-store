import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <img src="/khuvuu-mark.svg" alt="" className="mb-6 h-20 w-20 opacity-70" />
      <h1 className="text-5xl font-extrabold">404</h1>
      <p className="mt-2 text-muted">Хуудас олдсонгүй. Урсгалдаа хөвөөд төөрчихсөн бололтой.</p>
      <Link to="/" className="btn btn-primary mt-8">Нүүр хуудас</Link>
    </div>
  )
}
