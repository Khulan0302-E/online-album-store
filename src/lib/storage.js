import { supabase } from './supabase'

export const IMAGE_RULES = {
  maxSize: 5 * 1024 * 1024,
  types: ['image/jpeg', 'image/png', 'image/webp'],
  accept: '.jpg,.jpeg,.png,.webp',
}

export const AUDIO_RULES = {
  maxSize: 5 * 1024 * 1024,
  types: ['audio/mpeg'],
  accept: '.mp3',
}

export function validateFile(file, rules) {
  if (!rules.types.includes(file.type)) {
    return `Зөвхөн ${rules.accept} төрлийн файл оруулна`
  }
  if (file.size > rules.maxSize) {
    return `Файлын хэмжээ ${rules.maxSize / 1024 / 1024}MB-аас ихгүй байна`
  }
  return null
}

export async function uploadFile(bucket, folder, file) {
  const ext = file.name.split('.').pop().toLowerCase()
  const path = `${folder}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
