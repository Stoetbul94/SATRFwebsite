import {
  Box,
  Button,
  Container,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
  VStack,
  HStack,
  Image,
  Icon,
  useToast,
  Progress,
} from '@chakra-ui/react';
import { useState, useCallback } from 'react';
import Layout from '@/components/layout/Layout';
import { useDropzone } from 'react-dropzone';
import { FaFile, FaFilePdf, FaFileWord, FaImage } from 'react-icons/fa';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface MediaItem {
  id: string;
  name: string;
  type: 'image' | 'document';
  url: string;
  uploadedAt: string;
}

// Mock data - in a real app, this would come from Firebase
const MOCK_MEDIA: MediaItem[] = [
  {
    id: '1',
    name: 'Event Results.pdf',
    type: 'document',
    url: '/documents/results.pdf',
    uploadedAt: '2024-03-15',
  },
  {
    id: '2',
    name: 'Championship Photo.jpg',
    type: 'image',
    url: '/images/championship.jpg',
    uploadedAt: '2024-03-15',
  },
];

export default function Media() {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const toast = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (const file of acceptedFiles) {
        const storageRef = ref(storage, `media/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            toast({
              title: 'Upload failed',
              description: error.message,
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            toast({
              title: 'Upload successful',
              description: 'File has been uploaded successfully',
              status: 'success',
              duration: 3000,
              isClosable: true,
            });
          }
        );
      }
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
  });

  const getFileIcon = (type: string) => {
    if (type === 'document') {
      if (type.includes('pdf')) return FaFilePdf;
      if (type.includes('doc')) return FaFileWord;
      return FaFile;
    }
    return FaImage;
  };

  return (
    <Layout>
      <Container maxW="container.xl" py={8}>
        <Stack spacing={8}>
          <Box>
            <Heading size="xl" mb={2}>
              Media Library
            </Heading>
            <Text color={useColorModeValue('gray.600', 'gray.400')}>
              Upload and manage event documents and photos
            </Text>
          </Box>

          <Box
            {...getRootProps()}
            p={10}
            border="2px dashed"
            borderColor={isDragActive ? 'blue.400' : 'gray.200'}
            borderRadius="lg"
            textAlign="center"
            cursor="pointer"
            bg={useColorModeValue('gray.50', 'gray.700')}
            _hover={{ borderColor: 'blue.400' }}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <VStack spacing={4}>
                <Text>Uploading...</Text>
                <Progress value={uploadProgress} w="100%" />
              </VStack>
            ) : (
              <VStack spacing={4}>
                <Text fontSize="lg">
                  {isDragActive
                    ? 'Drop the files here...'
                    : 'Drag and drop files here, or click to select files'}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Supported formats: JPG, PNG, PDF, DOC, DOCX
                </Text>
              </VStack>
            )}
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {MOCK_MEDIA.map((item) => (
              <Box
                key={item.id}
                bg={useColorModeValue('white', 'gray.700')}
                p={4}
                rounded="lg"
                shadow="md"
              >
                <VStack align="start" spacing={4}>
                  {item.type === 'image' ? (
                    <Image
                      src={item.url}
                      alt={item.name}
                      w="100%"
                      h="200px"
                      objectFit="cover"
                      rounded="md"
                    />
                  ) : (
                    <Box
                      w="100%"
                      h="200px"
                      bg="gray.100"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      rounded="md"
                    >
                      <Icon
                        as={getFileIcon(item.type)}
                        w={12}
                        h={12}
                        color="gray.400"
                      />
                    </Box>
                  )}
                  <VStack align="start" spacing={1} w="100%">
                    <Text fontWeight="bold" noOfLines={1}>
                      {item.name}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      Uploaded on {new Date(item.uploadedAt).toLocaleDateString()}
                    </Text>
                  </VStack>
                  <HStack spacing={2} w="100%">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(item.url, '_blank')}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      colorScheme="red"
                      onClick={() => {
                        // In a real app, this would delete the file from Firebase Storage
                        console.log('Delete file:', item.id);
                      }}
                    >
                      Delete
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Layout>
  );
} 