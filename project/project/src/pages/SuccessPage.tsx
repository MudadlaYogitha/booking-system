// src/pages/SuccessPage.tsx
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Users, Calendar } from 'lucide-react';
import { storage } from '../utils/storage';
import { trainersData } from '../data/trainers';
import { supabase } from '../lib/supabase';
import { Booking } from '../types';

export const SuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [bookingCreated, setBookingCreated] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    handlePaymentSuccess();
  }, []);

  const handlePaymentSuccess = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Check if this is a booking success
      const isBooking = searchParams.get('booking') === 'true';
      const sessionId = searchParams.get('sessionId');

      if (isBooking) {
        const pendingBookingData = localStorage.getItem('pendingBooking');
        
        if (pendingBookingData) {
          const pendingBooking = JSON.parse(pendingBookingData);
          
          // Create booking record
          const newBooking: Booking = {
            id: sessionId || Date.now().toString(),
            trainerId: pendingBooking.trainerId,
            studentId: user.id,
            studentName: pendingBooking.studentName,
            studentEmail: pendingBooking.studentEmail,
            message: pendingBooking.message || '',
            createdAt: new Date().toISOString(),
            paymentStatus: 'completed'
          };

          // Save to storage
          storage.saveBooking(newBooking);
          
          // Save to Supabase
          await saveBookingToSupabase(newBooking);
          
          setBooking(newBooking);
          setBookingCreated(true);
          
          // Clear pending booking
          localStorage.removeItem('pendingBooking');
        }
      }
    } catch (error) {
      console.error('Error handling payment success:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveBookingToSupabase = async (booking: Booking) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .insert([
          {
            id: booking.id,
            trainer_id: booking.trainerId,
            student_id: booking.studentId,
            student_name: booking.studentName,
            student_email: booking.studentEmail,
            message: booking.message,
            payment_status: booking.paymentStatus,
            created_at: booking.createdAt
          }
        ]);

      if (error) {
        console.error('Error saving booking to Supabase:', error);
      }
    } catch (error) {
      console.error('Error saving booking to Supabase:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const trainer = booking ? trainersData.find(t => t.id === booking.trainerId) : null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            
            {bookingCreated && trainer ? (
              <div className="text-left bg-blue-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-900 mb-2">Booking Confirmed</h3>
                <p className="text-blue-800 text-sm mb-2">
                  <strong>Trainer:</strong> {trainer.name}
                </p>
                <p className="text-blue-800 text-sm mb-2">
                  <strong>Student:</strong> {booking.studentName}
                </p>
                <div className="flex items-center text-blue-600 text-sm mt-3">
                  <Users className="h-4 w-4 mr-2" />
                  <span>Your booking has been added to the queue</span>
                </div>
                <div className="flex items-center text-blue-600 text-sm mt-1">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Session will be scheduled when 5+ students join</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">Thank you for your purchase. Your payment has been processed successfully.</p>
            )}
          </div>

          <div className="space-y-4">
            <Link
              to="/student-dashboard"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>View My Sessions</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/"
              className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Back to Trainers
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;