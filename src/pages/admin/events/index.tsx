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
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
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
    });
    setImageFile(null);
    setImagePreview(null);
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
    });
    setImageFile(null);
    setImagePreview((event as any).imageUrl || null);
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

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.imageUrl || null;

    try {
      setUploadingImage(true);
      const timestamp = Date.now();
      const fileName = `events/${timestamp}_${imageFile.name}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, imageFile);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image. Please try again.',
        status: 'error',
        duration: 3000,
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        toast({
          title: 'Error',
          description: 'Authentication required',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      // Upload image first if a new one was selected
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          // Don't proceed if image upload failed
          return;
        }
      }

      const eventData = {
        ...formData,
        imageUrl,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
      };

      const url = isEditMode && selectedEvent
        ? `/api/admin/events/${selectedEvent.id}`
        : '/api/admin/events';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      });

      const responseData = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: isEditMode ? 'Event updated successfully' : 'Event created successfully',
          status: 'success',
          duration: 3000,
        });
        onClose();
        fetchEvents();
        // Reset form
        setImageFile(null);
        setImagePreview(null);
      } else {
        throw new Error(responseData.error || responseData.details || 'Failed to save event');
      }
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save event',
        status: 'error',
        duration: 5000,
      });
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

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{isEditMode ? 'Edit Event' : 'Create New Event'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Title</FormLabel>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Event title"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Location</FormLabel>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Event location"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Type</FormLabel>
                <Input
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="Event type (e.g., Prone Match, 3P)"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Event description"
                  rows={4}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="open">Open</option>
                  <option value="full">Full</option>
                  <option value="closed">Closed</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Max Participants</FormLabel>
                <Input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                  placeholder="Optional"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Event Photo</FormLabel>
                {imagePreview ? (
                  <Box position="relative" mb={2}>
                    <Box
                      as="img"
                      src={imagePreview}
                      alt="Event preview"
                      maxH="200px"
                      borderRadius="md"
                      objectFit="cover"
                      w="100%"
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
                    />
                  </Box>
                ) : null}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  disabled={uploadingImage}
                />
                {uploadingImage && (
                  <Text fontSize="sm" color="blue.500" mt={2}>
                    Uploading image...
                  </Text>
                )}
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Optional: Upload an image for this event (max 5MB)
                </Text>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} disabled={uploadingImage}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleSave}
              isLoading={uploadingImage}
              loadingText="Uploading..."
            >
              {isEditMode ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
}


