import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Users, Clock } from 'lucide-react';
import { Trainer } from '../types';

interface TrainerCardProps {
  trainer: Trainer;
}

export const TrainerCard: React.FC<TrainerCardProps> = ({ trainer }) => {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group">
      <div className="p-6">
        <div className="flex items-start space-x-4">
          <img
            src={trainer.avatar}
            alt={trainer.name}
            className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-100"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {trainer.name}
            </h3>
            <div className="flex items-center space-x-1 mt-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium text-gray-700">{trainer.rating}</span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-500 flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>{trainer.totalSessions} sessions</span>
              </span>
            </div>
          </div>
        </div>

        <p className="text-gray-600 text-sm mt-3 line-clamp-2">
          {trainer.description}
        </p>

        <div className="flex flex-wrap gap-2 mt-4">
          {trainer.expertise.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {skill}
            </span>
          ))}
        </div>

        <div className="mt-6">
          <Link
            to={`/book/${trainer.id}`}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2 group-hover:bg-blue-700"
          >
            <Clock className="h-4 w-4" />
            <span>Book Session</span>
          </Link>
        </div>
      </div>
    </div>
  );
};