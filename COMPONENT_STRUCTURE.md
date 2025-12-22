# SATRF Website Component Structure

## Project Overview

The SATRF website is built with **React + Next.js + Tailwind CSS**, following a component-based architecture with TypeScript for type safety and accessibility best practices.

## Technology Stack

- **Frontend Framework**: Next.js 14.1.0
- **Styling**: Tailwind CSS 3.3.6
- **Form Handling**: React Hook Form + Zod validation
- **HTTP Client**: Axios
- **Icons**: React Icons (Feather icons)
- **Notifications**: React Hot Toast
- **Type Safety**: TypeScript

## Project Structure

```
src/
├── components/
│   ├── layout/           # Layout components
│   │   ├── Navbar.tsx    # Navigation with mobile menu
│   │   ├── Footer.tsx    # Footer with links
│   │   └── Layout.tsx    # Main layout wrapper
│   ├── forms/            # Reusable form components
│   ├── cards/            # Card components
│   └── ui/               # Basic UI components
├── lib/
│   ├── api.ts           # API service layer
│   └── firebase/        # Firebase configuration
├── pages/               # Next.js pages
├── styles/
│   └── globals.css      # Global styles and Tailwind config
└── types/               # TypeScript type definitions
```

## Component Documentation

### Layout Components

#### 1. Navbar Component (`src/components/layout/Navbar.tsx`)

**Purpose**: Main navigation component with responsive mobile menu

**Features**:
- Responsive design (mobile-first)
- Mobile hamburger menu
- User authentication state handling
- SATRF branding with logo
- Accessible navigation links

**Props**:
```typescript
interface NavbarProps {
  user?: {
    firstName: string;
    lastName: string;
  } | null;
}
```

**Key Features**:
- Mobile menu toggle with smooth animations
- User logout functionality
- Active link highlighting
- Keyboard navigation support
- Screen reader friendly

**Usage**:
```tsx
<Navbar user={currentUser} />
```

#### 2. Footer Component (`src/components/layout/Footer.tsx`)

**Purpose**: Site footer with links and branding

**Features**:
- SATRF logo and description
- Quick links section
- Contact & support links
- Copyright information
- Responsive grid layout

**Usage**:
```tsx
<Footer />
```

#### 3. Layout Component (`src/components/layout/Layout.tsx`)

**Purpose**: Main layout wrapper for all pages

**Features**:
- Consistent page structure
- User context passing
- Flexbox layout for sticky footer

**Props**:
```typescript
interface LayoutProps {
  children: ReactNode;
  user?: {
    firstName: string;
    lastName: string;
  } | null;
}
```

**Usage**:
```tsx
<Layout user={currentUser}>
  <PageContent />
</Layout>
```

### Page Components

#### 1. Home Page (`src/pages/index.tsx`)

**Purpose**: Landing page with hero section and key information

**Sections**:
- Hero section with CTA buttons
- Dashboard stats (members, events, scores, news)
- Upcoming events grid
- Affiliate logos
- Call-to-action section

**Features**:
- API integration for dynamic data
- Loading states with skeletons
- Responsive grid layouts
- Interactive event cards

**API Integration**:
```typescript
// Fetch dashboard stats
const statsData = await dashboardAPI.getStats();

// Fetch upcoming events
const eventsData = await eventsAPI.getAll({ status: 'open' });
```

#### 2. Registration Page (`src/pages/register.tsx`)

**Purpose**: User registration form with validation

**Features**:
- Comprehensive form validation with Zod
- Password visibility toggles
- Real-time validation feedback
- Accessibility compliance
- API integration for user creation

**Form Fields**:
- First Name & Last Name
- Email Address
- Password & Confirm Password
- Membership Type (Junior/Senior/Veteran)
- Club Name

**Validation Rules**:
```typescript
const registrationSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  confirmPassword: z.string(),
  membershipType: z.enum(['junior', 'senior', 'veteran']),
  club: z.string().min(2).max(100),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```

## API Integration

### API Service Layer (`src/lib/api.ts`)

**Purpose**: Centralized API communication with backend

**Features**:
- Axios instance with interceptors
- Automatic token management
- Error handling
- TypeScript interfaces
- Modular API functions

**API Modules**:
- `authAPI`: Authentication (register, login, logout)
- `eventsAPI`: Event management
- `scoresAPI`: Score upload and management
- `leaderboardAPI`: Rankings and statistics
- `dashboardAPI`: Dashboard data

**Example Usage**:
```typescript
// User registration
const userData = await authAPI.register({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  password: 'SecurePass123',
  membershipType: 'senior',
  club: 'Cape Town Club'
});

// Fetch events
const events = await eventsAPI.getAll({ status: 'open' });
```

## Styling System

### Tailwind CSS Configuration (`tailwind.config.js`)

**Custom Colors**:
```javascript
colors: {
  satrf: {
    navy: '#1a365d',      // Primary brand color
    red: '#e53e3e',       // Accent color
    lightBlue: '#3182ce', // Secondary actions
    grayBlue: '#4a5568',  // Secondary text
    lightGray: '#f7fafc', // Background surfaces
    darkGray: '#2d3748',  // Dark mode backgrounds
  },
}
```

### Custom Components (`src/styles/globals.css`)

**Button Variants**:
```css
.btn-primary {
  @apply bg-satrf-navy text-white px-6 py-3 rounded-lg font-medium 
         hover:bg-satrf-lightBlue transition-colors duration-200 
         focus:outline-none focus:ring-2 focus:ring-satrf-lightBlue focus:ring-offset-2;
}

.btn-secondary {
  @apply bg-white text-satrf-navy border-2 border-satrf-navy px-6 py-3 rounded-lg 
         font-medium hover:bg-satrf-navy hover:text-white transition-colors duration-200 
         focus:outline-none focus:ring-2 focus:ring-satrf-lightBlue focus:ring-offset-2;
}
```

**Form Components**:
```css
.input-field {
  @apply w-full px-4 py-3 border border-gray-300 rounded-lg 
         focus:outline-none focus:ring-2 focus:ring-satrf-lightBlue 
         focus:border-transparent transition-colors duration-200;
}

.form-error {
  @apply text-red-500 text-sm mt-1;
}
```

## Accessibility Features

### WCAG 2.1 AA Compliance

**Form Accessibility**:
- Proper label associations
- ARIA attributes for error states
- Screen reader announcements
- Keyboard navigation support

**Navigation Accessibility**:
- Skip links for main content
- Focus indicators on all interactive elements
- Semantic HTML structure
- Mobile menu keyboard support

**Color and Contrast**:
- Minimum 4.5:1 contrast ratio for normal text
- 3:1 contrast ratio for large text
- Color not used as sole indicator

## Environment Configuration

### Environment Variables (`env.example`)

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NEXT_PUBLIC_API_VERSION=v1

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id

# Application Configuration
NEXT_PUBLIC_APP_NAME=SATRF
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_ENABLE_REGISTRATION=true
NEXT_PUBLIC_ENABLE_SCORE_UPLOAD=true
NEXT_PUBLIC_ENABLE_EVENT_REGISTRATION=true
```

## Development Guidelines

### Component Development Process

1. **Create component file** in appropriate directory
2. **Define TypeScript interfaces** for props
3. **Implement component** following design system
4. **Add responsive design** using Tailwind breakpoints
5. **Test accessibility** with screen readers and keyboard navigation
6. **Write unit tests** for component functionality
7. **Document component** with usage examples

### Code Quality Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Optimized bundle size and loading

### Testing Strategy

**Component Testing**:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

test('Component should not have accessibility violations', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Backend Integration Notes

### API Endpoints Required

**Authentication**:
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user

**Events**:
- `GET /api/v1/events` - Get all events with filters
- `GET /api/v1/events/:id` - Get specific event
- `POST /api/v1/events/:id/register` - Register for event
- `DELETE /api/v1/events/:id/register` - Unregister from event

**Scores**:
- `POST /api/v1/scores` - Upload score
- `GET /api/v1/scores` - Get user scores
- `GET /api/v1/scores/recent` - Get recent scores
- `PUT /api/v1/scores/:id` - Update score

**Dashboard**:
- `GET /api/v1/dashboard/stats` - Get dashboard statistics
- `GET /api/v1/dashboard/events` - Get upcoming events
- `GET /api/v1/dashboard/scores` - Get recent scores
- `GET /api/v1/dashboard/notifications` - Get notifications

### Data Models

**User Model**:
```typescript
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  membershipType: 'junior' | 'senior' | 'veteran';
  club: string;
  createdAt: string;
}
```

**Event Model**:
```typescript
interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  type: string;
  status: 'open' | 'full' | 'closed';
  description?: string;
  maxParticipants?: number;
  currentParticipants?: number;
}
```

**Score Model**:
```typescript
interface Score {
  id: string;
  userId: string;
  eventId: string;
  score: number;
  xCount: number;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}
```

## Deployment Considerations

### Build Optimization

- **Image Optimization**: Next.js Image component with WebP support
- **Code Splitting**: Automatic route-based code splitting
- **Bundle Analysis**: Webpack bundle analyzer
- **Performance Monitoring**: Core Web Vitals tracking

### SEO Optimization

- **Meta Tags**: Dynamic meta tags for each page
- **Structured Data**: JSON-LD schema markup
- **Sitemap**: Automatic sitemap generation
- **Robots.txt**: Search engine crawling configuration

This component structure provides a solid foundation for building a scalable, accessible, and maintainable SATRF website. 