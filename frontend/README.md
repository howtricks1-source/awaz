# Hamari Awaz - Frontend

A comprehensive complaint management system frontend built with Next.js 14, React, TypeScript, and Bootstrap 5.

## 🚀 Features

### ✅ **Complete Authentication System**
- Student registration with department selection
- JWT-based login with role-based access
- Password strength validation
- Secure logout functionality

### ✅ **Role-Based Dashboards**
- **Student Dashboard**: File complaints, track status, view notifications
- **Staff Dashboard**: Manage assigned complaints, respond to queries
- **Department Head Dashboard**: Department overview, complaint assignment
- **VC Dashboard**: System-wide analytics and oversight
- **Admin Dashboard**: User management and system administration

### ✅ **Comprehensive Complaint Management**
- **File Complaints**: Rich form with file uploads, priority selection
- **Track Complaints**: Public tracking by complaint number
- **Complaint Listing**: Advanced filters, search, pagination
- **Complaint Details**: Full timeline, comments, responses
- **Status Management**: Real-time status updates

### ✅ **Advanced Features**
- **Real-time Notifications**: Dropdown with unread counter
- **Analytics Dashboard**: Charts and performance metrics
- **File Upload**: Secure file handling with validation
- **Theme Support**: Dark/light mode toggle
- **Responsive Design**: Mobile-first approach

### ✅ **Technical Excellence**
- **TypeScript**: Full type safety
- **State Management**: Zustand stores
- **Form Validation**: React Hook Form + Yup
- **API Integration**: Axios with interceptors
- **Error Handling**: Comprehensive error management
- **Performance**: Optimized components and lazy loading

## 🛠️ Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **UI Library**: Bootstrap 5 + React Bootstrap
- **State Management**: Zustand
- **Forms**: React Hook Form + Yup validation
- **Charts**: Chart.js + React Chart.js 2
- **HTTP Client**: Axios
- **Notifications**: React Toastify
- **Icons**: React Icons (Font Awesome)
- **Date Handling**: date-fns

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── complaints/        # Complaint management
│   │   ├── analytics/         # Analytics dashboard
│   │   └── public/            # Public pages
│   ├── components/            # Reusable components
│   │   ├── layout/           # Layout components
│   │   ├── charts/           # Chart components
│   │   ├── forms/            # Form components
│   │   └── ui/               # UI components
│   ├── lib/                  # API client and utilities
│   ├── store/                # Zustand stores
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Utility functions
├── public/                   # Static assets
└── package.json             # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm 8+
- Backend API running on http://localhost:8000

### Installation

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   # Create .env.local file
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   ```
   http://localhost:3000
   ```

## 📱 Pages & Features

### Public Pages
- **Landing Page** (`/`): Hero section, features, call-to-action
- **Login** (`/auth/login`): User authentication
- **Register** (`/auth/register`): Student registration
- **Track Complaint** (`/public/track`): Public complaint tracking

### Authenticated Pages
- **Dashboard** (`/dashboard`): Role-based overview
- **Complaints** (`/complaints`): List and manage complaints
- **Create Complaint** (`/complaints/create`): File new complaints
- **Analytics** (`/analytics`): Charts and performance metrics
- **Profile** (`/profile`): User profile management

## 🎨 UI Components

### Layout Components
- **Navbar**: Responsive navigation with notifications
- **DashboardLayout**: Main layout wrapper
- **NotificationDropdown**: Real-time notifications

### Chart Components
- **ComplaintStatusChart**: Status distribution (pie/bar)
- **ComplaintsByDepartmentChart**: Department breakdown
- **ComplaintTrendsChart**: Time-based trends

### Form Components
- **LoginForm**: Authentication form
- **RegisterForm**: Student registration
- **ComplaintForm**: Complaint creation/editing

## 🔧 State Management

### Zustand Stores
- **authStore**: User authentication and profile
- **complaintStore**: Complaint data and operations
- **notificationStore**: Notification management

### Store Features
- Persistent authentication state
- Optimistic updates
- Error handling
- Loading states

## 🎯 Key Features Implementation

### Authentication Flow
```typescript
// Login process
const login = async (credentials) => {
  const response = await authApi.login(credentials);
  setUser(response.data);
  fetchDashboardStats();
};
```

### Complaint Management
```typescript
// Create complaint with file upload
const createComplaint = async (data) => {
  const formData = new FormData();
  if (data.attachment) formData.append('attachment', data.attachment);
  return await complaintApi.createComplaint(formData);
};
```

### Real-time Notifications
```typescript
// Notification polling
useEffect(() => {
  const interval = setInterval(fetchNotifications, 30000);
  return () => clearInterval(interval);
}, []);
```

## 🔒 Security Features

- **JWT Token Management**: Automatic token refresh
- **Role-based Access**: Component-level permissions
- **Input Validation**: Client and server-side validation
- **File Upload Security**: Type and size validation
- **XSS Protection**: Sanitized inputs and outputs

## 📊 Performance Optimizations

- **Code Splitting**: Route-based splitting
- **Lazy Loading**: Component lazy loading
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Webpack bundle analyzer
- **Caching**: API response caching

## 🧪 Development Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🌐 Environment Configuration

### Development
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Production
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Breakpoints**: Bootstrap 5 responsive breakpoints
- **Touch Friendly**: Large touch targets
- **Accessibility**: WCAG 2.1 compliant

## 🎨 Theme System

- **Light/Dark Mode**: System preference detection
- **Bootstrap Themes**: CSS custom properties
- **Persistent Settings**: LocalStorage theme persistence

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

---

**Built with ❤️ for educational institutions to ensure every voice is heard.**

