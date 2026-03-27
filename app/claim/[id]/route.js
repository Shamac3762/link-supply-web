import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  const { id } = await params; // This grabs the 'd0b52053' slug from the NFC tap

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // 🔥 STEP 1: Look up the hardware using 'url_slug'
  const { data: tag, error } = await supabase
    .from('nfc_stickers') // Ensure this matches your table name exactly
    .select('*')
    .eq('url_slug', id) // <--- THE CRITICAL FIX
    .single()

  // If someone types a fake or broken link, send them to the homepage
  if (error || !tag) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 🔥 STEP 2: Is it a blank, unactivated tag?
  if (!tag.owner_id) {
    // Instantly route them to your claim page, passing the slug.
    return NextResponse.redirect(new URL(`/claim/${id}`, request.url))
  }

  // 🔥 STEP 3: The tag is active! Log the analytics in the background.
  await supabase
    .from('nfc_stickers')
    .update({
      tap_count: (tag.tap_count || 0) + 1,
      last_tapped_at: new Date().toISOString()
    })
    .eq('id', tag.id) // We update using the actual row ID for bulletproof database safety

  // 🔥 STEP 4: Redirect to the user's chosen destination (Direct Mode)
  // This honors whether they want their profile OR an external link like www.google.com!
  const destination = tag.target_url || '/'
  return NextResponse.redirect(new URL(destination))
}
