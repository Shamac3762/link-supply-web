import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  const { id } = await params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // 🔥 STEP 1: Look up the hardware using 'url_slug'
  const { data: tag, error } = await supabase
    .from('nfc_stickers') 
    .select('*')
    .eq('url_slug', id) 
    .single()

  if (error || !tag) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 🔥 STEP 2: THE KILL-SWITCH (NEW)
  // If the user disabled this tag in their dashboard, instantly bounce the tap.
  if (tag.is_active === false) {
    // You can redirect to your homepage, or a custom "Tag Disabled" page later
    return NextResponse.redirect(new URL('/', request.url)) 
  }

  // 🔥 STEP 3: Is it a blank, unactivated tag?
  if (!tag.owner_id) {
    return NextResponse.redirect(new URL(`/claim/${id}`, request.url))
  }

  // 🔥 STEP 4: The tag is active! Log the analytics in the background.
  await supabase
    .from('nfc_stickers')
    .update({
      tap_count: (tag.tap_count || 0) + 1,
      last_tapped_at: new Date().toISOString()
    })
    .eq('id', tag.id) 

  // 🔥 STEP 5: Redirect to the user's chosen destination
  const destination = tag.target_url || '/'
  return NextResponse.redirect(new URL(destination))
}
