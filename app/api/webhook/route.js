import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initiates standard connection to Supabase via admin bypass roles
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
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
    const userId = session.client_reference_id; 

    if (userId) {
      console.log(`Upgrading permissions for profile row id: ${userId}`);
      
      try {
        // Retrieve the exact items the customer bought from Stripe
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        const purchasedPriceId = lineItems.data[0]?.price?.id;

        let newTier = 'pro';
        let newMaxLinks = 5; // Default Pro limit

        // Map the Price ID to the exact Database Tier & Hardware Slots
        if (['price_1Ti9OmKGdZO7jtUpO5elGanH', 'price_1Ti9T3KGdZO7jtUpzt1Eqmnd'].includes(purchasedPriceId)) {
          newTier = 'business';
          newMaxLinks = 25;
        } else if (['price_1Ti9U2KGdZO7jtUpnHS7xFJF', 'price_1Ti9WQKGdZO7jtUph8CBWes7'].includes(purchasedPriceId)) {
          newTier = 'business';
          newMaxLinks = 50;
        } else if (['price_1Ti9XBKGdZO7jtUpSOzwOk0k', 'price_1Ti9XbKGdZO7jtUpCCjnqHLk'].includes(purchasedPriceId)) {
          newTier = 'business';
          newMaxLinks = 75;
        } else if (['price_1Ti9YEKGdZO7jtUpxdWpsBbS', 'price_1Ti9YjKGdZO7jtUpojitCDaS'].includes(purchasedPriceId)) {
          newTier = 'business';
          newMaxLinks = 150;
        }

        // Matches the columns defined in your specific customer schema
        const { error } = await supabase
          .from('customers')
          .update({ 
            tier: newTier,
            max_links: newMaxLinks 
          })
          .eq('id', userId);

        if (error) {
          console.error("Database status injection failed:", error);
          return NextResponse.json({ error: "Database update failed" }, { status: 500 });
        }
        
        console.log(`✅ User profile row ${userId} successfully upgraded to ${newTier} with ${newMaxLinks} slots.`);
      } catch (itemError) {
        console.error("Failed to retrieve line items or update DB:", itemError);
        return NextResponse.json({ error: "Failed to process tier upgrade" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
