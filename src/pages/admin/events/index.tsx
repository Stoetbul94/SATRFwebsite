import { useState, useEffect } from 'react';
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
} from '@chakra-ui/react';
import { FiEdit, FiTrash2, FiPlus, FiArchive, FiImage, FiX } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminRoute } from '@/hooks/useAdminRoute';
import { useProtectedRoute } from '@/contexts/AuthContext';
import { Event } from '@/lib/api';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export default function AdminEvents() {
  useProtectedRoute();
  const { isAdmin, isLoading: authLoading } = useAdminRoute();
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
    type: '',
    description: '',
    status: 'open' as 'open' | 'full' | 'closed',
    maxParticipants: '',
    imageUrl: '',
    payfastUrl: '',
    eftInstructions: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

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
      type: '',
      description: '',
      status: 'open',
      maxParticipants: '',
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
      type: event.type || '',
      description: event.description || '',
      status: (event.status || 'open') as 'open' | 'full' | 'closed',
      maxParticipants: event.maxParticipants?.toString() || '',
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
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 5MB',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, imageUrl: '' });
  };

  const uploadImage = async (skipOnTimeout: boolean = true): Promise<string | null> => {
    if (!imageFile) return formData.imageUrl || null;

    try {
      setUploadingImage(true);
      setUploadProgress(0);
      
      const timestamp = Date.now();
      const sanitizedFileName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `events/${timestamp}_${sanitizedFileName}`;
      const storageRef = ref(storage, fileName);
      
      // Use uploadBytesResumable for progress tracking
      const uploadTask = uploadBytesResumable(storageRef, imageFile, {
        contentType: imageFile.type,
      });
      
      // Track upload progress
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
          console.log(`Upload progress: ${progress}%`);
        },
        (error) => {
          console.error('Upload error:', error);
          throw error;
        }
      );
      
      // Wait for upload to complete with a longer timeout (60 seconds for larger images)
      const uploadPromise = new Promise<void>((resolve, reject) => {
        uploadTask.then(() => resolve()).catch(reject);
      });
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Upload timeout after 60 seconds. Please try again with a smaller image or check your internet connection.'));
        }, 60000); // 60 seconds - reasonable for images up to 5MB
      });
      
      await Promise.race([uploadPromise, timeoutPromise]);
      
      // Get download URL after successful upload
      const downloadURL = await getDownloadURL(storageRef);
      console.log('Image uploaded successfully:', downloadURL);
      
      setUploadProgress(100);
      return downloadURL;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setUploadProgress(0);
      
      // Check if it's a retry limit error or timeout
      const isTimeout = error?.code === 'storage/retry-limit-exceeded' || 
                       error?.message?.includes('timeout') ||
                       error?.message?.includes('retry');
      
      if (isTimeout && skipOnTimeout) {
        console.log('Image upload timed out - proceeding without image');
        toast({
          title: 'Image upload timeout',
          description: 'Image upload took too long. Event will be created without an image. You can add it later by editing the event.',
          status: 'warning',
          duration: 5000,
        });
        return null;
      }
      
      // Check for specific Firebase Storage errors
      let errorMessage = 'Failed to upload image';
      if (error?.code === 'storage/unauthorized') {
        errorMessage = 'Permission denied. Please check your authentication.';
      } else if (error?.code === 'storage/canceled') {
        errorMessage = 'Upload was canceled.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Image upload failed',
        description: `${errorMessage}. Event will be created without an image. You can add it later by editing the event.`,
        status: 'warning',
        duration: 5000,
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
    
    if (!formData.type?.trim()) {
      errors.type = 'Type is required';
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
        type: formData.type,
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

      // Upload image first if a new one was selected (optional - event can be created without image)
      // If upload fails or times out, we'll proceed without the image
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        // Try to upload, but don't block event creation if it fails
        try {
          const uploadedUrl = await uploadImage(true); // skipOnTimeout = true
          if (uploadedUrl) {
            imageUrl = uploadedUrl;
          } else {
            // Upload failed/timed out - proceed without image
            imageUrl = null;
          }
        } catch (error) {
          // If upload throws an error, just proceed without image
          console.log('Image upload error, proceeding without image:', error);
          imageUrl = null;
        }
      }

      const eventData = {
        ...formData,
        imageUrl,
        payfastUrl: formData.payfastUrl || null,
        eftInstructions: formData.eftInstructions || null,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
      };

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
          type: '',
          description: '',
          status: 'open',
          maxParticipants: '',
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

  const getStatusBadge = (status: string) => {
    const colors = {
      open: 'green',
      full: 'yellow',
      closed: 'gray',
    };
    return (
      <Badge colorScheme={colors[status as keyof typeof colors] || 'gray'}>
        {status}
      </Badge>
    );
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <Center minH="50vh">
          <Spinner size="xl" color="blue.500" />
        </Center>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout title="Event Management" description="Create, edit, and manage events">
      <Head>
        <title>Admin Events - SATRF</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <Box mb={6}>
        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={handleCreate}>
          Create New Event
        </Button>
      </Box>

      {/* Events Table */}
      <Box bg={cardBg} borderRadius="lg" border="1px" borderColor={borderColor} overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Title</Th>
              <Th>Date</Th>
              <Th>Location</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>Participants</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {events.length === 0 ? (
              <Tr>
                <Td colSpan={7} textAlign="center" py={8}>
                  <Text color="gray.500">No events found</Text>
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
                  <Td>{event.type}</Td>
                  <Td>{getStatusBadge(event.status)}</Td>
                  <Td>
                    {event.currentParticipants || 0}
                    {event.maxParticipants && ` / ${event.maxParticipants}`}
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Edit event"
                        icon={<FiEdit />}
                        size="sm"
                        onClick={() => handleEdit(event)}
                      />
                      <IconButton
                        aria-label="Archive event"
                        icon={<FiArchive />}
                        size="sm"
                        colorScheme="orange"
                        onClick={() => handleArchive(event.id)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

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

              {/* Type and Status Row */}
              <HStack spacing={4}>
                <FormControl isRequired isInvalid={!!formErrors.type} flex={2}>
                  <FormLabel fontWeight="semibold" mb={2}>Event Type</FormLabel>
                  <Input
                    value={formData.type}
                    onChange={(e) => {
                      setFormData({ ...formData, type: e.target.value });
                      if (formErrors.type) setFormErrors({ ...formErrors, type: '' });
                    }}
                    placeholder="e.g., Prone Match, 3P, F-Class"
                    size="lg"
                    isDisabled={isSaving || uploadingImage}
                  />
                  <FormErrorMessage>{formErrors.type}</FormErrorMessage>
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

              {/* Max Participants and Image Row */}
              <HStack spacing={4} align="flex-start">
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
                <FormControl flex={1}>
                  <FormLabel fontWeight="semibold" mb={2}>
                    Event Photo <Text as="span" fontWeight="normal" color="gray.500" fontSize="sm">(Optional)</Text>
                  </FormLabel>
                  <FormHelperText mb={2} fontSize="xs" color="gray.500">
                    You can add an image now or skip and add it later by editing the event
                  </FormHelperText>
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
                    <Box
                      border="2px dashed"
                      borderColor="gray.300"
                      borderRadius="md"
                      p={4}
                      textAlign="center"
                      cursor="pointer"
                      _hover={{ borderColor: 'blue.400', bg: 'blue.50' }}
                      transition="all 0.2s"
                      position="relative"
                    >
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        disabled={uploadingImage || isSaving}
                        position="absolute"
                        opacity={0}
                        width="100%"
                        height="100%"
                        cursor="pointer"
                        zIndex={1}
                        top={0}
                        left={0}
                      />
                      <VStack spacing={2}>
                        <FiImage size={24} color="gray" />
                        <Text fontSize="sm" color="gray.600">
                          Click to upload image
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          Max 5MB (JPG, PNG, GIF) - Optional
                        </Text>
                      </VStack>
                    </Box>
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
              </HStack>

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
              colorScheme="blue" 
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


