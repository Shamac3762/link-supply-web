import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, planType, interval } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    let priceId = '';
    if (planType === 'pro') {
      if (interval === 'month') {
        // 🔥 REPLACE THIS STRING WITH YOUR ACTUAL PRICE ID STARTING WITH "price_"
        priceId = 'price_XXXXX_MONTHLY_HERE'; 
      } else if (interval === 'year') {
        // 🔥 REPLACE THIS STRING WITH YOUR ACTUAL PRICE ID STARTING WITH "price_"
        priceId = 'price_XXXXX_ANNUAL_HERE'; 
      }
    }

    if (!priceId) {
       return NextResponse.json({ error: "Invalid plan selection" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?checkout=canceled`,
      client_reference_id: userId, // Injects the user's DB identity straight into Stripe's response package
      metadata: { supabase_user_id: userId }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    // This will now pass Stripe's exact secret error message to your screen
    return NextResponse.json({ error: error.message }, { status: 500 }); 
  }
}
