# InternHub — Production Deployment Guide

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ (production) or SQLite (development)
- Nginx or Caddy (reverse proxy, production)
- Git

---

## 1. Server Setup

### Clone & Install

```bash
git clone <repo-url> InternHub
cd InternHub

# Backend
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

### Environment Configuration

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with production values
```

**Required variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | 64-char hex random string | `python -c "import secrets; print(secrets.token_hex(32))"` |
| `ADMIN_PASSWORD` | Strong admin password | — |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/internhub` |
| `CORS_ORIGINS` | Allowed frontend origins | `https://app.example.com` |

---

## 2. Database Setup (PostgreSQL)

```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE internhub;
CREATE USER internhub_user WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE internhub TO internhub_user;
\q

# Set DATABASE_URL in .env:
# DATABASE_URL=postgresql://internhub_user:strong_password@localhost:5432/internhub
```

Tables are auto-created on first startup (`Base.metadata.create_all`). No migration tool required for initial deployment.

### Migrating from SQLite to PostgreSQL

1. Dump SQLite data:
   ```bash
   cd backend
   sqlite3 internhub.db .dump > dump.sql
   ```
2. Edit `dump.sql` to remove SQLite-specific syntax (`BEGIN TRANSACTION;` → `BEGIN;`, etc.)
3. Import into PostgreSQL:
   ```bash
   psql -U internhub_user -d internhub -f dump.sql
   ```

---

## 3. Running in Production

### Backend (uvicorn + gunicorn)

```bash
cd backend

# Using uvicorn directly:
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4 --log-level info

# Using gunicorn with uvicorn workers (recommended):
pip install gunicorn
gunicorn app.main:app --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --workers 4 --timeout 120
```

### Using systemd (auto-restart on crash)

Create `/etc/systemd/system/internhub-backend.service`:

```ini
[Unit]
Description=InternHub Backend API
After=network.target postgresql.service

[Service]
User=www-data
WorkingDirectory=/opt/InternHub/backend
EnvironmentFile=/opt/InternHub/backend/.env
ExecStart=/opt/InternHub/backend/venv/bin/gunicorn app.main:app --worker-class uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000 --workers 4 --timeout 120
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable internhub-backend
sudo systemctl start internhub-backend
sudo systemctl status internhub-backend
```

### Frontend (Nginx static file serve)

```bash
cd frontend
npm run build
# Output in frontend/dist/
```

Nginx configuration (`/etc/nginx/sites-available/internhub`):

```nginx
server {
    listen 80;
    server_name app.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/app.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.yourdomain.com/privkey.pem;

    root /opt/InternHub/frontend/dist;
    index index.html;

    # SPA fallback — serve index.html for all non-file routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploaded file serving (proxy to backend)
    location /uploads/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Health check (public)
    location /health {
        proxy_pass http://127.0.0.1:8000/health;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 4. File Storage

Upload directories are auto-created on first use. They persist on disk by default:

```
backend/uploads/
├── payment_proofs/
├── offer_letters/
├── certificates/
├── project_submissions/
├── profile_pics/
└── study_materials/
```

**For production with multiple servers**, configure a shared filesystem (NFS) or use S3-compatible storage. To use S3, add a storage backend adapter (the current code uses local filesystem via `shutil.copyfileobj`).

---

## 5. Backup Strategy

### Database

```bash
# PostgreSQL
pg_dump -U internhub_user internhub > backup_$(date +%Y%m%d_%H%M%S).sql

# SQLite
cp backend/internhub.db backup_$(date +%Y%m%d_%H%M%S).db
```

### Uploaded Files

```bash
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz backend/uploads/
```

### Automated backup script

Create `scripts/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/internhub"
mkdir -p "$BACKUP_DIR"

# Database
pg_dump -U internhub_user internhub > "$BACKUP_DIR/db_$(date +%Y%m%d_%H%M%S).sql"

# Uploads
tar -czf "$BACKUP_DIR/uploads_$(date +%Y%m%d_%H%M%S).tar.gz" /opt/InternHub/backend/uploads/

# Keep only last 7 days
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
```

Add to crontab:
```bash
0 3 * * * /opt/InternHub/scripts/backup.sh
```

---

## 6. Monitoring

### Health Check

```bash
curl https://app.yourdomain.com/health
# {"status":"healthy","database":"connected"}
```

### Logging

Backend logs to stdout (captured by systemd journal):
```bash
journalctl -u internhub-backend -f
```

### Uptime Monitoring

Configure external monitoring service (Pingdom, UptimeRobot, etc.) to hit:
- `https://app.yourdomain.com/health` every 5 minutes

---

## 7. Security Checklist

- [ ] `SECRET_KEY` is a random 64-char hex string (not the default)
- [ ] `ADMIN_PASSWORD` is a strong, unique password (not the default)
- [ ] `CORS_ORIGINS` restricted to actual frontend domain(s) only
- [ ] HTTPS enabled via Let's Encrypt / Cloudflare
- [ ] Database credentials are strong and not the defaults
- [ ] `.env` file is NOT committed to version control (already in `.gitignore`)
- [ ] PostgreSQL only listens on localhost (`listen_addresses = 'localhost'`)
- [ ] File upload size limits enforced (50MB for projects, 5MB for photos)
- [ ] Path traversal protection on `/uploads/` endpoint
- [ ] Rate limiting configured (optional: add slowapi or cloudflare)
- [ ] Regular security updates applied (OS, Python packages, Node packages)

---

## 8. Recommended Server Specs

| Setup | Users | RAM | CPU | Disk |
|-------|-------|-----|-----|------|
| Development | 1-10 | 2 GB | 1 vCPU | 20 GB |
| Small production | 50-200 | 4 GB | 2 vCPU | 50 GB |
| Medium production | 200-1000 | 8 GB | 4 vCPU | 100 GB |
| Large production | 1000+ | 16 GB | 8 vCPU | 200 GB (SSD) |

**Cost estimate (small production):** ~$20-40/month (DigitalOcean / Linode / Hetzner)

---

## 9. Troubleshooting

### Backend won't start
```bash
# Check logs
journalctl -u internhub-backend -n 50 --no-pager

# Test database connection
psql -U internhub_user -d internhub -c "SELECT 1"
```

### CORS errors in browser
```bash
# Verify CORS_ORIGINS in .env matches the exact origin in the browser
# The origin must match exactly (protocol, domain, port)
# Example: https://app.yourdomain.com (not https://app.yourdomain.com/)
```

### Uploaded files 404
```bash
# Check file exists
ls -la backend/uploads/
# Check backend logs
journalctl -u internhub-backend -n 20 --no-pager | grep -i "upload"
```

---

## 10. Quick Start (Development)

```bash
# Terminal 1: Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Edit .env if needed
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm install
npm run dev

# Open http://localhost:5173
# Login: internhub_admin / <ADMIN_PASSWORD from .env>
```
