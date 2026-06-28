import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  HStack,
  useToast,
  Badge,
  IconButton,
  useColorModeValue,
  Spinner,
  Center,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  VStack,
  FormErrorMessage,
  FormHelperText,
  Progress,
  Checkbox,
  CheckboxGroup,
  Stack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import {
  EVENT_DISCIPLINE_OPTIONS,
  disciplinesToLegacyType,
  parseEventDisciplines,
} from '@/lib/eventDisciplines';
import type { Discipline } from '@/types/scores';
import { FiEdit, FiTrash2, FiPlus, FiArchive, FiImage, FiX, FiUsers, FiCalendar } from 'react-icons/fi';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminTableCard from '@/components/admin/AdminTableCard';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton';
import AdminLoadingPanel from '@/components/admin/AdminLoadingPanel';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import AdminIconActions from '@/components/admin/AdminIconActions';
import { useAdminRoute } from '@/hooks/useAdminRoute';
import { useProtectedRoute } from '@/contexts/AuthContext';
import { Event } from '@/lib/api';
import { auth } from '@/lib/firebase';

export default function AdminEvents() {
  useProtectedRoute();
  const { isAdmin, isLoading: authLoading } = useAdminRoute();
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    location: '',
    disciplines: [] as Discipline[],
    description: '',
    status: 'open' as 'open' | 'full' | 'closed',
    maxParticipants: '',
    price: '',
    imageUrl: '',
    payfastUrl: '',
    eftInstructions: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  // All useColorModeValue calls must be at the very top, before any other hooks
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEvents();
  }, [isAdmin]);

  const fetchEvents = async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) return;

      const response = await fetch('/api/admin/events', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch events',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch events',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsEditMode(false);
    setSelectedEvent(null);
    setFormData({
      title: '',
      date: '',
      location: '',
      disciplines: [] as Discipline[],
      description: '',
      status: 'open',
      maxParticipants: '',
      price: '',
      imageUrl: '',
      payfastUrl: '',
      eftInstructions: '',
    });
    setImageFile(null);
    setImagePreview(null);
    setFormErrors({});
    setIsSaving(false);
    setUploadProgress(0);
    onOpen();
  };

  // Helper function to normalize date to YYYY-MM-DD format for date input
  const normalizeDateForInput = (date: any): string => {
    if (!date) return '';
    
    // If it's already a string in YYYY-MM-DD format
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    
    // If it's a string with ISO format, extract YYYY-MM-DD
    if (typeof date === 'string' && date.includes('T')) {
      return date.split('T')[0];
    }
    
    // If it's a Firestore Timestamp (has toDate method)
    if (date && typeof date.toDate === 'function') {
      const dateObj = date.toDate();
      return dateObj.toISOString().split('T')[0];
    }
    
    // If it's a Date object
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    
    // Try to parse as Date
    try {
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toISOString().split('T')[0];
      }
    } catch (e) {
      console.warn('Failed to parse date:', date);
    }
    
    return '';
  };

  const handleEdit = (event: Event) => {
    console.log('[EDIT EVENT] Event data received:', event);
    
    setIsEditMode(true);
    setSelectedEvent(event);
    
    // Ensure all required fields have default values to prevent validation errors
    const formDataToSet = {
      title: event.title || '',
      date: normalizeDateForInput(event.date),
      location: event.location || '',
      disciplines: parseEventDisciplines(event as unknown as Record<string, unknown>),
      description: event.description || '',
      status: (event.status || 'open') as 'open' | 'full' | 'closed',
      maxParticipants: event.maxParticipants?.toString() || '',
      price: (event as any).price?.toString() || '',
      imageUrl: (event as any).imageUrl || '',
      payfastUrl: (event as any).payfastUrl || '',
      eftInstructions: (event as any).eftInstructions || '',
    };
    
    console.log('[EDIT EVENT] Form data prepared:', formDataToSet);
    
    setFormData(formDataToSet);
    setImageFile(null);
    setImagePreview((event as any).imageUrl || null);
    setFormErrors({});
    setIsSaving(false);
    onOpen();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (jpg, png, gif)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a JPG, PNG, or GIF image file',
        status: 'error',
        duration: 3000,
      });
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: `File size is ${(file.size / 1024 / 1024).toFixed(2)}MB. Please select an image smaller than 5MB`,
        status: 'error',
        duration: 3000,
      });
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Set file and create preview
    setImageFile(file);
    if (formErrors.image) setFormErrors({ ...formErrors, image: '' });
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.onerror = () => {
      toast({
        title: 'Error',
        description: 'Failed to read image file',
        status: 'error',
        duration: 3000,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, imageUrl: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUploadClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (uploadingImage || isSaving) {
      return;
    }
    
    if (fileInputRef.current && !fileInputRef.current.disabled) {
      fileInputRef.current.click();
    } else {
      console.error('[IMAGE UPLOAD] File input not available or disabled', {
        hasRef: !!fileInputRef.current,
        disabled: fileInputRef.current?.disabled,
        uploadingImage,
        isSaving,
      });
    }
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.includes(',') ? result.split(',')[1] : result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  /** Upload via server Admin SDK — avoids client Storage permission errors. */
  const uploadImage = async (eventId?: string): Promise<string | null> => {
    if (!imageFile) return formData.imageUrl || null;

    const targetEventId = eventId || (isEditMode && selectedEvent ? selectedEvent.id : null);
    if (!targetEventId) return null;

    try {
      setUploadingImage(true);
      setUploadProgress(15);

      const token =
        (await auth.currentUser?.getIdToken().catch(() => null)) ||
        (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);
      if (!token) throw new Error('Please log in again');

      const imageBase64 = await fileToBase64(imageFile);
      setUploadProgress(45);

      const response = await fetch(`/api/admin/events/${targetEventId}/image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          contentType: imageFile.type || 'image/jpeg',
        }),
      });

      setUploadProgress(85);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to upload image');
      }

      setUploadProgress(100);
      return data.imageUrl as string;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setUploadProgress(0);
      toast({
        title: 'Image upload failed',
        description:
          error?.message ||
          'Failed to upload image. You can save the event without an image and add it later.',
        status: 'warning',
        duration: 7000,
        isClosable: true,
      });
      return null;
    } finally {
      setUploadingImage(false);
      // Reset progress after a short delay to show completion
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Log form data for debugging
    console.log('[VALIDATION] Form data:', formData);
    
    if (!formData.title?.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.date) {
      errors.date = 'Date is required';
    } else {
      // Validate date is not in the past (optional, can remove if needed)
      const selectedDate = new Date(formData.date);
      if (isNaN(selectedDate.getTime())) {
        errors.date = 'Invalid date format';
      }
    }
    
    if (!formData.location?.trim()) {
      errors.location = 'Location is required';
    }
    
    if (!formData.disciplines?.length) {
      errors.disciplines = 'Select at least one discipline';
    }

    if (formData.price === '' || formData.price == null) {
      errors.price = 'Entry fee is required';
    } else if (parseFloat(formData.price) < 0 || Number.isNaN(parseFloat(formData.price))) {
      errors.price = 'Entry fee must be 0 or greater';
    }

    const hasImage = Boolean(imageFile || formData.imageUrl?.trim());
    if (!hasImage) {
      errors.image = 'Event photo is required';
    }
    
    if (formData.maxParticipants && parseInt(formData.maxParticipants) < 1) {
      errors.maxParticipants = 'Max participants must be at least 1';
    }
    
    // Log validation errors for debugging
    if (Object.keys(errors).length > 0) {
      console.error('[VALIDATION] Validation errors:', errors);
      console.error('[VALIDATION] Form data state:', {
        title: formData.title,
        date: formData.date,
        location: formData.location,
        disciplines: formData.disciplines,
        maxParticipants: formData.maxParticipants,
      });
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    // Prevent multiple submissions
    if (isSaving || uploadingImage) {
      return;
    }

    // Validate form
    if (!validateForm()) {
      const errorFields = Object.keys(formErrors);
      const errorMessages = errorFields.map(field => {
        const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
        return `${fieldName}: ${formErrors[field]}`;
      });
      
      toast({
        title: 'Validation Error',
        description: errorMessages.length > 0 
          ? `Please fix the following errors:\n${errorMessages.join('\n')}`
          : 'Please fix the errors in the form',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsSaving(true);
    setFormErrors({});

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        toast({
          title: 'Error',
          description: 'Authentication required. Please log in again.',
          status: 'error',
          duration: 3000,
        });
        setIsSaving(false);
        return;
      }

      // Upload image first if a new one was selected
      // For edit mode: upload immediately with eventId
      // For create mode: upload after event is created (so we have eventId)
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        if (isEditMode && selectedEvent) {
          // Edit mode: upload now with eventId
          try {
            const uploadedUrl = await uploadImage(selectedEvent.id);
            if (uploadedUrl) {
              imageUrl = uploadedUrl;
            } else {
              imageUrl = formData.imageUrl || '';
            }
          } catch (error: any) {
            console.error('Image upload error:', error);
            toast({
              title: 'Image upload failed',
              description: error?.message || 'Failed to upload image. Event will be saved without image.',
              status: 'warning',
              duration: 5000,
            });
            imageUrl = formData.imageUrl || '';
          }
        }
        // For create mode, we'll upload after event creation (see below)
      }

      let imageBase64: string | undefined;
      if (imageFile && !isEditMode) {
        imageBase64 = await fileToBase64(imageFile);
      }

      const eventData: Record<string, unknown> = {
        title: formData.title,
        date: formData.date,
        location: formData.location,
        description: formData.description,
        status: formData.status,
        disciplines: formData.disciplines,
        type: disciplinesToLegacyType(formData.disciplines),
        imageUrl: imageUrl || undefined,
        payfastUrl: formData.payfastUrl || undefined,
        eftInstructions: formData.eftInstructions || undefined,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
        price: parseFloat(formData.price),
      };

      if (imageBase64) {
        eventData.imageBase64 = imageBase64;
        eventData.contentType = imageFile?.type || 'image/jpeg';
      }

      const url = isEditMode && selectedEvent
        ? `/api/admin/events/${selectedEvent.id}`
        : '/api/admin/events';
      const method = isEditMode ? 'PUT' : 'POST';

      // Add timeout to prevent infinite hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let responseData;
      try {
        const responseText = await response.text();
        console.log('[EVENT CREATE] Raw API response:', responseText);
        console.log('[EVENT CREATE] Response status:', response.status);
        
        if (responseText) {
          try {
            responseData = JSON.parse(responseText);
          } catch (parseError) {
            // If not JSON, use the text as error message
            throw new Error(responseText || `HTTP ${response.status}: ${response.statusText}`);
          }
        } else {
          responseData = {};
        }
      } catch (parseError: any) {
        console.error('[EVENT CREATE] Failed to parse response:', parseError);
        throw new Error(parseError.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('[EVENT CREATE] Parsed response data:', responseData);

      if (response.ok) {
        const savedEvent = responseData.event || responseData;
        const savedEventId = savedEvent?.id || (isEditMode && selectedEvent ? selectedEvent.id : null);
        
        
        toast({
          title: 'Success',
          description: isEditMode ? 'Event updated successfully' : 'Event created successfully',
          status: 'success',
          duration: 3000,
        });
        onClose();
        await fetchEvents();
        // Reset form
        setFormData({
          title: '',
          date: '',
          location: '',
          disciplines: [] as Discipline[],
          description: '',
          status: 'open',
          maxParticipants: '',
          price: '',
          imageUrl: '',
          payfastUrl: '',
          eftInstructions: '',
        });
        setImageFile(null);
        setImagePreview(null);
        setFormErrors({});
        setUploadProgress(0);
      } else {
        // Log detailed error information
        console.error('[EVENT CREATE] API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
        });
        
        const errorMessage = responseData.error || responseData.details || `Failed to save event (${response.status})`;
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('[EVENT CREATE] Error saving event:', error);
      console.error('[EVENT CREATE] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      
      let errorMessage = 'Failed to save event. Please try again.';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      toast({
        title: 'Error Creating Event',
        description: errorMessage,
        status: 'error',
        duration: 7000,
        isClosable: true,
      });
      
      // Also log to console for debugging
      console.error('[EVENT CREATE] Full error object:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async (eventId: string) => {
    if (!confirm('Are you sure you want to archive this event?')) {
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) return;

      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'closed' }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Event archived successfully',
          status: 'success',
          duration: 3000,
        });
        fetchEvents();
      } else {
        throw new Error('Failed to archive event');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to archive event',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleDelete = async (eventId: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) {
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) return;

      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 409) {
        toast({
          title: 'Cannot delete event',
          description: data.error || 'Remove linked scores from Admin → Scores first.',
          status: 'warning',
          duration: 7000,
          isClosable: true,
        });
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete event');
      }

      toast({
        title: 'Success',
        description: 'Event deleted successfully',
        status: 'success',
        duration: 3000,
      });
      fetchEvents();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete event',
        status: 'error',
        duration: 5000,
      });
    }
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <AdminPageHeader title="Event Management" subtitle="Create, edit, and manage events" />
        <AdminTableSkeleton columns={7} />
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <Head>
        <title>Admin Events - SATRF</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <AdminPageHeader
        title="Event Management"
        subtitle="Create, edit, and manage events"
        actions={
          <Button leftIcon={<FiPlus />} variant="satrf" onClick={handleCreate}>
            Create New Event
          </Button>
        }
      />

      <AdminTableCard>
        <Table variant="admin" size="sm">
          <Thead>
            <Tr>
              <Th>Title</Th>
              <Th>Date</Th>
              <Th>Location</Th>
              <Th>Disciplines</Th>
              <Th>Status</Th>
              <Th>Participants</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {events.length === 0 ? (
              <Tr>
                <Td colSpan={7} p={0} border={0}>
                  <AdminEmptyState
                    icon={FiCalendar}
                    title="No events yet"
                    description="Create your first event to get started."
                    action={
                      <Button leftIcon={<FiPlus />} variant="satrf" size="sm" onClick={handleCreate} mt={2}>
                        Create New Event
                      </Button>
                    }
                  />
                </Td>
              </Tr>
            ) : (
              events.map((event) => (
                <Tr key={event.id}>
                  <Td>
                    <HStack spacing={2}>
                      {(event as any).imageUrl && (
                        <Box
                          as="img"
                          src={(event as any).imageUrl}
                          alt={event.title}
                          w="40px"
                          h="40px"
                          objectFit="cover"
                          borderRadius="md"
                        />
                      )}
                      <Text fontWeight="semibold">{event.title}</Text>
                    </HStack>
                  </Td>
                  <Td>{new Date(event.date).toLocaleDateString()}</Td>
                  <Td>{event.location}</Td>
                  <Td>
                    {parseEventDisciplines(event as unknown as Record<string, unknown>)
                      .map((id) => EVENT_DISCIPLINE_OPTIONS.find((o) => o.id === id)?.shortLabel ?? id)
                      .join(', ') || (event as { type?: string }).type || '—'}
                  </Td>
                  <Td><AdminStatusBadge status={event.status} /></Td>
                  <Td>
                    {event.currentParticipants || 0}
                    {event.maxParticipants && ` / ${event.maxParticipants}`}
                  </Td>
                  <Td>
                    <AdminIconActions
                      actions={[
                        {
                          label: 'View registrations',
                          icon: <FiUsers />,
                          colorScheme: 'teal',
                          onClick: () => router.push(`/admin/events/${event.id}/registrations`),
                        },
                        { label: 'Edit event', icon: <FiEdit />, onClick: () => handleEdit(event) },
                        {
                          label: 'Archive event',
                          icon: <FiArchive />,
                          colorScheme: 'orange',
                          onClick: () => handleArchive(event.id),
                        },
                        {
                          label: 'Delete event',
                          icon: <FiTrash2 />,
                          colorScheme: 'red',
                          onClick: () => handleDelete(event.id, event.title),
                        },
                      ]}
                    />
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </AdminTableCard>

      {/* Create/Edit Modal - Modernized */}
      <Modal 
        isOpen={isOpen} 
        onClose={() => {
          if (!isSaving && !uploadingImage) {
            onClose();
            // Reset form on close
            setFormErrors({});
            setImageFile(null);
            setImagePreview(null);
            setUploadProgress(0);
          }
        }} 
        size="xl" 
        closeOnOverlayClick={!isSaving && !uploadingImage}
        closeOnEsc={!isSaving && !uploadingImage}
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent maxW="800px">
          <ModalHeader fontSize="xl" fontWeight="bold" pb={2}>
            {isEditMode ? 'Edit Event' : 'Create New Event'}
          </ModalHeader>
          <ModalCloseButton isDisabled={isSaving || uploadingImage} />
          <ModalBody pb={6}>
            <VStack spacing={5} align="stretch">
              {/* Title */}
              <FormControl isRequired isInvalid={!!formErrors.title}>
                <FormLabel fontWeight="semibold" mb={2}>Event Title</FormLabel>
                <Input
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (formErrors.title) setFormErrors({ ...formErrors, title: '' });
                  }}
                  placeholder="e.g., SATRF Championships 2026"
                  size="lg"
                  isDisabled={isSaving || uploadingImage}
                />
                  <FormErrorMessage>{formErrors.title}</FormErrorMessage>
              </FormControl>

              {/* Date and Location Row */}
              <HStack spacing={4}>
                <FormControl isRequired isInvalid={!!formErrors.date} flex={1}>
                  <FormLabel fontWeight="semibold" mb={2}>Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => {
                      setFormData({ ...formData, date: e.target.value });
                      if (formErrors.date) setFormErrors({ ...formErrors, date: '' });
                    }}
                    size="lg"
                    isDisabled={isSaving || uploadingImage}
                  />
                  <FormErrorMessage>{formErrors.date}</FormErrorMessage>
                </FormControl>
                <FormControl isRequired isInvalid={!!formErrors.location} flex={1}>
                  <FormLabel fontWeight="semibold" mb={2}>Location</FormLabel>
                  <Input
                    value={formData.location}
                    onChange={(e) => {
                      setFormData({ ...formData, location: e.target.value });
                      if (formErrors.location) setFormErrors({ ...formErrors, location: '' });
                    }}
                    placeholder="e.g., Modderbee Prison"
                    size="lg"
                    isDisabled={isSaving || uploadingImage}
                  />
                  <FormErrorMessage>{formErrors.location}</FormErrorMessage>
                </FormControl>
              </HStack>

              {/* Disciplines and Status Row */}
              <HStack spacing={4} align="flex-start">
                <FormControl isRequired isInvalid={!!formErrors.disciplines} flex={2}>
                  <FormLabel fontWeight="semibold" mb={2}>Disciplines</FormLabel>
                  <CheckboxGroup
                    value={formData.disciplines}
                    onChange={(values) => {
                      setFormData({ ...formData, disciplines: values as Discipline[] });
                      if (formErrors.disciplines) setFormErrors({ ...formErrors, disciplines: '' });
                    }}
                  >
                    <Stack spacing={2} direction={{ base: 'column', sm: 'row' }} flexWrap="wrap">
                      {EVENT_DISCIPLINE_OPTIONS.map((opt) => (
                        <Checkbox
                          key={opt.id}
                          value={opt.id}
                          isDisabled={isSaving || uploadingImage}
                          colorScheme="green"
                        >
                          {opt.label}
                        </Checkbox>
                      ))}
                    </Stack>
                  </CheckboxGroup>
                  <FormErrorMessage>{formErrors.disciplines}</FormErrorMessage>
                </FormControl>
                <FormControl flex={1}>
                  <FormLabel fontWeight="semibold" mb={2}>Status</FormLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    size="lg"
                    isDisabled={isSaving || uploadingImage}
                  >
                    <option value="open">Open</option>
                    <option value="full">Full</option>
                    <option value="closed">Closed</option>
                  </Select>
                </FormControl>
              </HStack>

              {/* Description */}
              <FormControl>
                <FormLabel fontWeight="semibold" mb={2}>Description</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add event details, requirements, schedule, etc."
                  rows={4}
                  size="lg"
                  isDisabled={isSaving || uploadingImage}
                />
              </FormControl>

              {/* Max Participants and Price Row */}
              <HStack spacing={4}>
                <FormControl isInvalid={!!formErrors.maxParticipants} flex={1}>
                  <FormLabel fontWeight="semibold" mb={2}>Max Participants</FormLabel>
                  <Input
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) => {
                      setFormData({ ...formData, maxParticipants: e.target.value });
                      if (formErrors.maxParticipants) setFormErrors({ ...formErrors, maxParticipants: '' });
                    }}
                    placeholder="Optional"
                    size="lg"
                    min="1"
                    isDisabled={isSaving || uploadingImage}
                  />
                  <FormErrorMessage>{formErrors.maxParticipants}</FormErrorMessage>
                </FormControl>
                <FormControl isRequired isInvalid={!!formErrors.price} flex={1}>
                  <FormLabel fontWeight="semibold" mb={2}>Entry Fee (R)</FormLabel>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => {
                      setFormData({ ...formData, price: e.target.value });
                      if (formErrors.price) setFormErrors({ ...formErrors, price: '' });
                    }}
                    placeholder="e.g. 300"
                    size="lg"
                    min="0"
                    step="1"
                    isDisabled={isSaving || uploadingImage}
                  />
                  <FormHelperText>Required. Use 0 only for genuinely free events.</FormHelperText>
                  <FormErrorMessage>{formErrors.price}</FormErrorMessage>
                </FormControl>
              </HStack>

              {/* Event Photo */}
              <FormControl isRequired isInvalid={!!formErrors.image}>
                  <FormLabel fontWeight="semibold" mb={2}>Event Photo</FormLabel>
                  <FormHelperText mb={2} fontSize="xs" color="gray.500">
                    Required. JPG, PNG, or GIF, max 5MB.
                  </FormHelperText>
                  <FormErrorMessage mb={2}>{formErrors.image}</FormErrorMessage>
                  {/* Always render the file input so ref is always available */}
                  <input
                    ref={fileInputRef}
                    id="event-image-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleImageSelect}
                    disabled={uploadingImage || isSaving}
                    style={{ display: 'none' }}
                    aria-label="Event photo upload"
                  />
                  {imagePreview ? (
                    <Box position="relative" mb={2}>
                      <Box
                        as="img"
                        src={imagePreview}
                        alt="Event preview"
                        maxH="120px"
                        borderRadius="md"
                        objectFit="cover"
                        w="100%"
                        border="2px solid"
                        borderColor="gray.200"
                      />
                      <IconButton
                        aria-label="Remove image"
                        icon={<FiX />}
                        size="sm"
                        colorScheme="red"
                        position="absolute"
                        top={2}
                        right={2}
                        onClick={handleRemoveImage}
                        isDisabled={isSaving || uploadingImage}
                      />
                    </Box>
                  ) : (
                    <>
                      <Box
                        onClick={handleImageUploadClick}
                        border="2px dashed"
                        borderColor="gray.300"
                        borderRadius="md"
                        p={4}
                        textAlign="center"
                        cursor={uploadingImage || isSaving ? 'not-allowed' : 'pointer'}
                        _hover={uploadingImage || isSaving ? {} : { borderColor: 'blue.400', bg: 'blue.50' }}
                        transition="all 0.2s"
                        userSelect="none"
                        opacity={uploadingImage || isSaving ? 0.6 : 1}
                        pointerEvents={uploadingImage || isSaving ? 'none' : 'auto'}
                      >
                        <VStack spacing={2}>
                          <FiImage size={24} color="gray" />
                          <Text fontSize="sm" color="gray.600">
                            Click to upload image
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            Max 5MB (JPG, PNG, GIF) — required
                          </Text>
                        </VStack>
                      </Box>
                      {!uploadingImage && !isSaving && (
                        <Button
                          mt={2}
                          size="sm"
                          variant="outline"
                          onClick={handleImageUploadClick}
                          leftIcon={<FiImage />}
                          w="full"
                        >
                          Or click here to browse files
                        </Button>
                      )}
                    </>
                  )}
                  {uploadingImage && (
                    <VStack mt={2} spacing={2} align="stretch">
                      <HStack spacing={2}>
                        <Spinner size="sm" color="blue.500" />
                        <Text fontSize="sm" color="blue.500" fontWeight="medium">
                          Uploading image... {uploadProgress}%
                        </Text>
                      </HStack>
                      <Progress 
                        value={uploadProgress} 
                        colorScheme="blue" 
                        size="sm" 
                        borderRadius="md"
                        isAnimated
                      />
                      <Text fontSize="xs" color="gray.500" fontStyle="italic">
                        {uploadProgress < 100 
                          ? 'Please wait while your image uploads...'
                          : 'Upload complete! Saving event...'}
                      </Text>
                    </VStack>
                  )}
                </FormControl>

              {/* Payment options */}
              <FormControl>
                <FormLabel fontWeight="semibold" mb={2}>PayFast URL (Optional)</FormLabel>
                <Input
                  value={formData.payfastUrl}
                  onChange={(e) => setFormData({ ...formData, payfastUrl: e.target.value })}
                  placeholder="https://www.payfast.co.za/eng/process/..."
                  size="lg"
                  isDisabled={isSaving || uploadingImage}
                />
                <FormHelperText>Provide a PayFast payment link for this event (optional)</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="semibold" mb={2}>EFT Instructions (Optional)</FormLabel>
                <Textarea
                  value={formData.eftInstructions}
                  onChange={(e) => setFormData({ ...formData, eftInstructions: e.target.value })}
                  placeholder={"Bank: ...\\nAccount: ...\\nReference: ..."}
                  rows={3}
                  size="lg"
                  isDisabled={isSaving || uploadingImage}
                />
                <FormHelperText>Displayed to users as EFT payment instructions</FormHelperText>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter borderTop="1px" borderColor="gray.200" pt={4}>
            <Button 
              variant="ghost" 
              mr={3} 
              onClick={onClose} 
              isDisabled={isSaving || uploadingImage}
              size="lg"
            >
              Cancel
            </Button>
            <Button 
              variant="satrf" 
              onClick={handleSave}
              isLoading={isSaving || uploadingImage}
              loadingText={uploadingImage ? "Uploading..." : (isEditMode ? "Updating..." : "Creating...")}
              size="lg"
              leftIcon={!isSaving && !uploadingImage ? (isEditMode ? <FiEdit /> : <FiPlus />) : undefined}
            >
              {!isSaving && !uploadingImage && (isEditMode ? 'Update Event' : 'Create Event')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
}


