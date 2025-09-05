import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PaymentBookingForm } from '../components/PaymentBookingForm';
import { trainersData } from '../data/trainers';

export const BookingPage: React.FC = () => {
  const { trainerId } = useParams<{ trainerId: string }>();
  const trainer = trainersData.find(t => t.id === trainerId);

  if (!trainer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Trainer not found</h2>
          <Link to="/" className="text-blue-600 hover:text-blue-700">
            Return to trainers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Trainers</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Trainer Info */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-6">
              <img
                src={trainer.avatar}
                alt={trainer.name}
                className="w-32 h-32 rounded-full mx-auto mb-4 ring-4 ring-blue-100"
              />
              <h1 className="text-3xl font-bold text-gray-900">{trainer.name}</h1>
              <p className="text-gray-600 mt-2">{trainer.description}</p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {trainer.expertise.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{trainer.rating}</div>
                  <div className="text-sm text-gray-600">Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{trainer.totalSessions}</div>
                  <div className="text-sm text-gray-600">Sessions</div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Booking Form */}
          <div>
            <PaymentBookingForm trainer={trainer} />
          </div>
        </div>
      </div>
    </div>
  );
};