# Advanced Features - File Reference Guide

This document provides a quick reference to all files created and modified for the advanced features implementation.

## 📁 File Structure Overview

```
event-app-tracker/
│
├── Documentation
│   ├── ADVANCED_FEATURES_IMPLEMENTATION.md    (670+ lines) - Comprehensive implementation details
│   ├── SETUP_ADVANCED_FEATURES.md             (400+ lines) - Quick start guide
│   ├── DEPLOYMENT_CHECKLIST.md                (500+ lines) - Pre/post deployment checklist
│   └── README_ADVANCED_FEATURES.md             (This file)
│
├── Database
│   └── migrations/
│       └── 001_advanced_features.sql          (230+ lines) - PostgreSQL schema migration
│
├── Scripts
│   └── scripts/
│       └── migration-runner.ts                (300+ lines) - Migration execution utility
│
├── Backend Services
│   └── server/_core/
│       ├── recommendationService.ts           (319 lines) - Feature 1: AI Recommendations
│       ├── teamService.ts                     (264 lines) - Feature 2: Team Formation
│       ├── conflictDetectionService.ts        (168 lines) - Feature 3: Conflict Detection
│       └── successScoringService.ts           (218 lines) - Feature 4: Success Scoring
│
├── Backend Types
│   └── shared/
│       └── db-types.ts                        (Extended +100 lines) - Type definitions
│
├── Backend Routes
│   └── server/
│       └── routers.ts                         (Extended +250 lines) - tRPC endpoints
│
├── Tests
│   └── server/
│       ├── recommendationService.test.ts      (300+ lines) - Tests for recommendations
│       ├── teamService.test.ts                (400+ lines) - Tests for teams
│       ├── conflictDetectionService.test.ts   (350+ lines) - Tests for conflicts
│       └── successScoringService.test.ts      (400+ lines) - Tests for scoring
│
├── Configuration
│   └── .env.example                           (500+ lines) - Environment variable documentation
│
└── Frontend Components (To be created)
    └── client/src/components/
        ├── PersonalizedRecommendations.tsx
        ├── TeamFormation.tsx
        ├── ConflictDetectionBanner.tsx
        └── SuccessProbabilityBadge.tsx
```

## 📖 Documentation Files

### 1. ADVANCED_FEATURES_IMPLEMENTATION.md (Core Documentation)
**Location:** `./ADVANCED_FEATURES_IMPLEMENTATION.md`
**Size:** 670+ lines
**Purpose:** Comprehensive technical documentation covering:
- Architecture overview
- Database schema details
- Service layer implementations
- Available API endpoints
- Usage examples with TypeScript
- Configuration options

**When to use:**
- Understanding advanced feature architecture
- Implementing frontend components
- Troubleshooting issues
- Reference for API contracts

### 2. SETUP_ADVANCED_FEATURES.md (Setup Guide)
**Location:** `./SETUP_ADVANCED_FEATURES.md`
**Size:** 400+ lines
**Purpose:** Step-by-step setup and configuration guide:
- Prerequisites
- Installation steps
- Integration points
- API endpoints overview
- Testing checklist
- Troubleshooting tips

**When to use:**
- Initial project setup
- New team member onboarding
- Environment configuration
- Feature troubleshooting

### 3. DEPLOYMENT_CHECKLIST.md (Deployment Guide)
**Location:** `./DEPLOYMENT_CHECKLIST.md`
**Size:** 500+ lines
**Purpose:** Complete deployment checklist:
- Pre-deployment verification
- Security checklist
- Step-by-step deployment
- Feature validation
- Monitoring setup
- Rollback procedures

**When to use:**
- Before deploying to production
- Validating deployment success
- Setting up monitoring
- Planning rollback scenarios

### 4. .env.example (Configuration Reference)
**Location:** `./.env.example`
**Size:** 500+ lines
**Purpose:** Complete environment variable documentation:
- Database configuration
- Feature flags
- API settings
- Email configuration
- Monitoring setup
- Security settings

**When to use:**
- Setting up environment variables
- Configuring production deployment
- Understanding available options
- Troubleshooting configuration issues

## 🗄️ Database Files

### Migration Script
**Location:** `./migrations/001_advanced_features.sql`
**Size:** 230+ lines
**Content:**
- 4 new tables (teams, team_members, calendar_conflicts, event_success_scores)
- 2 custom enums (team_role, skill_level)
- 12+ performance indexes
- Constraint definitions
- Optional analytics views

**How to run:**
```bash
# Option 1: Using psql directly
psql $DATABASE_URL < migrations/001_advanced_features.sql

# Option 2: Using migration runner
npm run migrate

# Check status
npm run migrate status
```

## ⚙️ Backend Files

### Service Implementations

#### 1. recommendationService.ts (Feature 1)
**Location:** `./server/_core/recommendationService.ts`
**Lines:** 319
**Purpose:** AI-powered event recommendations
**Key Methods:**
- `calculateMatchScore()` - Score algorithm
- `generateForUser()` - Generate top 5 recommendations
- `updateUserProfile()` - Store user preferences
- `identifySkillGaps()` - Find missing skills

**Dependencies:**
- PostgreSQL pool
- UserSkill interface
- UserApplicationProfile types

**Usage Example:**
```typescript
const recommendations = await RecommendationService.generateForUser(
  pool,
  userId,
  applicationList
);
```

#### 2. teamService.ts (Feature 2)
**Location:** `./server/_core/teamService.ts`
**Lines:** 264
**Purpose:** Team management system
**Key Methods:**
- `createTeam()` - Create new team
- `addTeamMember()` - Add user to team
- `getTeamWithMembers()` - Fetch team data
- `removeTeamMember()` - Remove user from team
- `deleteTeam()` - Delete team
- `updateTeam()` - Update team properties

**Dependencies:**
- PostgreSQL pool
- Team and TeamMember interfaces

**Usage Example:**
```typescript
const team = await TeamService.createTeam(
  pool,
  applicationId,
  userId,
  'Team Name',
  'Description',
  5  // max members
);
```

#### 3. conflictDetectionService.ts (Feature 3)
**Location:** `./server/_core/conflictDetectionService.ts`
**Lines:** 168
**Purpose:** Detect overlapping event deadlines
**Key Methods:**
- `detectConflicts()` - Find conflicting dates
- `getSmartRecommendation()` - Recommend priority
- `storeConflict()` - Save conflict record
- `resolveConflict()` - Mark as resolved
- `getUserConflicts()` - Fetch user conflicts

**Dependencies:**
- PostgreSQL pool
- CalendarConflict interface

**Usage Example:**
```typescript
const conflicts = await ConflictDetectionService.detectConflicts(
  pool,
  userId
);
```

#### 4. successScoringService.ts (Feature 4)
**Location:** `./server/_core/successScoringService.ts`
**Lines:** 218
**Purpose:** Calculate success probability scores
**Key Methods:**
- `calculateSuccessProbability()` - Compute probability
- `storeSuccessScore()` - Save score
- `getSuccessScore()` - Fetch score
- `getSuccessProbabilities()` - Fetch all scores

**Dependencies:**
- PostgreSQL pool
- EventSuccessScore interface

**Usage Example:**
```typescript
const probability = SuccessScoringService.calculateSuccessProbability(
  eventSuccessRate,
  userExperienceLevel,
  acceptanceRate,
  daysUntilDeadline,
  historicalTrend
);
```

### Type Definitions
**Location:** `./shared/db-types.ts`
**Added Lines:** 100+
**New Types:**
- TeamRole: 'lead' | 'member' | 'mentor'
- SkillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'

**New Interfaces:**
- UserSkill, Team, TeamMember, TeamWithMembers
- CalendarConflict, EventSuccessScore, Recommendation
- SuccessFactor, PublicUserProfile, PublicUserProfileStats

### Router Integration
**Location:** `./server/routers.ts`
**Added Lines:** 250+
**5 New Routers:**
1. **recommendations** (2 procedures)
   - `getPersonalized()` - Query
   - `updateUserProfile()` - Mutation

2. **teams** (6 procedures)
   - `create()`, `getByEvent()`, `getById()`, `getUserTeams()`
   - `join()`, `leave()`

3. **calendar** (4 procedures)
   - `detectConflicts()`, `getConflictRecommendation()`
   - `getUserConflicts()`, `resolveConflict()`

4. **successScoring** (2 procedures)
   - `getProbability()`, `getProbabilitiesForAll()`

5. **publicProfile** (2 procedures)
   - `getByUsername()`, `updateVisibility()`

**Usage:**
```typescript
// Client-side tRPC
const { data } = trpc.recommendations.getPersonalized.useQuery();
const mutation = trpc.teams.create.useMutation();
```

## 🧪 Test Files

### 1. recommendationService.test.ts
**Location:** `./server/recommendationService.test.ts`
**Lines:** 300+
**Test Coverage:**
- Match score calculation
- Skill gap identification
- Recommendation generation
- User profile updates

**Run tests:**
```bash
npm run test recommendationService.test.ts
```

### 2. teamService.test.ts
**Location:** `./server/teamService.test.ts`
**Lines:** 400+
**Test Coverage:**
- Team creation
- Member addition/removal
- Team capacity management
- Team data retrieval

**Run tests:**
```bash
npm run test teamService.test.ts
```

### 3. conflictDetectionService.test.ts
**Location:** `./server/conflictDetectionService.test.ts`
**Lines:** 350+
**Test Coverage:**
- Conflict detection
- Smart recommendations
- Conflict resolution
- Edge cases

**Run tests:**
```bash
npm run test conflictDetectionService.test.ts
```

### 4. successScoringService.test.ts
**Location:** `./server/successScoringService.test.ts`
**Lines:** 400+
**Test Coverage:**
- Probability calculation
- Weight verification
- Score storage/retrieval
- Algorithm edge cases

**Run tests:**
```bash
npm run test successScoringService.test.ts
```

## 🛠️ Utility Scripts

### Migration Runner
**Location:** `./scripts/migration-runner.ts`
**Lines:** 300+
**Purpose:** Database migration management utility
**Commands:**
```bash
npm run migrate              # Run all pending migrations
npm run migrate status       # Show migration status
npm run migrate rollback     # Rollback last migration (dev only)
```

**Features:**
- Transaction-based migrations
- Migration tracking in database
- Rollback support
- Status reporting

## 📋 Additional Reference

### Commands Summary

```bash
# Setup
npm install
npm run build

# Database
npm run migrate              # Run migrations
npm run migrate status       # Check status
psql $DATABASE_URL < migrations/001_advanced_features.sql

# Testing
npm run test                 # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report

# Development
npm run dev                  # Start dev server
npm run build               # Build for production
npm run typecheck           # Check types

# Deployment
npm run deploy:staging      # Deploy to staging
npm run deploy:production   # Deploy to production
npm run verify:db           # Verify database
```

### File Dependencies

```
recommendationService.ts
├── shared/db-types.ts (UserSkill, UserApplicationProfile)
└── server/db.ts (PostgreSQL pool)

teamService.ts
├── shared/db-types.ts (Team, TeamMember)
└── server/db.ts (PostgreSQL pool)

conflictDetectionService.ts
├── shared/db-types.ts (CalendarConflict)
└── server/db.ts (PostgreSQL pool)

successScoringService.ts
├── shared/db-types.ts (EventSuccessScore, SuccessFactor)
└── server/db.ts (PostgreSQL pool)

routers.ts
├── All 4 services above
├── shared/db-types.ts
└── server/db.ts
```

### Environment Variables by Feature

```
Feature 1 (Recommendations):
FEATURE_AI_RECOMMENDATIONS=true
REC_SKILL_WEIGHT=0.35
REC_EXPERIENCE_WEIGHT=0.25
REC_INTEREST_WEIGHT=0.20
REC_HISTORY_WEIGHT=0.20

Feature 2 (Teams):
FEATURE_TEAMS=true
TEAMS_MAX_MEMBERS=10
TEAMS_DEFAULT_MAX=5

Feature 3 (Conflicts):
FEATURE_CONFLICT_DETECTION=true
CONFLICT_CHECK_SAME_DAY=true

Feature 4 (Success Scoring):
FEATURE_SUCCESS_SCORING=true
SCORE_EVENT_TYPE_WEIGHT=0.30
SCORE_EXPERIENCE_WEIGHT=0.25
SCORE_ACCEPTANCE_WEIGHT=0.20
SCORE_TIMELINE_WEIGHT=0.15
SCORE_TREND_WEIGHT=0.10

Feature 5 (Public Profile):
FEATURE_PUBLIC_PROFILE=true
DEFAULT_PROFILE_VISIBILITY=private
```

## 🎯 Next Steps

### Phase 1: Setup (Immediate)
1. Review SETUP_ADVANCED_FEATURES.md
2. Copy .env.example to .env.local
3. Configure environment variables
4. Run migrations: `npm run migrate`

### Phase 2: Testing (Day 1-2)
1. Run all unit tests
2. Run integration tests
3. Manual testing on staging
4. Performance testing

### Phase 3: Deployment (Day 3)
1. Follow DEPLOYMENT_CHECKLIST.md
2. Deploy to staging first
3. Run smoke tests
4. Deploy to production
5. Monitor for errors

### Phase 4: Frontend (Week 2)
1. Create React components
2. Integrate with tRPC
3. Add UI tests
4. Deploy frontend changes

---

## 📞 Getting Help

- **API Documentation:** See ADVANCED_FEATURES_IMPLEMENTATION.md
- **Setup Issues:** See SETUP_ADVANCED_FEATURES.md
- **Deployment Questions:** See DEPLOYMENT_CHECKLIST.md
- **Configuration Help:** See .env.example
- **Code Questions:** Check individual service files for inline comments

---

**Last Updated:** January 2024
**Version:** 1.0.0
