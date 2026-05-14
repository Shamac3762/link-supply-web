import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  const { id } = await params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  const { data: tag, error } = await supabase
    .from('nfc_stickers') 
    .select('*')
    .eq('url_slug', id) 
    .single()

  if (error || !tag) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (tag.is_active === false) {
    return NextResponse.redirect(new URL('/', request.url)) 
  }

  // 🔥 UPDATED: This now sends them directly to your new Dashboard UI to enter their 6-Digit PIN
  if (!tag.owner_id) {
    return NextResponse.redirect(new URL(`/dashboard?claim=${id}`, request.url))
  }

  // 🔥 STEP 4: The Analytics Fix
  if (supabaseAdmin) {
    // A. Update the master count
    await supabaseAdmin
      .from('nfc_stickers')
      .update({
        tap_count: (tag.tap_count || 0) + 1,
        last_tapped_at: new Date().toISOString()
      })
      .eq('id', tag.id) 

    // B. LOG THE EVENT (This powers your new live graph)
    await supabaseAdmin
      .from('nfc_taps')
      .insert({
        sticker_id: tag.id,
        owner_id: tag.owner_id
      })
  }

  let destination = '/'

  if (tag.target_url && tag.target_url.trim() !== '') {
    destination = tag.target_url
    if (!destination.startsWith('http')) {
      destination = `https://${destination}`
    }
    return NextResponse.redirect(new URL(destination))
    
  } else {
    const { data: customer } = await supabase
      .from('customers')
      .select('username')
      .eq('id', tag.owner_id)
      .single()

    if (customer && customer.username) {
      destination = `/u/${customer.username}`
    }
    return NextResponse.redirect(new URL(destination, request.url))
  }
}
