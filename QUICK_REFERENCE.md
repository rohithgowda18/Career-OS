# Advanced Features - Quick Reference Card

**Version:** 1.0 | **Last Updated:** January 2024

## 🎯 5 Features at a Glance

| Feature | Purpose | Key Endpoints | Where to Find |
|---------|---------|---------------|---------------|
| **AI Recommendations** | Smart event matching based on skills | `recommendations.getPersonalized` | recommendationService.ts |
| **Team Formation** | Create teams and collaborate | `teams.create/join/leave` | teamService.ts |
| **Conflict Detection** | Find overlapping deadlines | `calendar.detectConflicts` | conflictDetectionService.ts |
| **Success Scoring** | Predict acceptance likelihood | `successScoring.getProbability` | successScoringService.ts |
| **Public Profile** | Shareable portfolio | `publicProfile.getByUsername` | routers.ts |

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Setup environment
cp .env.example .env.local
nano .env.local  # Update DATABASE_URL

# 2. Run migrations
npm run migrate

# 3. Start development
npm run dev

# 4. Test endpoints
curl http://localhost:3000/api/trpc/recommendations.getPersonalized
```

## 📊 Database Tables

**4 New Tables:**
- `teams` - Team records
- `team_members` - Team membership
- `calendar_conflicts` - Deadline conflicts
- `event_success_scores` - Success predictions

**2 New Enums:**
- `team_role` - 'lead' | 'member' | 'mentor'
- `skill_level` - 'beginner' | 'intermediate' | 'advanced' | 'expert'

## 🔌 API Endpoints (22 Total)

### Feature 1: Recommendations (2)
```
GET  /api/trpc/recommendations.getPersonalized
POST /api/trpc/recommendations.updateUserProfile
```

### Feature 2: Teams (6)
```
POST /api/trpc/teams.create
GET  /api/trpc/teams.getByEvent
GET  /api/trpc/teams.getById
GET  /api/trpc/teams.getUserTeams
POST /api/trpc/teams.join
POST /api/trpc/teams.leave
```

### Feature 3: Calendar (4)
```
GET  /api/trpc/calendar.detectConflicts
GET  /api/trpc/calendar.getConflictRecommendation
GET  /api/trpc/calendar.getUserConflicts
POST /api/trpc/calendar.resolveConflict
```

### Feature 4: Scoring (2)
```
GET /api/trpc/successScoring.getProbability
GET /api/trpc/successScoring.getProbabilitiesForAll
```

### Feature 5: Public Profile (2)
```
GET  /api/trpc/publicProfile.getByUsername
POST /api/trpc/publicProfile.updateVisibility
```

## ⚡ Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run dev --workspace=server   # Server only
npm run dev --workspace=client   # Client only

# Testing
npm run test                     # All tests
npm run test:watch              # Watch mode
npm test recommendationService  # Specific test

# Database
npm run migrate              # Run migrations
npm run migrate status       # Check status
npm run migrate rollback     # Rollback (dev only)

# Building
npm run build               # Build all
npm run build --workspace=server
npm run build --workspace=client

# Type checking
npm run typecheck           # Check types
npm run lint                # Run eslint

# Deployment
npm run deploy:staging          # Deploy to staging
npm run deploy:production       # Deploy to production
```

## 🔑 Key Files

| File | Lines | Purpose |
|------|-------|---------|
| recommendationService.ts | 319 | Scoring algorithm |
| teamService.ts | 264 | Team CRUD |
| conflictDetectionService.ts | 168 | Conflict detection |
| successScoringService.ts | 218 | Probability calculations |
| 001_advanced_features.sql | 230+ | Database schema |
| routers.ts | +250 | API endpoints |
| db-types.ts | +100 | TypeScript types |

## 🧪 Testing Patterns

```typescript
// Service testing
import { describe, it, expect, beforeAll } from 'vitest';
import { RecommendationService } from '../_core/recommendationService';

describe('RecommendationService', () => {
  it('should calculate score', () => {
    const score = RecommendationService.calculateMatchScore(
      skills,
      eventSkills,
      experience
    );
    expect(score).toBeGreaterThan(0);
  });
});

// API testing
const { data } = await trpc.recommendations.getPersonalized.useQuery();
// data: Recommendation[]
```

## 📝 Type Examples

```typescript
// Feature 1: Recommendations
interface Recommendation {
  id: string;
  appId: number;
  eventName: string;
  score: number;
  matchReasons: string[];
  skillGaps: string[];
}

// Feature 2: Teams
interface Team {
  id: number;
  name: string;
  applicationId: number;
  createdBy: string;
  maxMembers: number;
  status: 'active' | 'inactive';
}

// Feature 3: Conflicts
interface CalendarConflict {
  id: number;
  userId: string;
  appId1: number;
  appId2: number;
  conflictDateStart: Date;
  conflictDateEnd: Date;
  recommended: number;
  resolved: boolean;
}

// Feature 4: Success Scoring
interface EventSuccessScore {
  id: number;
  applicationId: number;
  userId: string;
  successProbability: number;
  scoreFactors: SuccessFactor;
  calculatedAt: Date;
}

// Feature 5: Public Profile
interface PublicUserProfile {
  username: string;
  stats: PublicUserProfileStats;
  acceptedApps?: Application[];
}
```

## 🎬 Code Snippets

### Get Recommendations
```typescript
const { data: recommendations } = 
  trpc.recommendations.getPersonalized.useQuery();
// Returns: Recommendation[]
```

### Create Team
```typescript
const mutation = trpc.teams.create.useMutation();
const team = await mutation.mutateAsync({
  applicationId: 5,
  name: 'Team Name',
  maxMembers: 5
});
```

### Detect Conflicts
```typescript
const { data: conflicts } = 
  trpc.calendar.detectConflicts.useQuery({
    startDate: new Date(),
    endDate: addDays(new Date(), 30)
  });
```

### Get Success Score
```typescript
const { data: score } = 
  trpc.successScoring.getProbability.useQuery({
    applicationId: 5
  });
// Returns: { probability: 78, factors: {...} }
```

### Get Public Profile
```typescript
const { data: profile } = 
  trpc.publicProfile.getByUsername.useQuery({
    username: 'johndoe'
  });
```

## ⚙️ Environment Variables (Critical)

```bash
# Required
DATABASE_URL=postgresql://...
NODE_ENV=development

# Features (enable/disable)
FEATURE_AI_RECOMMENDATIONS=true
FEATURE_TEAMS=true
FEATURE_CONFLICT_DETECTION=true
FEATURE_SUCCESS_SCORING=true
FEATURE_PUBLIC_PROFILE=true

# Scoring weights (sum = 1.0)
REC_SKILL_WEIGHT=0.35
REC_EXPERIENCE_WEIGHT=0.25
REC_INTEREST_WEIGHT=0.20
REC_HISTORY_WEIGHT=0.20

# Limits
TEAMS_MAX_MEMBERS=10
RECOMMENDATIONS_MAX_RESULTS=5
```

## 🐛 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "relation does not exist" | Migration not run | `npm run migrate` |
| "Cannot find module" | Missing import | Check routers.ts imports |
| Empty recommendations | No user profile data | Call `updateUserProfile` first |
| Conflicts not detected | Wrong date range | Check deadline_date field |
| Score = 0 | Missing factors | Ensure all factor values provided |

## 📈 Performance Tips

```
✅ DO:
- Use indexes (created in migration)
- Cache recommendations (Redis)
- Batch score calculations
- Limit recommendation results

❌ DON'T:
- Run detectConflicts on every page load
- Store full event objects in JSONB
- Make N+1 queries for team members
- Recalculate scores synchronously
```

## 📚 Documentation Map

| Document | When to Use | Key Info |
|----------|-----------|----------|
| **SETUP_ADVANCED_FEATURES.md** | Getting started | Step-by-step setup |
| **ADVANCED_FEATURES_IMPLEMENTATION.md** | Deep dive | Architecture details |
| **DEPLOYMENT_CHECKLIST.md** | Before production | Deployment procedure |
| **.env.example** | Configuration | All env variables |
| **README_ADVANCED_FEATURES.md** | Reference | File structure |

## 🚨 Emergency Contacts

- **Database Issue:** Check DATABASE_URL, verify PostgreSQL running
- **API Down:** Check error logs in `logs/error.log`
- **Feature Not Working:** Verify feature flag is `true`, check environment variables
- **Migration Failed:** Review `001_advanced_features.sql` syntax
- **Performance Slow:** Check database indexes, review APM metrics

## ✅ Deployment Checklist (Quick)

- [ ] All tests pass: `npm run test`
- [ ] Types check: `npm run typecheck`
- [ ] Migration tested on staging
- [ ] Environment variables set
- [ ] Database backup created
- [ ] All features enabled (feature flags)
- [ ] API endpoints respond
- [ ] Frontend components ready
- [ ] Monitoring configured
- [ ] Rollback plan documented

## 🎓 Learning Resources

1. **Understanding Recommendations:**
   - See `calculateMatchScore()` in recommendationService.ts
   - Review weighting: 35% skills, 25% exp, 20% interests, 20% history

2. **Understanding Teams:**
   - See `TeamService` CRUD operations
   - Max members enforced in `addTeamMember()`

3. **Understanding Conflicts:**
   - See `detectConflicts()` for date comparison
   - `getSmartRecommendation()` uses 60% success rate + 40% urgency

4. **Understanding Scoring:**
   - See `calculateSuccessProbability()` weights
   - Result: 30% event, 25% exp, 20% accept, 15% timeline, 10% trend

5. **Understanding Public Profile:**
   - See `publicProfile.getByUsername()`
   - Privacy controlled by visibility flag

## 📞 Getting Help

```
Quick Q&A:
Q: Where are the services?
A: server/_core/*.ts

Q: What's the main table?
A: teams, calendar_conflicts, event_success_scores

Q: How do I test?
A: npm run test

Q: Where are the types?
A: shared/db-types.ts

Q: How do I deploy?
A: Follow DEPLOYMENT_CHECKLIST.md
```

---

**Print this card for quick reference during development!**

**Bookmark:** [SETUP_ADVANCED_FEATURES.md](./SETUP_ADVANCED_FEATURES.md)
