// src/lib/stripe.ts
interface CreateCheckoutSessionParams {
  priceId: string;
  mode: 'payment' | 'subscription';
  successUrl: string;
  cancelUrl: string;
  userToken?: string;
}

interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

// Map friendly keys to real Stripe Price IDs (replace values with your real price IDs)
const PRICE_MAP: Record<string, string> = {
  training_session: 'price_1S2qB1EiAibFBvoA9ecHRy8o',
  hiregenius_monthly: 'price_1S2qB1EiAibFBvoA9ecHRy8x'
};

export const createCheckoutSession = async (
  params: CreateCheckoutSessionParams
): Promise<CheckoutSessionResponse> => {
  const apiUrl =
    (import.meta.env.VITE_STRIPE_FUNC_URL as string) ||
    'https://lserzybsvugwnvhmszal.supabase.co/functions/v1/stripe-checkout';

  const resolvedPriceId = PRICE_MAP[params.priceId] ?? params.priceId;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (params.userToken) {
    headers['Authorization'] = `Bearer ${params.userToken}`;
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      price_id: resolvedPriceId,
      mode: params.mode,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl
    })
  });

  if (!response.ok) {
    let errorMsg = 'Failed to create checkout session';
    try {
      const errJson = await response.json();
      errorMsg = errJson?.error ?? JSON.stringify(errJson) ?? errorMsg;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  return response.json();
};
