# SATRF Website Design System

## Brand Identity

### Color Palette

**Primary Colors:**
- **Navy Blue** `#1a365d` - Primary brand color, used for headers, navigation, and primary actions
- **White** `#ffffff` - Background and text on dark surfaces
- **Red** `#e53e3e` - Accent color for CTAs, alerts, and important elements

**Secondary Colors:**
- **Light Blue** `#3182ce` - Secondary actions, links, and highlights
- **Gray Blue** `#4a5568` - Secondary text and borders
- **Light Gray** `#f7fafc` - Background surfaces
- **Dark Gray** `#2d3748` - Dark mode backgrounds

**Semantic Colors:**
- **Success** `#38a169` - Success states and confirmations
- **Warning** `#d69e2e` - Warning states and cautions
- **Error** `#e53e3e` - Error states and alerts
- **Info** `#3182ce` - Information states

### Typography

**Font Family:**
- Primary: `Inter, sans-serif` (already configured in theme)
- Fallback: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

**Font Sizes:**
- `xs`: 0.75rem (12px) - Captions, metadata
- `sm`: 0.875rem (14px) - Small text, form labels
- `md`: 1rem (16px) - Body text (default)
- `lg`: 1.125rem (18px) - Large body text
- `xl`: 1.25rem (20px) - Subheadings
- `2xl`: 1.5rem (24px) - Section headings
- `3xl`: 1.875rem (30px) - Page titles
- `4xl`: 2.25rem (36px) - Hero titles

**Font Weights:**
- `normal`: 400 - Body text
- `medium`: 500 - Emphasis and labels
- `semibold`: 600 - Subheadings
- `bold`: 700 - Headings and CTAs

### Spacing System

**Base Unit:** 4px (0.25rem)

**Spacing Scale:**
- `0`: 0px
- `1`: 4px (0.25rem)
- `2`: 8px (0.5rem)
- `3`: 12px (0.75rem)
- `4`: 16px (1rem)
- `5`: 20px (1.25rem)
- `6`: 24px (1.5rem)
- `8`: 32px (2rem)
- `10`: 40px (2.5rem)
- `12`: 48px (3rem)
- `16`: 64px (4rem)
- `20`: 80px (5rem)

## Component Library

### Buttons

**Primary Button:**
```tsx
<Button colorScheme="blue" size="lg">
  Primary Action
</Button>
```

**Secondary Button:**
```tsx
<Button variant="outline" colorScheme="blue" size="lg">
  Secondary Action
</Button>
```

**Danger Button:**
```tsx
<Button colorScheme="red" size="lg">
  Delete
</Button>
```

**Button Sizes:**
- `sm`: 32px height
- `md`: 40px height (default)
- `lg`: 48px height

### Form Components

**Input Fields:**
```tsx
<FormControl isInvalid={!!errors.field}>
  <FormLabel>Field Label</FormLabel>
  <Input placeholder="Enter value..." />
  {errors.field && (
    <FormErrorMessage>{errors.field.message}</FormErrorMessage>
  )}
</FormControl>
```

**Select Dropdown:**
```tsx
<FormControl>
  <FormLabel>Select Option</FormLabel>
  <Select placeholder="Choose an option">
    <option value="option1">Option 1</option>
    <option value="option2">Option 2</option>
  </Select>
</FormControl>
```

### Cards

**Standard Card:**
```tsx
<Box bg="white" p={6} rounded="lg" shadow="md">
  <Heading size="md" mb={4}>Card Title</Heading>
  <Text>Card content goes here...</Text>
</Box>
```

**Interactive Card:**
```tsx
<Box 
  bg="white" 
  p={6} 
  rounded="lg" 
  shadow="md"
  _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
  transition="all 0.2s"
  cursor="pointer"
>
  <Heading size="md" mb={4}>Interactive Card</Heading>
  <Text>Hover to see effect...</Text>
</Box>
```

### Navigation

**Primary Navigation:**
- Background: Navy Blue (`#1a365d`)
- Text: White
- Active state: Light Blue (`#3182ce`)
- Hover: Light Blue with 10% opacity

**Secondary Navigation:**
- Background: White
- Text: Gray Blue (`#4a5568`)
- Active state: Navy Blue
- Hover: Light Gray (`#f7fafc`)

## Layout Guidelines

### Grid System
- **Container Max Width:** 1200px
- **Gutters:** 24px (1.5rem)
- **Columns:** 12-column grid system
- **Breakpoints:**
  - Mobile: 320px - 768px
  - Tablet: 768px - 1024px
  - Desktop: 1024px+

### Section Spacing
- **Section Padding:** 64px (4rem) top/bottom
- **Component Spacing:** 32px (2rem) between major sections
- **Element Spacing:** 16px (1rem) between related elements

## Accessibility Guidelines

### WCAG 2.1 AA Compliance

**Color Contrast:**
- Normal text: 4.5:1 minimum contrast ratio
- Large text: 3:1 minimum contrast ratio
- UI components: 3:1 minimum contrast ratio

**Focus Indicators:**
- All interactive elements must have visible focus indicators
- Focus ring color: Light Blue (`#3182ce`)
- Focus ring width: 2px

**Keyboard Navigation:**
- All interactive elements must be keyboard accessible
- Logical tab order
- Skip links for main content

**Screen Reader Support:**
- Semantic HTML structure
- ARIA labels where necessary
- Alt text for images
- Form labels properly associated

### Responsive Design

**Mobile First Approach:**
- Design for mobile (320px) first
- Progressive enhancement for larger screens
- Touch-friendly targets (minimum 44px)

**Breakpoint Strategy:**
```tsx
// Mobile: 320px - 768px
// Tablet: 768px - 1024px  
// Desktop: 1024px+
```

## Animation Guidelines

### Transitions
- **Duration:** 200ms for micro-interactions
- **Easing:** `ease-in-out` for smooth transitions
- **Hover Effects:** Subtle scale (1.02) and shadow changes

### Loading States
- **Skeleton Loading:** For content-heavy pages
- **Spinner:** For form submissions and data fetching
- **Progress Indicators:** For multi-step processes

## Content Guidelines

### Writing Style
- Clear, concise, and professional
- Use active voice
- Avoid jargon when possible
- Include clear calls-to-action

### Image Guidelines
- **Hero Images:** 1920x1080px (16:9 ratio)
- **Card Images:** 400x300px (4:3 ratio)
- **Avatar Images:** 150x150px (1:1 ratio)
- **Format:** WebP with JPEG fallback
- **Optimization:** Compress for web

## Implementation Notes

### Chakra UI Integration
The design system is built on Chakra UI for consistency and accessibility. Key customizations:

```tsx
// Theme extension for SATRF colors
const satrfTheme = extendTheme({
  colors: {
    satrf: {
      navy: '#1a365d',
      red: '#e53e3e',
      lightBlue: '#3182ce',
      grayBlue: '#4a5568',
    }
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'blue',
      },
    },
  },
});
```

### CSS Custom Properties
Use CSS custom properties for consistent theming:

```css
:root {
  --satrf-navy: #1a365d;
  --satrf-red: #e53e3e;
  --satrf-light-blue: #3182ce;
}
```

This design system ensures consistency, accessibility, and maintainability across the SATRF website while reflecting the organization's professional identity and commitment to excellence in target rifle shooting. 