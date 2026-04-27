/**
 * Dedicated database types and interfaces to replace Drizzle-inferred types.
 */

export type EventType = 'Hackathon' | 'Workshop' | 'Conference' | 'Internship' | 'Other';
export type ApplicationStatus = 'Interested' | 'Applied' | 'Under Review' | 'Accepted' | 'Rejected' | 'Withdrawn';
export type UserRole = 'user' | 'admin';
export type NotificationType = 'status_change' | 'deadline_reminder' | 'upcoming_deadline';
export type ViewType = 'dashboard' | 'kanban' | 'list' | 'calendar' | 'analytics';
export type ProfileVisibility = 'public' | 'private';
export type TeamRole = 'lead' | 'member' | 'mentor';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface User {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  passwordHash?: string | null;
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
  skillsJson?: UserSkill[];
  interests?: string[];
  experienceLevel?: SkillLevel;
  preferredEventTypes?: string[];
  location?: string;
  timezone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type InsertUserApplicationProfile = Omit<UserApplicationProfile, 'id' | 'createdAt' | 'updatedAt'>;

// =====================================================
// ADVANCED FEATURES TYPES
// =====================================================

// Feature 1: Skills & Interests
export interface UserSkill {
  name: string;
  level: SkillLevel;
  yearsOfExperience?: number;
}

// Feature 2: Team Formation
export interface Team {
  id: number;
  name: string;
  description?: string;
  applicationId: number;
  createdBy: number;
  maxMembers: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: number;
  teamId: number;
  userId: number;
  role: TeamRole;
  joinedAt: Date;
  user?: User;
}

export interface TeamWithMembers extends Team {
  members: TeamMember[];
  memberCount: number;
  isFull: boolean;
}

// Feature 3: Calendar Conflicts
export interface CalendarConflict {
  id: number;
  userId: number;
  applicationId1: number;
  applicationId2: number;
  conflictDateStart: Date;
  conflictDateEnd: Date;
  recommendedApplicationId?: number;
  resolved: number;
  createdAt: Date;
}

// Feature 4: Success Scoring
export interface SuccessFactor {
  eventTypeSuccessRate: number;
  userExperienceLevel: number;
  skillMatchPercentage: number;
  timelineScore: number;
  historicalTrend: number;
}

export interface EventSuccessScore {
  id: number;
  applicationId: number;
  userId: number;
  successProbability: number;
  scoreFactors: SuccessFactor;
  calculatedAt: Date;
}

// Feature 5: Recommendations
export interface Recommendation {
  id: string;
  applicationId: number;
  eventName: string;
  eventType: EventType;
  score: number;
  matchReasons: string[];
  userFitPercentage: number;
  skillGaps?: string[];
}

// Public Profile
export interface PublicUserProfileStats {
  totalApplications: number;
  acceptedCount: number;
  acceptanceRate: number;
  eventTypeBreakdown: Record<string, number>;
}

export interface PublicUserProfile {
  username: string;
  bio?: string;
  avatarUrl?: string;
  websiteUrl?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  stats: PublicUserProfileStats;
  acceptedApplications?: Application[];
}
