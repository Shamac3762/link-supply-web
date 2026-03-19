import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  const { id } = await params 
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const { data, error } = await supabase
    .from('nfc_stickers')
    .select('target_url, owner_id, tap_count')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (!data.owner_id) {
    return NextResponse.redirect(new URL(`/claim/${id}`, request.url))
  }

  if (data.target_url) {
    // 🔥 PREMIUM ANALYTICS: Add +1 to the count and stamp the exact current time
    await supabase
      .from('nfc_stickers')
      .update({ 
        tap_count: (data.tap_count || 0) + 1,
        last_tapped_at: new Date().toISOString() 
      })
      .eq('id', id)

    return NextResponse.redirect(new URL(data.target_url))
  }

  return NextResponse.redirect(new URL('/login', request.url))
}
