'use client'
import { useEffect } from 'react'
import { createClient } from '../../../utils/supabase/client'
import { useRouter, useParams } from 'next/navigation'

export default function ClaimRouter() {
  const params = useParams()
  const stickerId = params?.id // The URL slug
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const routeUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // Logged out? Go to signup, bring the slug.
        router.push(`/login?view=signup&claim=${stickerId}`) 
      } else {
        // Logged in? Go straight to dashboard, bring the slug.
        router.push(`/dashboard?claim=${stickerId}`)
      }
    }
    
    routeUser()
  }, [router, stickerId]) 

  // Just a simple loading screen while it decides where to send them (takes < 0.5s)
  return <div style={{ minHeight: '100vh', backgroundColor: '#111', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Connecting to secure vault...</div>
}
