'use client';

import { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Link,
} from '@chakra-ui/react';
import { disciplinePublicLabel, EVENT_DISCIPLINE_OPTIONS } from '@/lib/eventDisciplines';
import { formatEntryFee } from '@/lib/eventDisciplines';
import type { Discipline } from '@/types/scores';

export interface EventRegistrationTarget {
  id: string;
  title: string;
  price: number | null;
  disciplines: Discipline[];
  payfastUrl?: string | null;
  eftInstructions?: string | null;
}

interface EventRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventRegistrationTarget;
  onSuccess?: () => void;
}

type Step = 'form' | 'confirm';

interface RegistrationResult {
  paymentMethod: string | null;
  payfastUrl: string | null;
  eftInstructions: string | null;
  message: string;
  alreadyRegistered?: boolean;
}

export default function EventRegistrationModal({
  isOpen,
  onClose,
  event,
  onSuccess,
}: EventRegistrationModalProps) {
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [club, setClub] = useState('');
  const [phone, setPhone] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RegistrationResult | null>(null);

  const showDiscipline = event.disciplines.length > 1;
  const needsDiscipline = event.disciplines.length > 1;

  const reset = () => {
    setStep('form');
    setErrors({});
    setResult(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Full name is required';
    if (!email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Invalid email';
    if (!club.trim()) next.club = 'Club is required';
    if (needsDiscipline && !discipline) next.discipline = 'Select a discipline';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setErrors({});

    try {
      const response = await fetch(`/api/events/${event.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          club: club.trim(),
          phone: phone.trim() || undefined,
          discipline: discipline || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Registration failed');
      }

      setResult({
        paymentMethod: data.paymentMethod,
        payfastUrl: data.payfastUrl,
        eftInstructions: data.eftInstructions,
        message: data.message,
        alreadyRegistered: data.alreadyRegistered,
      });
      setStep('confirm');
      onSuccess?.();

      if (data.paymentMethod === 'payfast' && data.payfastUrl && !data.alreadyRegistered) {
        window.setTimeout(() => {
          window.open(data.payfastUrl, '_blank', 'noopener,noreferrer');
        }, 800);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setErrors({ form: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" isCentered>
      <ModalOverlay />
      <ModalContent mx={4}>
        <ModalHeader fontFamily="heading">
          {step === 'form' ? `Register — ${event.title}` : 'Registration confirmed'}
        </ModalHeader>
        <ModalCloseButton />

        {step === 'form' ? (
          <>
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Text fontSize="sm" color="text.muted">
                  {formatEntryFee(event.price)} · No login required
                </Text>
                {errors.form && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>{errors.form}</AlertDescription>
                  </Alert>
                )}
                <FormControl isRequired isInvalid={!!errors.name}>
                  <FormLabel>Full name</FormLabel>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                  {errors.name && <Text fontSize="xs" color="red.500" mt={1}>{errors.name}</Text>}
                </FormControl>
                <FormControl isRequired isInvalid={!!errors.email}>
                  <FormLabel>Email</FormLabel>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  {errors.email && <Text fontSize="xs" color="red.500" mt={1}>{errors.email}</Text>}
                </FormControl>
                <FormControl isRequired isInvalid={!!errors.club}>
                  <FormLabel>Club / Member affiliation</FormLabel>
                  <Input value={club} onChange={(e) => setClub(e.target.value)} placeholder="Your club name" />
                  {errors.club && <Text fontSize="xs" color="red.500" mt={1}>{errors.club}</Text>}
                </FormControl>
                <FormControl>
                  <FormLabel>Phone (optional)</FormLabel>
                  <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </FormControl>
                {showDiscipline && (
                  <FormControl isRequired isInvalid={!!errors.discipline}>
                    <FormLabel>Discipline</FormLabel>
                    <Select
                      placeholder="Select discipline"
                      value={discipline}
                      onChange={(e) => setDiscipline(e.target.value)}
                    >
                      {event.disciplines.map((d) => (
                        <option key={d} value={d}>
                          {disciplinePublicLabel(d)}
                        </option>
                      ))}
                    </Select>
                    {errors.discipline && (
                      <Text fontSize="xs" color="red.500" mt={1}>{errors.discipline}</Text>
                    )}
                  </FormControl>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter gap={3}>
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button variant="satrf" onClick={handleSubmit} isLoading={submitting} loadingText="Saving…">
                Register
              </Button>
            </ModalFooter>
          </>
        ) : (
          <>
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>You're registered!</AlertTitle>
                    <AlertDescription>{result?.message}</AlertDescription>
                  </Box>
                </Alert>

                {result?.paymentMethod === 'payfast' && result.payfastUrl && (
                  <Box>
                    <Text fontSize="sm" mb={2}>
                      Complete payment via PayFast (a new tab should open). If not:
                    </Text>
                    <Button
                      as="a"
                      href={result.payfastUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="satrfGold"
                      w="full"
                    >
                      Pay with PayFast
                    </Button>
                  </Box>
                )}

                {result?.paymentMethod === 'eft' && result.eftInstructions && (
                  <Box p={4} bg="bg.canvas" borderRadius="md" borderWidth="1px" borderColor="border.default">
                    <Text fontWeight="semibold" mb={2}>
                      EFT payment instructions
                    </Text>
                    <Text fontSize="sm" whiteSpace="pre-wrap">
                      {result.eftInstructions}
                    </Text>
                    <Text fontSize="xs" color="text.muted" mt={2}>
                      Your registration is saved. Payment will be confirmed by an admin once received.
                    </Text>
                  </Box>
                )}

                {result?.paymentMethod === 'free' && (
                  <Text fontSize="sm" color="text.muted">
                    No payment required. See you at the event!
                  </Text>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="satrf" onClick={handleClose}>
                Done
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
