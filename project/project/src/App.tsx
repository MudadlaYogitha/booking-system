// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { BookingPage } from './pages/BookingPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { TrainerDashboard } from './pages/TrainerDashboard';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ProductsPage } from './pages/ProductsPage';
import { SuccessPage } from './pages/SuccessPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/book/:trainerId" element={<BookingPage />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/trainer-dashboard" element={<TrainerDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
