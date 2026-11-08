import { useEffect, useRef, useState } from 'react'
import { FiImage, FiX } from 'react-icons/fi'
import { IMAGE_RULES, validateFile } from '../../lib/storage'

export default function ImageUpload({ currentUrl, onFileChange, onClear, label = 'Зураг', rounded = false }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const handleChange = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const validationError = validateFile(file, IMAGE_RULES)
    if (validationError) {
      setError(validationError)
      return
    }
    setError('')
    setPreview(URL.createObjectURL(file))
    onFileChange(file)
  }

  const handleClear = () => {
    setPreview(null)
    onFileChange(null)
    onClear?.()
  }

  const shown = preview ?? currentUrl
  const shape = rounded ? 'rounded-full' : 'rounded-2xl'

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-cream/90">{label}</span>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden border-2 border-dashed border-line bg-elevated text-muted transition hover:border-soft ${shape}`}
        >
          {shown ? <img src={shown} alt="" className="h-full w-full object-cover" /> : <FiImage className="h-7 w-7" />}
        </button>
        <div className="space-y-2 text-xs text-muted">
          <p>JPG, PNG, WEBP · 5MB хүртэл</p>
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => inputRef.current?.click()}>
              {shown ? 'Солих' : 'Сонгох'}
            </button>
            {shown && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleClear}>
                <FiX /> Хасах
              </button>
            )}
          </div>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <input ref={inputRef} type="file" accept={IMAGE_RULES.accept} className="hidden" onChange={handleChange} />
    </div>
  )
}
