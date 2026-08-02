# DATABASE MAP & SCHEMAS — CAREER OS

## 1. DATABASE OVERVIEW

- **Database Engine**: PostgreSQL 15+
- **Database Name (Default)**: `event_tracker_db`
- **Schema Management Script**: `apps/backend/src/main/resources/schema.sql`
- **ORM Framework**: Spring Data JPA / Hibernate

---

## 2. TABLE SCHEMAS

### 2.1 Table: `users`
Stores core user authentication credentials and account metadata.

| Column Name | Data Type | Constraints | Default Value | Description |
| --- | --- | --- | --- | --- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Auto-increment | Unique user identifier |
| `email` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE` | None | User login email address |
| `password` | `VARCHAR(255)` | `NOT NULL` | None | BCrypt encrypted password hash |
| `display_name` | `VARCHAR(255)` | `NULLABLE` | `NULL` | Full name of the user |
| `role` | `VARCHAR(50)` | `NOT NULL` | `'USER'` | Authorization role (`USER`, `ADMIN`) |
| `created_at` | `TIMESTAMP` | `NOT NULL` | `CURRENT_TIMESTAMP` | Account creation timestamp |
| `updated_at` | `TIMESTAMP` | `NOT NULL` | `CURRENT_TIMESTAMP` | Account last modification timestamp |

---

### 2.2 Table: `user_profiles`
Stores student / candidate profile details used for auto-filling application forms.

| Column Name | Data Type | Constraints | Default Value | Description |
| --- | --- | --- | --- | --- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Auto-increment | Profile ID |
| `user_id` | `BIGINT` | `NOT NULL`, `UNIQUE`, `FOREIGN KEY -> users(id) ON DELETE CASCADE` | None | Associated user ID |
| `college` | `VARCHAR(255)` | `NULLABLE` | `NULL` | College / University name |
| `skills` | `TEXT` | `NULLABLE` | `NULL` | Comma-separated or text skills overview |
| `github_url` | `VARCHAR(255)` | `NULLABLE` | `NULL` | GitHub profile URL |
| `linkedin_url` | `VARCHAR(255)` | `NULLABLE` | `NULL` | LinkedIn profile URL |
| `portfolio_url` | `VARCHAR(255)` | `NULLABLE` | `NULL` | Personal portfolio website URL |
| `location` | `VARCHAR(255)` | `NULLABLE` | `NULL` | Current location / City |
| `email_alerts` | `BOOLEAN` | `NOT NULL` | `TRUE` | Enable deadline email notification alerts |
| `weekly_digest` | `BOOLEAN` | `NOT NULL` | `FALSE` | Enable weekly summary email digest |
| `created_at` | `TIMESTAMP` | `NOT NULL` | `CURRENT_TIMESTAMP` | Record creation timestamp |
| `updated_at` | `TIMESTAMP` | `NOT NULL` | `CURRENT_TIMESTAMP` | Record update timestamp |

---

### 2.3 Table: `applications`
Tracks job and hackathon applications.

| Column Name | Data Type | Constraints | Default Value | Description |
| --- | --- | --- | --- | --- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Auto-increment | Application ID |
| `user_id` | `BIGINT` | `NOT NULL`, `FOREIGN KEY -> users(id) ON DELETE CASCADE` | None | Associated user ID |
| `event_name` | `VARCHAR(255)` | `NOT NULL` | None | Name of event or company position |
| `event_type` | `VARCHAR(50)` | `NOT NULL` | None | Type (`FULL_TIME`, `INTERNSHIP`, `HACKATHON`, `OFFCAMPUS`) |
| `status` | `VARCHAR(50)` | `NOT NULL` | None | Lifecycle status (`SAVED`, `APPLIED`, `INTERVIEW`, `OFFER`, `REJECTED`) |
| `deadline` | `TIMESTAMP` | `NULLABLE` | `NULL` | Application deadline date/time |
| `notes` | `TEXT` | `NULLABLE` | `NULL` | User notes or referral details |
| `event_url` | `VARCHAR(255)` | `NULLABLE` | `NULL` | Application link |
| `location` | `VARCHAR(255)` | `NULLABLE` | `NULL` | Job location |
| `created_at` | `TIMESTAMP` | `NOT NULL` | `CURRENT_TIMESTAMP` | Creation timestamp |
| `updated_at` | `TIMESTAMP` | `NOT NULL` | `CURRENT_TIMESTAMP` | Update timestamp |

**Indices**:
- `idx_applications_status` ON `applications(status)`
- `unique_user_event_url` ON `applications(user_id, event_url)` (Idempotency check)

---

### 2.4 Table: `placements`
Tracks campus placement recruitment drives.

| Column Name | Data Type | Constraints | Default Value | Description |
| --- | --- | --- | --- | --- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Auto-increment | Placement ID |
| `user_id` | `BIGINT` | `NOT NULL`, `FOREIGN KEY -> users(id) ON DELETE CASCADE` | None | Associated user ID |
| `company_name` | `VARCHAR(255)` | `NOT NULL` | None | Company name |
| `role` | `VARCHAR(255)` | `NOT NULL` | None | Job role / title |
| `location` | `VARCHAR(255)` | `NULLABLE` | `NULL` | Job location |
| `stipend` | `VARCHAR(255)` | `NULLABLE` | `NULL` | Monthly stipend amount |
| `ctc` | `VARCHAR(255)` | `NULLABLE` | `NULL` | Annual CTC / Salary compensation |
| `application_link` | `VARCHAR(255)` | `NULLABLE` | `NULL` | Application link |
| `assessment_date` | `TIMESTAMP` | `NULLABLE` | `NULL` | Online assessment date/time |
| `interview_date` | `TIMESTAMP` | `NULLABLE` | `NULL` | Interview date/time |
| `status` | `VARCHAR(50)` | `NOT NULL` | None | Placement status (`ELIGIBLE`, `APPLIED`, `OA_SCHEDULED`, `INTERVIEW_SCHEDULED`, `OFFERED`, `REJECTED`) |
| `created_at` | `TIMESTAMP` | `NOT NULL` | `CURRENT_TIMESTAMP` | Creation timestamp |
| `updated_at` | `TIMESTAMP` | `NOT NULL` | `CURRENT_TIMESTAMP` | Update timestamp |

**Indices**:
- `idx_placements_status` ON `placements(status)`
- `unique_user_company_role_link` ON `placements(user_id, company_name, role, application_link)`

---

### 2.5 Table: `skills`
Tracks technical competencies and proficiency levels.

| Column Name | Data Type | Constraints | Default Value | Description |
| --- | --- | --- | --- | --- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Auto-increment | Skill ID |
| `user_id` | `BIGINT` | `NOT NULL`, `FOREIGN KEY -> users(id) ON DELETE CASCADE` | None | Associated user ID |
| `name` | `VARCHAR(255)` | `NOT NULL` | None | Skill name (e.g. `Java`, `React`, `Docker`) |
| `category` | `VARCHAR(50)` | `NOT NULL` | None | Category (`LANGUAGES`, `FRAMEWORKS`, `DATABASE`, `TOOLS`, `CONCEPTS`) |
| `level` | `VARCHAR(50)` | `NOT NULL` | None | Skill level (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT`) |
| `created_at` | `TIMESTAMP` | `NOT NULL` | `CURRENT_TIMESTAMP` | Creation timestamp |
| `updated_at` | `TIMESTAMP` | `NOT NULL` | `CURRENT_TIMESTAMP` | Update timestamp |

**Indices**:
- `unique_user_skill` ON `skills(user_id, name)`

---

### 2.6 Table: `routine_tasks`
Defines daily habit tasks created by users.

| Column Name | Data Type | Constraints | Default Value | Description |
| --- | --- | --- | --- | --- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Auto-increment | Routine Task ID |
| `user_id` | `BIGINT` | `NOT NULL`, `FOREIGN KEY -> users(id) ON DELETE CASCADE` | None | Associated user ID |
| `title` | `VARCHAR(255)` | `NOT NULL` | None | Habit title (e.g., "Solve 2 LeetCode Problems") |
| `display_order` | `INT` | `NOT NULL` | `0` | UI display ordering index |
| `created_at` | `TIMESTAMP` | `NOT NULL` | `CURRENT_TIMESTAMP` | Creation timestamp |
| `updated_at` | `TIMESTAMP` | `NOT NULL` | `CURRENT_TIMESTAMP` | Update timestamp |

---

### 2.7 Table: `routine_completion`
Logs daily checkbox completions for routine tasks.

| Column Name | Data Type | Constraints | Default Value | Description |
| --- | --- | --- | --- | --- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Auto-increment | Completion Record ID |
| `routine_task_id` | `BIGINT` | `NOT NULL`, `FOREIGN KEY -> routine_tasks(id) ON DELETE CASCADE` | None | Foreign key to `routine_tasks` |
| `completion_date` | `DATE` | `NOT NULL` | None | Date of completion (`YYYY-MM-DD`) |
| `completed` | `BOOLEAN` | `NOT NULL` | `FALSE` | Completion status boolean |
| `created_at` | `TIMESTAMP` | `NOT NULL` | `CURRENT_TIMESTAMP` | Creation timestamp |
| `updated_at` | `TIMESTAMP` | `NOT NULL` | `CURRENT_TIMESTAMP` | Update timestamp |

**Constraints**:
- `uq_routine_completion` UNIQUE ON `(routine_task_id, completion_date)`
