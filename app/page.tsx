import { supabase } from '@/lib/supabase'

export default async function Home() {
  const { data: albums, error } = await supabase.from('albums').select('*')

  if (error) return <p>Алдаа: {error.message}</p>

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Online Album Store</h1>
      {albums?.map((a) => (
        <div key={a.id} className="border rounded p-4 mb-2">
          <h2 className="font-bold">{a.title}</h2>
          <p>{a.artist} - ${a.price}</p>
        </div>
      ))}
    </main>
  )
}