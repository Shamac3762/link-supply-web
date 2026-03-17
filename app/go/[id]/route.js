import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  // 1. Wait for the ID from the URL (e.g., /go/LS-001)
  const { id } = await params 
  
  // 2. Connect to your Supabase project using the keys we put in Vercel
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  // 3. Search your table for a matching ID
  const { data, error } = await supabase
    .from('nfc_stickers')
    .select('target_url')
    .eq('id', id)
    .single()

  // 4. If we found a link, send the user there immediately
  if (data?.target_url) {
    return NextResponse.redirect(new URL(data.target_url))
  }

  // 5. If no ID is found (or error), send them back to your homepage
  console.error("Redirect error or ID not found:", error)
  return NextResponse.redirect(new URL('/', request.url))
}
