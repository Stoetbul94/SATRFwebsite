#!/usr/bin/env node

/**
 * SATRF Events Calendar Testing Setup Script
 * 
 * This script helps set up and test the integrated calendar system by:
 * - Generating sample event data
 * - Creating API test examples
 * - Setting up environment variables
 * - Providing testing instructions
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

function logSubsection(title) {
  console.log('\n' + '-'.repeat(40));
  log(title, 'cyan');
  console.log('-'.repeat(40));
}

// Sample event data for testing
const sampleEvents = [
  {
    id: 'test-1',
    title: 'SATRF National Championship 2024',
    description: 'The premier target rifle shooting championship of the year. This three-day event features multiple disciplines and categories.',
    start: '2024-03-15T08:00:00Z',
    end: '2024-03-17T18:00:00Z',
    location: 'Johannesburg Shooting Range',
    category: 'Senior',
    discipline: 'Target Rifle',
    price: 500,
    maxSpots: 50,
    currentSpots: 35,
    status: 'OPEN',
    registrationDeadline: '2024-03-01T23:59:59Z',
    image: '/images/events/national-championship.jpg',
    requirements: ['Valid shooting license', 'Minimum 6 months experience', 'Own equipment'],
    schedule: [
      'Day 1: Registration and Practice (8:00 AM - 5:00 PM)',
      'Day 2: Qualification Rounds (7:00 AM - 6:00 PM)',
      'Day 3: Finals and Awards (8:00 AM - 4:00 PM)'
    ],
    contactInfo: {
      name: 'John Smith',
      email: 'john.smith@satrf.org.za',
      phone: '+27 11 123 4567'
    },
    isLocal: true,
    source: 'SATRF',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'test-2',
    title: 'ISSF World Cup - Air Rifle',
    description: 'International Shooting Sport Federation World Cup event for Air Rifle discipline. Top international shooters will compete for world ranking points.',
    start: '2024-04-20T09:00:00Z',
    end: '2024-04-25T17:00:00Z',
    location: 'Munich, Germany',
    category: 'International',
    discipline: 'Air Rifle',
    price: 0,
    maxSpots: 200,
    currentSpots: 150,
    status: 'OPEN',
    registrationDeadline: '2024-04-15T23:59:59Z',
    image: '/images/events/issf-world-cup.jpg',
    requirements: ['Valid passport', 'ISSF membership'],
    schedule: [
      'Day 1-2: Training and Equipment Check',
      'Day 3-4: Qualification Rounds',
      'Day 5: Finals and Medal Ceremony'
    ],
    contactInfo: {
      name: 'ISSF Secretariat',
      email: 'info@issf-sports.org',
      phone: '+49 89 544 355 0'
    },
    isLocal: false,
    source: 'ISSF',
    createdAt: '2024-01-10T14:00:00Z',
    updatedAt: '2024-01-10T14:00:00Z'
  },
  {
    id: 'test-3',
    title: 'SATRF Junior Development Camp',
    description: 'A comprehensive training camp designed for junior shooters to develop their skills and prepare for competitive shooting.',
    start: '2024-05-10T08:00:00Z',
    end: '2024-05-12T16:00:00Z',
    location: 'Cape Town Shooting Club',
    category: 'Junior',
    discipline: '3P',
    price: 300,
    maxSpots: 30,
    currentSpots: 25,
    status: 'OPEN',
    registrationDeadline: '2024-05-01T23:59:59Z',
    image: '/images/events/junior-camp.jpg',
    requirements: ['Age 12-18', 'Basic shooting experience', 'Parental consent'],
    schedule: [
      'Day 1: Fundamentals and Safety',
      'Day 2: Advanced Techniques',
      'Day 3: Competition Practice'
    ],
    contactInfo: {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@satrf.org.za',
      phone: '+27 21 987 6543'
    },
    isLocal: true,
    source: 'SATRF',
    createdAt: '2024-01-20T09:00:00Z',
    updatedAt: '2024-01-20T09:00:00Z'
  }
];

// API test examples
const apiExamples = {
  getEvents: {
    description: 'Get all events with optional filters',
    examples: [
      {
        name: 'Get all events',
        curl: 'curl -X GET "http://localhost:8000/api/v1/events"',
        response: {
          events: sampleEvents,
          total: 3,
          page: 1,
          limit: 20,
          hasMore: false
        }
      },
      {
        name: 'Get events with filters',
        curl: 'curl -X GET "http://localhost:8000/api/v1/events?discipline=Target%20Rifle&source=SATRF&status=OPEN"',
        response: {
          events: [sampleEvents[0]],
          total: 1,
          page: 1,
          limit: 20,
          hasMore: false
        }
      },
      {
        name: 'Get events with pagination',
        curl: 'curl -X GET "http://localhost:8000/api/v1/events?page=1&limit=10"',
        response: {
          events: sampleEvents.slice(0, 10),
          total: 3,
          page: 1,
          limit: 10,
          hasMore: false
        }
      }
    ]
  },
  registerForEvent: {
    description: 'Register for an event (requires authentication)',
    examples: [
      {
        name: 'Register for event',
        curl: 'curl -X POST "http://localhost:8000/api/v1/events/test-1/register" \\\n  -H "Authorization: Bearer YOUR_JWT_TOKEN"',
        response: {
          id: 'reg-123',
          eventId: 'test-1',
          userId: 'user-456',
          status: 'REGISTERED',
          registeredAt: '2024-01-25T10:30:00Z',
          paymentStatus: 'PENDING'
        }
      }
    ]
  },
  getUserRegistrations: {
    description: 'Get user registrations (requires authentication)',
    examples: [
      {
        name: 'Get user registrations',
        curl: 'curl -X GET "http://localhost:8000/api/v1/events/registrations" \\\n  -H "Authorization: Bearer YOUR_JWT_TOKEN"',
        response: [
          {
            id: 'reg-123',
            eventId: 'test-1',
            userId: 'user-456',
            status: 'REGISTERED',
            registeredAt: '2024-01-25T10:30:00Z',
            paymentStatus: 'PENDING'
          }
        ]
      }
    ]
  }
};

// Environment setup
const envTemplate = `# SATRF Events Calendar Environment Variables
# Copy this to .env.local and update with your values

# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_API_VERSION=v1

# Development Settings
NODE_ENV=development
NEXT_PUBLIC_DEBUG=true

# Optional: Override for testing
# NEXT_PUBLIC_USE_MOCK_DATA=true
`;

// Testing checklist
const testingChecklist = [
  'Backend API is running on http://localhost:8000',
  'Environment variables are configured in .env.local',
  'Frontend dependencies are installed',
  'Authentication system is working',
  'Calendar component renders correctly',
  'Events are displayed in calendar',
  'Filtering works for all filter types',
  'Search functionality works',
  'Event registration works for authenticated users',
  'Event cancellation works',
  'Modal displays event details correctly',
  'Responsive design works on mobile',
  'Accessibility features are working',
  'Error handling displays appropriate messages',
  'Loading states are shown correctly'
];

function createSampleData() {
  logSubsection('Creating Sample Event Data');
  
  const sampleDataPath = path.join(__dirname, '..', 'src', 'lib', 'sample-events.json');
  
  try {
    fs.writeFileSync(sampleDataPath, JSON.stringify(sampleEvents, null, 2));
    log(`✓ Sample event data created: ${sampleDataPath}`, 'green');
  } catch (error) {
    log(`✗ Failed to create sample data: ${error.message}`, 'red');
  }
}

function createApiExamples() {
  logSubsection('Creating API Examples');
  
  const examplesPath = path.join(__dirname, '..', 'docs', 'api-examples.md');
  
  let content = '# SATRF Events Calendar API Examples\n\n';
  
  Object.entries(apiExamples).forEach(([endpoint, data]) => {
    content += `## ${endpoint}\n\n`;
    content += `${data.description}\n\n`;
    
    data.examples.forEach((example, index) => {
      content += `### Example ${index + 1}: ${example.name}\n\n`;
      content += '**cURL Command:**\n';
      content += '```bash\n';
      content += example.curl;
      content += '\n```\n\n';
      content += '**Response:**\n';
      content += '```json\n';
      content += JSON.stringify(example.response, null, 2);
      content += '\n```\n\n';
    });
  });
  
  try {
    // Ensure docs directory exists
    const docsDir = path.dirname(examplesPath);
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    
    fs.writeFileSync(examplesPath, content);
    log(`✓ API examples created: ${examplesPath}`, 'green');
  } catch (error) {
    log(`✗ Failed to create API examples: ${error.message}`, 'red');
  }
}

function createEnvFile() {
  logSubsection('Creating Environment Template');
  
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (fs.existsSync(envPath)) {
    log('⚠ .env.local already exists, skipping creation', 'yellow');
    return;
  }
  
  try {
    fs.writeFileSync(envPath, envTemplate);
    log(`✓ Environment template created: ${envPath}`, 'green');
    log('Please update the values in .env.local with your configuration', 'blue');
  } catch (error) {
    log(`✗ Failed to create environment file: ${error.message}`, 'red');
  }
}

function displayTestingInstructions() {
  logSubsection('Testing Instructions');
  
  log('1. Start the backend API:', 'bright');
  log('   cd backend && python -m uvicorn app.main:app --reload', 'blue');
  
  log('\n2. Start the frontend development server:', 'bright');
  log('   npm run dev', 'blue');
  
  log('\n3. Open the calendar page:', 'bright');
  log('   http://localhost:3000/events/calendar', 'blue');
  
  log('\n4. Test the following features:', 'bright');
  testingChecklist.forEach((item, index) => {
    log(`   ${index + 1}. ${item}`, 'blue');
  });
  
  log('\n5. API Testing:', 'bright');
  log('   - Use the API examples in docs/api-examples.md', 'blue');
  log('   - Test with Postman or similar tool', 'blue');
  log('   - Verify authentication works correctly', 'blue');
}

function displayTroubleshooting() {
  logSubsection('Troubleshooting');
  
  const troubleshooting = [
    {
      issue: 'Calendar not loading',
      solution: 'Check if backend API is running and accessible'
    },
    {
      issue: 'Events not displaying',
      solution: 'Verify API response format matches expected structure'
    },
    {
      issue: 'Registration not working',
      solution: 'Ensure user is authenticated and JWT token is valid'
    },
    {
      issue: 'Filters not working',
      solution: 'Check if filter parameters are being sent correctly to API'
    },
    {
      issue: 'Styling issues',
      solution: 'Verify Tailwind CSS and custom styles are loaded'
    },
    {
      issue: 'Modal not opening',
      solution: 'Check if FullCalendar event click handler is working'
    }
  ];
  
  troubleshooting.forEach(({ issue, solution }) => {
    log(`• ${issue}:`, 'yellow');
    log(`  ${solution}`, 'blue');
  });
}

function main() {
  logSection('SATRF Events Calendar Testing Setup');
  
  log('This script will help you set up and test the integrated calendar system.', 'blue');
  
  // Create sample data
  createSampleData();
  
  // Create API examples
  createApiExamples();
  
  // Create environment file
  createEnvFile();
  
  // Display instructions
  displayTestingInstructions();
  
  // Display troubleshooting
  displayTroubleshooting();
  
  logSection('Setup Complete');
  log('The calendar testing environment has been set up successfully!', 'green');
  log('Refer to the generated files and follow the testing instructions above.', 'blue');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  sampleEvents,
  apiExamples,
  testingChecklist
}; 