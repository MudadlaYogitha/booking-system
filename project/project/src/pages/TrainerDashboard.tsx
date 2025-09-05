// src/pages/TrainerDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Users, Calendar, Video, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
import { SessionCard } from '../components/SessionCard';
import { storage } from '../utils/storage';
import { generateMeetingLink } from '../utils/meetingLink';
import { trainersData } from '../data/trainers';
import { supabase } from '../lib/supabase';
import { Session, Booking, Trainer, BookingWithDetails } from '../types';

export const TrainerDashboard: React.FC = () => {
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [pendingBookings, setPendingBookings] = useState<BookingWithDetails[]>([]);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [sessionForm, setSessionForm] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    duration: 60,
    selectedBookings: [] as string[]
  });

  // --- load user once
  useEffect(() => {
    checkUser();
  }, []);

  // --- when trainer selected, load data and poll for updates
  useEffect(() => {
    if (selectedTrainer) {
      loadTrainerData();
      const interval = setInterval(loadTrainerData, 30000); // poll every 30s
      return () => clearInterval(interval);
    }
  }, [selectedTrainer]);

  const checkUser = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user ?? null);
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const loadTrainerData = async () => {
    if (!selectedTrainer) return;

    try {
      // 1. Load from local storage
      const allSessions = storage.getSessions(); // -> Session[]
      const allBookings = storage.getBookings(); // -> Booking[]

      // 2. Fetch from Supabase and merge/save to local storage (backup)
      await loadFromSupabase();

      // Re-read after potential supabase sync
      const sessionsFromStorage = storage.getSessions();
      const bookingsFromStorage = storage.getBookings();

      // Filter trainer-specific data
      const trainerSessions = sessionsFromStorage.filter(s => s.trainerId === selectedTrainer.id);
      const trainerPendingBookings = bookingsFromStorage.filter(b =>
        b.trainerId === selectedTrainer.id &&
        !b.sessionId &&
        b.paymentStatus === 'completed'
      );

      // Add trainer details to booking (BookingWithDetails)
      const bookingsWithDetails: BookingWithDetails[] = trainerPendingBookings.map(b => ({
        ...b,
        trainer: selectedTrainer
      }));

      setSessions(trainerSessions);
      setPendingBookings(bookingsWithDetails);
    } catch (error) {
      console.error('Error loading trainer data:', error);
    }
  };

  const loadFromSupabase = async () => {
    if (!selectedTrainer) return;
    try {
      // Sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('trainer_id', selectedTrainer.id);

      if (!sessionsError && sessionsData) {
        const converted = sessionsData.map((s: any) => ({
          id: s.id,
          trainerId: s.trainer_id,
          trainerName: s.trainer_name,
          title: s.title,
          description: s.description,
          scheduledAt: s.scheduled_at,
          duration: s.duration,
          meetingLink: s.meeting_link,
          studentIds: s.student_ids || [],
          status: s.status,
          createdAt: s.created_at
        })) as Session[];

        converted.forEach(session => storage.saveSession(session));
      } else if (sessionsError) {
        console.error('Supabase sessions error:', sessionsError);
      }

      // Bookings (only pending ones for this trainer)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('trainer_id', selectedTrainer.id)
        .is('session_id', null)
        .eq('payment_status', 'completed');

      if (!bookingsError && bookingsData) {
        const converted = bookingsData.map((b: any) => ({
          id: b.id,
          trainerId: b.trainer_id,
          studentId: b.student_id,
          studentName: b.student_name,
          studentEmail: b.student_email,
          message: b.message || '',
          createdAt: b.created_at,
          paymentStatus: b.payment_status
        })) as Booking[];

        converted.forEach(booking => storage.saveBooking(booking));
      } else if (bookingsError) {
        console.error('Supabase bookings error:', bookingsError);
      }
    } catch (error) {
      console.error('Error loading from Supabase:', error);
    }
  };

  // Create session - allows 1..10 students (selectedBookings or fallback to earliest pending)
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainer) return;

    // Determine which bookings to include
    const bookingsToInclude = sessionForm.selectedBookings.length > 0
      ? pendingBookings.filter(b => sessionForm.selectedBookings.includes(b.id))
      : pendingBookings.slice(0, Math.min(pendingBookings.length, 10));

    // Allow creation even if only 1 student selected (cap 10)
    if (bookingsToInclude.length === 0) {
      alert('Please select at least one student to include in the session.');
      return;
    }

    setLoading(true);
    try {
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
        studentIds: bookingsToInclude.map(b => b.id),
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        minStudents: 1,
        maxStudents: 10
      };

      // Save to local storage
      storage.saveSession(newSession);

      // Save to Supabase
      await saveSessionToSupabase(newSession);

      // Link bookings to session (storage + supabase)
      for (const booking of bookingsToInclude) {
        storage.updateBooking(booking.id, { sessionId });
        await updateBookingInSupabase(booking.id, sessionId);
      }

      // Reset form & refresh
      setSessionForm({
        title: '',
        description: '',
        scheduledAt: '',
        duration: 60,
        selectedBookings: []
      });
      setShowCreateSession(false);
      await loadTrainerData();

      // In a real system we'd notify students by email/push
      console.log('Session created. Notifying students:', bookingsToInclude.map(b => b.studentEmail));
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Error creating session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveSessionToSupabase = async (session: Session) => {
    try {
      const { error } = await supabase.from('sessions').insert([{
        id: session.id,
        trainer_id: session.trainerId,
        trainer_name: session.trainerName,
        title: session.title,
        description: session.description,
        scheduled_at: session.scheduledAt,
        duration: session.duration,
        meeting_link: session.meetingLink,
        student_ids: session.studentIds,
        status: session.status,
        created_at: session.createdAt
      }]);

      if (error) console.error('Error saving session to Supabase:', error);
    } catch (err) {
      console.error('Supabase save session error:', err);
    }
  };

  const updateBookingInSupabase = async (bookingId: string, sessionId: string) => {
    try {
      const { error } = await supabase.from('bookings').update({ session_id: sessionId }).eq('id', bookingId);
      if (error) console.error('Error updating booking in Supabase:', error);
    } catch (err) {
      console.error('Supabase update booking error:', err);
    }
  };

  // toggle a booking id in the modal selection (max 10)
  const handleBookingSelection = (bookingId: string) => {
    setSessionForm(prev => {
      const exists = prev.selectedBookings.includes(bookingId);
      const selected = exists
        ? prev.selectedBookings.filter(id => id !== bookingId)
        : [...prev.selectedBookings, bookingId].slice(0, 10);
      return { ...prev, selectedBookings: selected };
    });
  };

  // Helper: display student names for a session (looks up bookings by id)
  const getStudentNamesForSession = (session: Session) => {
    const allBookings = storage.getBookings();
    const names = session.studentIds
      .map(id => {
        const found = allBookings.find(b => b.id === id);
        return found ? found.studentName : id;
      });
    return names.join(', ');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ----------------- Render -----------------
  // If user not logged in, show sign-in prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-2xl font-semibold mb-2">Please sign in</h2>
          <p className="text-gray-600 mb-6">You need to be signed in to access the trainer dashboard.</p>
          <button
            onClick={() => window.location.assign('/login')}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  // If no trainer selected, show trainer selection (you can auto-select for demo)
  if (!selectedTrainer) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6">Select Trainer Profile</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {trainersData.map(tr => (
              <button
                key={tr.id}
                onClick={() => setSelectedTrainer(tr)}
                className="text-left p-4 border rounded-lg hover:shadow-md bg-white"
              >
                <div className="flex items-center space-x-3">
                  <img src={tr.avatar} alt={tr.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <div className="font-medium">{tr.name}</div>
                    <div className="text-sm text-gray-500">{tr.expertise.join(', ')}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard UI
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {selectedTrainer?.name}</h1>
            <p className="text-gray-600">Manage sessions and students for your profile.</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSelectedTrainer(null)}
              className="px-3 py-2 border rounded text-sm"
            >
              Switch Trainer
            </button>
            <button
              onClick={() => setShowCreateSession(true)}
              className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded"
            >
              <Plus className="w-4 h-4" /> <span>Create Session</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-100 p-2 rounded-full"><Users className="w-5 h-5 text-yellow-600" /></div>
              <div>
                <div className="text-2xl font-bold">{pendingBookings.length}</div>
                <div className="text-sm text-gray-500">Pending Bookings</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-full"><Calendar className="w-5 h-5 text-blue-600" /></div>
              <div>
                <div className="text-2xl font-bold">{sessions.length}</div>
                <div className="text-sm text-gray-500">Total Sessions</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-full"><Video className="w-5 h-5 text-green-600" /></div>
              <div>
                <div className="text-2xl font-bold">{sessions.filter(s => s.status === 'scheduled' || s.status === 'active').length}</div>
                <div className="text-sm text-gray-500">Upcoming</div>
              </div>
            </div>
          </div>
        </div>

        {/* Session creation hint when pending bookings exist */}
        {pendingBookings.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div className="text-sm text-green-800">
                You have {pendingBookings.length} pending booking(s). You can create a session with 1–10 students.
              </div>
            </div>
          </div>
        )}

        {/* Upcoming sessions */}
        {sessions.filter(s => s.status === 'scheduled' || s.status === 'active').length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.filter(s => s.status === 'scheduled' || s.status === 'active').map(session => (
                <div key={session.id} className="bg-white rounded-lg shadow p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold">{session.title}</h3>
                      <p className="text-sm text-gray-500">{session.description}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">{session.status}</span>
                  </div>

                  <div className="text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {formatDate(session.scheduledAt)} • {session.duration} min</div>
                    <div className="mt-1">Students: {getStudentNamesForSession(session) || '—'}</div>
                  </div>

                  <button
                    onClick={() => window.open(session.meetingLink, '_blank', 'noopener,noreferrer')}
                    className="w-full bg-green-600 text-white px-3 py-2 rounded flex items-center justify-center gap-2"
                  >
                    <Video className="w-4 h-4" /> Start Meeting
                  </button>

                  <p className="mt-3 text-xs text-gray-400 break-all">Meeting Link: {session.meetingLink}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pending Bookings list */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Pending Student Bookings</h2>
          <div className="bg-white rounded-lg shadow divide-y">
            {pendingBookings.length === 0 ? (
              <div className="p-6 text-gray-500">No pending bookings at the moment.</div>
            ) : (
              pendingBookings.map(booking => (
                <div key={booking.id} className="p-4 flex justify-between items-start">
                  <div>
                    <div className="font-medium">{booking.studentName}</div>
                    <div className="text-sm text-gray-500">{booking.studentEmail}</div>
                    {booking.message && <div className="text-sm text-gray-400 mt-1">"{booking.message}"</div>}
                  </div>
                  <div className="text-sm text-gray-400">{new Date(booking.createdAt).toLocaleDateString()}</div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Completed sessions */}
        {sessions.filter(s => s.status === 'completed').length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Completed Sessions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.filter(s => s.status === 'completed').map(s => (
                <div key={s.id} className="bg-white rounded-lg shadow p-5">
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">{s.description}</p>
                  <div className="text-sm text-gray-600">Completed on {formatDate(s.scheduledAt)}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {sessions.length === 0 && pendingBookings.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="mx-auto w-12 h-12 mb-4 text-gray-400" />
            <h3 className="text-lg font-medium">No sessions yet</h3>
            <p className="mt-2">You’ll see bookings and sessions here once students book.</p>
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      {showCreateSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6 relative">
            <button
              onClick={() => setShowCreateSession(false)}
              className="absolute top-3 right-3 p-1 rounded hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-semibold mb-3">Create New Session</h3>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={sessionForm.title}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="mt-1 w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={sessionForm.description}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  required
                  className="mt-1 w-full border rounded px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={sessionForm.scheduledAt}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    required
                    min={new Date().toISOString().slice(0, 16)}
                    className="mt-1 w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration (min)</label>
                  <select
                    value={sessionForm.duration}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, duration: Number(e.target.value) }))}
                    className="mt-1 w-full border rounded px-3 py-2"
                  >
                    <option value={30}>30</option>
                    <option value={60}>60</option>
                    <option value={90}>90</option>
                    <option value={120}>120</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Students to Enroll (max 10)</label>
                <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-2">
                  {pendingBookings.length === 0 && <div className="text-sm text-gray-500">No pending bookings</div>}
                  {pendingBookings.map(b => (
                    <label key={b.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={sessionForm.selectedBookings.includes(b.id)}
                        onChange={() => handleBookingSelection(b.id)}
                      />
                      <div>
                        <div className="text-sm font-medium">{b.studentName}</div>
                        <div className="text-xs text-gray-500">{b.studentEmail}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end items-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateSession(false);
                    setSessionForm(prev => ({ ...prev, selectedBookings: [] }));
                  }}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
                >
                  {loading ? 'Creating...' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerDashboard;
