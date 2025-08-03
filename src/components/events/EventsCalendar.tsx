import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { EventClickArg, DateSelectArg, EventApi, EventInput } from '@fullcalendar/core';
import {
  Box,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  VStack,
  HStack,
  Text,
  Badge,
  Divider,
  IconButton,
  Tooltip,
  Select,
  Flex,
  useColorModeValue,
  Alert,
  AlertIcon,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  List,
  ListItem,
  ListIcon,
  Input,
  InputGroup,
  InputLeftElement,
  Checkbox,
  FormControl,
  FormLabel,
  useToast,
} from '@chakra-ui/react';
import { 
  FaCalendar, 
  FaMapMarkerAlt, 
  FaUsers, 
  FaClock, 
  FaInfoCircle, 
  FaRegCalendarAlt,
  FaFilter,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaSearch,
  FaTimes
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { Event, EventFilters, eventUtils } from '../../lib/events';

interface EventsCalendarProps {
  events: Event[];
  onEventRegister?: (event: Event) => void;
  onEventUnregister?: (event: Event) => void;
  loading?: boolean;
  error?: string | null;
  userRegistrations?: string[];
  onFiltersChange?: (filters: EventFilters) => void;
  filters?: EventFilters;
}

const EventsCalendar: React.FC<EventsCalendarProps> = ({
  events,
  onEventRegister,
  onEventUnregister,
  loading = false,
  error = null,
  userRegistrations = [],
  onFiltersChange,
  filters = {}
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [calendarView, setCalendarView] = useState<'dayGridMonth' | 'timeGridWeek' | 'listWeek'>('dayGridMonth');
  const [localFilters, setLocalFilters] = useState<EventFilters>(filters);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  // Color scheme for SATRF branding
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const primaryColor = 'satrf.navy';
  const accentColor = 'satrf.red';

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Filter events based on current filters and search
  const filteredEvents = events.filter(event => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!event.title.toLowerCase().includes(query) && 
          !event.description.toLowerCase().includes(query) &&
          !event.location.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Apply discipline filter
    if (localFilters.discipline && event.discipline !== localFilters.discipline) return false;
    
    // Apply source filter
    if (localFilters.source && localFilters.source !== 'all' && event.source !== localFilters.source) return false;
    
    // Apply status filter
    if (localFilters.status && event.status !== localFilters.status) return false;
    
    // Apply date range filters
    if (localFilters.startDate && new Date(event.start) < new Date(localFilters.startDate)) return false;
    if (localFilters.endDate && new Date(event.end) > new Date(localFilters.endDate)) return false;
    
    // Apply completed events filter
    if (localFilters.showCompleted === false && event.status === 'CLOSED') return false;
    
    return true;
  });

  // Convert events to FullCalendar format
  const calendarEvents: EventInput[] = filteredEvents.map(event => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    backgroundColor: getEventColor(event),
    borderColor: getEventColor(event),
    textColor: 'white',
    extendedProps: {
      event: event
    }
  }));

  function getEventColor(event: Event): string {
    return eventUtils.getEventColor(event);
  }

  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const event = clickInfo.event.extendedProps.event as Event;
    setSelectedEvent(event);
    onOpen();
  }, [onOpen]);

  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    // Future enhancement: Allow creating new events on date selection
    console.log('Date selected:', selectInfo.startStr);
  }, []);

  const handleRegister = async () => {
    if (selectedEvent && onEventRegister) {
      try {
        await onEventRegister(selectedEvent);
        toast({
          title: 'Registration Successful',
          description: `You have been registered for ${selectedEvent.title}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onClose();
      } catch (error) {
        toast({
          title: 'Registration Failed',
          description: 'Failed to register for event. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleUnregister = async () => {
    if (selectedEvent && onEventUnregister) {
      try {
        await onEventUnregister(selectedEvent);
        toast({
          title: 'Registration Cancelled',
          description: `Your registration for ${selectedEvent.title} has been cancelled`,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        onClose();
      } catch (error) {
        toast({
          title: 'Cancellation Failed',
          description: 'Failed to cancel registration. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleFilterChange = (key: keyof EventFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  };

  const clearFilters = () => {
    const clearedFilters: EventFilters = {};
    setLocalFilters(clearedFilters);
    setSearchQuery('');
    if (onFiltersChange) {
      onFiltersChange(clearedFilters);
    }
  };

  const isUserRegistered = (eventId: string) => {
    return userRegistrations.includes(eventId);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'blue';
      case 'FULL': return 'orange';
      case 'CLOSED': return 'gray';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="400px">
        <Spinner size="xl" color={primaryColor} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Error loading events</Text>
          <Text fontSize="sm">{error}</Text>
        </Box>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Search and Filter Controls */}
      <Box
        bg={bgColor}
        p={4}
        mb={4}
        rounded="lg"
        shadow="sm"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <VStack spacing={4} align="stretch">
          {/* Search Bar */}
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <FaSearch color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Search events by title, description, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <IconButton
                aria-label="Clear search"
                icon={<FaTimes />}
                size="sm"
                variant="ghost"
                position="absolute"
                right={2}
                top={1}
                onClick={() => setSearchQuery('')}
              />
            )}
          </InputGroup>

          {/* Filter Toggle */}
          <Flex justify="space-between" align="center">
            <Button
              size="sm"
              variant="outline"
              colorScheme="satrf"
              leftIcon={<FaFilter />}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>

            {(Object.keys(localFilters).length > 0 || searchQuery) && (
              <Button
                size="sm"
                variant="ghost"
                colorScheme="gray"
                onClick={clearFilters}
              >
                Clear All
              </Button>
            )}
          </Flex>

          {/* Filter Controls */}
          {showFilters && (
            <Box
              p={4}
              borderWidth="1px"
              borderColor={borderColor}
              rounded="md"
              bg={useColorModeValue('gray.50', 'gray.700')}
            >
              <Flex direction={{ base: 'column', md: 'row' }} gap={4} wrap="wrap">
                {/* Discipline Filter */}
                <FormControl maxW="200px">
                  <FormLabel fontSize="sm">Discipline</FormLabel>
                  <Select
                    size="sm"
                    value={localFilters.discipline || ''}
                    onChange={(e) => handleFilterChange('discipline', e.target.value || undefined)}
                  >
                    <option value="">All Disciplines</option>
                    <option value="3P">3P</option>
                    <option value="Prone">Prone</option>
                    <option value="Air Rifle">Air Rifle</option>
                    <option value="Air Pistol">Air Pistol</option>
                    <option value="Target Rifle">Target Rifle</option>
                  </Select>
                </FormControl>

                {/* Source Filter */}
                <FormControl maxW="150px">
                  <FormLabel fontSize="sm">Source</FormLabel>
                  <Select
                    size="sm"
                    value={localFilters.source || 'all'}
                    onChange={(e) => handleFilterChange('source', e.target.value)}
                  >
                    <option value="all">All Events</option>
                    <option value="SATRF">SATRF</option>
                    <option value="ISSF">ISSF</option>
                  </Select>
                </FormControl>

                {/* Status Filter */}
                <FormControl maxW="150px">
                  <FormLabel fontSize="sm">Status</FormLabel>
                  <Select
                    size="sm"
                    value={localFilters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  >
                    <option value="">All Status</option>
                    <option value="OPEN">Open</option>
                    <option value="FULL">Full</option>
                    <option value="CLOSED">Closed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </Select>
                </FormControl>

                {/* Date Range Filters */}
                <FormControl maxW="200px">
                  <FormLabel fontSize="sm">Start Date</FormLabel>
                  <Input
                    type="date"
                    size="sm"
                    value={localFilters.startDate || ''}
                    onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
                  />
                </FormControl>

                <FormControl maxW="200px">
                  <FormLabel fontSize="sm">End Date</FormLabel>
                  <Input
                    type="date"
                    size="sm"
                    value={localFilters.endDate || ''}
                    onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
                  />
                </FormControl>

                {/* Show Completed Events */}
                <FormControl maxW="200px">
                  <Checkbox
                    isChecked={localFilters.showCompleted !== false}
                    onChange={(e) => handleFilterChange('showCompleted', e.target.checked)}
                  >
                    <Text fontSize="sm">Show Completed</Text>
                  </Checkbox>
                </FormControl>
              </Flex>
            </Box>
          )}
        </VStack>
      </Box>

      {/* Calendar Controls */}
      <Box
        bg={bgColor}
        p={4}
        mb={4}
        rounded="lg"
        shadow="sm"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <Flex direction={{ base: 'column', md: 'row' }} gap={4} align="center" justify="space-between">
          {/* View Controls */}
          <HStack spacing={2}>
            <Button
              size="sm"
              variant={calendarView === 'dayGridMonth' ? 'solid' : 'outline'}
              colorScheme="satrf"
              onClick={() => setCalendarView('dayGridMonth')}
            >
              Month
            </Button>
            <Button
              size="sm"
              variant={calendarView === 'timeGridWeek' ? 'solid' : 'outline'}
              colorScheme="satrf"
              onClick={() => setCalendarView('timeGridWeek')}
            >
              Week
            </Button>
            <Button
              size="sm"
              variant={calendarView === 'listWeek' ? 'solid' : 'outline'}
              colorScheme="satrf"
              onClick={() => setCalendarView('listWeek')}
            >
              List
            </Button>
          </HStack>

          {/* Results Count */}
          <Text fontSize="sm" color="gray.500">
            Showing {filteredEvents.length} of {events.length} events
          </Text>
        </Flex>
      </Box>

      {/* Calendar */}
      <Box
        bg={bgColor}
        p={4}
        rounded="lg"
        shadow="sm"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          headerToolbar={false} // We're using custom controls
          initialView={calendarView}
          views={{
            dayGridMonth: {
              titleFormat: { year: 'numeric', month: 'long' }
            },
            timeGridWeek: {
              titleFormat: { year: 'numeric', month: 'short', day: 'numeric' }
            },
            listWeek: {
              titleFormat: { year: 'numeric', month: 'long', day: 'numeric' }
            }
          }}
          events={calendarEvents}
          eventClick={handleEventClick}
          select={handleDateSelect}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          height="auto"
          eventDisplay="block"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: 'short'
          }}
        />
      </Box>

      {/* Event Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <FaCalendar color="#2C5282" />
              <Text>{selectedEvent?.title}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedEvent && (
              <VStack align="stretch" spacing={4}>
                {/* Event Status and Source */}
                <HStack justify="space-between">
                  <Badge colorScheme={getStatusBadgeColor(selectedEvent.status)}>
                    {selectedEvent.status}
                  </Badge>
                  <Badge colorScheme={selectedEvent.source === 'ISSF' ? 'blue' : 'satrf'}>
                    {selectedEvent.source}
                  </Badge>
                </HStack>

                {/* Event Details */}
                <Tabs variant="enclosed">
                  <TabList>
                    <Tab>Details</Tab>
                    <Tab>Schedule</Tab>
                    <Tab>Registration</Tab>
                  </TabList>

                  <TabPanels>
                    {/* Details Tab */}
                    <TabPanel>
                      <VStack align="stretch" spacing={3}>
                        <Text>{selectedEvent.description}</Text>
                        
                        <HStack>
                          <FaMapMarkerAlt color="#2C5282" />
                          <Text fontWeight="medium">{selectedEvent.location}</Text>
                        </HStack>

                        <HStack>
                          <FaRegCalendarAlt color="#2C5282" />
                          <Text>
                            {formatDate(selectedEvent.start)} - {formatDate(selectedEvent.end)}
                          </Text>
                        </HStack>

                        <HStack>
                          <FaClock color="#2C5282" />
                          <Text>
                            {formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)}
                          </Text>
                        </HStack>

                        <HStack>
                          <FaUsers color="#2C5282" />
                          <Text>
                            {selectedEvent.currentSpots}/{selectedEvent.maxSpots} spots filled
                          </Text>
                        </HStack>

                        <Text fontWeight="medium" color={primaryColor}>
                          R{selectedEvent.price}
                        </Text>

                        {selectedEvent.requirements && selectedEvent.requirements.length > 0 && (
                          <Box>
                            <Text fontWeight="medium" mb={2}>Requirements:</Text>
                            <List spacing={1}>
                              {selectedEvent.requirements.map((req, index) => (
                                <ListItem key={index}>
                                  <ListIcon as={FaCheckCircle} color="green.500" />
                                  {req}
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}

                        {selectedEvent.contactInfo && (
                          <Box>
                            <Text fontWeight="medium" mb={2}>Contact Information:</Text>
                            <Text>{selectedEvent.contactInfo.name}</Text>
                            <Text>{selectedEvent.contactInfo.email}</Text>
                            <Text>{selectedEvent.contactInfo.phone}</Text>
                          </Box>
                        )}
                      </VStack>
                    </TabPanel>

                    {/* Schedule Tab */}
                    <TabPanel>
                      {selectedEvent.schedule && selectedEvent.schedule.length > 0 ? (
                        <List spacing={3}>
                          {selectedEvent.schedule.map((item, index) => (
                            <ListItem key={index}>
                              <ListIcon as={FaClock} color="#2C5282" />
                              {item}
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Text color="gray.500">Schedule details not available</Text>
                      )}
                    </TabPanel>

                    {/* Registration Tab */}
                    <TabPanel>
                      <VStack align="stretch" spacing={4}>
                        <Box>
                          <Text fontWeight="medium" mb={2}>Registration Status:</Text>
                          <Badge 
                            colorScheme={eventUtils.getRegistrationStatus(selectedEvent) === 'open' ? 'green' : 'red'}
                            size="lg"
                          >
                            {eventUtils.getRegistrationStatus(selectedEvent).toUpperCase()}
                          </Badge>
                        </Box>

                        <Box>
                          <Text fontWeight="medium" mb={2}>Registration Deadline:</Text>
                          <Text>{formatDate(selectedEvent.registrationDeadline)}</Text>
                        </Box>

                        <Box>
                          <Text fontWeight="medium" mb={2}>Available Spots:</Text>
                          <Text>{selectedEvent.maxSpots - selectedEvent.currentSpots} remaining</Text>
                        </Box>

                        {eventUtils.getRegistrationStatus(selectedEvent) === 'open' && isAuthenticated && !isUserRegistered(selectedEvent.id) && (
                          <Button
                            colorScheme="satrf"
                            size="lg"
                            onClick={handleRegister}
                            leftIcon={<FaCheckCircle />}
                          >
                            Register for Event
                          </Button>
                        )}

                        {isUserRegistered(selectedEvent.id) && (
                          <VStack spacing={3}>
                            <Alert status="success">
                              <AlertIcon />
                              <Text>You are registered for this event!</Text>
                            </Alert>
                            <Button
                              colorScheme="red"
                              variant="outline"
                              onClick={handleUnregister}
                              leftIcon={<FaTimesCircle />}
                            >
                              Cancel Registration
                            </Button>
                          </VStack>
                        )}

                        {!isAuthenticated && (
                          <Alert status="info">
                            <AlertIcon />
                            <Text>Please log in to register for this event</Text>
                          </Alert>
                        )}

                        {eventUtils.getRegistrationStatus(selectedEvent) === 'closed' && (
                          <Alert status="warning">
                            <AlertIcon />
                            <Text>Registration for this event has closed</Text>
                          </Alert>
                        )}

                        {eventUtils.getRegistrationStatus(selectedEvent) === 'full' && (
                          <Alert status="warning">
                            <AlertIcon />
                            <Text>This event is full. You can join the waitlist.</Text>
                          </Alert>
                        )}
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default EventsCalendar; 