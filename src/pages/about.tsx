import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  Link,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
import Layout from '@/components/layout/Layout';
import Image from 'next/image';

export default function About() {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.800', 'white');

  return (
    <Layout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Welcome Section */}
          <Box textAlign="center" py={10}>
            <Box mb={4} display="flex" justifyContent="center">
              <Image
                src="/SATRFLOGO.png"
                alt="SATRF Logo"
                width={100}
                height={100}
                style={{ borderRadius: '50%' }}
                priority
              />
            </Box>
            <Heading
              as="h1"
              size="2xl"
              color={headingColor}
              mb={4}
            >
              Welcome to the South African Target Rifle Federation
            </Heading>
            <Text fontSize="xl" color={textColor} maxW="3xl" mx="auto">
              The South African Target Rifle Federation (SATRF) is the official national governing body for (non-air) rifle shooting in South Africa. Established in 1994, SATRF is committed to promoting, developing, and regulating target rifle shooting across the country.
            </Text>
          </Box>

          {/* Mission Section */}
          <Box bg={bgColor} p={8} borderRadius="lg" boxShadow="md">
            <Heading as="h2" size="xl" color={headingColor} mb={4}>
              Our Mission
            </Heading>
            <Text fontSize="lg" color={textColor}>
              Our mission is to advance the sport of target rifle shooting in South Africa by fostering excellence, integrity, and sportsmanship at all levels—from grassroots to international competition. We strive to create opportunities for shooters of all ages and backgrounds to participate, compete, and succeed.
            </Text>
          </Box>

          {/* Who We Are Section */}
          <Box bg={bgColor} p={8} borderRadius="lg" boxShadow="md">
            <Heading as="h2" size="xl" color={headingColor} mb={4}>
              Who We Are
            </Heading>
            <Text fontSize="lg" color={textColor} mb={4}>
              SATRF is recognized by the South African Shooting Sport Confederation (SASSCo), the South African Sports Confederation and Olympic Committee (SASCOC), and is affiliated with the International Shooting Sport Federation (ISSF) and the International Olympic Committee (IOC). Our leadership team is dedicated to upholding the highest standards of governance, safety, and athlete development.
            </Text>
          </Box>

          {/* What We Do Section */}
          <Box bg={bgColor} p={8} borderRadius="lg" boxShadow="md">
            <Heading as="h2" size="xl" color={headingColor} mb={4}>
              What We Do
            </Heading>
            <Text fontSize="lg" color={textColor}>
              We organize national championships, league competitions, training camps, and coaching clinics to nurture talent and support the growth of our sport. SATRF works closely with provincial associations, clubs, and schools to expand participation and encourage the next generation of shooters.
            </Text>
          </Box>

          {/* Achievements Section */}
          <Box bg={bgColor} p={8} borderRadius="lg" boxShadow="md">
            <Heading as="h2" size="xl" color={headingColor} mb={4}>
              Our Achievements
            </Heading>
            <Text fontSize="lg" color={textColor}>
              Over the years, SATRF has produced numerous national champions and has represented South Africa on the world stage at ISSF-sanctioned events and the Olympic Games. Our members have consistently demonstrated skill, discipline, and sportsmanship.
            </Text>
          </Box>

          {/* Join Us Section */}
          <Box bg={bgColor} p={8} borderRadius="lg" boxShadow="md">
            <Heading as="h2" size="xl" color={headingColor} mb={4}>
              Join Us
            </Heading>
            <Text fontSize="lg" color={textColor}>
              SATRF welcomes members of all ages and skill levels—from beginners to elite athletes. Whether you are looking to compete, learn, or contribute to the shooting community, we invite you to become part of our federation. Membership offers access to exclusive events, training resources, and a vibrant community of fellow shooting enthusiasts.
            </Text>
          </Box>

          {/* Contact Section */}
          <Box bg={bgColor} p={8} borderRadius="lg" boxShadow="md">
            <Heading as="h2" size="xl" color={headingColor} mb={6}>
              Contact Us
            </Heading>
            <VStack spacing={4} align="stretch">
              <HStack>
                <Icon as={FaEnvelope} color="blue.500" />
                <Link href="mailto:info@satrf.co.za" color={textColor}>
                  info@satrf.co.za
                </Link>
              </HStack>
              <HStack>
                <Icon as={FaPhone} color="blue.500" />
                <Text color={textColor}>+27 (0)12 345 6789</Text>
              </HStack>
              <HStack>
                <Icon as={FaMapMarkerAlt} color="blue.500" />
                <Text color={textColor}>
                  SATRF Headquarters<br />
                  123 Shooting Range Road<br />
                  Pretoria, South Africa
                </Text>
              </HStack>
              <HStack spacing={4} mt={4}>
                <Link href="https://facebook.com/satrf" isExternal>
                  <Icon as={FaFacebook} w={6} h={6} color="blue.500" />
                </Link>
                <Link href="https://twitter.com/satrf" isExternal>
                  <Icon as={FaTwitter} w={6} h={6} color="blue.400" />
                </Link>
                <Link href="https://instagram.com/satrf" isExternal>
                  <Icon as={FaInstagram} w={6} h={6} color="pink.500" />
                </Link>
              </HStack>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Layout>
  );
} 