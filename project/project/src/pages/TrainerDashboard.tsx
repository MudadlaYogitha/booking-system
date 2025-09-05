import React, { useState, useEffect } from 'react';
import { Plus, Users, Calendar, Video, AlertCircle, CheckCircle } from 'lucide-react';
import { SessionCard } from '../components/SessionCard';
import { storage } from '../utils/storage';
import { generateMeetingLink } from '../utils/meetingLink';
import { trainersData } from '../data/trainers';
import { Session, Booking, Trainer } from '../types';

export const TrainerDashboard: React.FC = () => {
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    duration: 60
  });

  useEffect(() => {
    if (selectedTrainer) {
      loadTrainerData();
    }
  }, [selectedTrainer]);

  const loadTrainerData = () => {
    if (!selectedTrainer) return;

    const allSessions = storage.getSessions();
    const allBookings = storage.getBookings();

    const trainerSessions = allSessions.filter(s => s.trainerId === selectedTrainer.id);
    const trainerPendingBookings = allBookings.filter(b => 
      b.trainerId === selectedTrainer.id && !b.sessionId
    );

    setSessions(trainerSessions);
    setPendingBookings(trainerPendingBookings);
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainer || pendingBookings.length < 5) return;

    const sessionId = Date.now().toString();
    const meetingLink = generateMeetingLink(sessionId);

    const newSession: Session = {
      id: sessionId,
      trainerId: selectedTrainer.id,
      trainerName: selectedTrainer.name,
      title: sessionForm.title,
      description: sessionForm.description,
      scheduledAt: sessionForm.scheduledAt,
      duration: sessionForm.duration,
      meetingLink,
      studentIds: pendingBookings.slice(0, 5).map(b => b.id),
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };

    storage.saveSession(newSession);

    // Update bookings to link them to the session
    pendingBookings.slice(0, 5).forEach(booking => {
      storage.updateBooking(booking.id, { sessionId });
    });

    // Reset form and refresh data
    setSessionForm({
      title: '',
      description: '',
      scheduledAt: '',
      duration: 60
    });
    setShowCreateSession(false);
    loadTrainerData();
  };

  if (!selectedTrainer) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Trainer Dashboard</h1>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Your Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trainersData.map((trainer) => (
                <button
                  key={trainer.id}
                  onClick={() => setSelectedTrainer(trainer)}
                  className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={trainer.avatar}
                      alt={trainer.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-medium text-gray-900">{trainer.name}</h3>
                      <p className="text-sm text-gray-600">{trainer.expertise.join(', ')}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {selectedTrainer.name}</h1>
            <p className="text-gray-600">Manage your training sessions and connect with students.</p>
          </div>
          <button
            onClick={() => setSelectedTrainer(null)}
            className="px-4 py-2 text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Switch Trainer
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingBookings.length}</p>
                <p className="text-gray-600">Pending Bookings</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
                <p className="text-gray-600">Total Sessions</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-3 rounded-full">
                <Video className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {sessions.filter(s => s.status === 'scheduled').length}
                </p>
                <p className="text-gray-600">Upcoming</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Bookings */}
        {pendingBookings.length >= 5 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-medium">
                You have {pendingBookings.length} pending bookings! You can now create a group session.
              </span>
              <button
                onClick={() => setShowCreateSession(true)}
                className="ml-auto bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Create Session
              </button>
            </div>
          </div>
        )}

        {pendingBookings.length > 0 && pendingBookings.length < 5 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-800">
                You have {pendingBookings.length} pending booking(s). Need {5 - pendingBookings.length} more to create a session.
              </span>
            </div>
          </div>
        )}

        {/* Create Session Modal */}
        {showCreateSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Session</h3>
              
              <form onSubmit={handleCreateSession} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Title
                  </label>
                  <input
                    type="text"
                    value={sessionForm.title}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., React Fundamentals"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={sessionForm.description}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, description: e.target.value }))}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="What will you cover in this session?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scheduled Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={sessionForm.scheduledAt}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    required
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <select
                    value={sessionForm.duration}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, duration: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateSession(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Session
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Sessions List */}
        {sessions.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Sessions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map((session) => (
                <SessionCard key={session.id} session={session} isTrainer={true} />
              ))}
            </div>
          </div>
        )}

        {sessions.length === 0 && pendingBookings.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
            <p className="text-gray-600">
              You'll see your bookings and sessions here once students start booking with you.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};