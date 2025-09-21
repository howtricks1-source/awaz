# 🚀 Hamari Awaz - Complete Setup Guide

## 📋 **System Overview**

**Hamari Awaz** is a comprehensive complaint management system built with:
- **Backend**: Django 5 + Django REST Framework
- **Frontend**: Next.js 14 + React + TypeScript
- **Database**: MySQL (configurable)
- **Authentication**: JWT-based with role-based access control

---

## 🛠️ **Prerequisites**

### **System Requirements**
- **Python**: 3.10+ (recommended 3.11+)
- **Node.js**: 18+ (recommended 20+)
- **MySQL**: 8.0+ (or SQLite for development)
- **Git**: Latest version

### **Development Tools**
- **Code Editor**: VS Code (recommended)
- **API Testing**: Postman or Thunder Client
- **Database GUI**: MySQL Workbench or phpMyAdmin

---

## 🔧 **Backend Setup (Django)**

### **1. Navigate to Backend Directory**
```bash
cd backend
```

### **2. Create Virtual Environment**
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### **3. Install Dependencies**
```bash
pip install -r requirements.txt
```

### **4. Environment Configuration**
Create a `.env` file in the `backend` directory:

```env
# Database Configuration
DB_NAME=hamari_awaz_db
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_PORT=3306

# Django Settings
SECRET_KEY=your-super-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# JWT Settings
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=True

# File Upload Settings
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,jpeg,png,gif,txt

# Redis Configuration (Optional - for caching)
REDIS_URL=redis://localhost:6379/0
```

### **5. Database Setup**

#### **Option A: MySQL (Recommended for Production)**
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE hamari_awaz_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'hamari_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON hamari_awaz_db.* TO 'hamari_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### **Option B: SQLite (Quick Development)**
Update your `.env` file:
```env
DB_ENGINE=sqlite
DB_NAME=db.sqlite3
```

### **6. Run Migrations**
```bash
# Create and apply migrations
python manage.py makemigrations
python manage.py migrate
```

### **7. Create Superuser**
```bash
python manage.py createsuperuser
```

### **8. Load Sample Data (Optional)**
```bash
# Load departments and sample users
python manage.py loaddata fixtures/departments.json
python manage.py loaddata fixtures/sample_users.json
```

### **9. Start Development Server**
```bash
python manage.py runserver
```

**Backend will be available at**: `http://localhost:8000`

---

## 🎨 **Frontend Setup (Next.js)**

### **1. Navigate to Frontend Directory**
```bash
cd frontend
```

### **2. Install Dependencies**
```bash
npm install
# or
yarn install
```

### **3. Environment Configuration**
Create a `.env.local` file in the `frontend` directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_MEDIA_URL=http://localhost:8000/media

# App Configuration
NEXT_PUBLIC_APP_NAME=Hamari Awaz
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ENVIRONMENT=development

# Authentication
NEXT_PUBLIC_JWT_REFRESH_INTERVAL=300000  # 5 minutes in milliseconds

# File Upload
NEXT_PUBLIC_MAX_FILE_SIZE=10485760  # 10MB
NEXT_PUBLIC_ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,jpeg,png,gif,txt

# Features
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_DARK_MODE=true
```

### **4. Start Development Server**
```bash
npm run dev
# or
yarn dev
```

**Frontend will be available at**: `http://localhost:3000`

---

## 🗄️ **Database Schema**

### **Core Models**
1. **User** (Custom AbstractUser)
   - Roles: Student, Staff, DepartmentHead, VC, Admin
   - Department association
   - Profile information

2. **Department**
   - Name, description, head assignment
   - Active status

3. **Complaint**
   - Auto-generated complaint numbers (AWA-YYYY-XXXX)
   - Priority levels, status tracking
   - File attachments, forwarding history

4. **WithdrawalRequest**
   - Auto-generated request numbers (WRQ-YYYY-XXXX)
   - Approval workflows

5. **Notification**
   - 10 different notification types
   - Read/unread status

6. **ActivityLog**
   - Comprehensive audit trails
   - User action tracking

---

## 🔐 **User Roles & Permissions**

### **Student**
- File complaints
- Track complaint status
- Submit feedback (post-closure)
- Submit withdrawal requests
- View personal dashboard

### **Staff**
- View assigned complaints
- Respond to complaints
- Forward complaints
- Add comments (3 types)
- Review withdrawal requests

### **Department Head**
- Department-wide oversight
- Assign complaints to staff
- Approve/reject withdrawal requests
- View department analytics
- Manage staff workload

### **VC (Vice Chancellor)**
- University-wide oversight
- Executive decision making
- View all complaints and requests
- Access comprehensive analytics
- System-wide reporting

### **Admin**
- Complete system administration
- User and department management
- System configuration
- Activity log monitoring
- System health tracking

---

## 🚀 **API Endpoints**

### **Authentication**
- `POST /api/auth/register/` - Student registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/refresh/` - Token refresh
- `POST /api/auth/logout/` - User logout

### **Complaints**
- `GET /api/complaints/` - List complaints
- `POST /api/complaints/` - Create complaint
- `GET /api/complaints/{id}/` - Get complaint details
- `PUT /api/complaints/{id}/` - Update complaint
- `POST /api/complaints/{id}/forward/` - Forward complaint
- `POST /api/complaints/{id}/comments/` - Add comment
- `POST /api/complaints/{id}/responses/` - Add response

### **Withdrawals**
- `GET /api/withdrawals/` - List withdrawal requests
- `POST /api/withdrawals/` - Create withdrawal request
- `PUT /api/withdrawals/{id}/` - Update withdrawal request

### **Notifications**
- `GET /api/notifications/` - List notifications
- `POST /api/notifications/mark-read/` - Mark as read

### **Analytics**
- `GET /api/reports/complaints/` - Complaint statistics
- `GET /api/reports/feedback/` - Feedback analytics
- `GET /api/reports/departments/` - Department performance

---

## 🧪 **Testing**

### **Backend Testing**
```bash
cd backend
python manage.py test
```

### **Frontend Testing**
```bash
cd frontend
npm run test
# or
yarn test
```

---

## 📦 **Production Deployment**

### **Backend (Django)**
1. Set `DEBUG=False` in production settings
2. Configure proper database (MySQL/PostgreSQL)
3. Set up static file serving (Nginx/Apache)
4. Configure HTTPS and security headers
5. Set up monitoring and logging

### **Frontend (Next.js)**
1. Build production bundle: `npm run build`
2. Deploy to Vercel, Netlify, or custom server
3. Configure environment variables
4. Set up CDN for static assets

---

## 🔧 **Troubleshooting**

### **Common Backend Issues**

#### **Database Connection Error**
```bash
# Check MySQL service
sudo systemctl status mysql
# Restart if needed
sudo systemctl restart mysql
```

#### **Migration Issues**
```bash
# Reset migrations (development only)
python manage.py migrate --fake-initial
# Or reset specific app
python manage.py migrate complaints zero
python manage.py migrate complaints
```

#### **Permission Denied Errors**
```bash
# Fix file permissions
chmod +x manage.py
# Fix media directory permissions
chmod -R 755 media/
```

### **Common Frontend Issues**

#### **API Connection Error**
- Check if backend server is running on port 8000
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check CORS settings in Django

#### **Build Errors**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

#### **Module Not Found**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 **Additional Resources**

### **Documentation**
- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)

### **Development Tools**
- [Django Debug Toolbar](https://django-debug-toolbar.readthedocs.io/)
- [React Developer Tools](https://react.dev/learn/react-developer-tools)
- [Postman API Testing](https://www.postman.com/)

---

## 🎯 **Quick Start Commands**

### **Start Both Servers**
```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python manage.py runserver

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### **Access the Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **Admin Panel**: http://localhost:8000/admin

---

## ✅ **System Features Checklist**

### **Core Functionality**
- ✅ User authentication and authorization
- ✅ Role-based access control (5 roles)
- ✅ Complaint management lifecycle
- ✅ Auto-numbering system
- ✅ File upload and management
- ✅ Comment system (3 types)
- ✅ Forwarding workflow
- ✅ Withdrawal request module
- ✅ Feedback system
- ✅ Notification system
- ✅ Activity logging
- ✅ Analytics and reporting

### **UI/UX Features**
- ✅ Responsive Bootstrap 5 design
- ✅ Role-specific dashboards
- ✅ Interactive modals and forms
- ✅ Advanced filtering and search
- ✅ Real-time notifications
- ✅ Mobile-responsive design
- ✅ Loading states and error handling

### **Technical Features**
- ✅ RESTful API architecture
- ✅ JWT authentication
- ✅ Database optimization
- ✅ File validation and security
- ✅ Comprehensive error handling
- ✅ Activity audit trails
- ✅ Performance optimization

---

## 🎉 **Congratulations!**

You now have a fully functional **Hamari Awaz** complaint management system! 

The system includes:
- **Complete backend** with 25+ API endpoints
- **Full frontend** with 4 role-based dashboards
- **Comprehensive user management**
- **Advanced complaint workflow**
- **Real-time notifications**
- **Analytics and reporting**
- **Production-ready architecture**

For support or questions, refer to the troubleshooting section or check the documentation links provided above.

**Happy coding! 🚀**
