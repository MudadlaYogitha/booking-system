import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { SessionCard } from '../components/SessionCard';
import { storage } from '../utils/storage';
import { Session, Booking } from '../types';
import { trainersData } from '../data/trainers';

export const StudentDashboard: React.FC = () => {
  const location = useLocation();
  const [studentEmail, setStudentEmail] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
      setStudentEmail(location.state.studentEmail || '');
    }
  }, [location.state]);

  useEffect(() => {
    if (studentEmail) loadStudentData();
  }, [studentEmail]);

  const loadStudentData = () => {
    const allBookings = storage.getBookings();
    const allSessions = storage.getSessions();

    const studentBookings = allBookings.filter(b => b.studentEmail === studentEmail);
    const studentSessions = allSessions.filter(s =>
      studentBookings.some(b => b.sessionId === s.id) ||
      s.studentIds.some(studentId => {
        const booking = allBookings.find(bk => bk.id === studentId);
        return booking?.studentEmail === studentEmail;
      })
    );

    setBookings(studentBookings);
    setSessions(studentSessions);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadStudentData();
  };

  if (!studentEmail) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">My Sessions</h1>
            <p className="text-gray-600 mb-6 text-center">
              Enter your email address to view your booked sessions and upcoming meetings.
            </p>
            <form onSubmit={handleEmailSubmit}>
              <input
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                required
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              />
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors">
                View My Sessions
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {message && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800">{message}</span>
          </div>
        )}

        {sessions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Scheduled Sessions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map(session => <SessionCard key={session.id} session={session} />)}
            </div>
          </div>
        )}

        {bookings.filter(b => !b.sessionId).length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Bookings</h2>
            <div className="bg-white rounded-lg shadow-md">
              {bookings.filter(b => !b.sessionId).map(booking => (
                <div key={booking.id} className="border-b border-gray-200 last:border-b-0 p-6">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        Booking with {trainersData.find(t => t.id === booking.trainerId)?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Booked on {new Date(booking.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-yellow-600 mt-1">
                        Waiting for more students to join (minimum 5 required)
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sessions.length === 0 && bookings.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't booked any sessions yet. Book your first session with one of our expert trainers to get started.
            </p>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Trainers
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
