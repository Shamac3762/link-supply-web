import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Tell the server NEVER to cache this, so every single tap is counted!
export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  const { id } = await params 
  
  // THE FIX: We now use the secret Master Key so the counter updates for anyone!
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseMasterKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  const supabase = createClient(supabaseUrl, supabaseMasterKey)

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
    // Because we have the Master Key, this will now successfully update!
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
