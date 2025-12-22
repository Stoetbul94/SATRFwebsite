# SATRF Frontend Authentication System

A comprehensive user authentication and profile management system for the SATRF website built with React, Next.js, and TypeScript.

## 🚀 Features

### Core Authentication
- **User Registration** - Complete registration flow with validation
- **User Login** - Secure login with JWT tokens
- **Token Management** - Automatic token refresh and secure storage
- **Logout** - Secure logout with token cleanup
- **Password Reset** - Forgot password and reset functionality
- **Email Confirmation** - Email verification system

### User Profile Management
- **Profile Viewing** - Display user information and statistics
- **Profile Editing** - Update personal information
- **Password Change** - Secure password update
- **Activity Logging** - Track user actions and sessions

### Dashboard & Analytics
- **Personal Dashboard** - Overview of shooting performance
- **Score Analytics** - Detailed score breakdowns and trends
- **Event Management** - View recent and upcoming events
- **Statistics** - Performance metrics and progress tracking

### Security Features
- **JWT Authentication** - Secure token-based authentication
- **Password Strength Validation** - Real-time password requirements
- **Input Sanitization** - Protection against XSS attacks
- **Session Management** - Secure session handling
- **Protected Routes** - Route-level authentication guards

## 📁 Project Structure

```
src/
├── contexts/
│   └── AuthContext.tsx          # Global authentication state management
├── lib/
│   └── auth.ts                  # Authentication utilities and API calls
├── pages/
│   ├── login.tsx               # Login page
│   ├── register.tsx            # Registration page
│   ├── profile.tsx             # User profile page
│   └── dashboard.tsx           # User dashboard page
├── components/
│   └── auth/
│       └── ProtectedRoute.tsx  # Route protection component
└── __tests__/
    └── auth/
        └── LoginPage.test.tsx  # Authentication tests
```

## 🛠 Installation & Setup

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Backend API running (see backend documentation)

### Environment Variables
Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_API_VERSION=v1
```

### Installation
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 🔧 Configuration

### API Configuration
The authentication system connects to the backend API. Update the API configuration in `src/lib/auth.ts`:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';
```

### Styling
The system uses Tailwind CSS with custom SATRF color palette:

```javascript
// tailwind.config.js
colors: {
  satrf: {
    navy: '#1a365d',
    red: '#e53e3e',
    lightBlue: '#3182ce',
  },
  midnight: {
    steel: '#0b1e2f',
    dark: '#0a1a28',
    light: '#1a2f3f',
  },
  electric: {
    cyan: '#00ffff',
    blue: '#0080ff',
    neon: '#00d4ff',
  },
}
```

## 📖 Usage

### Authentication Context

The `AuthContext` provides global authentication state and methods:

```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { 
    user, 
    isAuthenticated, 
    login, 
    logout, 
    register,
    updateProfile 
  } = useAuth();

  // Use authentication methods
  const handleLogin = async () => {
    const success = await login(email, password);
    if (success) {
      // Redirect or show success message
    }
  };
}
```

### Protected Routes

Use the `ProtectedRoute` component to protect pages:

```typescript
import ProtectedRoute from '../components/auth/ProtectedRoute';

function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>Protected content here</div>
    </ProtectedRoute>
  );
}
```

Or use the `useProtectedRoute` hook:

```typescript
import { useProtectedRoute } from '../contexts/AuthContext';

function DashboardPage() {
  useProtectedRoute('/login');
  
  return <div>Protected content here</div>;
}
```

### Form Validation

The system includes comprehensive form validation:

```typescript
import { passwordValidator } from '../lib/auth';

// Password validation
const validation = passwordValidator.validatePassword(password);
if (!validation.isValid) {
  console.log('Password errors:', validation.errors);
  console.log('Password warnings:', validation.warnings);
}

// Email validation
const isValidEmail = passwordValidator.validateEmail(email);
```

## 🔐 Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Special characters recommended

### Token Management
- Access tokens expire after 30 minutes
- Refresh tokens expire after 7 days
- Automatic token refresh on API calls
- Secure localStorage storage

### Input Validation
- Client-side validation for all forms
- Server-side validation via API
- XSS protection through input sanitization
- CSRF protection via JWT tokens

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test LoginPage.test.tsx
```

### Test Structure
Tests are organized by component and feature:

```
src/__tests__/
├── auth/
│   ├── LoginPage.test.tsx
│   ├── RegisterPage.test.tsx
│   └── ProfilePage.test.tsx
└── components/
    └── auth/
        └── ProtectedRoute.test.tsx
```

### Test Coverage
- Component rendering
- User interactions
- Form validation
- API integration
- Error handling
- Authentication flows

## 🎨 Styling Guidelines

### Color Palette
- **Primary**: Electric Cyan (`#00ffff`)
- **Secondary**: Midnight Steel (`#0b1e2f`)
- **Accent**: Electric Blue (`#0080ff`)
- **Success**: Green (`#4ade80`)
- **Error**: Red (`#ef4444`)
- **Warning**: Yellow (`#fbbf24`)

### Typography
- **Primary Font**: Oxanium (monospace)
- **Secondary Font**: Inter (sans-serif)
- **Font Weights**: 200, 300, 400, 500, 600, 700, 800

### Component Styling
```typescript
// Button styling
className="px-6 py-2 bg-electric-cyan text-midnight-steel font-oxanium font-medium rounded-lg hover:bg-electric-neon transition-all duration-200"

// Input styling
className="px-3 py-3 border rounded-lg text-gray-100 bg-midnight-light/50 border-gray-600 focus:ring-2 focus:ring-electric-cyan font-oxanium"

// Card styling
className="bg-midnight-light/30 rounded-lg border border-gray-600 p-6"
```

## 🔄 API Integration

### Authentication Endpoints
The frontend integrates with these backend endpoints:

- `POST /users/register` - User registration
- `POST /users/login` - User login
- `POST /users/refresh` - Token refresh
- `POST /users/logout` - User logout
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `GET /users/dashboard` - Get dashboard data
- `POST /users/change-password` - Change password
- `POST /users/forgot-password` - Request password reset
- `POST /users/reset-password` - Reset password
- `POST /users/confirm-email` - Confirm email
- `GET /users/activity` - Get user activity

### Error Handling
```typescript
try {
  const result = await login(email, password);
  if (result.success) {
    // Handle success
  } else {
    // Handle error
    console.error(result.error);
  }
} catch (error) {
  // Handle network or unexpected errors
  console.error('Login failed:', error);
}
```

## 🚀 Deployment

### Production Build
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Configuration
For production, set these environment variables:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.satrf.org.za/api
NEXT_PUBLIC_API_VERSION=v1
NODE_ENV=production
```

### Security Considerations
- Use HTTPS in production
- Set secure cookie flags
- Implement rate limiting
- Monitor authentication attempts
- Regular security audits

## 🔧 Troubleshooting

### Common Issues

**Token Expiration**
- Tokens automatically refresh on API calls
- If refresh fails, user is redirected to login
- Check network connectivity and API status

**Form Validation Errors**
- Ensure all required fields are filled
- Check password strength requirements
- Verify email format

**API Connection Issues**
- Verify API base URL configuration
- Check CORS settings on backend
- Ensure API server is running

### Debug Mode
Enable debug logging by setting:

```env
NEXT_PUBLIC_DEBUG=true
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [JWT.io](https://jwt.io/) - JWT token debugging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is part of the SATRF website and follows the same licensing terms.

---

For additional support or questions, please refer to the backend API documentation or contact the development team. 