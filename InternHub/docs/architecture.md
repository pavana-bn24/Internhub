# InternHub Architecture

## Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS 3
- **Routing**: React Router v6
- **Icons**: Heroicons v2
- **HTTP Client**: Axios
- **Notifications**: react-hot-toast

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **ORM**: SQLAlchemy 2.0
- **Auth**: JWT (python-jose) + bcrypt
- **Validation**: Pydantic v2
- **Database**: SQLite (dev), PostgreSQL (prod)

---

## Project Structure

```
InternHub/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # API route handlers
│   │   │   ├── auth.py         # Login/register/token
│   │   │   ├── users.py        # User CRUD
│   │   │   ├── courses.py      # Course CRUD
│   │   │   ├── enrollments.py  # Enrollment workflow
│   │   │   ├── attendance.py   # Attendance management
│   │   │   ├── study_materials.py
│   │   │   ├── offer_letters.py
│   │   │   ├── certificates.py
│   │   │   ├── notifications.py
│   │   │   ├── dashboard.py    # Analytics endpoints
│   │   │   └── search.py       # Global search
│   │   ├── core/
│   │   │   ├── config.py       # Settings/env vars
│   │   │   ├── database.py     # DB engine & session
│   │   │   └── security.py     # JWT, auth dependencies
│   │   ├── models/             # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── course.py
│   │   │   ├── enrollment.py
│   │   │   ├── attendance.py
│   │   │   ├── offer_letter.py
│   │   │   ├── certificate.py
│   │   │   ├── study_material.py
│   │   │   └── notification.py
│   │   ├── schemas/            # Pydantic request/response
│   │   ├── services/
│   │   │   └── permissions.py  # Approved-student gate
│   │   └── main.py             # App entry, CORS, routers
│   ├── uploads/                # User-uploaded files
│   └── seed_data.py            # Development seed script
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # ProtectedRoute
│   │   │   ├── layout/         # AppLayout (sidebar + header)
│   │   │   └── ui/             # Common.tsx (UI primitives)
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx  # Auth state provider
│   │   ├── pages/
│   │   │   ├── auth/           # Login, Register
│   │   │   ├── student/        # 7 student pages
│   │   │   └── admin/          # 6 admin pages
│   │   ├── services/
│   │   │   ├── api.ts          # Axios instance + interceptors
│   │   │   └── index.ts        # All API call functions
│   │   ├── types/
│   │   │   └── index.ts        # Shared TypeScript types
│   │   ├── App.tsx             # Route definitions
│   │   └── main.tsx            # Entry point
│   └── tailwind.config.js
│
└── docs/
    ├── api.md
    ├── database.md
    └── architecture.md
```

---

## Authentication Flow

1. User sends username+password to `/auth/login`
2. Server validates credentials, returns JWT token
3. Frontend stores token in `localStorage`
4. Axios interceptor attaches `Bearer` header to all requests
5. `get_current_user` dependency decodes JWT and loads user
6. `require_role` gating restricts admin/student endpoints
7. `require_approved_student` gating restricts Phase 3/4 resources

---

## Data Flow

```
User Action → React Component → Service (Axios) → API Route → 
DB Query → Response → React State → UI Update
```

---

## Role-Based Access Control

| Feature | Student | Approved Student | Admin |
|---------|---------|-----------------|-------|
| Browse courses | ✓ | ✓ | ✓ |
| Enroll in courses | ✓ | ✓ | - |
| Study Materials | - | ✓ | ✓ (upload) |
| Attendance (view) | - | ✓ | ✓ (mark) |
| Offer Letters | - | ✓ | ✓ (upload) |
| Certificates | - | ✓ | ✓ (upload/release) |
| Dashboard | ✓ | ✓ | ✓ |
| Manage Users | - | - | ✓ |

---

## File Upload Strategy

- Files stored in `backend/uploads/` directory tree
- Served via authenticated `GET /uploads/{path}` endpoint
- Path traversal protected with `os.path.normpath` + prefix check
- File type validated against `ALLOWED_EXTENSIONS` set
- File size limited to `MAX_UPLOAD_SIZE_MB` (configurable)
- Study materials named: `material_{course_id}_{title}{ext}`
- Offer letters named: `offer_letter_{enrollment_id}_{student_id}.pdf`
- Certificates named: `certificate_{enrollment_id}_{student_id}{ext}`

---

## Notification System

- Database-backed `notifications` table
- Auto-triggered on: enrollment status change, material upload, offer letter upload, certificate release
- Students poll for unread count every 30 seconds
- Types: `enrollment`, `material`, `offer_letter`, `certificate`
