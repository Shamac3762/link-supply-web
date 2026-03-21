import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  const { id } = await params 
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseMasterKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabase = createClient(supabaseUrl, supabaseMasterKey)

  const { data, error } = await supabase
    .from('nfc_stickers')
    .select('id, target_url, owner_id, tap_count')
    .eq('url_slug', id)
    .single()

  if (error || !data) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (!data.owner_id) {
    return NextResponse.redirect(new URL(`/dashboard?claim=${data.id}`, request.url))
  }

  if (data.target_url) {
    await supabase
      .from('nfc_stickers')
      .update({ 
        tap_count: (data.tap_count || 0) + 1,
        last_tapped_at: new Date().toISOString() 
      })
      .eq('id', data.id)

    return NextResponse.redirect(new URL(data.target_url))
  }

  return NextResponse.redirect(new URL('/login', request.url))
}
