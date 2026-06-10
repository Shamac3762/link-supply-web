import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initiates standard connection to Supabase via admin bypass roles
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, // 🔥 THIS IS THE FIX 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error(`❌ Webhook Cryptographic Verification Failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Act on verified completed checkout signals
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id; // Unpacks the target database record identity

    if (userId) {
      console.log(`Upgrading permissions for profile row id: ${userId}`);
      
      // Matches the columns defined in your specific customer schema
      const { error } = await supabase
        .from('customers')
        .update({ 
          tier: 'pro',
          max_links: 100 // Dynamically unlocks link parameters from standard 2 limits
        })
        .eq('id', userId);

      if (error) {
        console.error("Database status injection failed:", error);
        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
      }
      
      console.log(`✅ User profile row ${userId} successfully flagged as PRO.`);
    }
  }

  return NextResponse.json({ received: true });
}
