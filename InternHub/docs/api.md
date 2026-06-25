# InternHub API Documentation

Base URL: `http://localhost:8000/api/v1`

## Authentication
All endpoints except `/auth/login`, `/auth/register`, and `/auth/token` require a Bearer JWT token.

### Auth Endpoints
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/auth/register` | Register new student | No |
| POST | `/auth/login` | Login (JSON body) | No |
| POST | `/auth/token` | Login (form body, for Swagger) | No |
| GET | `/auth/me` | Get current user | Yes |

### User Endpoints
| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/users` | List all users | Admin |
| GET | `/users/students` | List all students | Admin |
| GET | `/users/{id}` | Get user by ID | Self/Admin |
| PATCH | `/users/{id}` | Update user | Admin |

### Course Endpoints
| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/courses` | List active courses | Any |
| GET | `/courses/{id}` | Get course details | Any |
| POST | `/courses` | Create course | Admin |
| PATCH | `/courses/{id}` | Update course | Admin |
| DELETE | `/courses/{id}` | Delete course | Admin |

### Enrollment Endpoints
| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/enrollments` | List enrollments (filterable) | Any |
| GET | `/enrollments/my` | My enrollments | Student |
| POST | `/enrollments` | Apply for course | Student |
| PATCH | `/enrollments/{id}` | Approve/reject enrollment | Admin |

### Attendance Endpoints
| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/attendance` | List attendance records | Any* |
| GET | `/attendance/summary` | Attendance summary | Any* |
| POST | `/attendance` | Mark attendance (single) | Admin |
| POST | `/attendance/bulk` | Mark attendance (bulk) | Admin |

*Requires approved enrollment

### Study Materials Endpoints
| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/study-materials` | List materials (searchable) | Any* |
| POST | `/study-materials/upload` | Upload material | Admin |
| DELETE | `/study-materials/{id}` | Delete material | Admin |

*Requires approved enrollment

### Offer Letter Endpoints
| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/offer-letters` | List offer letters | Any* |
| GET | `/offer-letters/my` | My offer letter | Student* |
| POST | `/offer-letters/upload` | Upload offer letter | Admin |
| GET | `/offer-letters/{id}` | Get specific letter | Any |

*Requires approved enrollment

### Certificate Endpoints
| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/certificates` | List certificates | Any* |
| GET | `/certificates/my` | My certificate | Student* |
| POST | `/certificates/upload` | Upload certificate | Admin |
| PATCH | `/certificates/{id}` | Update/release certificate | Admin |

*Requires approved enrollment

### Notification Endpoints
| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/notifications` | List my notifications | Student |
| GET | `/notifications/unread-count` | Unread count | Student |
| PATCH | `/notifications/{id}/read` | Mark as read | Student |
| PATCH | `/notifications/read-all` | Mark all read | Student |
| POST | `/notifications` | Create notification | Admin |

### Dashboard Endpoints
| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/dashboard/student` | Student dashboard stats | Student |
| GET | `/dashboard/admin` | Admin dashboard stats | Admin |

### Search Endpoint
| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/search?q=` | Global search | Any |

### Utility Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | API info |
| GET | `/health` | Health check |
| GET | `/uploads/{path}` | Serve uploaded files (auth) |
