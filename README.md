# Hamari Awaz - Complaint Management System

A comprehensive web application for managing complaints in educational institutions with role-based access control, automated workflows, and analytics.

## 🏗️ Architecture

- **Backend**: Django 5 + Django REST Framework + MySQL
- **Frontend**: Next.js 14 + React + TypeScript
- **Authentication**: JWT-based with role-based access control
- **Database**: MySQL with comprehensive relational schema

## 👥 User Roles

- **Student**: File complaints, track status, submit feedback
- **Staff**: Handle assigned complaints, respond to queries
- **Department Head**: Manage department complaints, assign staff
- **VC (Vice Chancellor)**: System-wide oversight and management
- **Admin**: User management and system administration

## 🚀 Features

### Core Features
- ✅ Complete complaint lifecycle management
- ✅ Auto-generated complaint numbers (AWA-YYYY-XXXX)
- ✅ Role-based forwarding system
- ✅ Comment and reply system with thread-style timeline
- ✅ File attachments support
- ✅ Real-time notifications
- ✅ Activity logging for all actions

### Advanced Features
- ✅ Withdrawal request management (WRQ-YYYY-XXXX)
- ✅ Post-closure feedback system
- ✅ Analytics and reporting dashboards
- ✅ Department-wise complaint tracking
- ✅ Dark/Light mode toggle
- ✅ Responsive design

## 📁 Project Structure

```
hamari-awaz/
├── backend/                 # Django REST API
│   ├── hamari_awaz/        # Main Django project
│   ├── requirements.txt    # Python dependencies
│   └── manage.py          # Django management script
├── frontend/               # Next.js React app
│   ├── src/               # Source code
│   ├── package.json       # Node dependencies
│   └── next.config.js     # Next.js configuration
└── README.md              # This file
```

## 🛠️ Development Setup

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure MySQL database in `settings/local.py`

5. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

6. Create superuser:
```bash
python manage.py createsuperuser
```

7. Start development server:
```bash
python manage.py runserver
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register/` - Student registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/refresh/` - Token refresh

### Complaints
- `GET/POST /api/complaints/` - List/Create complaints
- `GET/PUT/DELETE /api/complaints/{id}/` - Complaint details
- `POST /api/complaints/{id}/forward/` - Forward complaint
- `GET/POST /api/complaints/{id}/comments/` - Comments
- `POST /api/complaints/{id}/comments/{comment_id}/reply/` - Reply to comment

### Other Endpoints
- `/api/withdrawals/` - Withdrawal requests
- `/api/feedback/` - Feedback management
- `/api/notifications/` - User notifications
- `/api/reports/` - Analytics and reports
- `/api/users/` - User management (Admin only)

## 🎨 UI Components

### Common Components
- Responsive navigation with role-based menus
- Dashboard cards with statistics
- Data tables with sorting and filtering
- Modal dialogs for forms
- Toast notifications
- Loading states and error handling

### Role-Specific Dashboards
- **Student**: Complaint filing, tracking, feedback
- **Staff**: Assigned complaints, responses
- **Department Head**: Department overview, assignments
- **VC**: System-wide analytics and management
- **Admin**: User and system management

## 📊 Analytics & Reporting

- Complaints per department
- Resolution rate tracking
- Feedback ratings analysis
- Unresolved complaint monitoring
- Activity logs and audit trails

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- CORS configuration
- SQL injection prevention
- XSS protection

## 🚀 Production Deployment

### Backend Deployment
- Configure production settings
- Set up MySQL database
- Configure static file serving
- Set up WSGI server (Gunicorn)
- Configure reverse proxy (Nginx)

### Frontend Deployment
- Build production bundle: `npm run build`
- Deploy to static hosting or server
- Configure environment variables
- Set up CDN for assets

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions, please contact the development team.
