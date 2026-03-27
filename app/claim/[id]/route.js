import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  const { id } = await params; // This grabs the 'd0b52053' from the NFC tap

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // 🔥 STEP 1: Look up the hardware ID in your Supabase table
  const { data: tag, error } = await supabase
    .from('nfc_stickers') // Matches the table name from your claim code
    .select('*')
    .eq('id', id)
    .single()

  // If someone manually types a fake code, send them to the homepage
  if (error || !tag) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 🔥 STEP 2: Is it a blank, unactivated tag?
  if (!tag.owner_id) {
    // Instantly route them to your claim page. 
    // This auto-fills the ID in the URL exactly as you designed!
    return NextResponse.redirect(new URL(`/claim/${id}`, request.url))
  }

  // 🔥 STEP 3: The tag is active! Log the analytics in the background.
  await supabase
    .from('nfc_stickers')
    .update({
      tap_count: (tag.tap_count || 0) + 1,
      last_tapped_at: new Date().toISOString()
    })
    .eq('id', id)

  // 🔥 STEP 4: Redirect to the user's chosen destination (Direct Mode)
  // This will go to their /u/username OR to www.google.com depending on what they set!
  const destination = tag.target_url || '/'
  return NextResponse.redirect(new URL(destination))
}
