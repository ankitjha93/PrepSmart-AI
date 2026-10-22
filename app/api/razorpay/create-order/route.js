import { NextResponse } from 'next/server';
import { PLAN_TIERS } from '@/utils/planData';

/**
 * POST /api/razorpay/create-order
 * Creates an authenticated Razorpay order for subscription checkout.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { planId, billingCycle = 'annual', currency = 'INR' } = body;

    const plan = PLAN_TIERS.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json({ success: false, error: 'Invalid plan selected' }, { status: 400 });
    }

    if (plan.id === 'starter') {
      return NextResponse.json({ success: false, error: 'Starter plan is free forever' }, { status: 400 });
    }

    const cur = currency.toUpperCase() === 'USD' ? 'USD' : 'INR';
    const pricing = plan.pricing?.[cur] || { monthly: plan.monthlyCost, annual: plan.annualCost };
    const perMonth = billingCycle === 'annual' ? pricing.annual : pricing.monthly;
    const finalAmount = billingCycle === 'annual' ? perMonth * 12 : perMonth;

    // Smallest currency unit (paise for INR, cents for USD)
    const amountInSubunits = Math.round(finalAmount * 100);

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Live or Test Razorpay Order Generation via REST API
    if (keyId && keySecret && !keyId.includes('your_key_id')) {
      const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${basicAuth}`,
        },
        body: JSON.stringify({
          amount: amountInSubunits,
          currency: cur,
          receipt: `rcpt_${planId}_${Date.now().toString().slice(-8)}`,
          notes: {
            planId,
            planName: plan.name,
            billingCycle,
            app: 'PrepSmart AI',
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Razorpay Order API Error:', errorData);
        return NextResponse.json(
          { success: false, error: errorData?.error?.description || 'Could not create Razorpay order' },
          { status: 500 }
        );
      }

      const order = await response.json();
      return NextResponse.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        planId,
        planName: plan.name,
        billingCycle,
        keyId,
        isSandbox: false,
      });
    }

    // Development Sandbox Simulator (When keys are not yet configured in .env.local)
    const mockOrderId = `order_test_${Date.now()}`;
    return NextResponse.json({
      success: true,
      orderId: mockOrderId,
      amount: amountInSubunits,
      currency: cur,
      planId,
      planName: plan.name,
      billingCycle,
      keyId: keyId || 'rzp_test_prepsmart_sandbox',
      isSandbox: true,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
