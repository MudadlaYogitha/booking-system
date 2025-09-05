// src/types.ts
export interface Trainer {
  id: string;
  name: string;
  expertise: string[];
  description: string;
  avatar: string;
  rating: number;
  totalSessions: number;
  priceId?: string; // map key or direct Stripe Price ID
  price?: number; // display price (USD)
  priceMode?: 'payment' | 'subscription'; 
}

export interface Booking {
  id: string;
  trainerId: string;
  studentName: string;
  studentEmail: string;
  createdAt: string;
  message?: string;
  sessionId?: string;
}

export interface Session {
  id: string;
  trainerId: string;
  trainerName: string;
  title: string;
  description: string;
  scheduledAt: string;
  duration: number;
  meetingLink: string;
  studentIds: string[];
  status: 'scheduled' | 'active' | 'completed';
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
}
