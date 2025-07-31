import {
  Box,
  Button,
  Container,
  Heading,
  Stack,
  Text,
  useColorModeValue,
  VStack,
  HStack,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Avatar,
  IconButton,
  useToast,
} from '@chakra-ui/react';
import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { FaSearch, FaThumbsUp, FaComment, FaBookmark } from 'react-icons/fa';
import { useRouter } from 'next/router';

interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    avatar: string;
  };
  category: string;
  likes: number;
  comments: number;
  createdAt: string;
}

// Mock data - in a real app, this would come from Firebase
const MOCK_POSTS: Post[] = [
  {
    id: '1',
    title: 'Tips for improving accuracy',
    content: 'Here are some techniques I\'ve found helpful for improving shooting accuracy...',
    author: {
      name: 'John Smith',
      avatar: '/avatars/john.jpg',
    },
    category: 'Training Tips',
    likes: 15,
    comments: 5,
    createdAt: '2024-03-15',
  },
  {
    id: '2',
    title: 'Upcoming regional competition',
    content: 'Details about the upcoming regional competition in Johannesburg...',
    author: {
      name: 'Sarah Johnson',
      avatar: '/avatars/sarah.jpg',
    },
    category: 'Event Discussion',
    likes: 8,
    comments: 12,
    createdAt: '2024-03-14',
  },
];

const CATEGORIES = [
  'All',
  'Event Discussion',
  'Training Tips',
  'Equipment',
  'General Chat',
];

export default function Forum() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const toast = useToast();

  const filteredPosts = MOCK_POSTS.filter((post) => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreatePost = () => {
    router.push('/forum/create');
  };

  const handleLike = (postId: string) => {
    // In a real app, this would update the likes in Firebase
    toast({
      title: 'Post liked',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleBookmark = (postId: string) => {
    // In a real app, this would add the post to user's bookmarks in Firebase
    toast({
      title: 'Post bookmarked',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Layout>
      <Container maxW="container.xl" py={8}>
        <Stack spacing={8}>
          <Box>
            <Heading size="xl" mb={2}>
              SATRF Forum
            </Heading>
            <Text color={useColorModeValue('gray.600', 'gray.400')}>
              Connect with fellow members and discuss shooting sports
            </Text>
          </Box>

          <HStack spacing={4} wrap="wrap">
            <InputGroup maxW="400px">
              <InputLeftElement pointerEvents="none">
                <FaSearch color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>

            <HStack spacing={2}>
              {CATEGORIES.map((category) => (
                <Badge
                  key={category}
                  colorScheme={selectedCategory === category ? 'blue' : 'gray'}
                  cursor="pointer"
                  onClick={() => setSelectedCategory(category)}
                  px={3}
                  py={1}
                  rounded="full"
                >
                  {category}
                </Badge>
              ))}
            </HStack>

            <Button
              colorScheme="blue"
              onClick={handleCreatePost}
              ml="auto"
            >
              Create Post
            </Button>
          </HStack>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {filteredPosts.map((post) => (
              <Box
                key={post.id}
                bg={useColorModeValue('white', 'gray.700')}
                p={6}
                rounded="lg"
                shadow="md"
                cursor="pointer"
                onClick={() => router.push(`/forum/post/${post.id}`)}
                _hover={{ shadow: 'lg' }}
              >
                <VStack align="start" spacing={4}>
                  <HStack spacing={2}>
                    <Badge colorScheme="blue">{post.category}</Badge>
                    <Text fontSize="sm" color="gray.500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </Text>
                  </HStack>

                  <Heading size="md">{post.title}</Heading>
                  <Text noOfLines={3} color={useColorModeValue('gray.600', 'gray.400')}>
                    {post.content}
                  </Text>

                  <HStack spacing={4} w="100%" justify="space-between">
                    <HStack spacing={4}>
                      <HStack spacing={1}>
                        <IconButton
                          aria-label="Like post"
                          icon={<FaThumbsUp />}
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(post.id);
                          }}
                        />
                        <Text>{post.likes}</Text>
                      </HStack>
                      <HStack spacing={1}>
                        <FaComment />
                        <Text>{post.comments}</Text>
                      </HStack>
                    </HStack>

                    <HStack spacing={4}>
                      <Avatar
                        size="sm"
                        name={post.author.name}
                        src={post.author.avatar}
                      />
                      <Text fontWeight="medium">{post.author.name}</Text>
                      <IconButton
                        aria-label="Bookmark post"
                        icon={<FaBookmark />}
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookmark(post.id);
                        }}
                      />
                    </HStack>
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