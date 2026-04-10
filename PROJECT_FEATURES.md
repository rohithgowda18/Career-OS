# Event Application Tracker - Comprehensive Features Guide

## Project Overview

**Event Application Tracker** is a full-stack web application built with **React + TypeScript** (frontend) and **Express.js + TypeScript** (backend). It helps users manage, track, and optimize their applications to hackathons, workshops, conferences, and other tech events. The platform provides intelligent recommendations, deadline reminders, and comprehensive analytics to improve application success rates.

**Tech Stack:**
- Frontend: React 18, Vite, TypeScript, TailwindCSS
- Backend: Express.js, Node.js, TypeScript, tRPC
- Database: PostgreSQL
- Authentication: OAuth (Manus)
- Communication: tRPC (type-safe RPC framework)

---

## 1. Core Application Management Features

### 1.1 Application Tracking
- **Create Applications**: Add new event applications with:
  - Event name (required)
  - Event type: Hackathon, Workshop, Conference, Other
  - Application status: Interested, Applied, Under Review, Accepted, Rejected, Withdrawn
  - Deadline date (optional)
  - Event URL (optional, with metadata fetching)
  - Notes/comments (optional)

- **Edit Applications**: Modify any application details after creation
- **Delete Applications**: Remove applications with confirmation
- **Application List View**: Browse all applications with sorting and filtering capabilities

### 1.2 Metadata Extraction
- **Smart URL Fetching**: When adding an event URL, the system automatically:
  - Extracts page title and description from OpenGraph (og:title, og:description)
  - Fetches metadata from URL HTML
  - Suggests event type based on keywords found on the page
- **Magic Wand Button**: One-click metadata extraction in the Add Application modal
- **External Links**: Event names throughout the UI are clickable links to original event pages

---

## 2. Dashboard & Visualization Features

### 2.1 Main Dashboard
The dashboard provides at-a-glance insights into application status:
- **Summary Statistics**:
  - Total applications count
  - Upcoming deadlines (7-day window)
  - Status breakdown (pie/bar charts)
  - Recent activity timeline
  - Success metrics by event type

- **Upcoming Deadlines Widget**: 
  - Shows applications with deadlines in the next 7 days
  - Color-coded by urgency
  - Quick action buttons to update status

- **Analytics Dashboard**: 
  - Visual representation of application success rates
  - Event type performance comparison
  - Application status distribution
  - Trends over time

### 2.2 Multiple View Modes
Users can switch between different visualization styles:

1. **Dashboard View** (Default)
   - Comprehensive overview with statistics
   - Summary widgets
   - Upcoming deadlines
   - Performance charts

2. **Kanban Board View**
   - Drag-and-drop application cards
   - Organized by status columns:
     - Interested
     - Applied
     - Under Review
     - Accepted
     - Rejected
     - Withdrawn
   - Real-time status updates

3. **List/Table View**
   - Spreadsheet-style view of all applications
   - Sortable columns (event name, type, status, deadline, etc.)
   - Filtering capabilities
   - Bulk actions support

4. **Calendar View**
   - Visual calendar with events plotted by deadline
   - Month/week navigation
   - Click events to see application details
   - iCal export for external calendar integration

5. **Analytics View**
   - Detailed success metrics
   - Success rate by event type
   - Application timeline
   - Status distribution charts
   - Performance trends

---

## 3. Intelligent Recommendation System

### 3.1 Smart Offline Recommendations
The recommendation engine analyzes user's application history and provides personalized suggestions:

- **Success Rate Analysis**:
  - Calculates acceptance rate for each event type
  - Identifies user's strongest event categories
  - Provides percentage-based success metrics

- **Personalized Recommendations**:
  - Recommends top 3 event types based on historical success
  - Includes reasoning why each type is recommended
  - Provides specific, real event links for each category:
    - **Hackathons**: MLH Prime, Devpost, AngelHack, TechCrunch Disrupt
    - **Workshops**: Coursera, Udemy, Frontend Masters, LinkedIn Learning
    - **Conferences**: TechCrunch Disrupt, Google I/O, Web Summit, PyCon
    - **Other Events**: Eventbrite, Meetup, local networking events

- **Actionable Tips**:
  - Specific advice for improving acceptance rates
  - Best timing to apply (2-4 weeks, 1-3 weeks, etc.)
  - Strategies for each event type:
    - Build unique project ideas
    - Highlight relevant past projects
    - Apply to multiple events
    - Join communities like MLH for early discovery

- **No External API Dependency**:
  - Works completely offline
  - Analyzes real user data
  - Zero latency compared to cloud APIs
  - Reliable and always available

### 3.2 Success Metrics Calculation
- Analyzes all user applications
- Groups by event type
- Calculates success rates (Accepted count / Total count)
- Provides detailed performance breakdowns
- Available through API endpoint for dashboard display

---

## 4. Notification & Reminder System

### 4.1 Email Notifications
The system sends proactive email notifications for important events:

- **Status Change Notifications**:
  - Triggered when application status changes
  - HTML-formatted email with event details
  - Shows old and new status
  - Includes event type and relevant information

- **Deadline Reminder Emails**:
  - Sent when approaching application deadlines
  - Calculates days remaining
  - Provides actionable next steps
  - HTML-formatted with visual styling

### 4.2 Automated Scheduled Jobs

- **Deadline Reminder Job** (Every 6 hours):
  - Checks all applications for upcoming deadlines
  - Identifies applications due within 7 days
  - Sends reminder emails to users
  - Respects user notification preferences

- **Weekly Digest Job** (Every Monday):
  - Compiles weekly application summary
  - Shows new applications added
  - Includes status changes from past week
  - Provides upcoming deadline list
  - Can be enabled/disabled per user

### 4.3 Notification Preferences
Users can customize notification settings:
- Toggle all notifications on/off
- Separate controls for email notifications
- Enable/disable deadline reminder emails
- Enable/disable status update emails
- Configure weekly digest (with day selection)
- Specify preferred digest day (Monday-Sunday)

---

## 5. User Profile & Public Profile System

### 5.1 User Profiles
- **Profile Information**:
  - Username (unique identifier)
  - Bio/description
  - Profile visibility (public/private)
  - Social links
  - Posted date

### 5.2 Public Profile Features
Users can share their application success story:
- **Public Profile Viewing** (for public profiles):
  - View username and bio
  - See application statistics
  - Browse publicly shared applications
  - View success metrics

- **Profile Statistics**:
  - Total applications
  - Acceptance rate (%)
  - Applications by status
  - Most successful event type
  - Average approval time

- **Profile Visibility Control**:
  - Private: Profile only visible to user
  - Public: Profile and stats visible to all

### 5.3 Public Application Display
- Users can showcase their accepted applications
- Share their event experience
- Display event details and type
- Profile visibility setting controls access

---

## 6. User Preferences & Customization

### 6.1 View Preferences
Users can customize their experience:
- **Default View Selection**:
  - Set preferred view on dashboard load
  - Choose from: Dashboard, Kanban, List, Calendar, Analytics
  - Preference saves and persists

### 6.2 Notification Settings
- **Granular Control**:
  - Master notification toggle
  - Separate email preference
  - Deadline reminder toggle
  - Status update toggle
  - Weekly digest toggle
  - Digest day selection

### 6.3 Calendar Integration
- **iCal Export**:
  - Export applications as calendar file
  - Import into Apple Calendar, Google Calendar, Outlook, etc.
  - Deadlines appear as events
  - Automatic sync capability

---

## 7. Authentication & Security

### 7.1 OAuth Authentication
- **Manus OAuth Integration**:
  - Single sign-on capability
  - Secure token-based authentication
  - Session management with JWT cookies
  - Automatic session expiration

- **OAuth Flow**:
  - Login via Manus OAuth server
  - Callback handler validates credentials
  - Session cookie created and stored
  - User context available to all protected routes

### 7.2 Session Management
- **Secure Cookies**:
  - HTTP-only cookies prevent XSS attacks
  - Secure flag for HTTPS connections
  - Domain-specific cookie handling
  - Automatic cleanup on logout

- **User Context**:
  - User information attached to requests
  - User ID used for data isolation
  - Role-based access control (user/admin roles)
  - Last signed-in tracking

### 7.3 Protected Routes
- All API endpoints (except OAuth callbacks) require authentication
- User isolation: users only see their own data
- Admin routes for future extension

---

## 8. API Endpoints (tRPC Router)

### 8.1 Authentication Endpoints
```
auth.me                    - Get current user info
auth.logout                - Clear session and logout
```

### 8.2 Application Management Endpoints
```
applications.list          - Get all user applications
applications.get           - Get single application by ID
applications.create        - Create new application
applications.update        - Update application details
applications.delete        - Delete application
applications.fetchMetadata - Extract metadata from URL
```

### 8.3 Preferences Endpoints
```
preferences.get            - Get user preferences
preferences.update         - Update notification and view preferences
```

### 8.4 Recommendation Endpoints
```
recommendations.generate   - Get personalized recommendations
recommendations.metrics    - Get success metrics by event type
```

### 8.5 Profile Endpoints
```
profile.getByUsername      - Get public profile by username
profile.getStats           - Get user stats (public profiles)
profile.getApplications    - Get public applications (public profiles)
profile.get                - Get own profile (private)
profile.create             - Create new profile
profile.update             - Update profile information
```

### 8.6 System Endpoints
```
system.health              - Health check endpoint
```

---

## 9. Database Schema

### 9.1 Core Tables

**users**
- userId: Unique identifier
- openId: OAuth identifier
- name: User's name
- email: Email address
- loginMethod: OAuth provider
- role: User role (user/admin)
- createdAt, updatedAt: Timestamps
- lastSignedIn: Last login time

**applications**
- id: Application ID
- userId: Owner user ID (foreign key)
- eventName: Name of event
- eventType: Hackathon/Workshop/Conference/Other
- status: Interested/Applied/Under Review/Accepted/Rejected/Withdrawn
- deadline: Application deadline
- notes: User notes
- url: Event URL
- createdAt, updatedAt: Timestamps

**user_preferences**
- id: Preference ID
- userId: User ID (foreign key)
- defaultView: Dashboard/Kanban/List/Calendar/Analytics
- notificationsEnabled: Boolean
- emailNotificationsEnabled: Boolean
- emailDeadlineReminders: Boolean
- emailStatusUpdates: Boolean
- weeklyDigestEnabled: Boolean
- digestDay: Selected digest day
- createdAt, updatedAt: Timestamps

**user_profiles**
- id: Profile ID
- userId: User ID (foreign key)
- username: Unique username
- bio: Profile bio
- profileVisibility: Public/Private
- createdAt, updatedAt: Timestamps

**notifications**
- id: Notification ID
- userId: Recipient user ID
- applicationId: Related application ID
- type: status_change/deadline_reminder/upcoming_deadline
- subject: Email subject
- message: Notification message
- sent: Boolean (sent status)
- sentAt: Sent timestamp
- createdAt: Created timestamp

**digest_logs**
- id: Log ID
- userId: User ID
- lastDigestSent: Last digest send time
- createdAt, updatedAt: Timestamps

---

## 10. Component Architecture

### 10.1 Main Components

**DashboardLayout**
- Navigation and main layout wrapper
- Tab switching between views
- Responsive sidebar

**AnalyticsDashboard**
- Statistics display
- Chart rendering (pie, bar, line charts)
- Summary cards
- Performance metrics

**ApplicationCard**
- Single application display
- Status indicator
- Event type badge
- Deadline countdown
- Quick action buttons

**AddApplicationModal**
- Form for creating applications
- Input validation
- Metadata fetching button
- Event type selection
- Deadline picker

**Kanban Board**
- Drag-and-drop interface
- Status columns
- Card organization
- Status change via drag

**RecommendationsPanel**
- Displays recommendations
- Shows success rates
- Lists suggested events with links
- Shows tips and timing advice

**SettingsPage**
- Preference configuration
- View selection
- Notification settings
- Calendar export
- Digest configuration

**Map Component** (for event location visualization)
- Shows event locations
- Geographic distribution of applications

**AIChatBox**
- Interactive chat interface
- Can ask questions about events
- Get help with applications

---

## 11. UI Components Library

The project includes a comprehensive Radix UI component library:
- Accordion, Alert Dialog, Avatar, Badge
- Button, Card, Carousel, Checkbox
- Command (search), Context Menu, Dialog
- Dropdown Menu, Form, Hover Card
- Input Group, Menu bar, Navigation Menu
- Popover, Progress, Radio Group, Select
- Sidebar, Tabs, Tooltip, Toggle Groups
- And 30+ additional UI primitives

---

## 12. Backend Services

### 12.1 Email Service
- **Manus Built-in Email**:
  - Sends status change notification emails
  - Sends deadline reminder emails
  - HTML formatted messages
  - Respects notification preferences

### 12.2 OAuth Service
- **Manus OAuth**:
  - User authentication
  - Secure token exchange
  - Session creation
  - Logout handling

### 12.3 URL Scraper
- Extracts metadata from event URLs
- Parses OpenGraph tags
- Fallback to HTML <title> tag
- Event type suggestion based on keywords
- Error handling for unavailable pages

### 12.4 Recommendation Engine
- Smart offline analysis
- Success rate calculation
- Event type ranking
- Tip generation
- Real event URL database

### 12.5 Image Generation Service
- Generates event images/thumbnails
- Used for visual representation
- Caching support

### 12.6 Voice Transcription Service
- Transcribes user voice input
- Assists with voice-to-text
- Integration with chat interface

---

## 13. Key Features Summary Table

| Feature | Type | Status | Details |
|---------|------|--------|---------|
| Application CRUD | Core | ✅ Complete | Full create, read, update, delete |
| Multiple Views | UI | ✅ Complete | Dashboard, Kanban, List, Calendar, Analytics |
| Smart Recommendations | AI | ✅ Complete | Offline, success-rate-based analysis |
| Email Notifications | Backend | ✅ Complete | Status change & deadline reminders |
| Deadline Reminders | Automation | ✅ Complete | Every 6 hours automated checks |
| Weekly Digest | Automation | ✅ Complete | Scheduled email summaries |
| Profile System | Social | ✅ Complete | Public/private profiles with stats |
| Calendar Export | Integration | ✅ Complete | iCal format for external calendars |
| OAuth Login | Auth | ✅ Complete | Manus OAuth integration |
| Metadata Fetching | Enhancement | ✅ Complete | Automatic event page analysis |
| Success Metrics | Analytics | ✅ Complete | Per-event-type success tracking |
| Settings Panel | UX | ✅ Complete | Preferences and customization |

---

## 14. Data Flow Architecture

### User Registration & Authentication
1. User clicks "Login with OAuth"
2. Redirected to Manus OAuth server
3. User authenticates
4. Callback to `/api/auth/oauth/callback`
5. Session cookie created
6. User redirected to dashboard

### Adding an Application
1. User clicks "Add Application" button
2. Modal opens with form
3. User enters event details
4. (Optional) User clicks "Magic Wand" for URL metadata
5. System fetches and suggests details
6. User submits form
7. `applications.create` API called
8. Application saved to database
9. Dashboard updates with new application

### Recommendations Generation
1. User views dashboard
2. RecommendationsPanel loads
3. `recommendations.generate` API called
4. Backend retrieves all user applications
5. `calculateDefaultRecommendations()` analyzes:
   - Event type distribution
   - Success rate by type
   - Sorts by success
6. Returns top 3 recommendations with:
   - Event type with success percentage
   - Reasoning explanation
   - Real event URLs
   - Application tips
7. UI displays recommendations with action links

### Deadline Reminder Job
1. Runs every 6 hours automatically
2. Queries all applications with upcoming deadlines
3. For each application due within 7 days:
   - Checks user notification preferences
   - If enabled, generates reminder email
   - Sends email via Manus email service
   - Records notification in database

---

## 15. Configuration & Environment

### Required Environment Variables
```
DATABASE_URL=postgresql://user:password@localhost:5432/event_tracker
JWT_SECRET=your_jwt_secret
OAUTH_SERVER_URL=manus_oauth_url
PORT=3000
VITE_APP_ID=app_id
```

### Optional Environment Variables
```
VITE_ANALYTICS_ENDPOINT=analytics_url
VITE_ANALYTICS_WEBSITE_ID=website_id
BUILT_IN_FORGE_API_URL=api_url
BUILT_IN_FORGE_API_KEY=api_key
```

---

## 16. Testing

The project includes comprehensive test coverage:

- **Application Management Tests** (applications.test.ts)
  - CRUD operations
  - User isolation
  - Error handling

- **Recommendation Engine Tests** (recommendations.test.ts)
  - Success rate calculation
  - Recommendation ranking
  - Edge cases (no applications)

- **Notification Tests** (notifications.test.ts)
  - Status change triggers
  - Deadline reminder logic
  - Preference respecting

- **Calendar Tests** (calendar.test.ts)
  - iCal export
  - Date formatting
  - Event properties

- **Authentication Tests** (auth.logout.test.ts)
  - Login flow
  - Logout flow
  - Session management

- **Scraper Tests** (scraper.test.ts)
  - Metadata extraction
  - URL parsing
  - Event type detection

- **Other Tests**:
  - Digest service tests
  - Database tests
  - Integration tests

**Current Test Status**: 63+ tests passing

---

## 17. Performance Optimizations

- **Lazy Loading**: Views and components loaded on demand
- **Query Optimization**: Indexed database queries for fast retrieval
- **Caching**: Application data cached at frontend
- **Offline Support**: Recommendations work without external APIs
- **Automatic Cleanup**: Old sessions and logs cleaned up
- **File Upload Optimization**: 50MB limit for file uploads

---

## 18. Browser & Device Support

- **Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Devices**: Desktop, Tablet, Mobile
- **Responsive Design**: Fully responsive UI with mobile-first approach
- **Accessibility**: WCAG 2.1 compliant color contrasts and labels

---

## 19. Security Features

- **Authentication**: OAuth 2.0 with secure tokens
- **Data Isolation**: User data completely isolated per user ID
- **HTTPS**: Secure transport (in production)
- **SQL Injection Prevention**: Parameterized queries via ORM
- **XSS Protection**: React's built-in XSS prevention
- **CSRF Protection**: tRPC handles CSRF automatically
- **Rate Limiting**: Built-in express rate limiting

---

## 20. Future Enhancement Possibilities

### Planned Enhancements
- AI-powered chat assistant for event questions
- Voice input for rapid application logging
- Advanced analytics with ML predictions
- Integration with LinkedIn for profile import
- Batch import from CSV/Google Sheets
- Event feeds from APIs (Eventbrite, AngelList, etc.)
- Team collaboration features
- Dark mode theme
- Mobile native app
- Blockchain-based achievements/badges

---

## Deployment

### Development
```bash
npm run dev          # Start dev server with hot reload
```

### Production Build
```bash
npm run build        # Build frontend and backend
npm start            # Start production server
```

### Testing
```bash
npm test             # Run all tests
```

---

## Support & Contact

For issues or feature requests, please refer to the project repository or contact the development team.

---

**Last Updated**: April 2026
**Version**: 1.0.0
**License**: MIT
