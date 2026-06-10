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
        priceId = 'price_XXXXX_PASTE_YOUR_MONTHLY_ID'; 
      } else if (interval === 'year') {
        priceId = 'price_XXXXX_PASTE_YOUR_ANNUAL_ID'; 
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
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
