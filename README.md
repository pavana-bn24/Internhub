# InternHub

InternHub is a full-stack internship management platform developed to simplify and automate the complete internship lifecycle for students, administrators, and organizations. The platform centralizes every stage of the internship process, including student registration, course enrollment, payment verification, attendance tracking, project submission, offer letter generation, certificate management, notifications, and progress monitoring.

Built with a modern client-server architecture, InternHub provides secure role-based authentication, RESTful APIs, and an intuitive dashboard that enables students and administrators to manage internship activities efficiently. The platform reduces manual work, improves transparency, and streamlines administrative operations through an organized and scalable workflow.



## Features

- Student registration and authentication
- Secure role-based access control using JWT
- Internship course management
- Student enrollment and payment verification
- Attendance management
- Project submission and review
- Offer letter generation
- Certificate generation and download
- Study materials management
- Notification system
- Progress tracking dashboard
- RESTful API architecture
- Responsive and user-friendly interface


## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

### Backend

- FastAPI
- Python

### Database

- SQLite

### Authentication

- JWT Authentication

### Development Tools

- Git
- GitHub
- Visual Studio Code
- npm
- Python Virtual Environment


## Installation

### Clone the repository

```bash
git clone https://github.com/pavana-bn24/Internhub.git
cd InternHub
```

---

## Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate the environment.

**Windows**

```bash
venv\Scripts\activate
```

**Linux / macOS**

```bash
source venv/bin/activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file using `.env.example` and configure the required environment variables.

Run the backend server:

```bash
python run.py
```

or

```bash
uvicorn app.main:app --reload
```

The backend will be available at:

```text
http://localhost:8000
```



## Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install the required packages:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at:

```text
http://localhost:5173
```



## Future Enhancements

- Email notifications
- Internship analytics dashboard
- Cloud file storage
- Multi-organization support
- Advanced reporting
- Mobile application
- Interview scheduling
- AI-powered internship recommendations


This project is developed for educational and learning purposes.
