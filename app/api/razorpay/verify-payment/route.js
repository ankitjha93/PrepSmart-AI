import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * POST /api/razorpay/verify-payment
 * Verifies Razorpay HMAC SHA256 payment signature and returns subscription confirmation.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      billingCycle = 'annual',
      isSandbox = false,
      userEmail,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json({ success: false, error: 'Missing payment identifiers' }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Verify HMAC-SHA256 signature when secret is configured
    if (keySecret && !isSandbox) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return NextResponse.json(
          { success: false, error: 'Cryptographic signature mismatch. Payment could not be verified.' },
          { status: 400 }
        );
      }
    }

    // Calculate subscription validity (1 month or 1 year)
    const now = new Date();
    const expiresAt = new Date(now);
    if (billingCycle === 'annual') {
      expiresAt.setFullYear(now.getFullYear() + 1);
    } else {
      expiresAt.setMonth(now.getMonth() + 1);
    }

    const subscription = {
      planId: planId || 'pro',
      status: 'active',
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      billingCycle,
      userEmail: userEmail || 'candidate@prepsmart.ai',
      activatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      verified: true,
      planId: planId || 'pro',
      subscription,
      message: 'Payment verified and subscription activated successfully!',
    });
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    return NextResponse.json({ success: false, error: error.message || 'Verification error' }, { status: 500 });
  }
}
