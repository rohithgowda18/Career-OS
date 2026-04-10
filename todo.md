# Event Application Tracker - TODO

## Core Features

- [x] Database schema: users, applications, user preferences tables
- [x] Authentication: Login/logout with Manus OAuth
- [x] Dashboard page with summary stats (total apps, upcoming deadlines, status breakdown, recent activity)
- [x] Upcoming deadlines widget (7-day window)
- [x] Add application modal/form with fields: event name, type, status, deadline, notes, URL
- [x] Edit application modal/form
- [x] Delete application functionality
- [x] Kanban board view with status columns: Interested, Applied, Under Review, Accepted, Rejected, Withdrawn
- [x] List/table view with sorting and filtering
- [x] One-click status change from any view
- [x] Settings page with view preference and notification preferences
- [x] Elegant and polished UI with refined styling
- [x] Write and run comprehensive tests
- [x] Final checkpoint and delivery

## Completed


## Email Notifications Feature

- [x] Add notifications table to database schema
- [x] Create email service integration (Manus built-in or external)
- [x] Add notification trigger on application status change
- [x] Add notification trigger for upcoming deadlines (7-day window)
- [x] Update user preferences to include email notification settings
- [x] Add notification preferences UI to settings page
- [x] Create scheduled job for deadline reminder emails
- [x] Write tests for notification service
- [x] Apply database migration
- [x] Verify all tests pass (30/30 passing)

## Calendar Integration Feature

- [x] Add calendar view component with event visualization
- [x] Implement iCal export functionality for calendar sync
- [x] Add calendar export button to UI
- [x] Create calendar event generation logic
- [x] Add calendar preferences to settings
- [x] Write tests for calendar export (15 tests passing)
- [x] Add Calendar view to navigation tabs
- [x] Update Settings page with Calendar export option
- [x] All 45 tests passing (including 15 calendar tests)

## AI-Powered Event Recommendations Feature

- [x] Implement LLM-based recommendation analysis service using invokeLLM
- [x] Build recommendations UI component (RecommendationsPanel)
- [x] Add recommendations to dashboard
- [x] Create recommendation router endpoints (generate, get, metrics)
- [x] Implement success metrics calculation
- [x] Write tests for recommendation engine (7 tests)
- [x] All 52 tests passing (including 7 recommendation tests)
- [x] Integrated with existing database schema


## Smart Metadata Fetching & External Linking Feature

- [x] Create backend scraper utility (server/_core/scraper.ts) with axios and regex extraction
- [x] Implement og:title, og:description, and <title> tag extraction
- [x] Add fetchMetadata tRPC procedure to applications router
- [x] Implement event type suggestion based on metadata keywords
- [x] Update AddApplicationModal with "Magic Wand" button for metadata fetching
- [x] Add loading state and error handling for metadata fetching
- [x] Add external links to Dashboard view (event names as clickable links)
- [x] Add external links to ApplicationCard (card titles as clickable links)
- [x] Add external links to List view (event names as clickable links)
- [x] Write tests for scraper utility and metadata extraction (11 tests)
- [x] All 63 tests passing (including 11 scraper tests)


## OAuth Sign-In Fix

- [x] Diagnose Manus OAuth callback issues (fixed session cookie domain)
- [x] Check OAuth environment variables and configuration
- [x] Verify session cookie handling
- [x] Test OAuth flow end-to-end
- [x] Fix identified issues (enabled domain setting in getSessionCookieOptions)
- [x] Verify sign-in works properly

## Advanced Analytics Dashboard Feature

- [x] Create analytics data query procedures (acceptanceRates, seasonalTrends, statusDistribution, summary)
- [x] Calculate acceptance rates by event type
- [x] Analyze seasonal trends (applications by month)
- [x] Build analytics dashboard component (AnalyticsDashboard.tsx)
- [x] Add acceptance rate chart (bar chart)
- [x] Add seasonal trends chart (line chart)
- [x] Add status distribution visualization (pie chart)
- [x] Add summary statistics display
- [x] Write tests for analytics calculations (9 tests)
- [x] Integrate analytics into main dashboard (Analytics tab)
- [x] All 72 tests passing (including 9 analytics tests)


## Weekly Email Digest Feature

- [x] Update userPreferences schema to include digest preferences (weeklyDigestEnabled, digestDay)
- [x] Create digest generation service with email template (digestService.ts)
- [x] Implement digest content generation (status summary, upcoming deadlines, metrics)
- [x] Create scheduled job for weekly digest delivery (weeklyDigestJob.ts)
- [x] Add digest preferences UI to settings page (Weekly Digest Email section)
- [x] Add digest delivery tracking to database (digestLogs table)
- [x] Write tests for digest generation (12 tests in digest.test.ts)
- [x] Database migration generated (0003_bright_luke_cage.sql)
- [ ] Apply database migration via Management UI (required for full functionality)


## Public User Profile Feature

- [ ] Update userPreferences schema to include profile visibility and bio
- [ ] Create userProfiles table for public profile data
- [ ] Implement profile data queries and achievement calculation
- [ ] Build public profile page component (/profile/:username)
- [ ] Add profile customization UI to settings
- [ ] Implement achievement badges system
- [ ] Create portfolio/showcase view of accepted applications
- [ ] Add profile sharing links and social features
- [ ] Write tests for profile functionality
- [ ] Polish UI and ensure responsive design
