// src/components/PaymentBookingForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, MessageSquare, CreditCard } from 'lucide-react';
import { Trainer } from '../types';
import { supabase } from '../lib/supabase';
import { createCheckoutSession } from '../lib/stripe';
import { storage } from '../utils/storage';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface PaymentBookingFormProps {
  trainer: Trainer;
}

export const PaymentBookingForm: React.FC<PaymentBookingFormProps> = ({ trainer }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userToken, setUserToken] = useState<string>('');
  const [formData, setFormData] = useState({
    studentName: '',
    studentEmail: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userRes = await supabase.auth.getUser();
        if (userRes.error) throw userRes.error;
        const currentUser = userRes.data.user ?? null;

        const sessionRes = await supabase.auth.getSession();
        if (sessionRes.error) throw sessionRes.error;
        const session = sessionRes.data.session ?? null;

        setUser(currentUser);
        setUserToken(session?.access_token ?? '');

        setFormData(prev => ({
          ...prev,
          studentEmail: currentUser?.email ?? '',
          studentName: (currentUser?.user_metadata as any)?.full_name ?? prev.studentName
        }));
      } catch (err) {
        console.error('Error checking user:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const priceKey = trainer.priceId ?? 'training_session';
      if (!priceKey) throw new Error('This trainer does not have a valid price set.');

      // Prefer explicit trainer.priceMode if provided; otherwise try payment first.
      let preferredMode: 'payment' | 'subscription' = (trainer as any).priceMode ?? 'payment';

      const successUrl = `${window.location.origin}/success?trainer=${trainer.id}&booking=true`;
      const cancelUrl = window.location.href;

      // Helper to attempt creating a session and optionally retry with subscription mode
      const attemptCreate = async (mode: 'payment' | 'subscription') => {
        return await createCheckoutSession({
          priceId: priceKey,
          mode,
          successUrl,
          cancelUrl,
          userToken
        });
      };

      let sessionResp;
      try {
        sessionResp = await attemptCreate(preferredMode);
      } catch (err: any) {
        // If we tried payment but Stripe complains price is recurring, retry with subscription
        const msg: string = (err && err.message) || String(err || '');
        const recurringIndicator = /recurring price|You specified `payment` mode but passed a recurring price/i;
        if (preferredMode === 'payment' && recurringIndicator.test(msg)) {
          try {
            sessionResp = await attemptCreate('subscription');
          } catch (err2: any) {
            // If retry also fails, bubble up the most relevant message
            throw err2;
          }
        } else {
          throw err;
        }
      }

      if (!sessionResp || !sessionResp.url) throw new Error('Failed to create checkout session.');

      // Store booking data with user ID for session management
      const bookingData = {
        trainerId: trainer.id,
        studentId: user.id,
        studentName: formData.studentName,
        studentEmail: formData.studentEmail,
        message: formData.message,
        timestamp: Date.now()
      };

      localStorage.setItem('pendingBooking', JSON.stringify(bookingData));

      window.location.href = sessionResp.url;
    } catch (err: any) {
      console.error('Booking error:', err);
      setError(err?.message ?? 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Sign in required</h2>
        <p className="text-gray-600 mb-6">You need to be signed in to book a session</p>
        <button
          onClick={() => navigate('/login')}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  const displayMode: 'payment' | 'subscription' = (trainer as any).priceMode ?? 'payment';
  const buttonLabel =
    isSubmitting
      ? 'Processing...'
      : displayMode === 'subscription'
      ? 'Subscribe & Book'
      : `Pay & Book Session ($${trainer.price ?? 25}.00)`;

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
      <div className="text-center mb-6">
        <img
          src={trainer.avatar}
          alt={trainer.name}
          className="w-20 h-20 rounded-full mx-auto mb-4 ring-4 ring-blue-100"
        />
        <h2 className="text-2xl font-bold text-gray-900">{trainer.name}</h2>
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {trainer.expertise.map(skill => (
            <span
              key={skill}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center space-x-2">
        <CreditCard className="h-5 w-5 text-blue-600" />
        <div>
          <p className="text-blue-800 font-medium">
            Session Fee: ${trainer.price ?? 25}.00
          </p>
          <p className="text-blue-600 text-sm">Payment required to confirm booking</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 mb-2">
            Your Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              id="studentName"
              name="studentName"
              value={formData.studentName}
              onChange={handleInputChange}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter your full name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="studentEmail" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              id="studentEmail"
              name="studentEmail"
              value={formData.studentEmail}
              onChange={handleInputChange}
              required
              disabled
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Message (Optional)
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows={3}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="Tell the trainer what you'd like to learn..."
            />
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <CreditCard className="h-5 w-5" />
          <span>{buttonLabel}</span>
        </button>
      </form>

      <p className="text-xs text-gray-500 text-center mt-4">
        Secure payment powered by Stripe. Your session will be confirmed after successful payment.
      </p>
    </div>
  );
};

export default PaymentBookingForm;