import React from 'react';
import { TrainerCard } from '../components/TrainerCard';
import { trainersData } from '../data/trainers';
import { BookOpen, Star, Users, Zap } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Learn from the Best
              <span className="block text-yellow-300">Train with Experts</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Connect with world-class trainers and join group sessions. 
              Free, open-source, and designed for collaborative learning.
            </p>
            <div className="flex flex-wrap justify-center gap-8 mt-12">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6 text-yellow-300" />
                <span className="font-medium">Expert Trainers</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-yellow-300" />
                <span className="font-medium">Group Sessions</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-6 w-6 text-yellow-300" />
                <span className="font-medium">100% Free</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trainers Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Trainers</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose from our carefully selected experts and join interactive group sessions. 
            Minimum 5 students per session for the best collaborative experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trainersData.map((trainer) => (
            <TrainerCard key={trainer.id} trainer={trainer} />
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Group Learning</h3>
              <p className="text-gray-600">
                Sessions start when 5+ students book with the same trainer for optimal group dynamics.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Expert Trainers</h3>
              <p className="text-gray-600">
                Learn from industry professionals with years of real-world experience.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Free Platform</h3>
              <p className="text-gray-600">
                No hidden costs, no subscriptions. Open-source and completely free to use.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};