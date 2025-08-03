# Olympic Countdown Component

A dynamic React countdown component featuring the iconic Olympic rings with real-time countdown to the 2028 Olympics. Perfect for the SATRF website hero section.

## Features

- **Olympic Rings Design**: Five official Olympic rings in their authentic colors (blue, yellow, black, green, red)
- **Dynamic Countdown**: Real-time countdown displaying days, hours, minutes, and seconds
- **Responsive Design**: Scales gracefully across all device sizes
- **Accessibility**: Semantic HTML with proper ARIA labels
- **Smooth Animations**: Fade and slide animations for enhanced user experience
- **Customizable**: Optional fifth ring for branding or custom content
- **Production Ready**: Well-commented, TypeScript-based component

## Olympic Ring Colors

The component uses the official Olympic ring colors:
- **Blue**: `#0066CC`
- **Yellow**: `#FFD700` 
- **Black**: `#000000`
- **Green**: `#009B3A`
- **Red**: `#CE1126`

## Usage

### Basic Implementation

```tsx
import OlympicCountdown from './components/OlympicCountdown';

function HeroSection() {
  return (
    <div>
      <OlympicCountdown />
    </div>
  );
}
```

### With Fifth Ring and Custom Content

```tsx
import OlympicCountdown from './components/OlympicCountdown';
import Image from 'next/image';

function HeroSection() {
  return (
    <div>
      <OlympicCountdown 
        showFifthRing={true}
        fifthRingContent={
          <div className="w-8 h-8 relative">
            <Image
              src="/SATRFLOGO.png"
              alt="SATRF Logo"
              fill
              className="object-contain"
            />
          </div>
        }
      />
    </div>
  );
}
```

### With South African Flag

```tsx
<OlympicCountdown 
  showFifthRing={true}
  fifthRingContent={
    <div className="text-white text-lg font-bold">
      🇿🇦
    </div>
  }
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showFifthRing` | `boolean` | `false` | Whether to display the fifth Olympic ring |
| `fifthRingContent` | `React.ReactNode` | `undefined` | Custom content to display inside the fifth ring |

## Component Structure

### Olympic Rings Layout
- **Ring 1 (Blue)**: Days countdown
- **Ring 2 (Yellow)**: Hours countdown  
- **Ring 3 (Black)**: Minutes countdown
- **Ring 4 (Green)**: Seconds countdown
- **Ring 5 (Red)**: Optional - can be blank or contain custom content

### Visual Elements
- **Background**: Midnight steel blue (`#0b1e2f`)
- **Ring Labels**: Positioned below each ring
- **Caption**: Olympic Games information and call-to-action
- **Animations**: Smooth transitions and fade effects

## Technical Implementation

### Countdown Logic
- Calculates time remaining until July 21, 2028 (Olympic Games start)
- Updates every second using `setInterval`
- Handles timezone conversion (UTC+2 for South Africa)
- Gracefully handles when countdown reaches zero

### SVG Rendering
- Uses SVG for crisp, scalable Olympic rings
- Responsive viewBox that adapts to container size
- Proper accessibility attributes
- Drop shadows for visual depth

### Styling
- Tailwind CSS classes for consistent design
- Custom animations defined in `tailwind.config.js`
- Responsive breakpoints for mobile, tablet, and desktop
- Font family: Oxanium for countdown numbers

## Accessibility Features

- **ARIA Labels**: Descriptive labels for screen readers
- **Semantic HTML**: Proper heading structure and landmarks
- **Keyboard Navigation**: Focusable elements with proper tab order
- **Color Contrast**: High contrast text for readability
- **Screen Reader Support**: Clear, descriptive text content

## Responsive Behavior

### Mobile (< 640px)
- Compact ring layout
- Smaller font sizes
- Reduced spacing between elements

### Tablet (640px - 1024px)
- Medium-sized rings
- Balanced spacing
- Optimized text sizing

### Desktop (> 1024px)
- Full-size rings
- Maximum spacing
- Large, bold typography

## Animation Details

### Fade In Animation
```css
@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
```

### Slide Up Animation
```css
@keyframes slideUp {
  0% { transform: translateY(10px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
```

### Number Transitions
- Smooth 300ms transitions when countdown numbers update
- Ease-in-out timing function for natural feel

## Integration with SATRF Website

### Hero Section Integration
The component is designed to integrate seamlessly with the SATRF website hero section:

```tsx
// pages/index.tsx
import OlympicCountdown from '../components/OlympicCountdown';

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <OlympicCountdown />
      {/* Other sections */}
    </div>
  );
}
```

### Styling Consistency
- Uses SATRF brand colors from `tailwind.config.js`
- Consistent with existing design system
- Matches typography and spacing patterns

## Performance Considerations

- **Efficient Updates**: Only re-renders when countdown values change
- **Memory Management**: Proper cleanup of intervals on component unmount
- **Optimized SVG**: Minimal DOM elements for smooth rendering
- **Lazy Loading**: Component can be lazy-loaded if needed

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **SVG Support**: Full SVG rendering capabilities required
- **CSS Grid/Flexbox**: Modern layout features utilized
- **ES6+ Features**: Arrow functions, destructuring, template literals

## Testing

### Manual Testing Checklist
- [ ] Countdown updates every second
- [ ] Numbers are clearly visible inside rings
- [ ] Responsive behavior on different screen sizes
- [ ] Accessibility features work with screen readers
- [ ] Animations are smooth and not jarring
- [ ] Fifth ring customization works correctly

### Automated Testing
```tsx
// Example test structure
describe('OlympicCountdown', () => {
  it('displays countdown numbers in rings', () => {
    // Test implementation
  });
  
  it('updates countdown every second', () => {
    // Test implementation
  });
  
  it('handles fifth ring customization', () => {
    // Test implementation
  });
});
```

## Future Enhancements

### Potential Improvements
- **Sound Effects**: Optional audio cues for countdown milestones
- **Multiple Events**: Support for different Olympic events
- **Localization**: Multi-language support for international users
- **Advanced Animations**: More sophisticated ring animations
- **Social Sharing**: Share countdown on social media platforms

### Customization Options
- **Color Themes**: Alternative color schemes
- **Ring Sizes**: Adjustable ring dimensions
- **Animation Speed**: Configurable animation timing
- **Background Options**: Different background styles

## Support and Maintenance

### Code Quality
- TypeScript for type safety
- ESLint configuration for code consistency
- Prettier for code formatting
- Comprehensive comments for maintainability

### Documentation
- Inline code comments
- JSDoc style documentation
- Usage examples and demos
- Integration guidelines

---

**Created for SATRF Website**  
*Supporting South African Target Shooting Federation* 