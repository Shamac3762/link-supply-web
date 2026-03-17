import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  const { id } = params
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { data } = await supabase.from('nfc_stickers').select('target_url').eq('id', id).single()
  if (data?.target_url) return NextResponse.redirect(data.target_url)
  return NextResponse.redirect(new URL('/', request.url))
}
