# InternHub Database Schema

## Engine: SQLite (default) — PostgreSQL compatible

---

## Table: `users`

Stores all users (admins + students).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Unique user ID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email |
| username | VARCHAR(100) | UNIQUE, NOT NULL | Login username |
| hashed_password | VARCHAR(255) | NOT NULL | bcrypt hash |
| full_name | VARCHAR(255) | NOT NULL | Display name |
| role | ENUM('student','admin') | NOT NULL, default='student' | User role |
| is_active | BOOLEAN | default=True | Account active |
| is_approved | BOOLEAN | default=False | Admin approved |
| phone | VARCHAR(20) | nullable | Phone number |
| department | VARCHAR(100) | nullable | Academic department |
| college | VARCHAR(255) | nullable | College name |
| profile_pic | VARCHAR(500) | nullable | Profile picture path |
| created_at | DATETIME | server_default=now() | Creation timestamp |
| updated_at | DATETIME | onupdate=now() | Update timestamp |

**Relationships:**
- `enrollments` — one-to-many (cascade delete)
- `attendance_records` — one-to-many (cascade delete)
- `notifications` — one-to-many (cascade delete)

---

## Table: `courses`

Stores internship opportunities.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Unique course ID |
| title | VARCHAR(255) | NOT NULL | Course title |
| description | TEXT | nullable | Course description |
| company | VARCHAR(255) | nullable | Company name |
| duration | VARCHAR(100) | nullable | Duration (e.g., "3 months") |
| mode | VARCHAR(50) | nullable | Remote/On-site/Hybrid |
| stipend | VARCHAR(100) | nullable | Stipend info |
| skills_required | TEXT | nullable | Comma-separated skills |
| is_active | BOOLEAN | default=True | Course active |
| created_at | DATETIME | server_default=now() | Creation timestamp |

**Relationships:**
- `enrollments` — one-to-many (cascade delete)
- `study_materials` — one-to-many (cascade delete)

---

## Table: `enrollments`

Links students to courses with application status.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Unique enrollment ID |
| student_id | INTEGER | FK -> users.id, NOT NULL | Student reference |
| course_id | INTEGER | FK -> courses.id, NOT NULL | Course reference |
| status | ENUM('pending','approved','rejected') | NOT NULL, default='pending' | Application status |
| admin_comment | TEXT | nullable | Admin review note |
| applied_at | DATETIME | server_default=now() | Application timestamp |
| updated_at | DATETIME | onupdate=now() | Update timestamp |

**Relationships:**
- `student` -> User
- `course` -> Course
- `offer_letter` — one-to-one (cascade delete)
- `certificate` — one-to-one (cascade delete)
- **Unique constraint**: (student_id, course_id)

---

## Table: `attendance`

Tracks student attendance per course per day.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Unique record ID |
| student_id | INTEGER | FK -> users.id, NOT NULL | Student reference |
| course_id | INTEGER | FK -> courses.id, NOT NULL | Course reference |
| date | DATE | NOT NULL | Attendance date |
| status | ENUM('present','absent','leave','holiday') | NOT NULL | Attendance status |
| marked_by | INTEGER | FK -> users.id, nullable | Admin who marked |
| remarks | TEXT | nullable | Additional notes |
| created_at | DATETIME | server_default=now() | Creation timestamp |

**Unique constraint**: (student_id, course_id, date)

---

## Table: `offer_letters`

One-to-one with enrollments for internship offer documents.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Unique ID |
| enrollment_id | INTEGER | FK -> enrollments.id, UNIQUE | Enrollment reference |
| file_path | VARCHAR(500) | nullable | PDF file path |
| issue_date | DATE | nullable | Letter issue date |
| is_generated | BOOLEAN | default=False | Generated status |
| created_at | DATETIME | server_default=now() | Creation timestamp |
| updated_at | DATETIME | onupdate=now() | Update timestamp |

---

## Table: `certificates`

One-to-one with enrollments for completion certificates.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Unique ID |
| enrollment_id | INTEGER | FK -> enrollments.id, UNIQUE | Enrollment reference |
| file_path | VARCHAR(500) | nullable | File path |
| issue_date | DATE | nullable | Certificate date |
| is_approved | BOOLEAN | default=False | Admin approved |
| is_issued | BOOLEAN | default=False | Released to student |
| created_at | DATETIME | server_default=now() | Creation timestamp |
| updated_at | DATETIME | onupdate=now() | Update timestamp |

---

## Table: `study_materials`

Course-related study resources uploaded by admin.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Unique ID |
| course_id | INTEGER | FK -> courses.id, NOT NULL | Course reference |
| title | VARCHAR(255) | NOT NULL | Material title |
| description | TEXT | nullable | Description |
| file_path | VARCHAR(500) | NOT NULL | Uploaded file path |
| file_type | ENUM('pdf','ppt','zip','video','doc','other') | NOT NULL | File category |
| file_size | INTEGER | nullable | Bytes |
| uploaded_by | INTEGER | FK -> users.id, nullable | Admin who uploaded |
| created_at | DATETIME | server_default=now() | Upload timestamp |

---

## Table: `notifications`

System notifications for students.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Unique ID |
| student_id | INTEGER | FK -> users.id, NOT NULL | Target student |
| title | VARCHAR(255) | NOT NULL | Notification title |
| message | TEXT | nullable | Details |
| is_read | BOOLEAN | default=False | Read status |
| notification_type | VARCHAR(50) | nullable | Category |
| created_at | DATETIME | server_default=now() | Creation timestamp |
