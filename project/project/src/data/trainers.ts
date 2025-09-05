// src/data/trainersData.ts
import { Trainer } from '../types';

export const trainersData: Trainer[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    expertise: ['React', 'TypeScript', 'Node.js'],
    description: 'Full-stack developer with 8+ years of experience building scalable web applications.',
    avatar: 'https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
    rating: 4.9,
    totalSessions: 245,
    priceId: 'training_session',
    price: 10,
    priceMode: 'subscription'
  },
  {
    id: '2',
    name: 'Michael Chen',
    expertise: ['Python', 'Machine Learning', 'Data Science'],
    description: 'AI researcher and data scientist specializing in machine learning and deep learning.',
    avatar: 'https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
    rating: 4.8,
    totalSessions: 189,
    priceId: 'training_session',
    price: 10,
    priceMode: 'subscription'
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    expertise: ['Java', 'Spring Boot', 'Microservices'],
    description: 'Backend engineer with expertise in enterprise Java applications and cloud architecture.',
    avatar: 'https://images.pexels.com/photos/3785081/pexels-photo-3785081.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
    rating: 4.7,
    totalSessions: 156,
    priceId: 'training_session',
    price: 25,
    priceMode: 'subscription'
  },
  {
    id: '4',
    name: 'David Kim',
    expertise: ['DevOps', 'AWS', 'Kubernetes'],
    description: 'Cloud infrastructure specialist with focus on containerization and CI/CD pipelines.',
    avatar: 'https://images.pexels.com/photos/3785083/pexels-photo-3785083.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
    rating: 4.9,
    totalSessions: 203,
    priceId: 'training_session',
    price: 25,
    priceMode: 'subscription'
  },
  {
    id: '5',
    name: 'Lisa Thompson',
    expertise: ['UI/UX Design', 'Figma', 'Design Systems'],
    description: 'Senior UX designer with a passion for creating intuitive and accessible user experiences.',
    avatar: 'https://images.pexels.com/photos/3785085/pexels-photo-3785085.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
    rating: 4.8,
    totalSessions: 178,
    priceId: 'training_session',
    price: 25,
    priceMode: 'subscription'
  },
  {
    id: '6',
    name: 'Alex Petrov',
    expertise: ['Mobile Development', 'React Native', 'Flutter'],
    description: 'Mobile app developer with expertise in cross-platform development and native performance.',
    avatar: 'https://images.pexels.com/photos/3785087/pexels-photo-3785087.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
    rating: 4.6,
    totalSessions: 134,
    priceId: 'training_session',
    price: 25,
    priceMode: 'subscription'
  }
];
