// src/utils/storage.ts
import { Booking, Session, Student } from '../types';

const BOOKINGS_KEY = 'training_bookings';
const SESSIONS_KEY = 'training_sessions';
const STUDENTS_KEY = 'training_students';

export const storage = {
  getBookings: (): Booking[] => {
    const data = localStorage.getItem(BOOKINGS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveBooking: (booking: Booking): void => {
    const bookings = storage.getBookings();
    bookings.push(booking);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  },

  updateBooking: (bookingId: string, updates: Partial<Booking>): void => {
    const bookings = storage.getBookings();
    const index = bookings.findIndex(b => b.id === bookingId);
    if (index !== -1) {
      bookings[index] = { ...bookings[index], ...updates };
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
    }
  },

  getSessions: (): Session[] => {
    const data = localStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveSession: (session: Session): void => {
    const sessions = storage.getSessions();
    sessions.push(session);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  },

  updateSession: (sessionId: string, updates: Partial<Session>): void => {
    const sessions = storage.getSessions();
    const index = sessions.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      sessions[index] = { ...sessions[index], ...updates };
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    }
  },

  getStudents: (): Student[] => {
    const data = localStorage.getItem(STUDENTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveStudent: (student: Student): void => {
    const students = storage.getStudents();
    const existing = students.find(s => s.email === student.email);
    if (!existing) {
      students.push(student);
      localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
    }
  },

  getStudentByEmail: (email: string): Student | undefined => {
    const students = storage.getStudents();
    return students.find(s => s.email === email);
  }
};
