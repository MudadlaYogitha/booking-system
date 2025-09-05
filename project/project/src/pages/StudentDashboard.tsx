// src/pages/StudentDashboard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, AlertCircle, CheckCircle, Video, Clock, Users, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getBookingsByUser, markUserJoinedSession } from '../lib/database';
import { DatabaseBooking, DatabaseSession } from '../lib/database';
import { trainersData } from '../data/trainers';
import type { User } from '@supabase/supabase-js';

/**
 * StudentDashboard
 * - Loads bookings for the logged-in student
 * - Loads sessions referenced by those bookings
 * - Adds a Supabase realtime subscription so when the trainer updates bookings (sets session_id)
 *   the student's dashboard updates instantly.
 */
export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<DatabaseBooking[]>([]);
  const [sessions, setSessions] = useState<DatabaseSession[]>([]);

  // Keep a ref to the current realtime subscription objects so we can cleanup reliably
  const realtimeRefs = useRef<any[]>([]);

  useEffect(() => {
    checkUserAndLoadData();

    // cleanup on unmount
    return () => {
      cleanupRealtime();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanupRealtime = async () => {
    try {
      // supabase v2 channel objects commonly have `unsubscribe()`; supabase also provides removeChannel
      for (const sub of realtimeRefs.current) {
        try {
          if (!sub) continue;
          if (typeof sub.unsubscribe === 'function') {
            await sub.unsubscribe();
          } else if (typeof supabase.removeChannel === 'function') {
            // v2 approach: supabase.removeChannel(channel)
            await supabase.removeChannel(sub);
          } else if (typeof sub.close === 'function') {
            sub.close();
          }
        } catch (err) {
          console.warn('Error unsubscribing realtime sub:', err);
        }
      }
    } finally {
      realtimeRefs.current = [];
    }
  };

  const checkUserAndLoadData = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;

      const currentUser = data?.user ?? null;
      if (!currentUser) {
        navigate('/login');
        return;
      }

      setUser(currentUser);
      await loadUserData(currentUser.id);

      // setup realtime listeners for this user
      setupRealtimeListeners(currentUser.id);
    } catch (error) {
      console.error('Error loading user data:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Loads:
   *  - bookings for the current user (via getBookingsByUser)
   *  - then fetches sessions that are assigned to any of the user's bookings
   */
  const loadUserData = async (userId: string) => {
    try {
      const userBookings = (await getBookingsByUser(userId)) || [];
      setBookings(userBookings);

      const sessionIds = Array.from(
        new Set(
          userBookings
            .map(b => (b as any).session_id ?? (b as any).sessionId ?? null)
            .filter(Boolean) as string[]
        )
      );

      if (sessionIds.length === 0) {
        setSessions([]);
        return;
      }

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .in('id', sessionIds);

      if (sessionsError) {
        console.error('Error fetching sessions for user:', sessionsError);
        setSessions([]);
        return;
      }

      if (!sessionsData || !Array.isArray(sessionsData)) {
        setSessions([]);
        return;
      }

      const converted: DatabaseSession[] = (sessionsData as any[]).map((s) => ({
        id: s.id,
        trainer_id: s.trainer_id ?? s.trainerId ?? '',
        trainer_name: s.trainer_name ?? s.trainerName ?? '',
        title: s.title ?? '',
        description: s.description ?? '',
        scheduled_at: s.scheduled_at ?? s.scheduledAt ?? '',
        duration: s.duration ?? 0,
        meeting_link: s.meeting_link ?? s.meetingLink ?? '',
        status: s.status ?? 'scheduled',
        created_at: s.created_at ?? s.createdAt ?? null
      }));

      setSessions(converted);
    } catch (error) {
      console.error('Error loading user data:', error);
      setSessions([]);
    }
  };

  const handleJoinSession = async (sessionId: string, meetingLink: string) => {
    try {
      await markUserJoinedSession(sessionId);
    } catch (error) {
      console.error('Error marking joined session:', error);
    } finally {
      if (meetingLink) {
        window.open(meetingLink, '_blank', 'noopener,noreferrer');
      } else {
        alert('Meeting link is not available for this session.');
      }
    }
  };

  // Subscribe to relevant realtime events:
  // - bookings updates for this student (so when trainer assigns session_id we reload)
  // - optionally sessions updates (not strictly necessary if bookings drive visibility)
  const setupRealtimeListeners = (userId: string) => {
    // cleanup any existing subs
    cleanupRealtime();

    // Prefer supabase.channel (v2). Fallback to supabase.from(...).on(...).subscribe() (v1)
    try {
      if ((supabase as any).channel) {
        // v2: create a channel and listen to Postgres changes on bookings filtered by student_id
        const bookingsChannel = (supabase as any)
          .channel(`public:bookings:student=${userId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'bookings', filter: `student_id=eq.${userId}` },
            (payload: any) => {
              // When booking changes (especially session_id), reload bookings+sessions
              console.debug('Realtime booking event for user:', payload);
              loadUserData(userId);
            }
          )
          .subscribe((status: any) => {
            // status: 'SUBSCRIBED' etc.
            console.debug('bookings channel status', status);
          });

        realtimeRefs.current.push(bookingsChannel);

        // Also subscribe to sessions table changes (optional) to update meeting_link/status if trainer modifies session row
        const sessionsChannel = (supabase as any)
          .channel(`public:sessions:student=${userId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'sessions' },
            (payload: any) => {
              // If a session changed that this student is part of, reload
              console.debug('Realtime sessions event:', payload);
              const newSessionRow = payload?.record;
              if (!newSessionRow) {
                // general reload
                loadUserData(userId);
                return;
              }

              // If the changed session id is one of the student's sessions, reload
              const studentSessionIds = sessions.map(s => s.id);
              if (studentSessionIds.includes(newSessionRow.id)) {
                loadUserData(userId);
              }
            }
          )
          .subscribe((status: any) => {
            console.debug('sessions channel status', status);
          });

        realtimeRefs.current.push(sessionsChannel);
      } else if ((supabase as any).from) {
        // fallback (older client)
        const bookingSub = (supabase as any)
          .from(`bookings:student_id=eq.${userId}`)
          .on('INSERT', (payload: any) => {
            console.debug('booking insert', payload);
            loadUserData(userId);
          })
          .on('UPDATE', (payload: any) => {
            console.debug('booking update', payload);
            loadUserData(userId);
          })
          .on('DELETE', (payload: any) => {
            console.debug('booking delete', payload);
            loadUserData(userId);
          })
          .subscribe();

        realtimeRefs.current.push(bookingSub);

        const sessionsSub = (supabase as any)
          .from('sessions')
          .on('UPDATE', (payload: any) => {
            console.debug('sessions update', payload);
            loadUserData(userId);
          })
          .subscribe();

        realtimeRefs.current.push(sessionsSub);
      } else {
        console.warn('Supabase realtime not available on this client version.');
      }
    } catch (err) {
      console.warn('Error setting up realtime listeners (non-fatal):', err);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h2>
          <p className="text-gray-600 mb-6">You need to be signed in to view your sessions</p>
          <Link
            to="/login"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const pendingBookings = bookings.filter(b => !b.session_id && b.payment_status === 'completed');
  const upcomingSessions = sessions.filter(s => s.status === 'scheduled' || s.status === 'active');
  const completedSessions = sessions.filter(s => s.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Sessions</h1>
          <p className="text-gray-600">
            Welcome back, {user.user_metadata?.full_name || user.email}! Here are your training sessions and bookings.
          </p>
        </div>

        {/* Upcoming Sessions */}
        {upcomingSessions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Video className="h-5 w-5" />
              <span>Upcoming Sessions</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingSessions.map(session => (
                <div key={session.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{session.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{session.trainer_name}</p>
                        <p className="text-sm text-gray-600">{session.description}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                        {session.status?.charAt(0).toUpperCase() + session.status?.slice(1)}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(session.scheduled_at)}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(session.scheduled_at)} • {session.duration} minutes</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>Session assigned to you</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleJoinSession(session.id, session.meeting_link)}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <Video className="h-4 w-4" />
                      <span>Join Meeting</span>
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Bookings */}
        {pendingBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <span>Pending Bookings</span>
            </h2>
            <div className="bg-white rounded-lg shadow-md">
              {pendingBookings.map(booking => {
                const trainer = trainersData.find(t => t.id === booking.trainer_id);
                return (
                  <div key={booking.id} className="border-b border-gray-200 last:border-b-0 p-6">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          Booking with {trainer?.name || 'Unknown Trainer'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Booked on {new Date(booking.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-yellow-600 mt-1">
                          Waiting for the trainer to schedule a session for you.
                        </p>
                        {booking.message && (
                          <p className="text-sm text-gray-500 mt-1">
                            Message: "{booking.message}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Sessions */}
        {completedSessions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Completed Sessions</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedSessions.map(session => (
                <div key={session.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{session.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{session.trainer_name}</p>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Completed
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Completed on {formatDate(session.scheduled_at)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {upcomingSessions.length === 0 && pendingBookings.length === 0 && completedSessions.length === 0 && (
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

export default StudentDashboard;
