import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  const { id } = await params;

  // 1. Standard Client (For reading public data safely)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // 2. Admin Client (For bypassing RLS to forcefully update analytics)
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  // 🔥 STEP 1: Look up the hardware using 'url_slug'
  const { data: tag, error } = await supabase
    .from('nfc_stickers') 
    .select('*')
    .eq('url_slug', id) 
    .single()

  if (error || !tag) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 🔥 STEP 2: THE KILL-SWITCH
  if (tag.is_active === false) {
    return NextResponse.redirect(new URL('/', request.url)) 
  }

  // 🔥 STEP 3: Is it a blank, unactivated tag?
  if (!tag.owner_id) {
    return NextResponse.redirect(new URL(`/claim/${id}`, request.url))
  }

  // 🔥 STEP 4: The Analytics Fix (Uses the Admin Key to bypass security blocks)
  if (supabaseAdmin) {
    await supabaseAdmin
      .from('nfc_stickers')
      .update({
        tap_count: (tag.tap_count || 0) + 1,
        last_tapped_at: new Date().toISOString()
      })
      .eq('id', tag.id) 
  }

  // 🔥 STEP 5: Smart Routing (Custom URL vs LinkSupply Profile)
  let destination = '/'

  if (tag.target_url && tag.target_url.trim() !== '') {
    // A. They typed in an external link (e.g. google.com or their car build sheet)
    destination = tag.target_url
    // Safety check: Ensure it has http:// so Next.js doesn't break the redirect
    if (!destination.startsWith('http')) {
      destination = `https://${destination}`
    }
    return NextResponse.redirect(new URL(destination))
    
  } else {
    // B. The box is blank, so route them to their LinkSupply Business Card
    const { data: customer } = await supabase
      .from('customers')
      .select('username')
      .eq('id', tag.owner_id)
      .single()

    if (customer && customer.username) {
      destination = `/u/${customer.username}`
    }
    
    // Internal routes need the base URL to redirect properly
    return NextResponse.redirect(new URL(destination, request.url))
  }
}
