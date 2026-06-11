'use client';

import { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import {
  Box,
  Button,
  Card,
  CardBody,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Icon,
  Heading,
  Input,
  FormLabel,
  IconButton,
} from '@chakra-ui/react';
import { FiHeart, FiCreditCard, FiHome, FiMail, FiCopy, FiCheck, FiTarget, FiUsers } from 'react-icons/fi';
import Layout from '@/components/layout/Layout';
import PublicPageShell from '@/components/layout/PublicPageShell';
import PublicPageHeader from '@/components/layout/PublicPageHeader';
import FlagStripe from '@/components/brand/FlagStripe';
import TargetRingMotif from '@/components/brand/TargetRingMotif';

const payfastUrl = process.env.NEXT_PUBLIC_PAYFAST_URL || 'https://www.payfast.co.za/eng/process';
const merchant_id = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID || '24319614';
const merchant_key = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY || 'sshi091ovn1fa';
const return_url =
  process.env.NEXT_PUBLIC_PAYFAST_RETURN_URL ||
  (typeof window !== 'undefined' ? `${window.location.origin}/donate/thank-you` : '/donate/thank-you');
const cancel_url =
  process.env.NEXT_PUBLIC_PAYFAST_CANCEL_URL ||
  (typeof window !== 'undefined' ? `${window.location.origin}/donate` : '/donate');
const notify_url =
  process.env.NEXT_PUBLIC_PAYFAST_NOTIFY_URL ||
  (typeof window !== 'undefined' ? `${window.location.origin}/api/payfast-notify` : '/api/payfast-notify');

const bankingDetails = {
  accountName: 'South African Target Rifle Federation',
  bank: 'Standard Bank Vereeniging',
  accountType: 'Savings',
  accountNumber: '02 233 062 3',
  branchCode: '014673',
  electronicPaymentsCode: '051001',
  proofOfPayment: 'satrf.shooting@gmail.com',
};

export default function Donate() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'payfast' | 'eft'>('payfast');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const presetAmounts = [100, 250, 500];

  const getDonationAmount = () => {
    if (customAmount) return Number(customAmount).toFixed(2);
    if (selectedAmount) return selectedAmount.toFixed(2);
    return '100.00';
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Donate to Olympic Shooting – SATRF</title>
        <meta name="description" content="Support the South African Target Rifle Federation." />
      </Head>

      <Box
        bg="brand"
        color="white"
        py={{ base: 12, md: 16 }}
        position="relative"
        overflow="hidden"
        textAlign={{ base: 'center', md: 'left' }}
      >
        <TargetRingMotif top="10%" right="-5%" size={320} opacity={0.08} color="white" />
        <Box
          maxW="container.xl"
          mx="auto"
          px={{ base: 4, md: 8 }}
          position="relative"
          zIndex={1}
        >
          <Box
            display="flex"
            justifyContent={{ base: 'center', md: 'flex-start' }}
            mb={6}
          >
            <Image
              src="/brand/satrf-emblem-transparent.png"
              alt="SATRF emblem"
              width={588}
              height={644}
              priority
              style={{
                height: 'clamp(80px, 14vw, 100px)',
                width: 'auto',
                objectFit: 'contain',
              }}
            />
          </Box>
          <Text textStyle="eyebrow" color="satrf.gold.300" mb={2}>
            Give
          </Text>
          <Heading size="2xl" mb={4} color="white">
            Support Olympic Shooting in South Africa
          </Heading>
          <Text fontSize="lg" color="whiteAlpha.800" maxW="2xl" mb={8} mx={{ base: 'auto', md: 0 }}>
            Every donation helps train the next generation of South African shooters.
          </Text>
          <Button
            as="a"
            href="#donate-form"
            variant="satrfGold"
            size="lg"
          >
            Choose amount
          </Button>
        </Box>
        <Box position="absolute" bottom={0} left={0} right={0}>
          <FlagStripe thickness={4} />
        </Box>
      </Box>

      <PublicPageShell maxW="container.md">
        <VStack align="stretch" spacing={8}>
          <PublicPageHeader
            title="Choose Your Donation"
            subtitle="Secure PayFast or EFT — every contribution supports training, equipment, and competitions."
            showMotif={false}
          />

          <Card id="donate-form">
            <CardBody>
              <Text fontWeight="semibold" mb={4}>
                Payment method
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mb={8}>
                <Button
                  variant={paymentMethod === 'payfast' ? 'satrf' : 'satrfOutline'}
                  leftIcon={<FiCreditCard />}
                  onClick={() => setPaymentMethod('payfast')}
                >
                  PayFast (Card)
                </Button>
                <Button
                  variant={paymentMethod === 'eft' ? 'satrf' : 'satrfOutline'}
                  leftIcon={<FiHome />}
                  onClick={() => setPaymentMethod('eft')}
                >
                  EFT Transfer
                </Button>
              </SimpleGrid>

              {paymentMethod === 'payfast' && (
                <Box as="form" action={payfastUrl} method="post" target="_blank">
                  <input type="hidden" name="merchant_id" value={merchant_id} />
                  <input type="hidden" name="merchant_key" value={merchant_key} />
                  <input type="hidden" name="return_url" value={return_url} />
                  <input type="hidden" name="cancel_url" value={cancel_url} />
                  <input type="hidden" name="notify_url" value={notify_url} />
                  <input type="hidden" name="item_name" value="SATRF Olympic Shooting Donation" />
                  <input type="hidden" name="email_confirmation" value="1" />
                  <input type="hidden" name="confirmation_address" value="satrf.shooting@gmail.com" />
                  <input type="hidden" name="currency" value="ZAR" />
                  <input type="hidden" name="amount" value={getDonationAmount()} />

                  <HStack spacing={2} flexWrap="wrap" mb={6} justify="center">
                    {presetAmounts.map((amount) => (
                      <Button
                        key={amount}
                        type="button"
                        size="sm"
                        variant={selectedAmount === amount && !customAmount ? 'satrfGold' : 'satrfOutline'}
                        onClick={() => {
                          setSelectedAmount(amount);
                          setCustomAmount('');
                        }}
                      >
                        R{amount}
                      </Button>
                    ))}
                  </HStack>

                  <FormLabel>Custom amount (ZAR)</FormLabel>
                  <Input
                    type="number"
                    placeholder="e.g. 500"
                    min={10}
                    step={10}
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedAmount(null);
                    }}
                    mb={6}
                    bg="bg.canvas"
                  />

                  <Button type="submit" variant="satrf" size="lg" w="100%">
                    Donate R{getDonationAmount()} with PayFast
                  </Button>
                  <Text fontSize="xs" color="text.muted" mt={3} textAlign="center">
                    Secure payment via PayFast. ZAR only.
                  </Text>
                </Box>
              )}

              {paymentMethod === 'eft' && (
                <VStack align="stretch" spacing={3}>
                  {Object.entries(bankingDetails).map(([key, value]) => (
                    <HStack
                      key={key}
                      justify="space-between"
                      p={3}
                      bg="bg.canvas"
                      rounded="md"
                      flexWrap="wrap"
                    >
                      <Text fontSize="sm" fontWeight="medium" textTransform="capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Text>
                      <HStack>
                        <Text fontFamily="mono" fontSize="sm" fontWeight="semibold">
                          {value}
                        </Text>
                        <IconButton
                          aria-label="Copy"
                          size="sm"
                          variant="ghost"
                          icon={copiedField === key ? <FiCheck color="green" /> : <FiCopy />}
                          onClick={() => copyToClipboard(value, key)}
                        />
                      </HStack>
                    </HStack>
                  ))}
                  <Button
                    as="a"
                    href="mailto:satrf.shooting@gmail.com?subject=SATRF Donation - Proof of Payment"
                    variant="satrf"
                    leftIcon={<FiMail />}
                    mt={4}
                  >
                    Email Proof of Payment
                  </Button>
                </VStack>
              )}
            </CardBody>
          </Card>

          <PublicPageHeader
            eyebrow="Impact"
            title="Your Donation Makes a Difference"
            showStripe={false}
            showMotif={false}
          />
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            {[
              { icon: FiTarget, title: 'Training Programs', text: 'Coaching for young shooters' },
              { icon: FiHeart, title: 'Equipment', text: 'Quality gear for competitions' },
              { icon: FiUsers, title: 'Competitions', text: 'Local and national events' },
            ].map((item) => (
              <Card key={item.title}>
                <CardBody textAlign="center">
                  <Icon as={item.icon} boxSize={8} color="accent" mb={3} />
                  <Heading size="sm" mb={2}>
                    {item.title}
                  </Heading>
                  <Text fontSize="sm" color="text.muted">
                    {item.text}
                  </Text>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          <Card>
            <CardBody textAlign="center">
              <Heading size="md" mb={2}>
                Questions about donating?
              </Heading>
              <Text color="text.muted" mb={4} fontSize="sm">
                We&apos;re happy to help with any donation queries.
              </Text>
              <Button as={Link} href="mailto:satrf.shooting@gmail.com" variant="satrfOutline" leftIcon={<FiMail />}>
                Contact Us
              </Button>
            </CardBody>
          </Card>
        </VStack>
      </PublicPageShell>
    </Layout>
  );
}
