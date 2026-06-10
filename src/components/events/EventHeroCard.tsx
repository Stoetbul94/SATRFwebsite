'use client';

import {
  Box,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  Progress,
  useColorModeValue,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Flex,
} from '@chakra-ui/react';
import { FaMapMarkerAlt, FaRegCalendarAlt } from 'react-icons/fa';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import EventCoverImage from './EventCoverImage';
import type { EventCardData } from './EventListCard';
import { formatEntryFee } from '@/lib/eventDisciplines';
import {
  formatEventDate,
  hasCapacityLimit,
  capacityPercent,
  getRibbonStatus,
  RIBBON_LABELS,
  RIBBON_COLORS,
  disciplineColor,
} from '@/lib/eventDisplay';

const MotionBox = motion(Box);

interface EventHeroCardProps {
  event: EventCardData;
  registrationOpen?: boolean;
  registrationLabel?: string;
  onRegister?: () => void;
}

export default function EventHeroCard({
  event,
  registrationOpen = false,
  registrationLabel = 'Register',
  onRegister,
}: EventHeroCardProps) {
  const reducedMotion = useReducedMotion();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('satrf.lightBlue', 'gray.600');
  const textMuted = useColorModeValue('gray.600', 'gray.400');
  const { isOpen, onOpen, onClose } = useDisclosure();

  const ribbon = getRibbonStatus({
    isPast: false,
    maxSpots: event.maxSpots,
    currentSpots: event.currentSpots,
    registrationDeadline: event.registrationDeadline,
  });
  const feeLabel = formatEntryFee(event.price);
  const showCapacity = hasCapacityLimit(event.maxSpots);
  const hasPayfast = event.price != null && event.price > 0 && !!event.payfastUrl;

  return (
    <>
      <MotionBox
        bg={cardBg}
        rounded="2xl"
        shadow="xl"
        borderWidth="2px"
        borderColor={borderColor}
        overflow="hidden"
        initial={reducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Flex direction={{ base: 'column', md: 'row' }}>
          <Box flex={{ md: '0 0 42%' }} position="relative">
            <EventCoverImage
              src={event.image}
              alt={event.title}
              height={{ base: '220px', md: '280px' }}
              rounded="none"
            />
            <Badge position="absolute" top={4} left={4} colorScheme="blue" fontSize="sm" px={3} py={1}>
              Next up
            </Badge>
          </Box>

          <VStack align="stretch" spacing={4} p={{ base: 5, md: 8 }} flex={1}>
            <HStack justify="space-between" align="start" flexWrap="wrap" gap={2}>
              <Text fontWeight="extrabold" fontSize={{ base: 'xl', md: '2xl' }} color="satrf.navy">
                {event.title}
              </Text>
              <Badge colorScheme={RIBBON_COLORS[ribbon]} fontSize="sm">
                {RIBBON_LABELS[ribbon]}
              </Badge>
            </HStack>

            <HStack spacing={2} flexWrap="wrap">
              {event.disciplineLabels.map((d) => (
                <Badge key={d} colorScheme={disciplineColor(d)} fontSize="sm">
                  {d}
                </Badge>
              ))}
            </HStack>

            <HStack spacing={4} flexWrap="wrap" color={textMuted}>
              <HStack spacing={2}>
                <FaRegCalendarAlt />
                <Text fontWeight="medium">{formatEventDate(event.eventDate)}</Text>
              </HStack>
              <HStack spacing={2}>
                <FaMapMarkerAlt />
                <Text>{event.location}</Text>
              </HStack>
            </HStack>

            {showCapacity ? (
              <Box maxW="320px">
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="sm" color={textMuted}>
                    {event.currentSpots} / {event.maxSpots} entered
                  </Text>
                </HStack>
                <Progress
                  value={capacityPercent(event.currentSpots, event.maxSpots)}
                  size="sm"
                  colorScheme="blue"
                  rounded="full"
                />
              </Box>
            ) : (
              <Text fontSize="sm" color={textMuted}>
                Open entry
              </Text>
            )}

            <Text fontSize="lg" fontWeight="bold" color="satrf.navy">
              {feeLabel}
            </Text>

            <HStack spacing={3} flexWrap="wrap">
              {hasPayfast && (
                <Button
                  as="a"
                  href={event.payfastUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  colorScheme="pink"
                  size="md"
                >
                  Pay with PayFast
                </Button>
              )}
              {event.eftInstructions && (
                <Button variant="outline" size="md" onClick={onOpen}>
                  EFT details
                </Button>
              )}
              <Button
                size="md"
                variant="satrf"
                isDisabled={!registrationOpen}
                onClick={onRegister}
              >
                {registrationLabel}
              </Button>
              <Button as={Link} href={`/events/${event.id}`} variant="outline" size="md">
                Event details
              </Button>
            </HStack>
          </VStack>
        </Flex>
      </MotionBox>

      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>EFT payment — {event.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text whiteSpace="pre-wrap">{event.eftInstructions}</Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
