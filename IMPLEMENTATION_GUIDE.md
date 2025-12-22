# SATRF Website Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the SATRF website design system and wireframes. The project uses Next.js with Chakra UI for consistent, accessible, and responsive design.

## Project Structure

```
src/
├── components/
│   ├── layout/          # Layout components (Navbar, Footer, Layout)
│   ├── home/           # Home page components
│   ├── forms/          # Reusable form components
│   ├── cards/          # Card components
│   └── ui/             # Basic UI components
├── lib/
│   ├── theme.ts        # Chakra UI theme configuration
│   └── firebase/       # Firebase configuration
├── pages/              # Next.js pages
└── types/              # TypeScript type definitions
```

## Implementation Steps

### 1. Theme Setup

The theme has been updated with SATRF brand colors. Key colors:

```tsx
// Available in theme.colors.satrf
navy: '#1a365d'      // Primary brand color
red: '#e53e3e'       // Accent color
lightBlue: '#3182ce' // Secondary actions
grayBlue: '#4a5568'  // Secondary text
```

### 2. Component Implementation

#### Navigation Component

```tsx
// src/components/layout/Navbar.tsx
import { Box, Flex, Button, useColorModeValue } from '@chakra-ui/react';

export default function Navbar() {
  return (
    <Box bg="satrf.navy" px={4} py={3}>
      <Flex justify="space-between" align="center" maxW="1200px" mx="auto">
        <Box>
          <Image src="/images/SATRFLOGO.png" alt="SATRF Logo" h="40px" />
        </Box>
        <Flex gap={4}>
          <Button variant="ghost" color="white" _hover={{ bg: 'satrf.lightBlue' }}>
            Home
          </Button>
          <Button variant="ghost" color="white" _hover={{ bg: 'satrf.lightBlue' }}>
            Events
          </Button>
          <Button variant="ghost" color="white" _hover={{ bg: 'satrf.lightBlue' }}>
            Scores
          </Button>
          <Button variant="ghost" color="white" _hover={{ bg: 'satrf.lightBlue' }}>
            About
          </Button>
          <Button variant="satrfRed" size="sm">
            Login
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}
```

#### Hero Section Component

```tsx
// src/components/home/HeroSection.tsx
import { Box, Container, Heading, Text, Button, VStack, HStack } from '@chakra-ui/react';

export default function HeroSection() {
  return (
    <Box bg="satrf.navy" color="white" py={20}>
      <Container maxW="1200px">
        <VStack spacing={8} textAlign="center">
          <Heading size="4xl" fontWeight="bold">
            South African Target Rifle Federation
          </Heading>
          <Text fontSize="xl" maxW="600px">
            Excellence in Precision Shooting Since 1960
          </Text>
          <HStack spacing={4}>
            <Button size="lg" variant="satrfRed">
              Join SATRF
            </Button>
            <Button size="lg" variant="outline" color="white" borderColor="white">
              View Events
            </Button>
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
}
```

#### Dashboard Cards Component

```tsx
// src/components/home/DashboardSection.tsx
import { Box, Container, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText } from '@chakra-ui/react';

export default function DashboardSection() {
  return (
    <Box py={16} bg="white">
      <Container maxW="1200px">
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={8}>
          <Stat textAlign="center">
            <StatNumber color="satrf.navy" fontSize="3xl">1,250</StatNumber>
            <StatLabel>Active Members</StatLabel>
            <StatHelpText>Growing community</StatHelpText>
          </Stat>
          <Stat textAlign="center">
            <StatNumber color="satrf.navy" fontSize="3xl">12</StatNumber>
            <StatLabel>Events This Month</StatLabel>
            <StatHelpText>Competitions & training</StatHelpText>
          </Stat>
          <Stat textAlign="center">
            <StatNumber color="satrf.navy" fontSize="3xl">Updated</StatNumber>
            <StatLabel>Scores Daily</StatLabel>
            <StatHelpText>Real-time tracking</StatHelpText>
          </Stat>
          <Stat textAlign="center">
            <StatNumber color="satrf.navy" fontSize="3xl">Latest</StatNumber>
            <StatLabel>News & Updates</StatLabel>
            <StatHelpText>Stay informed</StatHelpText>
          </Stat>
        </SimpleGrid>
      </Container>
    </Box>
  );
}
```

#### Event Card Component

```tsx
// src/components/cards/EventCard.tsx
import { Box, Heading, Text, Button, Badge, VStack, HStack } from '@chakra-ui/react';

interface EventCardProps {
  title: string;
  date: string;
  location: string;
  type: string;
  status: 'open' | 'full' | 'closed';
  onRegister: () => void;
  onViewDetails: () => void;
}

export default function EventCard({ title, date, location, type, status, onRegister, onViewDetails }: EventCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'green';
      case 'full': return 'orange';
      case 'closed': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Box bg="white" p={6} rounded="lg" shadow="md" _hover={{ shadow: "lg", transform: "translateY(-2px)" }} transition="all 0.2s">
      <VStack align="stretch" spacing={4}>
        <Box>
          <Text fontSize="sm" color="gray.500">{date}</Text>
          <Heading size="md" color="satrf.navy">{title}</Heading>
          <Text color="gray.600">{location}</Text>
        </Box>
        
        <HStack justify="space-between">
          <Badge colorScheme="blue">{type}</Badge>
          <Badge colorScheme={getStatusColor(status)}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </HStack>
        
        <HStack spacing={3}>
          <Button size="sm" variant="satrf" onClick={onRegister} flex={1}>
            {status === 'full' ? 'Waitlist' : 'Register'}
          </Button>
          <Button size="sm" variant="outline" onClick={onViewDetails} flex={1}>
            View Details
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}
```

#### Registration Form Component

```tsx
// src/components/forms/RegistrationForm.tsx
import { Box, Button, FormControl, FormLabel, Input, Select, Stack, Text, VStack } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const registrationSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  membershipType: z.enum(['junior', 'senior', 'veteran']),
  club: z.string().min(2, 'Club name is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function RegistrationForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registrationSchema),
  });

  const onSubmit = (data: any) => {
    console.log(data);
    // Handle form submission
  };

  return (
    <Box bg="white" p={8} rounded="lg" shadow="md" maxW="500px" mx="auto">
      <VStack spacing={6} as="form" onSubmit={handleSubmit(onSubmit)}>
        <FormControl isInvalid={!!errors.firstName}>
          <FormLabel>First Name</FormLabel>
          <Input {...register('firstName')} />
          {errors.firstName && (
            <Text color="red.500" fontSize="sm">{errors.firstName.message}</Text>
          )}
        </FormControl>

        <FormControl isInvalid={!!errors.lastName}>
          <FormLabel>Last Name</FormLabel>
          <Input {...register('lastName')} />
          {errors.lastName && (
            <Text color="red.500" fontSize="sm">{errors.lastName.message}</Text>
          )}
        </FormControl>

        <FormControl isInvalid={!!errors.email}>
          <FormLabel>Email</FormLabel>
          <Input type="email" {...register('email')} />
          {errors.email && (
            <Text color="red.500" fontSize="sm">{errors.email.message}</Text>
          )}
        </FormControl>

        <FormControl isInvalid={!!errors.password}>
          <FormLabel>Password</FormLabel>
          <Input type="password" {...register('password')} />
          {errors.password && (
            <Text color="red.500" fontSize="sm">{errors.password.message}</Text>
          )}
        </FormControl>

        <FormControl isInvalid={!!errors.confirmPassword}>
          <FormLabel>Confirm Password</FormLabel>
          <Input type="password" {...register('confirmPassword')} />
          {errors.confirmPassword && (
            <Text color="red.500" fontSize="sm">{errors.confirmPassword.message}</Text>
          )}
        </FormControl>

        <FormControl isInvalid={!!errors.membershipType}>
          <FormLabel>Membership Type</FormLabel>
          <Select {...register('membershipType')}>
            <option value="junior">Junior</option>
            <option value="senior">Senior</option>
            <option value="veteran">Veteran</option>
          </Select>
          {errors.membershipType && (
            <Text color="red.500" fontSize="sm">{errors.membershipType.message}</Text>
          )}
        </FormControl>

        <FormControl isInvalid={!!errors.club}>
          <FormLabel>Club</FormLabel>
          <Input {...register('club')} />
          {errors.club && (
            <Text color="red.500" fontSize="sm">{errors.club.message}</Text>
          )}
        </FormControl>

        <Button type="submit" variant="satrf" size="lg" w="full">
          Create Account
        </Button>
      </VStack>
    </Box>
  );
}
```

### 3. Responsive Design Implementation

#### Mobile-First Approach

```tsx
// Example of responsive design patterns
<Container maxW="1200px" px={{ base: 4, md: 8 }}>
  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: 4, md: 6 }}>
    {/* Content */}
  </SimpleGrid>
</Container>
```

#### Responsive Typography

```tsx
<Heading size={{ base: "lg", md: "xl", lg: "2xl" }}>
  Responsive Heading
</Heading>
```

### 4. Accessibility Implementation

#### Focus Management

```tsx
// Ensure all interactive elements have focus indicators
<Button
  _focus={{
    outline: '2px solid',
    outlineColor: 'satrf.lightBlue',
    outlineOffset: '2px',
  }}
>
  Accessible Button
</Button>
```

#### Screen Reader Support

```tsx
// Proper labeling for screen readers
<FormControl>
  <FormLabel id="email-label">Email Address</FormLabel>
  <Input
    aria-labelledby="email-label"
    aria-describedby="email-error"
    aria-invalid={!!errors.email}
  />
  {errors.email && (
    <Text id="email-error" color="red.500" role="alert">
      {errors.email.message}
    </Text>
  )}
</FormControl>
```

### 5. Performance Optimization

#### Image Optimization

```tsx
import Image from 'next/image';

<Image
  src="/images/SATRFLOGO.png"
  alt="SATRF Logo"
  width={200}
  height={80}
  priority
/>
```

#### Component Lazy Loading

```tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton height="200px" />,
  ssr: false,
});
```

### 6. Testing Strategy

#### Component Testing

```tsx
// Example test for EventCard component
import { render, screen, fireEvent } from '@testing-library/react';
import EventCard from '../components/cards/EventCard';

test('EventCard displays event information correctly', () => {
  const mockEvent = {
    title: 'Test Event',
    date: '2024-01-15',
    location: 'Test Location',
    type: 'Competition',
    status: 'open' as const,
    onRegister: jest.fn(),
    onViewDetails: jest.fn(),
  };

  render(<EventCard {...mockEvent} />);
  
  expect(screen.getByText('Test Event')).toBeInTheDocument();
  expect(screen.getByText('Test Location')).toBeInTheDocument();
  expect(screen.getByText('Register')).toBeInTheDocument();
});
```

#### Accessibility Testing

```tsx
// Test for accessibility compliance
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('EventCard should not have accessibility violations', async () => {
  const { container } = render(<EventCard {...mockEvent} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Development Workflow

### 1. Setup Development Environment

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint
```

### 2. Component Development Process

1. **Create component file** in appropriate directory
2. **Define TypeScript interfaces** for props
3. **Implement component** following design system
4. **Add responsive design** using Chakra UI breakpoints
5. **Test accessibility** with screen readers and keyboard navigation
6. **Write unit tests** for component functionality
7. **Document component** with usage examples

### 3. Page Implementation Process

1. **Create page file** in `src/pages/`
2. **Import and compose components** following wireframe structure
3. **Add page-specific logic** (data fetching, state management)
4. **Implement responsive layout** for all screen sizes
5. **Test page functionality** and user flows
6. **Optimize performance** (images, code splitting, caching)

## Quality Assurance Checklist

### Design Compliance
- [ ] Colors match SATRF brand palette
- [ ] Typography follows design system
- [ ] Spacing uses defined scale
- [ ] Components match wireframes
- [ ] Responsive design works on all devices

### Accessibility Compliance
- [ ] WCAG 2.1 AA standards met
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] Color contrast ratios sufficient
- [ ] Focus indicators visible

### Performance Standards
- [ ] Page load times under 3 seconds
- [ ] Images optimized and compressed
- [ ] Code splitting implemented
- [ ] Bundle size reasonable
- [ ] Core Web Vitals optimized

### Code Quality
- [ ] TypeScript types defined
- [ ] ESLint rules followed
- [ ] Prettier formatting applied
- [ ] Unit tests written
- [ ] Documentation complete

## Deployment Considerations

### Environment Configuration
- Set up environment variables for Firebase
- Configure build optimization
- Set up CI/CD pipeline
- Configure monitoring and analytics

### SEO Optimization
- Add meta tags for all pages
- Implement structured data
- Optimize for search engines
- Set up sitemap generation

This implementation guide ensures consistent, high-quality development following the established design system and wireframes. 