// src/components/BookingForm.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, MessageSquare } from 'lucide-react';
import { Trainer, Booking, Student } from '../types';
import { storage } from '../utils/storage';

interface BookingFormProps {
  trainer: Trainer;
}

export const BookingForm: React.FC<BookingFormProps> = ({ trainer }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    studentName: '',
    studentEmail: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const student: Student = {
        id: Date.now().toString(),
        name: formData.studentName,
        email: formData.studentEmail
      };
      storage.saveStudent(student);

      const booking: Booking = {
        id: Date.now().toString(),
        trainerId: trainer.id,
        studentName: formData.studentName,
        studentEmail: formData.studentEmail,
        message: formData.message,
        createdAt: new Date().toISOString()
      };
      storage.saveBooking(booking);

      navigate('/student-dashboard', {
        state: {
          message: `Booking confirmed with ${trainer.name}! You'll be notified when a session is scheduled.`,
          studentEmail: formData.studentEmail
        }
      });
    } catch (error) {
      console.error('Booking error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
      <div className="text-center mb-6">
        <img
          src={trainer.avatar}
          alt={trainer.name}
          className="w-20 h-20 rounded-full mx-auto mb-4 ring-4 ring-blue-100"
        />
        <h2 className="text-2xl font-bold text-gray-900">{trainer.name}</h2>
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {trainer.expertise.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 mb-2">
            Your Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              id="studentName"
              name="studentName"
              value={formData.studentName}
              onChange={handleInputChange}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter your full name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="studentEmail" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              id="studentEmail"
              name="studentEmail"
              value={formData.studentEmail}
              onChange={handleInputChange}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="your.email@example.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Message (Optional)
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows={3}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="Tell the trainer what you'd like to learn..."
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Booking...' : 'Book Session'}
        </button>
      </form>
    </div>
  );
};

export default BookingForm;
