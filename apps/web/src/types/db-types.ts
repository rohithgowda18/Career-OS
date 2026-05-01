/**
 * Dedicated database types and interfaces for the Event App Tracker.
 */

export type EventType = 'Hackathon' | 'Workshop' | 'Conference' | 'Internship' | 'Other';
export type ApplicationStatus = 'Interested' | 'Applied' | 'UnderReview' | 'Accepted' | 'Rejected';
export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: number;
  userId: number;
  eventName: string;
  eventType: EventType;
  status: ApplicationStatus;
  deadline: string | null;
  notes: string | null;
  url: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: number;
  userId: number;
  college: string | null;
  skills: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsSummary {
  totalApplications: number;
  accepted: number;
  underReview: number;
  applied: number;
  interested: number;
  rejected: number;
  overallAcceptanceRate: number;
}
