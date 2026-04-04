import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    'Supabase env vars not set — run mcp__supabase__provision_database first. ' +
    'Queries will fail silently until VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are in .env.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)
