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
  studentId: string; // Added for better user management
  studentName: string;
  studentEmail: string;
  createdAt: string;
  message?: string;
  sessionId?: string; // Links to a session when one is created
  paymentStatus?: 'pending' | 'completed' | 'failed'; // Track payment status
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
  studentIds: string[]; // Array of booking IDs that are part of this session
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  maxStudents?: number; // Maximum students allowed (default: no limit)
  minStudents?: number; // Minimum students required (default: 5)
}

export interface Student {
  id: string;
  name: string;
  email: string;
}

// New interface for session management
export interface SessionWithBookings extends Session {
  bookings: Booking[];
  trainer: Trainer;
}

// Enhanced booking interface for display purposes
export interface BookingWithDetails extends Booking {
  trainer?: Trainer;
  session?: Session;
}