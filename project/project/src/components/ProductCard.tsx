// src/components/ProductCard.tsx
import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Product } from '../stripe-config';
import { createCheckoutSession } from '../lib/stripe';

interface ProductCardProps {
  product: Product;
  userToken?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, userToken }) => {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const successUrl = `${window.location.origin}/success`;
      const cancelUrl = window.location.href;

      const { url } = await createCheckoutSession({
        priceId: product.priceId,
        mode: product.mode,
        successUrl,
        cancelUrl,
        userToken
      });

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      <div className="p-8">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h3>
          <div className="text-4xl font-bold text-blue-600 mb-4">
            {product.price}
            {product.mode === 'subscription' && <span className="text-lg text-gray-600">/month</span>}
          </div>
          <p className="text-gray-600 leading-relaxed">{product.description}</p>
        </div>

        <div className="space-y-3 mb-8">
          <div className="flex items-center space-x-3">
            <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span className="text-gray-700">AI-powered candidate matching</span>
          </div>
          <div className="flex items-center space-x-3">
            <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span className="text-gray-700">Comprehensive analytics dashboard</span>
          </div>
          <div className="flex items-center space-x-3">
            <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span className="text-gray-700">Advanced recruitment tools</span>
          </div>
          <div className="flex items-center space-x-3">
            <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span className="text-gray-700">24/7 customer support</span>
          </div>
        </div>

        <button
          onClick={handlePurchase}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <span>{product.mode === 'subscription' ? 'Subscribe Now' : 'Purchase Now'}</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
