# SATRF Website Setup Guide

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd satrf-website
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp env.example .env.local
# Edit .env.local with your configuration
```

4. **Start development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to `http://localhost:3000`

## Environment Configuration

### Required Environment Variables

Create a `.env.local` file in the root directory:

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NEXT_PUBLIC_API_VERSION=v1

# Firebase Configuration (if using Firebase)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Application Configuration
NEXT_PUBLIC_APP_NAME=SATRF
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_ENABLE_REGISTRATION=true
NEXT_PUBLIC_ENABLE_SCORE_UPLOAD=true
NEXT_PUBLIC_ENABLE_EVENT_REGISTRATION=true
```

## Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

## Project Structure

```
satrf-website/
├── src/
│   ├── components/          # React components
│   │   ├── layout/         # Layout components (Navbar, Footer, Layout)
│   │   ├── forms/          # Form components
│   │   └── ui/             # Basic UI components
│   ├── lib/                # Utilities and configurations
│   │   ├── api.ts         # API service layer
│   │   └── firebase/      # Firebase configuration
│   ├── pages/             # Next.js pages
│   ├── styles/            # Global styles
│   │   └── globals.css    # Tailwind CSS and custom styles
│   └── types/             # TypeScript type definitions
├── public/                # Static assets
│   └── images/           # Images and logos
├── tailwind.config.js    # Tailwind CSS configuration
├── package.json          # Dependencies and scripts
└── README.md            # Project documentation
```

## Key Features Implemented

### ✅ Completed Components

1. **Layout Components**
   - Responsive Navbar with mobile menu
   - Footer with links and branding
   - Main Layout wrapper

2. **Pages**
   - Home page with hero section and stats
   - Registration page with form validation

3. **API Integration**
   - Centralized API service layer
   - Authentication endpoints
   - Event management
   - Score upload functionality

4. **Styling System**
   - Tailwind CSS with SATRF brand colors
   - Custom component classes
   - Responsive design patterns

5. **Accessibility**
   - WCAG 2.1 AA compliance
   - Screen reader support
   - Keyboard navigation
   - Focus management

## Development Workflow

### 1. Component Development

```bash
# Create new component
touch src/components/ui/NewComponent.tsx

# Follow the component structure:
# - TypeScript interfaces for props
# - Tailwind CSS for styling
# - Accessibility attributes
# - Error handling
```

### 2. Page Development

```bash
# Create new page
touch src/pages/new-page.tsx

# Follow the page structure:
# - Import Layout component
# - Add page-specific logic
# - Integrate with API services
# - Add loading states
```

### 3. API Integration

```bash
# Add new API endpoints in src/lib/api.ts
# Follow the existing pattern:
# - TypeScript interfaces
# - Error handling
# - Authentication headers
```

## Testing

### Manual Testing Checklist

- [ ] **Responsive Design**: Test on mobile, tablet, desktop
- [ ] **Accessibility**: Screen reader compatibility
- [ ] **Form Validation**: All validation rules working
- [ ] **API Integration**: Backend communication
- [ ] **Navigation**: All links working correctly
- [ ] **Performance**: Page load times acceptable

### Automated Testing

```bash
# Run tests (when implemented)
npm test

# Run accessibility tests
npm run test:a11y

# Run type checking
npm run type-check
```

## Backend Integration

### Required API Endpoints

The frontend expects these backend endpoints:

**Authentication:**
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

**Events:**
- `GET /api/v1/events`
- `GET /api/v1/events/:id`
- `POST /api/v1/events/:id/register`

**Scores:**
- `POST /api/v1/scores`
- `GET /api/v1/scores`
- `GET /api/v1/scores/recent`

**Dashboard:**
- `GET /api/v1/dashboard/stats`
- `GET /api/v1/dashboard/events`
- `GET /api/v1/dashboard/scores`

### API Response Format

All API responses should follow this format:

```typescript
// Success response
{
  success: true,
  data: { /* response data */ },
  message?: string
}

// Error response
{
  success: false,
  error: {
    message: string,
    code?: string
  }
}
```

## Deployment

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Environment Variables for Production

Update `.env.local` with production values:

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.satrf.org/api
NEXT_PUBLIC_APP_URL=https://satrf.org
```

## Troubleshooting

### Common Issues

1. **Tailwind CSS not working**
   - Ensure `src/styles/globals.css` is imported in `_app.tsx`
   - Check `tailwind.config.js` content paths

2. **API calls failing**
   - Verify environment variables are set correctly
   - Check backend server is running
   - Review browser network tab for errors

3. **TypeScript errors**
   - Run `npm run type-check` to identify issues
   - Ensure all props have proper TypeScript interfaces

4. **Build errors**
   - Clear `.next` folder: `rm -rf .next`
   - Reinstall dependencies: `npm install`
   - Check for missing environment variables

### Getting Help

- Check the component documentation in `COMPONENT_STRUCTURE.md`
- Review the design system in `DESIGN_SYSTEM.md`
- Consult the wireframes in `WIREFRAMES.md`

## Next Steps

### Immediate Tasks

1. **Complete remaining pages:**
   - Login page
   - Event Calendar page
   - Score Upload page
   - Leaderboard page
   - Member Dashboard page

2. **Backend integration:**
   - Set up API endpoints
   - Implement authentication
   - Create database models

3. **Testing:**
   - Unit tests for components
   - Integration tests for API
   - E2E tests for user flows

### Future Enhancements

- Dark mode support
- Advanced filtering and search
- Real-time notifications
- Mobile app development
- Performance optimization

This setup guide provides everything needed to start developing the SATRF website. Follow the established patterns and refer to the documentation for detailed implementation guidance. 