import React from 'react';
import { Calendar, Clock, Users, Video, ExternalLink } from 'lucide-react';
import { Session } from '../types';
import { openMeeting } from '../utils/meetingLink';

interface SessionCardProps {
  session: Session;
  isTrainer?: boolean;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, isTrainer = false }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
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

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{session.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{session.description}</p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(session.scheduledAt)}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{formatTime(session.scheduledAt)} • {session.duration} minutes</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{session.studentIds.length} students enrolled</span>
          </div>
        </div>

        {session.meetingLink && (
          <button
            onClick={() => openMeeting(session.meetingLink)}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <Video className="h-4 w-4" />
            <span>Join Meeting</span>
            <ExternalLink className="h-4 w-4" />
          </button>
        )}

        {isTrainer && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Meeting Link: {session.meetingLink}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};