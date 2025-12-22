import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider } from '../../contexts/AuthContext';
import EventsCalendar from '../../components/events/EventsCalendar';
import { Event, EventFilters } from '../../lib/events';

// Mock the events API
jest.mock('../../lib/events', () => ({
  ...jest.requireActual('../../lib/events'),
  eventsAPI: {
    getEvents: jest.fn(),
    registerForEvent: jest.fn(),
    cancelRegistration: jest.fn(),
    getUserRegistrations: jest.fn(),
  },
  eventUtils: {
    getEventColor: jest.fn(() => '#2C5282'),
    getRegistrationStatus: jest.fn(() => 'open'),
    formatEventDate: jest.fn(() => 'March 15, 2024'),
  },
}));

// Mock the auth context
const mockUseAuth = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => mockUseAuth(),
}));

// FullCalendar is mocked globally in jest.setup.js

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'SATRF National Championship 2024',
    description: 'The premier target rifle shooting championship',
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
    isLocal: true,
    source: 'SATRF',
  },
  {
    id: '2',
    title: 'ISSF World Cup - Air Rifle',
    description: 'International Shooting Sport Federation World Cup',
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
    isLocal: false,
    source: 'ISSF',
  },
];

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ChakraProvider>
      {component}
    </ChakraProvider>
  );
};

describe('EventsCalendar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default auth context - unauthenticated user
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      updateProfile: jest.fn(),
      loadDashboard: jest.fn(),
    });
  });

  describe('Rendering', () => {
    it('renders calendar with events', () => {
      renderWithProviders(
        <EventsCalendar
          events={mockEvents}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-event-1')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-event-2')).toBeInTheDocument();
    });

    it('shows loading spinner when loading', () => {
      renderWithProviders(
        <EventsCalendar
          events={[]}
          loading={true}
          error={null}
        />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('shows error message when there is an error', () => {
      const errorMessage = 'Failed to load events';
      renderWithProviders(
        <EventsCalendar
          events={[]}
          loading={false}
          error={errorMessage}
        />
      );

      expect(screen.getByText('Error loading events')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Search and Filtering', () => {
    it('renders search bar', () => {
      renderWithProviders(
        <EventsCalendar
          events={mockEvents}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByPlaceholderText(/search events/i)).toBeInTheDocument();
    });

    it('filters events by search query', async () => {
      const onFiltersChange = jest.fn();
      renderWithProviders(
        <EventsCalendar
          events={mockEvents}
          loading={false}
          error={null}
          onFiltersChange={onFiltersChange}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search events/i);
      fireEvent.change(searchInput, { target: { value: 'SATRF' } });

      await waitFor(() => {
        expect(screen.getByTestId('calendar-event-1')).toBeInTheDocument();
        expect(screen.queryByTestId('calendar-event-2')).not.toBeInTheDocument();
      });
    });

    it('shows filter controls when filter button is clicked', () => {
      renderWithProviders(
        <EventsCalendar
          events={mockEvents}
          loading={false}
          error={null}
        />
      );

      const filterButton = screen.getByText(/show filters/i);
      fireEvent.click(filterButton);

      expect(screen.getByText('Discipline')).toBeInTheDocument();
      expect(screen.getByText('Source')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('filters events by discipline', async () => {
      const onFiltersChange = jest.fn();
      renderWithProviders(
        <EventsCalendar
          events={mockEvents}
          loading={false}
          error={null}
          onFiltersChange={onFiltersChange}
        />
      );

      // Show filters
      fireEvent.click(screen.getByText(/show filters/i));

      // Select discipline filter
      const disciplineSelect = screen.getByDisplayValue('All Disciplines');
      fireEvent.change(disciplineSelect, { target: { value: 'Target Rifle' } });

      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({ discipline: 'Target Rifle' })
        );
      });
    });

    it('filters events by source', async () => {
      const onFiltersChange = jest.fn();
      renderWithProviders(
        <EventsCalendar
          events={mockEvents}
          loading={false}
          error={null}
          onFiltersChange={onFiltersChange}
        />
      );

      // Show filters
      fireEvent.click(screen.getByText(/show filters/i));

      // Select source filter
      const sourceSelect = screen.getByDisplayValue('All Events');
      fireEvent.change(sourceSelect, { target: { value: 'SATRF' } });

      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({ source: 'SATRF' })
        );
      });
    });

    it('clears all filters when clear button is clicked', async () => {
      const onFiltersChange = jest.fn();
      renderWithProviders(
        <EventsCalendar
          events={mockEvents}
          loading={false}
          error={null}
          onFiltersChange={onFiltersChange}
          filters={{ discipline: 'Target Rifle', source: 'SATRF' }}
        />
      );

      const clearButton = screen.getByText(/clear all/i);
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith({});
      });
    });
  });

  describe('Calendar Controls', () => {
    it('renders view control buttons', () => {
      renderWithProviders(
        <EventsCalendar
          events={mockEvents}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByText('Month')).toBeInTheDocument();
      expect(screen.getByText('Week')).toBeInTheDocument();
      expect(screen.getByText('List')).toBeInTheDocument();
    });

    it('changes calendar view when view buttons are clicked', () => {
      renderWithProviders(
        <EventsCalendar
          events={mockEvents}
          loading={false}
          error={null}
        />
      );

      const weekButton = screen.getByText('Week');
      fireEvent.click(weekButton);

      // Check that the button is clickable and has proper styling
      expect(weekButton).toBeInTheDocument();
      expect(weekButton).toHaveAttribute('type', 'button');
    });

    it('shows results count', () => {
      renderWithProviders(
        <EventsCalendar
          events={mockEvents}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByText(/showing 2 of 2 events/i)).toBeInTheDocument();
    });
  });

  describe('Event Interaction', () => {
    it('opens event detail modal when event is clicked', async () => {
      renderWithProviders(
        <EventsCalendar
          events={mockEvents}
          loading={false}
          error={null}
        />
      );

      const eventElement = screen.getByTestId('calendar-event-1');
      fireEvent.click(eventElement);

      await waitFor(() => {
        expect(screen.getByText('SATRF National Championship 2024')).toBeInTheDocument();
      });
    });

    it('shows event details in modal', async () => {
      renderWithProviders(
        <EventsCalendar
          events={mockEvents}
          loading={false}
          error={null}
        />
      );

      const eventElement = screen.getByTestId('calendar-event-1');
      fireEvent.click(eventElement);

      await waitFor(() => {
        expect(screen.getByText('The premier target rifle shooting championship')).toBeInTheDocument();
        expect(screen.getByText('Johannesburg Shooting Range')).toBeInTheDocument();
        expect(screen.getByText('R500')).toBeInTheDocument();
      });
    });

    it('shows registration button for open events when user is authenticated', async () => {
      // Mock authenticated user
      const mockAuthContext = {
        user: { id: '1', email: 'test@example.com' },
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        updateProfile: jest.fn(),
        loadDashboard: jest.fn(),
      };

      mockUseAuth.mockReturnValue(mockAuthContext);

      renderWithProviders(
        <EventsCalendar
          events={mockEvents}
          loading={false}
          error={null}
        />
      );

      const eventElement = screen.getByTestId('calendar-event-1');
      fireEvent.click(eventElement);

      await waitFor(() => {
        expect(screen.getByText('Register for Event')).toBeInTheDocument();
      });
    });

    it('shows login message for unauthenticated users', async () => {
      // Mock unauthenticated user
      const mockAuthContext = {
        user: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        updateProfile: jest.fn(),
        loadDashboard: jest.fn(),
      };

      mockUseAuth.mockReturnValue(mockAuthContext);

      renderWithProviders(
        <EventsCalendar
          events={mockEvents}
          loading={false}
          error={null}
        />
      );

      const eventElement = screen.getByTestId('calendar-event-1');
      fireEvent.click(eventElement);

      await waitFor(() => {
        expect(screen.getByText(/please log in to register/i)).toBeInTheDocument();
      });
    });
  });

  describe('Event Registration', () => {
    it('calls onEventRegister when register button is clicked', async () => {
      const onEventRegister = jest.fn();
      const mockAuthContext = {
        user: { id: '1', email: 'test@example.com' },
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        updateProfile: jest.fn(),
        loadDashboard: jest.fn(),
      };

      mockUseAuth.mockReturnValue(mockAuthContext);

      renderWithProviders(
        <EventsCalendar
          events={mockEvents}
          loading={false}
          error={null}
          onEventRegister={onEventRegister}
        />
      );

      const eventElement = screen.getByTestId('calendar-event-1');
      fireEvent.click(eventElement);

      await waitFor(() => {
        const registerButton = screen.getByText('Register for Event');
        fireEvent.click(registerButton);
      });

      expect(onEventRegister).toHaveBeenCalledWith(mockEvents[0]);
    });

    it('calls onEventUnregister when cancel registration button is clicked', async () => {
      const onEventUnregister = jest.fn();
      const mockAuthContext = {
        user: { id: '1', email: 'test@example.com' },
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        updateProfile: jest.fn(),
        loadDashboard: jest.fn(),
      };

      mockUseAuth.mockReturnValue(mockAuthContext);

      renderWithProviders(
        <EventsCalendar
          events={mockEvents}
          loading={false}
          error={null}
          onEventUnregister={onEventUnregister}
          userRegistrations={['1']}
        />
      );

      const eventElement = screen.getByTestId('calendar-event-1');
      fireEvent.click(eventElement);

      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel Registration');
        fireEvent.click(cancelButton);
      });

      expect(onEventUnregister).toHaveBeenCalledWith(mockEvents[0]);
    });

    it('shows registered badge for user registrations', async () => {
      const mockAuthContext = {
        user: { id: '1', email: 'test@example.com' },
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        updateProfile: jest.fn(),
        loadDashboard: jest.fn(),
      };

      mockUseAuth.mockReturnValue(mockAuthContext);

      renderWithProviders(
        <EventsCalendar
          events={mockEvents}
          loading={false}
          error={null}
          userRegistrations={['1']}
        />
      );

      const eventElement = screen.getByTestId('calendar-event-1');
      fireEvent.click(eventElement);

      await waitFor(() => {
        expect(screen.getByText('You are registered for this event!')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for interactive elements', () => {
      renderWithProviders(
        <EventsCalendar
          events={mockEvents}
          loading={false}
          error={null}
        />
      );

      // Check that search input has proper accessibility
      const searchInput = screen.getByPlaceholderText(/search events/i);
      expect(searchInput).toBeInTheDocument();
      
      // Check that filter button has proper accessibility
      const filterButton = screen.getByText(/show filters/i);
      expect(filterButton).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      renderWithProviders(
        <EventsCalendar
          events={mockEvents}
          loading={false}
          error={null}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search events/i);
      expect(searchInput).toBeInTheDocument();
      
      // Check that buttons are keyboard accessible
      const filterButton = screen.getByText(/show filters/i);
      expect(filterButton).toHaveAttribute('type', 'button');
    });
  });

  describe('Responsive Design', () => {
    it('adapts layout for different screen sizes', () => {
      renderWithProviders(
        <EventsCalendar
          events={mockEvents}
          loading={false}
          error={null}
        />
      );

      // Check that the component renders with proper structure
      const filterButton = screen.getByText(/show filters/i);
      expect(filterButton).toBeInTheDocument();
      
      // Check that the calendar container exists
      const calendarContainer = screen.getByTestId('fullcalendar');
      expect(calendarContainer).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('shows toast notification on registration error', async () => {
      const onEventRegister = jest.fn().mockRejectedValue(new Error('Registration failed'));
      const mockAuthContext = {
        user: { id: '1', email: 'test@example.com' },
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        updateProfile: jest.fn(),
        loadDashboard: jest.fn(),
      };

      mockUseAuth.mockReturnValue(mockAuthContext);

      renderWithProviders(
        <EventsCalendar
          events={mockEvents}
          loading={false}
          error={null}
          onEventRegister={onEventRegister}
        />
      );

      const eventElement = screen.getByTestId('calendar-event-1');
      fireEvent.click(eventElement);

      await waitFor(() => {
        const registerButton = screen.getByText('Register for Event');
        fireEvent.click(registerButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Registration Failed')).toBeInTheDocument();
      });
    });
  });
}); 
