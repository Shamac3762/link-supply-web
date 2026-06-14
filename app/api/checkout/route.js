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
    
    // Pro Tier - 5 Slots
    if (planType === 'pro') {
      if (interval === 'month') priceId = 'price_1TgjvKKGdZO7jtUpnfJgwf5C';
      else if (interval === 'year') priceId = 'price_1TgjwTKGdZO7jtUpAKol72fY';
    } 
    // Business Tier - 25 Slots
    else if (planType === 'business_25') {
      if (interval === 'month') priceId = 'price_1Ti9OmKGdZO7jtUpO5elGanH';
      else if (interval === 'year') priceId = 'price_1Ti9T3KGdZO7jtUpzt1Eqmnd';
    } 
    // Business Tier - 50 Slots
    else if (planType === 'business_50') {
      if (interval === 'month') priceId = 'price_1Ti9U2KGdZO7jtUpnHS7xFJF';
      else if (interval === 'year') priceId = 'price_1Ti9WQKGdZO7jtUph8CBWes7';
    } 
    // Business Tier - 75 Slots
    else if (planType === 'business_75') {
      if (interval === 'month') priceId = 'price_1Ti9XBKGdZO7jtUpSOzwOk0k';
      else if (interval === 'year') priceId = 'price_1Ti9XbKGdZO7jtUpCCjnqHLk';
    } 
    // Business Tier - 150 Slots
    else if (planType === 'business_150') {
      if (interval === 'month') priceId = 'price_1Ti9YEKGdZO7jtUpxdWpsBbS';
      else if (interval === 'year') priceId = 'price_1Ti9YjKGdZO7jtUpojitCDaS';
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
      client_reference_id: userId, 
      metadata: { supabase_user_id: userId }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 }); 
  }
}
