import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  // This tiny database query counts as "activity" and prevents the 7-day pause!
  await supabase.from('nfc_stickers').select('id').limit(1)
  
  return NextResponse.json({ status: 'Database pinged successfully. Awake!' })
}
