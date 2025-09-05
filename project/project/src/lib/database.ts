import { supabase } from './supabase';
import { Session, Booking } from '../types';

export interface DatabaseBooking {
  id: string;
  trainer_id: string;
  user_id: string;
  student_name: string;
  student_email: string;
  message: string | null;
  session_id: string | null;
  payment_status: 'pending' | 'completed' | 'failed';
  stripe_session_id: string | null;
  created_at: string;
}

export interface DatabaseSession {
  id: string;
  trainer_id: string;
  trainer_name: string;
  title: string;
  description: string;
  scheduled_at: string;
  duration: number;
  meeting_link: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  max_students: number;
  created_at: string;
}

export interface SessionEnrollment {
  id: string;
  session_id: string;
  booking_id: string;
  user_id: string;
  joined_at: string | null;
  created_at: string;
}

// Booking functions
export const createBooking = async (booking: {
  trainerId: string;
  studentName: string;
  studentEmail: string;
  message?: string;
  stripeSessionId?: string;
}): Promise<DatabaseBooking> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      trainer_id: booking.trainerId,
      user_id: user.id,
      student_name: booking.studentName,
      student_email: booking.studentEmail,
      message: booking.message || null,
      stripe_session_id: booking.stripeSessionId || null,
      payment_status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateBookingPaymentStatus = async (
  bookingId: string,
  status: 'completed' | 'failed'
): Promise<void> => {
  const { error } = await supabase
    .from('bookings')
    .update({ payment_status: status })
    .eq('id', bookingId);

  if (error) throw error;
};

export const getBookingsByUser = async (userId?: string): Promise<DatabaseBooking[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  const targetUserId = userId || user?.id;
  
  if (!targetUserId) return [];

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getBookingsByTrainer = async (trainerId: string): Promise<DatabaseBooking[]> => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('trainer_id', trainerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getBookingsByEmail = async (email: string): Promise<DatabaseBooking[]> => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('student_email', email)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Session functions
export const createSession = async (session: {
  trainerId: string;
  trainerName: string;
  title: string;
  description: string;
  scheduledAt: string;
  duration: number;
  meetingLink: string;
}): Promise<DatabaseSession> => {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      trainer_id: session.trainerId,
      trainer_name: session.trainerName,
      title: session.title,
      description: session.description,
      scheduled_at: session.scheduledAt,
      duration: session.duration,
      meeting_link: session.meetingLink,
      status: 'scheduled'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getSessionsByUser = async (): Promise<DatabaseSession[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      session_enrollments!inner(user_id)
    `)
    .eq('session_enrollments.user_id', user.id)
    .order('scheduled_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const getSessionsByTrainer = async (trainerId: string): Promise<DatabaseSession[]> => {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('trainer_id', trainerId)
    .order('scheduled_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const enrollUsersInSession = async (
  sessionId: string,
  bookingIds: string[]
): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Get bookings to enroll
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .in('id', bookingIds);

  if (bookingsError) throw bookingsError;

  // Create enrollment records
  const enrollments = bookings?.map(booking => ({
    session_id: sessionId,
    booking_id: booking.id,
    user_id: booking.user_id
  })) || [];

  const { error: enrollmentError } = await supabase
    .from('session_enrollments')
    .insert(enrollments);

  if (enrollmentError) throw enrollmentError;

  // Update bookings to link to session
  const { error: updateError } = await supabase
    .from('bookings')
    .update({ session_id: sessionId })
    .in('id', bookingIds);

  if (updateError) throw updateError;
};

export const getSessionEnrollments = async (sessionId: string): Promise<SessionEnrollment[]> => {
  const { data, error } = await supabase
    .from('session_enrollments')
    .select('*')
    .eq('session_id', sessionId);

  if (error) throw error;
  return data || [];
};

export const markUserJoinedSession = async (sessionId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('session_enrollments')
    .update({ joined_at: new Date().toISOString() })
    .eq('session_id', sessionId)
    .eq('user_id', user.id);

  if (error) throw error;
};

// Helper function to get sessions with enrollment info
export const getSessionsWithEnrollments = async (userId?: string): Promise<(DatabaseSession & { enrollment_count: number; user_enrolled: boolean })[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  const targetUserId = userId || user?.id;

  const { data, error } = await supabase
    .rpc('get_sessions_with_enrollments', { 
      target_user_id: targetUserId 
    });

  if (error) throw error;
  return data || [];
};

// You might need to create this RPC function in Supabase
export const createSessionsWithEnrollmentsRPC = async () => {
  // This would need to be created in your Supabase dashboard
  // or through a migration. For now, we'll use separate queries.
};