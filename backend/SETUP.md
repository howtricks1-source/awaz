# Hamari Awaz Backend Setup Guide

## Quick Setup (Recommended)

### Prerequisites
- Python 3.8+ installed
- pip package manager

### Installation Steps

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment**
   
   **Windows:**
   ```bash
   venv\Scripts\activate
   ```
   
   **macOS/Linux:**
   ```bash
   source venv/bin/activate
   ```

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser (admin)**
   ```bash
   python manage.py createsuperuser
   ```

7. **Create sample data (optional)**
   ```bash
   python manage.py shell
   ```
   
   Then run:
   ```python
   from departments.models import Department
   from accounts.models import User
   
   # Create departments
   cs_dept = Department.objects.create(name="Computer Science", code="CS")
   ee_dept = Department.objects.create(name="Electrical Engineering", code="EE")
   
   # Create sample users
   student = User.objects.create_user(
       username="student1",
       email="student@example.com",
       password="password123",
       role="Student",
       department=cs_dept
   )
   
   staff = User.objects.create_user(
       username="staff1",
       email="staff@example.com",
       password="password123",
       role="Staff",
       department=cs_dept
   )
   
   print("Sample data created successfully!")
   exit()
   ```

8. **Start development server**
   ```bash
   python manage.py runserver
   ```

9. **Access the application**
   - API: http://localhost:8000/api/
   - Admin Panel: http://localhost:8000/admin/
   - API Documentation: http://localhost:8000/api/schema/swagger-ui/

## Database Configuration

### SQLite (Default - No Setup Required)
The system uses SQLite by default for easy development. No additional setup needed.

### MySQL (Production)
To use MySQL, create a `.env` file in the backend directory:

```env
DB_NAME=hamari_awaz
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_PORT=3306
```

Then install MySQL client:
```bash
pip install mysqlclient
```

## Environment Variables

Create a `.env` file in the backend directory for custom configuration:

```env
# Database (optional - defaults to SQLite)
DB_NAME=hamari_awaz
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=3306

# Security
SECRET_KEY=your-secret-key-here
DEBUG=True

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@hamariaawaz.com
```

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Student registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/refresh/` - Refresh JWT token
- `GET /api/auth/profile/` - Get user profile

### Complaints
- `GET /api/complaints/` - List complaints
- `POST /api/complaints/create/` - Create complaint
- `GET /api/complaints/{id}/` - Get complaint details
- `POST /api/complaints/forward/` - Forward complaint
- `POST /api/complaints/{id}/responses/` - Add response
- `GET /api/complaints/{id}/comments/` - List comments
- `POST /api/complaints/{id}/comments/` - Add comment
- `POST /api/complaints/comments/{id}/reply/` - Reply to comment

### Feedback
- `POST /api/complaints/feedback/` - Submit feedback
- `GET /api/complaints/feedback/list/` - List feedback

### Withdrawal Requests
- `GET /api/complaints/withdrawals/` - List withdrawal requests
- `POST /api/complaints/withdrawals/create/` - Create withdrawal request
- `GET /api/complaints/withdrawals/{id}/` - Get withdrawal details

### Notifications
- `GET /api/notifications/` - List notifications
- `POST /api/notifications/{id}/mark-read/` - Mark as read

### Analytics
- `GET /api/analytics/dashboard/` - Dashboard statistics
- `GET /api/analytics/complaints-by-department/` - Department stats
- `GET /api/analytics/complaint-trends/` - Trend analysis

## User Roles

1. **Student** - Can file complaints, track status, submit feedback
2. **Staff** - Can respond to assigned complaints, add comments
3. **Department Head** - Can manage department complaints, assign staff
4. **VC (Vice Chancellor)** - Can access all complaints, view analytics
5. **Admin** - Can manage users, departments, system settings

## File Uploads

The system supports file uploads for:
- Complaint attachments
- Response attachments
- Withdrawal supporting documents
- User profile pictures

Files are stored in the `media/` directory.

## Troubleshooting

### Migration Issues
If you encounter migration errors:
```bash
python manage.py makemigrations
python manage.py migrate
```

### Static Files Warning
If you see static files warnings:
```bash
mkdir static
python manage.py collectstatic
```

### Permission Errors
Make sure your virtual environment is activated and you have proper permissions.

### Database Connection Issues
- For SQLite: Ensure the backend directory is writable
- For MySQL: Verify database credentials and server is running

## Development Tips

1. **Use the admin panel** at `/admin/` to manage data
2. **Check logs** in the `logs/` directory for debugging
3. **Use API documentation** at `/api/schema/swagger-ui/` for testing
4. **Enable debug mode** in development for detailed error messages

## Production Deployment

For production deployment:

1. Set `DEBUG=False` in environment variables
2. Configure proper database (MySQL/PostgreSQL)
3. Set up proper email backend
4. Configure static files serving
5. Use HTTPS and proper security headers
6. Set up proper logging and monitoring

## Support

For issues or questions:
1. Check the logs in `logs/django.log`
2. Verify all dependencies are installed
3. Ensure database migrations are applied
4. Check API documentation for correct usage

The system is designed to be production-ready with proper security, validation, and error handling.

