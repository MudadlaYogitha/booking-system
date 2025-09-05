// src/components/SubscriptionStatus.tsx
import React, { useEffect, useState } from 'react';
import { Crown, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { products } from '../stripe-config';

interface SubscriptionStatusProps {
  userId: string;
}

interface SubscriptionData {
  subscription_status: string;
  price_id: string | null;
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ userId }) => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('subscription_status, price_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && (error as any).code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
        return;
      }

      setSubscription(data ?? null);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="animate-pulse flex items-center space-x-2">
          <div className="w-5 h-5 bg-gray-300 rounded"></div>
          <div className="w-24 h-4 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!subscription || subscription.subscription_status === 'not_started' || !subscription.price_id) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <span className="text-yellow-800 font-medium">No active subscription</span>
        </div>
      </div>
    );
  }

  const product = products.find(p => p.priceId === subscription.price_id);
  const isActive = subscription.subscription_status === 'active';

  return (
    <div className={`rounded-lg p-4 ${isActive ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
      <div className="flex items-center space-x-2">
        <Crown className={`h-5 w-5 ${isActive ? 'text-green-600' : 'text-red-600'}`} />
        <div>
          <span className={`font-medium ${isActive ? 'text-green-800' : 'text-red-800'}`}>
            {product ? product.name : 'Unknown Plan'}
          </span>
          <span className={`ml-2 text-sm ${isActive ? 'text-green-600' : 'text-red-600'}`}>
            ({subscription.subscription_status})
          </span>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionStatus;
