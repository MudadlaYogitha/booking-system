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

const PRICE_MAP: Record<string, string> = {
  training_session: 'price_1S2qB1EiAibFBvoA9ecHRy8o',
  hiregenius_monthly: 'price_1S2qB1EiAibFBvoA9ecHRy8x'
};

const USE_FAKE = import.meta.env.VITE_USE_FAKE_PAYMENT === 'true';

export const createCheckoutSession = async (
  params: CreateCheckoutSessionParams
): Promise<CheckoutSessionResponse> => {
  // If fake/demo payments are enabled, return a mock checkout URL that links to an in-app page
  if (USE_FAKE) {
    const mockSessionId = `mock_${Date.now()}`;
    // We rely on pendingBooking stored by the frontend (PaymentBookingForm) to get booking details.
    const url = `${window.location.origin}/mock-checkout?sessionId=${encodeURIComponent(mockSessionId)}`;
    return Promise.resolve({ sessionId: mockSessionId, url });
  }

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
