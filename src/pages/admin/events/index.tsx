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
} from '@chakra-ui/react';
import { FiEdit, FiTrash2, FiPlus, FiArchive, FiImage, FiX } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminRoute } from '@/hooks/useAdminRoute';
import { useProtectedRoute } from '@/contexts/AuthContext';
import { Event } from '@/lib/api';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
    onOpen();
  };

  const handleEdit = (event: Event) => {
    setIsEditMode(true);
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      date: event.date.split('T')[0],
      location: event.location,
      type: event.type,
      description: event.description || '',
      status: event.status,
      maxParticipants: event.maxParticipants?.toString() || '',
      imageUrl: (event as any).imageUrl || '',
      payfastUrl: (event as any).payfastUrl || '',
      eftInstructions: (event as any).eftInstructions || '',
    });
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
      const timestamp = Date.now();
      const fileName = `events/${timestamp}_${imageFile.name}`;
      const storageRef = ref(storage, fileName);
      
      // Reduced timeout to 15 seconds - if it takes longer, skip it
      const uploadPromise = uploadBytes(storageRef, imageFile, {
        contentType: imageFile.type,
      });
      
      // Create a timeout promise (15 seconds - faster failure)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Upload timeout'));
        }, 15000); // 15 seconds - fail fast
      });
      
      // Race between upload and timeout
      await Promise.race([uploadPromise, timeoutPromise]);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      
      // Check if it's a retry limit error or timeout
      const isTimeout = error?.code === 'storage/retry-limit-exceeded' || 
                       error?.message?.includes('retry') ||
                       error?.message?.includes('timeout');
      
      if (isTimeout && skipOnTimeout) {
        // Silently skip image upload on timeout - don't show error, just proceed
        console.log('Image upload timed out - proceeding without image');
        return null;
      }
      
      toast({
        title: 'Image upload failed',
        description: 'Failed to upload image. Event will be created without an image. You can add it later by editing the event.',
        status: 'warning',
        duration: 4000,
      });
      
      // Return null to indicate failure, but allow event creation to proceed
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
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
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        status: 'error',
        duration: 3000,
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
                        <Text fontSize="sm" color="blue.500">Uploading image...</Text>
                      </HStack>
                      <Text fontSize="xs" color="gray.500" fontStyle="italic">
                        If upload takes too long, you can skip and add the image later
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


