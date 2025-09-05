import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, Check, CreditCard } from 'lucide-react';
import { updateBookingPaymentStatus } from '../lib/database.ts';
import { trainersData } from '../data/trainers';

function luhnCheck(num: string) {
  let sum = 0;
  let shouldDouble = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let digit = parseInt(num.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

function normalizeCardNumber(input: string) {
  return (input || '').replace(/\D/g, '');
}

function detectBrand(cardNumber: string) {
  if (!cardNumber) return '';
  if (/^4/.test(cardNumber)) return 'Visa';
  if (/^5[1-5]/.test(cardNumber) || /^2[2-7]/.test(cardNumber)) return 'Mastercard';
  if (/^3[47]/.test(cardNumber)) return 'AMEX';
  return '';
}

function formatCardNumberForDisplay(input: string) {
  const digits = normalizeCardNumber(input);
  if (/^3[47]/.test(digits)) {
    const part1 = digits.slice(0, 4);
    const part2 = digits.slice(4, 10);
    const part3 = digits.slice(10, 15);
    return [part1, part2, part3].filter(Boolean).join(' ');
  }
  return digits.replace(/(\d{4})/g, '$1 ').trim();
}

function formatExpiryInput(raw: string) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 2) return digits;
  const m = digits.slice(0, 2);
  const y = digits.slice(2, 4);
  return `${m}/${y}`;
}

function expiryDigitsCount(formatted: string) {
  return (formatted.replace(/\D/g, '') || '').length;
}

function isExpiryValid(formatted: string) {
  const digits = (formatted || '').replace(/\D/g, '');
  if (digits.length !== 4) return false;
  const mm = parseInt(digits.slice(0, 2), 10);
  const yy = parseInt(digits.slice(2, 4), 10);
  if (isNaN(mm) || isNaN(yy)) return false;
  if (mm < 1 || mm > 12) return false;
  const fullYear = 2000 + yy;
  const lastOfMonth = new Date(fullYear, mm, 0, 23, 59, 59).getTime();
  const now = Date.now();
  return lastOfMonth >= now;
}

export const MockCheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('sessionId') ?? `mock_${Date.now()}`;

  const pendingRaw = localStorage.getItem('pendingBooking');
  const pending = pendingRaw ? JSON.parse(pendingRaw) : null;
  const trainer = pending ? trainersData.find(t => t.id === pending.trainerId) : null;

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardholder, setCardholder] = useState(pending?.studentName ?? '');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!pending) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">No pending booking</h2>
        <p className="text-gray-600 mb-4">Start booking from a trainer to demo the payment flow.</p>
        <button onClick={() => navigate('/')} className="bg-blue-600 text-white px-4 py-2 rounded">
          Go to Home
        </button>
      </div>
    );
  }

  const handleCardNumberChange = (raw: string) => {
    const formatted = formatCardNumberForDisplay(raw);
    setCardNumber(formatted);
    setErrors(prev => ({ ...prev, cardNumber: '' }));
  };

  const handleExpiryChange = (raw: string) => {
    const formatted = formatExpiryInput(raw);
    setExpiry(formatted);
    setErrors(prev => ({ ...prev, expiry: '' }));
  };

  const handleFillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setExpiry('12/34');
    setCvc('123');
    setCardholder(pending.studentName || 'Demo User');
    setErrors({});
  };

  const handleDemoQuickPay = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    
    try {
      // Update payment status in database
      if (pending.bookingId) {
        await updateBookingPaymentStatus(pending.bookingId, 'completed');
      }
      localStorage.removeItem('pendingBooking');
      setLoading(false);
      setDone(true);
      setTimeout(() => navigate(`/success?bookingId=${pending.bookingId}&trainer=${pending.trainerId}`), 700);
    } catch (error) {
      console.error('Error updating payment status:', error);
      setLoading(false);
      navigate(`/success?bookingId=${pending.bookingId}&trainer=${pending.trainerId}`);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const rawNumber = normalizeCardNumber(cardNumber);

    if (!/^\d{13,19}$/.test(rawNumber) || !luhnCheck(rawNumber)) {
      newErrors.cardNumber = 'Your card number is invalid.';
    }

    const expDigits = expiryDigitsCount(expiry);
    if (expDigits < 4) {
      newErrors.expiry = "Your card's expiration date is incomplete.";
    } else if (!isExpiryValid(expiry)) {
      newErrors.expiry = 'Expiry date is invalid or in the past.';
    }

    const brand = detectBrand(rawNumber);
    const cvcOk = brand === 'AMEX' ? /^\d{4}$/.test(cvc) : /^\d{3}$/.test(cvc);
    if (!cvcOk) {
      newErrors.cvc = 'CVC is invalid.';
    }

    if (!cardholder.trim()) {
      newErrors.cardholder = 'Cardholder name is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePay = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    
    try {
      // Update payment status in database
      if (pending.bookingId) {
        await updateBookingPaymentStatus(pending.bookingId, 'completed');
      }
      localStorage.removeItem('pendingBooking');
      setLoading(false);
      setDone(true);
      setTimeout(() => navigate(`/success?bookingId=${pending.bookingId}&trainer=${pending.trainerId}`), 700);
    } catch (error) {
      console.error('Error updating payment status:', error);
      setLoading(false);
      navigate(`/success?bookingId=${pending.bookingId}&trainer=${pending.trainerId}`);
    }
  };

  const rawNumber = normalizeCardNumber(cardNumber);
  const brand = detectBrand(rawNumber);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-blue-50 p-3 rounded"><CreditCard className="h-5 w-5 text-blue-600" /></div>
        <div>
          <h2 className="text-lg font-semibold">Demo Checkout</h2>
          <div className="text-xs text-gray-500">Use the form below to demo a payment (no real charge).</div>
        </div>
      </div>

      <div className="mb-4 border p-4 rounded">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-medium mb-1">{trainer ? trainer.name : 'Trainer'}</div>
            <div className="text-sm text-gray-600">{trainer ? trainer.description : ''}</div>
          </div>
          <div className="text-right text-sm text-gray-600">Amount: <strong>${trainer?.price ?? 25}.00</strong></div>
        </div>

        <div className="mt-3 text-sm">
          <div>Student: <span className="font-medium">{pending.studentName}</span></div>
          <div>Email: <span className="font-medium">{pending.studentEmail}</span></div>
          <div>Message: <span className="font-medium">{pending.message || '—'}</span></div>
        </div>
      </div>

      <div className="mb-3">
        <label className="text-sm font-medium block mb-1">Card number</label>
        <div className="flex items-center gap-2">
          <input
            value={cardNumber}
            onChange={e => handleCardNumberChange(e.target.value)}
            placeholder="1234 1234 1234 1234"
            className={`flex-1 p-3 border rounded ${errors.cardNumber ? 'border-red-500' : 'border-gray-300'}`}
          />
          <div className="text-xs text-gray-600 px-2">{brand || ''}</div>
        </div>
        {errors.cardNumber ? (
          <div className="text-red-600 text-xs mt-1">{errors.cardNumber}</div>
        ) : (
          <div className="text-gray-500 text-xs mt-1">
            Try <strong>4242 4242 4242 4242</strong> (Stripe test card — no real charge).
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label className="text-sm font-medium block mb-1">Expiry (MM/YY)</label>
          <input
            value={expiry}
            onChange={e => handleExpiryChange(e.target.value)}
            placeholder="MM/YY"
            className={`w-full p-3 border rounded ${errors.expiry ? 'border-red-500' : 'border-gray-300'}`}
            maxLength={5}
          />
          {errors.expiry && <div className="text-red-600 text-xs mt-1">{errors.expiry}</div>}
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">CVC</label>
          <input
            value={cvc}
            onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="123"
            className={`w-full p-3 border rounded ${errors.cvc ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.cvc && <div className="text-red-600 text-xs mt-1">{errors.cvc}</div>}
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Name on card</label>
          <input
            value={cardholder}
            onChange={e => setCardholder(e.target.value)}
            placeholder="Cardholder name"
            className={`w-full p-3 border rounded ${errors.cardholder ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.cardholder && <div className="text-red-600 text-xs mt-1">{errors.cardholder}</div>}
        </div>
      </div>

      <div className="flex gap-2 items-center mb-4">
        <button onClick={handleFillTestCard} className="px-3 py-2 bg-gray-100 rounded border text-sm">
          Fill test card
        </button>
        <button onClick={handleDemoQuickPay} className="px-3 py-2 bg-yellow-100 rounded border text-sm">
          Demo quick-pay (skip card)
        </button>
        <div className="ml-auto text-sm text-gray-500">Amount: <strong>${trainer?.price ?? 25}.00</strong></div>
      </div>

      <div className="text-center">
        {!done ? (
          <button
            onClick={handlePay}
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Check className="h-5 w-5" />}
            <span>{loading ? 'Processing...' : 'Pay (Demo)'}</span>
          </button>
        ) : (
          <div className="text-green-700 font-medium">Payment simulated — redirecting…</div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p><strong>Note:</strong> This is a demo-only view. No real card information is sent anywhere.</p>
        <p>To quickly demo the Stripe-like experience use card <code>4242 4242 4242 4242</code>, any future expiry (e.g. <code>12/34</code>), any CVC, and provide a cardholder name.</p>
      </div>
    </div>
  );
};

export default MockCheckoutPage;