import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('.env файлд VITE_SUPABASE_URL болон VITE_SUPABASE_ANON_KEY-г тохируулна уу')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
