/**
 * Dedicated database types and interfaces to replace Drizzle-inferred types.
 */

export type EventType = 'Hackathon' | 'Workshop' | 'Conference' | 'Other';
export type ApplicationStatus = 'Interested' | 'Applied' | 'Under Review' | 'Accepted' | 'Rejected' | 'Withdrawn';
export type UserRole = 'user' | 'admin';
export type NotificationType = 'status_change' | 'deadline_reminder' | 'upcoming_deadline';
export type ViewType = 'dashboard' | 'kanban' | 'list' | 'calendar' | 'analytics';
export type ProfileVisibility = 'public' | 'private';

export interface User {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

export type InsertUser = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>> & { openId: string };

export interface Application {
  id: number;
  userId: number;
  eventName: string;
  eventType: EventType;
  status: ApplicationStatus;
  deadline: Date | null;
  notes: string | null;
  url: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type InsertApplication = Omit<Application, 'id' | 'createdAt' | 'updatedAt'>;

export interface Notification {
  id: number;
  userId: number;
  applicationId: number | null;
  type: NotificationType;
  subject: string;
  message: string;
  sent: number;
  sentAt: Date | null;
  createdAt: Date;
}

export type InsertNotification = Omit<Notification, 'id' | 'createdAt' | 'sentAt'>;

export interface UserPreference {
  id: number;
  userId: number;
  defaultView: ViewType;
  notificationsEnabled: number;
  emailNotificationsEnabled: number;
  emailDeadlineReminders: number;
  emailStatusUpdates: number;
  weeklyDigestEnabled: number;
  digestDay: string;
  createdAt: Date;
  updatedAt: Date;
}

export type InsertUserPreferences = Omit<UserPreference, 'id' | 'createdAt' | 'updatedAt'>;

export interface UserProfile {
  id: number;
  userId: number;
  username: string;
  bio: string | null;
  profileVisibility: ProfileVisibility;
  showAcceptedOnly: number;
  avatarUrl: string | null;
  websiteUrl: string | null;
  linkedinUrl: string | null;
  twitterHandle: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type InsertUserProfile = Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>;

export interface DigestLog {
  id: number;
  userId: number;
  subject: string;
  contentSummary: string | null;
  sent: number;
  sentAt: Date | null;
  createdAt: Date;
}

export interface UserApplicationProfile {
  id: number;
  userId: number;
  fullName: string | null;
  college: string | null;
  degree: string | null;
  graduationYear: number | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  resumeUrl: string | null;
  skills: string | null;
  shortBio: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type InsertUserApplicationProfile = Omit<UserApplicationProfile, 'id' | 'createdAt' | 'updatedAt'>;
