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
} from '@chakra-ui/react';
import { FaMapMarkerAlt, FaRegCalendarAlt } from 'react-icons/fa';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import EventCoverImage from './EventCoverImage';
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

export interface EventCardData {
  id: string;
  title: string;
  description: string;
  eventDate: Date;
  location: string;
  disciplineLabels: string[];
  price: number | null;
  maxSpots: number;
  currentSpots: number;
  registrationDeadline: Date;
  image?: string | null;
  payfastUrl?: string | null;
  eftInstructions?: string | null;
  isPast: boolean;
}

interface EventListCardProps {
  event: EventCardData;
  index?: number;
  variant?: 'grid' | 'past';
  registrationOpen?: boolean;
  registrationLabel?: string;
  onRegister?: () => void;
}

export default function EventListCard({
  event,
  index = 0,
  variant = 'grid',
  registrationOpen = false,
  registrationLabel = 'Register',
  onRegister,
}: EventListCardProps) {
  const reducedMotion = useReducedMotion();
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textMuted = useColorModeValue('gray.600', 'gray.400');
  const isPast = variant === 'past' || event.isPast;
  const { isOpen, onOpen, onClose } = useDisclosure();

  const ribbon = getRibbonStatus({
    isPast,
    maxSpots: event.maxSpots,
    currentSpots: event.currentSpots,
    registrationDeadline: event.registrationDeadline,
  });
  const feeLabel = formatEntryFee(event.price);
  const showCapacity = !isPast && hasCapacityLimit(event.maxSpots);
  const hasPayfast = event.price != null && event.price > 0 && !!event.payfastUrl;

  return (
    <>
      <MotionBox
        bg={cardBg}
        rounded="xl"
        shadow="md"
        borderWidth="1px"
        borderColor={borderColor}
        overflow="hidden"
        opacity={isPast ? 0.72 : 1}
        filter={isPast ? 'grayscale(0.55)' : 'none'}
        initial={reducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: isPast ? 0.72 : 1, y: 0 }}
        transition={{ duration: 0.3, delay: reducedMotion ? 0 : index * 0.05 }}
        _hover={
          reducedMotion
            ? {}
            : {
                shadow: 'lg',
                transform: 'translateY(-4px)',
                transition: 'all 0.2s',
              }
        }
      >
        <Box position="relative">
          <EventCoverImage src={event.image} alt={event.title} height="180px" rounded="none" />
          <Badge
            position="absolute"
            top={3}
            right={3}
            colorScheme={RIBBON_COLORS[ribbon]}
            fontSize="xs"
            px={2}
            py={1}
            rounded="md"
            boxShadow="sm"
          >
            {RIBBON_LABELS[ribbon]}
          </Badge>
        </Box>

        <VStack align="stretch" spacing={3} p={5}>
          <Text fontWeight="bold" fontSize="lg" color="satrf.navy" noOfLines={2}>
            {event.title}
          </Text>

          <HStack spacing={2} flexWrap="wrap">
            {event.disciplineLabels.map((d) => (
              <Badge key={d} colorScheme={disciplineColor(d)} fontSize="xs">
                {d}
              </Badge>
            ))}
          </HStack>

          <VStack align="stretch" spacing={2}>
            <HStack spacing={2} color={textMuted} fontSize="sm">
              <FaRegCalendarAlt />
              <Text>{formatEventDate(event.eventDate)}</Text>
            </HStack>
            <HStack spacing={2} color={textMuted} fontSize="sm">
              <FaMapMarkerAlt />
              <Text noOfLines={1}>{event.location}</Text>
            </HStack>
          </VStack>

          {showCapacity && (
            <Box>
              <HStack justify="space-between" mb={1}>
                <Text fontSize="xs" color={textMuted}>
                  {event.currentSpots} / {event.maxSpots} entered
                </Text>
                <Text fontSize="xs" color={textMuted}>
                  {capacityPercent(event.currentSpots, event.maxSpots)}%
                </Text>
              </HStack>
              <Progress
                value={capacityPercent(event.currentSpots, event.maxSpots)}
                size="sm"
                colorScheme={ribbon === 'full' ? 'red' : 'blue'}
                rounded="full"
              />
            </Box>
          )}

          {!isPast && !showCapacity && (
            <Text fontSize="sm" color={textMuted}>
              Open entry
            </Text>
          )}

          {!isPast && (
            <Text fontWeight="semibold" color="satrf.navy">
              {feeLabel}
            </Text>
          )}

          <VStack spacing={2} w="100%">
            {isPast ? (
              <Button
                as={Link}
                href={`/events/${event.id}#results`}
                colorScheme="blue"
                variant="outline"
                w="100%"
                size="sm"
              >
                View Results
              </Button>
            ) : (
              <>
                {hasPayfast && (
                  <Button
                    as="a"
                    href={event.payfastUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    colorScheme="pink"
                    w="100%"
                    size="sm"
                  >
                    Pay with PayFast
                  </Button>
                )}
                {event.eftInstructions && (
                  <Button variant="outline" w="100%" size="sm" onClick={onOpen}>
                    EFT details
                  </Button>
                )}
                <Button
                  w="100%"
                  size="sm"
                  variant="satrf"
                  isDisabled={!registrationOpen}
                  onClick={onRegister}
                >
                  {registrationLabel}
                </Button>
                <Button
                  as={Link}
                  href={`/events/${event.id}`}
                  variant="outline"
                  w="100%"
                  size="sm"
                >
                  Event details
                </Button>
              </>
            )}
          </VStack>
        </VStack>
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
