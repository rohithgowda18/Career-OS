# Advanced Features Implementation - Setup Guide

## 🚀 Quick Start

This guide walks you through implementing all 5 advanced features for the Event App Tracker using PostgreSQL.

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Existing Event App Tracker setup
- npm or yarn

## 🔧 Installation Steps

### Step 1: Run Database Migrations

```bash
# Navigate to server directory
cd server

# Run the migration script
psql -U postgres -d event_tracker -f ../migrations/001_advanced_features.sql
```

Or if using environment variables:

```bash
psql $DATABASE_URL < ../migrations/001_advanced_features.sql
```

**Verify migration:**
```bash
psql $DATABASE_URL
postgres=> SELECT * FROM information_schema.tables WHERE table_name IN ('teams', 'team_members', 'calendar_conflicts', 'event_success_scores');
```

### Step 2: Backend Implementation

1. **Copy service files** to `server/_core/`:
   - ✅ `recommendationService.ts`
   - ✅ `teamService.ts`
   - ✅ `conflictDetectionService.ts`
   - ✅ `successScoringService.ts`

2. **Update shared types** (`shared/db-types.ts`):
   - Add new enums: `TeamRole`, `SkillLevel`
   - Add new interfaces for all features

3. **Update routers** (`server/routers.ts`):
   - Import new services
   - Add router definitions for all 5 features

4. **Rebuild backend:**
```bash
npm run build
npm run dev
```

### Step 3: Frontend Components

Create React components in `client/src/components/`:

```typescript
// Personalized Recommendations
PersonalizedRecommendations.tsx

// Team Formation
TeamFormation.tsx

// Conflict Detection
ConflictDetectionBanner.tsx

// Success Probability
SuccessProbabilityBadge.tsx

// Profile Visibility Settings
ProfileVisibilitySettings.tsx
PublicProfilePage.tsx
```

### Step 4: Integration Points

Add components to existing pages:

**In Dashboard:**
```typescript
<PersonalizedRecommendations />
<ConflictDetectionBanner />
```

**In Application Cards:**
```typescript
<SuccessProbabilityBadge applicationId={app.id} />
```

**In Event Detail Page:**
```typescript
<TeamFormation applicationId={applicationId} />
```

**In Settings:**
```typescript
<ProfileVisibilitySettings />
```

## 🏗️ Architecture Overview

```
server/
├── _core/
│   ├── recommendationService.ts    # Feature 1: AI Recommendations
│   ├── teamService.ts              # Feature 2: Team Formation
│   ├── conflictDetectionService.ts # Feature 3: Conflict Detection
│   ├── successScoringService.ts    # Feature 4: Success Scoring
│   └── trpc.ts
├── routers.ts                       # All tRPC endpoints
└── db.ts

client/src/
├── components/
│   ├── PersonalizedRecommendations.tsx
│   ├── TeamFormation.tsx
│   ├── ConflictDetectionBanner.tsx
│   └── SuccessProbabilityBadge.tsx
└── pages/
    └── PublicProfile.tsx
```

## 📊 Database Schema

### New Tables

```sql
-- Teams
teams (id, name, description, application_id, created_by, max_members, status, created_at, updated_at)
team_members (id, team_id, user_id, role, joined_at)

-- Calendar Conflicts
calendar_conflicts (id, user_id, application_id_1, application_id_2, conflict_date_start, conflict_date_end, recommended_application_id, resolved, created_at)

-- Success Scores
event_success_scores (id, application_id, user_id, success_probability, score_factors, calculated_at)

-- Enhanced user_application_profiles
ALTER TABLE user_application_profiles ADD COLUMN:
  - skills_json (JSONB)
  - interests (JSONB)
  - experience_level (enum)
  - preferred_event_types (JSONB)
  - location (VARCHAR)
  - timezone (VARCHAR)
```

## 🔑 API Endpoints

### Feature 1: Recommendations
```
GET  /api/trpc/recommendations.getPersonalized
POST /api/trpc/recommendations.updateUserProfile
```

### Feature 2: Teams
```
POST   /api/trpc/teams.create
GET    /api/trpc/teams.getByEvent
GET    /api/trpc/teams.getById
GET    /api/trpc/teams.getUserTeams
POST   /api/trpc/teams.join
POST   /api/trpc/teams.leave
```

### Feature 3: Calendar
```
GET  /api/trpc/calendar.detectConflicts
GET  /api/trpc/calendar.getConflictRecommendation
GET  /api/trpc/calendar.getUserConflicts
POST /api/trpc/calendar.resolveConflict
```

### Feature 4: Success Scoring
```
GET /api/trpc/successScoring.getProbability
GET /api/trpc/successScoring.getProbabilitiesForAll
```

### Feature 5: Public Profile
```
GET  /api/trpc/publicProfile.getByUsername
POST /api/trpc/publicProfile.updateVisibility
```

## 📝 Usage Examples

### Example 1: Get Personalized Recommendations

```typescript
const { data: recommendations } = trpc.recommendations.getPersonalized.useQuery();

// Returns:
// [
//   {
//     id: "rec_1",
//     eventName: "TechCrunch Disrupt 2024",
//     eventType: "Conference",
//     score: 85,
//     matchReasons: ["Matches your experience level", "You have most required skills"],
//     userFitPercentage: 85,
//     skillGaps: ["Leadership"]
//   }
// ]
```

### Example 2: Create a Team

```typescript
const createMutation = trpc.teams.create.useMutation();

await createMutation.mutateAsync({
  applicationId: 5,
  name: "Full Stack Warriors",
  description: "Building the next big thing",
  maxMembers: 5
});
```

### Example 3: Detect Calendar Conflicts

```typescript
const { data: conflicts } = trpc.calendar.detectConflicts.useQuery({
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
});

// Returns conflicting applications with same deadline dates
```

### Example 4: Get Success Probability

```typescript
const { data: scoreData } = trpc.successScoring.getProbability.useQuery({
  applicationId: 5,
});

// Returns:
// {
//   probability: 78,
//   factors: {
//     eventTypeSuccessRate: 80,
//     userExperienceLevel: 75,
//     skillMatchPercentage: 70,
//     timelineScore: 85,
//     historicalTrend: 75
//   }
// }
```

### Example 5: Share Public Profile

```typescript
// After setting profile to public:
const url = `https://youapp.com/profile/username`;

// Public users can view:
// - Username
// - Bio
// - Accepted applications (if show_accepted_only = true)
// - Success statistics
// - Social links
```

## ✅ Testing Checklist

### Backend
- [ ] Database migrations applied successfully
- [ ] All new tables created with correct schema
- [ ] Service functions work with test data
- [ ] tRPC endpoints respond correctly

### Frontend
- [ ] Components render without errors
- [ ] API calls made and data received
- [ ] User interactions work (join team, create team, etc.)
- [ ] Styling matches design system

### Integration
- [ ] Data flows from backend to frontend correctly
- [ ] Conflict detection triggers correctly
- [ ] Success scoring updates after application changes
- [ ] Public profiles are accessible

## 🐛 Troubleshooting

### Migration fails
```bash
# Check if tables exist
\dt teams

# Drop and retry
DROP TABLE IF EXISTS teams CASCADE;
psql $DATABASE_URL < ../migrations/001_advanced_features.sql
```

### API returns 500 errors
1. Check server logs
2. Verify database connection
3. Ensure all services are imported correctly

### Recommendations empty
1. Ensure user has completed profile with skills/interests
2. Check user_application_profiles table has data
3. Verify the query in recommendationService.ts

### Conflicts not detected
1. Create test applications with same deadline date
2. Verify calendar_conflicts table exists
3. Check date comparison logic

## 📚 Documentation Files

- `/ADVANCED_FEATURES_IMPLEMENTATION.md` - Complete implementation guide
- `/migrations/001_advanced_features.sql` - Database migration script
- `/server/_core/recommendationService.ts` - Recommendation logic
- `/server/_core/teamService.ts` - Team management logic
- `/server/_core/conflictDetectionService.ts` - Conflict detection logic
- `/server/_core/successScoringService.ts` - Success scoring logic

## 🚀 Performance Tips

### Indexes
- Already created in migration script
- Focus on frequently queried columns
- Use JSONB indexes for filter queries

### Caching
```typescript
// Consider Redis for recommendations
const cachedRecommendations = await redis.get(`rec:${userId}`);
```

### Query Optimization
```typescript
// Use batch queries for multiple applications
const scores = await Promise.all(
  apps.map(app => calculateSuccessProbability(userId, app.id, app.eventType))
);
```

## 📈 Monitoring

Monitor these key metrics:

1. **Recommendation accuracy** - Are recommendations helpful?
2. **Team formation** - How many teams created?
3. **Conflict resolution rate** - Are users resolving conflicts?
4. **Success probability** - Do high-probability events get accepted?
5. **Public profile views** - How many profile shares?

## 🎯 Next Steps

After implementation:

1. ✅ Run full test suite
2. ✅ Deploy to staging environment
3. ✅ Gather user feedback
4. ✅ Iterate and improve algorithms
5. ✅ Deploy to production

## 💡 Enhancement Ideas

Future additions:

- [ ] ML-based recommendations (instead of rule-based)
- [ ] Real-time team chat
- [ ] Event ratings and reviews
- [ ] User badges and achievements
- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Email reminders for conflicts
- [ ] Team progress tracking
- [ ] Mentorship matching

---

**Need Help?**

Check the detailed implementation guide in `ADVANCED_FEATURES_IMPLEMENTATION.md` for more information on each feature.
