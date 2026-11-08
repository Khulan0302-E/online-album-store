import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { FiPause, FiPlay } from 'react-icons/fi'
import { formatDuration } from '../../lib/format'

export default function TrackList({ tracks }) {
  const audioRef = useRef(null)
  const [playingId, setPlayingId] = useState(null)

  const sorted = [...tracks].sort((a, b) => a.track_no - b.track_no)

  const toggle = async (track) => {
    const audio = audioRef.current
    if (playingId === track.id) {
      audio.pause()
      setPlayingId(null)
      return
    }
    audio.src = track.preview_url
    try {
      await audio.play()
      setPlayingId(track.id)
    } catch {
      toast.error('Дууг тоглуулж чадсангүй')
    }
  }

  return (
    <div className="card divide-y divide-line">
      {sorted.map((track) => (
        <div key={track.id} className="flex items-center gap-4 px-4 py-3">
          <span className="w-6 text-right text-sm text-muted">{track.track_no}</span>
          {track.preview_url ? (
            <button
              type="button"
              onClick={() => toggle(track)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/30 text-soft hover:bg-brand hover:text-white"
              aria-label={playingId === track.id ? 'Зогсоох' : '30 секунд сонсох'}
            >
              {playingId === track.id ? <FiPause className="h-3.5 w-3.5" /> : <FiPlay className="ml-0.5 h-3.5 w-3.5" />}
            </button>
          ) : (
            <span className="h-8 w-8 shrink-0" />
          )}
          <span className="flex-1 truncate text-sm">{track.title}</span>
          <span className="text-sm text-muted">{formatDuration(track.duration_sec)}</span>
        </div>
      ))}
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />
    </div>
  )
}
