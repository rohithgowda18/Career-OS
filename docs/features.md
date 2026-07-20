# Career OS - Detailed Feature Specification

Career OS is a comprehensive, production-ready system helping students and job seekers manage their recruitment cycles. Below is the complete, granular specification of all modules, APIs, database definitions, frontends, and backend capabilities.

---

## 1. Authentication & Security
* **Backend Security Framework:** Spring Security with stateless JWT (JSON Web Token) authentication.
  * **Tokens:** JWT signed via HMAC-SHA256 (`JWT_SECRET`). Expiration set to 15 days (`1296000000 ms`). Auth token is validated on each request via a custom filter.
* **OAuth2 Social Sign-In:**
  * **Google OAuth2:** Registers/logs in users using `email` and `profile` scopes.
  * **GitHub OAuth2:** Registers/logs in users using `user:email` and `read:user` scopes. User names are mapped from `name` attributes.
* **Database Representation (`users` table):**
  * `id` (BIGSERIAL PRIMARY KEY)
  * `email` (VARCHAR(255) UNIQUE NOT NULL)
  * `password` (VARCHAR(255) NOT NULL)
  * `role` (VARCHAR(50) DEFAULT 'USER' NOT NULL)
  * `display_name` (VARCHAR(255) NULL)
* **Frontend Routing:** Route guards redirect unauthenticated users to `/login` and authenticated users away from authentication pages.

---

## 2. Personal User Profiles
* **Profile Settings Form:** Enables user customization.
* **Settings Options & Metadata:**
  * **User Profile Form Fields:** College, Technical Skills list, GitHub URL, LinkedIn URL, Portfolio URL, and location.
  * **Email Preferences:** Toggle states for Email Alerts (`email_alerts` BOOLEAN) and Weekly Digest (`weekly_digest` BOOLEAN).
* **Database Representation (`user_profiles` table):**
  * `id` (BIGSERIAL PRIMARY KEY)
  * `user_id` (BIGINT UNIQUE REFERENCES users(id) ON DELETE CASCADE)
  * `college` (VARCHAR(255))
  * `skills` (TEXT)
  * `github_url` (VARCHAR(255))
  * `linkedin_url` (VARCHAR(255))
  * `portfolio_url` (VARCHAR(255))
  * `location` (VARCHAR(255))

---

## 3. Application Tracker (Kanban Board)
* **Kanban Workflow Stages:** `INTERESTED`, `APPLIED`, `UNDER_REVIEW`, `ACCEPTED`, `REJECTED`.
* **API Endpoints (`/api/applications`):**
  * `GET /api/applications` - Lists user applications.
    * **Filtering:** Optional `status` string parameter.
    * **Search:** Optional `search` string parameter (full-text search on event name, notes, or location).
    * **Pagination:** Supports `page`, `size`, and `sort` parameters mapped via Spring Data `Pageable`.
  * `GET /api/applications/{id}` - Retrieve details of a specific application by ID.
  * `POST /api/applications` - Create application. Validates required fields: `event_name` (non-blank), `event_type`, `status`.
  * `PUT /api/applications/{id}` - Updates details or moves an application's Kanban stage.
  * `DELETE /api/applications/{id}` - Deletes application.
* **AI Email Parser (Gemini Extraction):**
  * `POST /api/applications/extract` - Extracts application details from a raw pasted email body.
  * **Limits:** Validates length <= 10,000 characters.
  * **AI Model:** Uses Google Gemini API (`gemini-2.5-flash`) via structured JSON schema instructions to output pre-filled `event_name`, `event_type`, `status`, `deadline`, and `notes`.
* **Database Representation (`applications` table):**
  * `id` (BIGSERIAL PRIMARY KEY)
  * `user_id` (BIGINT REFERENCES users(id) ON DELETE CASCADE)
  * `event_name` (VARCHAR(255) NOT NULL)
  * `event_type` (VARCHAR(50) NOT NULL)
  * `status` (VARCHAR(50) NOT NULL)
  * `deadline` (TIMESTAMP)
  * `notes` (TEXT)
  * `event_url` (VARCHAR(255))
  * `location` (VARCHAR(255))
  * **Idempotency Index:** Unique composite constraint `unique_user_event_url (user_id, event_url)` prevents a user from adding the same event URL twice.

---

## 4. Placement Tracker
* **Pipeline Milestones:** Tracks detailed parameters for corporate placement listings.
* **Pipeline Statuses:** `SAVED`, `APPLIED`, `ASSESSMENT_SCHEDULED`, `INTERVIEW_SCHEDULED`, `OFFER_RECEIVED`, `REJECTED`.
* **API Endpoints (`/api/placements`):**
  * `GET /api/placements` - Paginated placements list.
    * **Filtering:** Optional `status` string parameter.
    * **Search:** Optional `search` parameter for full-text search on company name or role.
    * **Pagination:** Full `Pageable` support (`page`, `size`, `sort`).
  * `GET /api/placements/{id}` - Retrieve a single placement by ID.
  * `POST /api/placements` - Create placement. Validates required fields: `company_name`, `role`, `status`.
  * `PUT /api/placements/{id}` - Edit details or update status.
  * `DELETE /api/placements/{id}` - Remove record.
* **AI Email Parser (Gemini Extraction):**
  * `POST /api/placements/extract` - Parses raw recruiter emails to extract company name, role, stipend, CTC, application link, assessment date, interview date, and status.
* **Funnel Statistics (`/api/analytics/placements/*`):**
  * **Summary Stat Cards:** Calculates total applications, offers received, active pipelines, conversion rates.
  * **Conversions Funnel:** Percentage steps between stages.
  * **Status Distribution:** Grouped percentage cards.
* **Database Representation (`placements` table):**
  * `id` (BIGSERIAL PRIMARY KEY)
  * `user_id` (BIGINT REFERENCES users(id) ON DELETE CASCADE)
  * `company_name` (VARCHAR(255) NOT NULL)
  * `role` (VARCHAR(255) NOT NULL)
  * `location` (VARCHAR(255))
  * `stipend` (VARCHAR(255))
  * `ctc` (VARCHAR(255))
  * `application_link` (VARCHAR(255))
  * `assessment_date` (TIMESTAMP)
  * `interview_date` (TIMESTAMP)
  * `status` (VARCHAR(50) NOT NULL)
  * **Uniqueness Index:** Unique composite constraint `unique_user_company_role_link (user_id, company_name, role, application_link)` prevents duplicate entries.

---

## 5. Skills Manager
* **Skill Inventory View:** A categorized table listing professional skill sets.
* **Proficiency Levels:** `BEGINNER`, `INTERMEDIATE`, `ADVANCED`.
* **API Endpoints (`/api/skills`):**
  * `GET /api/skills` - Lists skills for the authenticated user.
  * `POST /api/skills` - Add new skill. Validates required fields: `name`, `category`, `level`.
  * `PUT /api/skills/{id}` - Update level/category.
  * `DELETE /api/skills/{id}` - Delete skill.
* **Database Representation (`skills` table):**
  * `id` (BIGSERIAL PRIMARY KEY)
  * `user_id` (BIGINT REFERENCES users(id) ON DELETE CASCADE)
  * `name` (VARCHAR(255) NOT NULL)
  * `category` (VARCHAR(50) NOT NULL)
  * `level` (VARCHAR(50) NOT NULL)
  * **Uniqueness Constraint:** Composite constraint `unique_user_skill (user_id, name)` ensures users do not save duplicate skill entries.

---

## 6. Daily Routine & Consistency Reports
* **Reusable Daily Routine Tasks:** Define preparation habits (e.g. "Solve 2 DSA Problems") that persist day-to-day.
* **Checkoff Mechanics:** Toggling completion records status per task specifically for the current calendar date (`DATE`). The checkbox resets to unchecked on a new day.
* **Consistency Analytics (`/api/routines/reports`):**
  * **Current Streak:** Consecutive days with 100% completion of all routine tasks.
  * **Longest Streak:** All-time record streak.
  * **Weekly Average:** Completion percentage across the week.
  * **Weekday Completion Percentage:** Completion rates broken down from Monday to Sunday.
  * **Best Day:** The day of the week with the highest historic completion rate.
* **API Endpoints (`/api/routines`):**
  * `GET /api/routines` - Returns daily routine tasks with a boolean `completed` state resolved for today's date.
  * `POST /api/routines` - Creates a new task.
  * `PUT /api/routines/{id}` - Edit a task's title.
  * `POST /api/routines/{id}/toggle` - Toggle today's completion state (creates or deletes the current date completion row).
  * `DELETE /api/routines/{id}` - Remove a task and its entire completion history.
* **Database Representation:**
  * **`routine_tasks` table:**
    * `id` (BIGSERIAL PRIMARY KEY)
    * `user_id` (BIGINT REFERENCES users(id) ON DELETE CASCADE)
    * `title` (VARCHAR(255) NOT NULL)
    * `display_order` (INT NOT NULL DEFAULT 0)
  * **`routine_completion` table:**
    * `id` (BIGSERIAL PRIMARY KEY)
    * `routine_task_id` (BIGINT REFERENCES routine_tasks(id) ON DELETE CASCADE)
    * `completion_date` (DATE NOT NULL)
    * `completed` (BOOLEAN NOT NULL DEFAULT FALSE)
    * **Uniqueness constraint:** `uq_routine_completion (routine_task_id, completion_date)`
    * **Composite index:** `idx_routine_completion_task_date (routine_task_id, completion_date)`

---

## 7. Interactive Calendar
* **Visual Scheduler View:** Comprehensive Monthly grid view.
* **Unified Event Markers:** Renders calendar markers fetched from:
  1. **Application Deadlines:** Sourced from `applications.deadline`.
  2. **Online Assessments:** Sourced from `placements.assessment_date`.
  3. **Interview Schedules:** Sourced from `placements.interview_date`.
* **Sidebar Highlights:** Panel summarizing events scheduled for the currently selected date.
