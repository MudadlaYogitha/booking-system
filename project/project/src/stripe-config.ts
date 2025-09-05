// src/stripe-config.ts
export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  priceId: string; // key used by the frontend -> stripe function expects either key mapped or raw price id
  mode: 'payment' | 'subscription';
}

export const products: Product[] = [
  {
    id: 'prod_training_monthly',
    name: 'HireGenius Monthly',
    description: 'Monthly access to advanced hiring tools.',
    price: '$10',
    priceId: 'hiregenius_monthly', // example key
    mode: 'subscription'
  },
  {
    id: 'prod_session_one',
    name: '1:1 Training Session',
    description: 'One-time 1:1 session with an expert trainer.',
    price: '$10',
    priceId: 'training_session',
    mode: 'payment'
  }
];
