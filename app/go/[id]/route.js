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

  // If the tag isn't owned yet, route them to claim it with their 6-digit PIN
  if (!tag.owner_id) {
    return NextResponse.redirect(new URL(`/dashboard?claim=${id}`, request.url))
  }

  // --- ANALYTICS ENGINE ---
  if (supabaseAdmin) {
    // A. Update the master lifetime tap count
    await supabaseAdmin
      .from('nfc_stickers')
      .update({
        tap_count: (tag.tap_count || 0) + 1,
        last_tapped_at: new Date().toISOString()
      })
      .eq('id', tag.id) 

    // B. Log the individual tap for the dashboard charts
    const userAgent = request.headers.get('user-agent') || 'Unknown Device';
    
    await supabaseAdmin
      .from('nfc_taps')
      .insert({
        tag_id: tag.id, // FIXED: Now exactly matches your Supabase table
        owner_id: tag.owner_id,
        user_agent: userAgent // Added non-PII device tracking
      })
  }

  // --- DESTINATION ROUTING ---
  let destination = '/'

  // 1. If they have a custom direct link (like a restaurant menu or google.com)
  if (tag.target_url && tag.target_url.trim() !== '') {
    destination = tag.target_url
    if (!destination.startsWith('http')) {
      destination = `https://${destination}`
    }
    return NextResponse.redirect(new URL(destination))
    
  } else {
    // 2. Fallback to their built-in Link Supply profile
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
