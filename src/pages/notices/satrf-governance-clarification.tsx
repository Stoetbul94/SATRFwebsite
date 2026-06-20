import fs from 'fs';
import path from 'path';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import type { GetStaticProps } from 'next';
import {
  Badge,
  Box,
  Button,
  Divider,
  Heading,
  HStack,
  Link as ChakraLink,
  List,
  ListItem,
  OrderedList,
  Stack,
  Text,
  UnorderedList,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { FiDownload, FiExternalLink } from 'react-icons/fi';
import Layout from '@/components/layout/Layout';
import PublicPageShell from '@/components/layout/PublicPageShell';
import FlagStripe from '@/components/brand/FlagStripe';

const SITE_URL = 'https://satrf.org.za';
const PAGE_PATH = '/notices/satrf-governance-clarification';
const OG_IMAGE = '/images/notices/satrf-governance-communique-page-1.png';
const SCAN_PAGE_1 = '/images/notices/satrf-governance-communique-page-1.png';
const SCAN_PAGE_2 = '/images/notices/satrf-governance-communique-page-2.png';
const PDF_PATH = 'public/documents/satrf-governance-communique-23-january-2026.pdf';
// TODO: Add signed communiqué PDF at public/documents/satrf-governance-communique-23-january-2026.pdf

const META_TITLE = 'Official Notice: SATRF Governance Clarification | SATRF';
const META_DESCRIPTION =
  'Official SATRF notice clarifying recognised governance for non-air-rifle ISSF rifle disciplines in South Africa.';

const REFERENCE_LINKS = [
  { label: 'ISSF Rules', href: 'https://www.issf-sports.org/rules' },
  {
    label: 'ISSF Member Federations',
    href: 'https://www.issf-sports.org/issf/organisation/member-federations',
  },
  { label: 'SASSCo', href: 'https://www.sassf.co.za/' },
  { label: 'SAARA', href: 'https://www.saara.org.za/' },
] as const;

interface PageProps {
  showPdfDownload: boolean;
}

function NoticeSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const headingColor = useColorModeValue('#1a365d', 'white');
  return (
    <Box as="section">
      <Heading as="h2" size="md" color={headingColor} mb={3}>
        {title}
      </Heading>
      {children}
    </Box>
  );
}

function BodyText({ children }: { children: React.ReactNode }) {
  const mutedText = useColorModeValue('gray.600', 'gray.300');
  return (
    <Text color={mutedText} lineHeight="tall" mb={4}>
      {children}
    </Text>
  );
}

function CommuniqueScan({
  src,
  alt,
  caption,
  borderColor,
}: {
  src: string;
  alt: string;
  caption: string;
  borderColor: string;
}) {
  return (
    <Box borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden" bg="white">
      <Box position="relative" w="100%" minH={{ base: '280px', md: '480px' }}>
        <Image
          src={src}
          alt={alt}
          width={1200}
          height={1600}
          style={{ width: '100%', height: 'auto' }}
          sizes="(min-width: 768px) 768px, 100vw"
        />
      </Box>
      <Text fontSize="xs" color="gray.500" px={4} py={2} textAlign="center">
        {caption}
      </Text>
    </Box>
  );
}

export default function SatrfGovernanceClarificationPage({ showPdfDownload }: PageProps) {
  const pageUrl = `${SITE_URL}${PAGE_PATH}`;
  const ogImageUrl = `${SITE_URL}${OG_IMAGE}`;
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedText = useColorModeValue('gray.600', 'gray.300');
  const noticeBg = useColorModeValue('blue.50', 'gray.700');
  const noticeBorder = useColorModeValue('#3182ce', 'blue.300');
  const warningBg = useColorModeValue('gray.50', 'gray.900');
  const signatureBg = useColorModeValue('gray.50', 'gray.900');
  const listColor = useColorModeValue('gray.700', 'gray.200');

  return (
    <Layout>
      <Head>
        <title>{META_TITLE}</title>
        <meta name="description" content={META_DESCRIPTION} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={META_TITLE} />
        <meta property="og:description" content={META_DESCRIPTION} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={ogImageUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={META_TITLE} />
        <meta name="twitter:description" content={META_DESCRIPTION} />
        <meta name="twitter:image" content={ogImageUrl} />
      </Head>

      <PublicPageShell maxW="4xl">
        <Box
          bg={cardBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="xl"
          overflow="hidden"
          boxShadow="md"
        >
          <Box position="relative" pt={1}>
            <FlagStripe thickness={4} />
          </Box>

          <Box px={{ base: 5, md: 10 }} py={{ base: 8, md: 10 }}>
            <VStack align="stretch" spacing={6}>
              <HStack flexWrap="wrap" spacing={2}>
                <Badge colorScheme="red" fontSize="xs" px={3} py={1} borderRadius="full">
                  Official SATRF Notice
                </Badge>
                <Badge variant="outline" colorScheme="blue" fontSize="xs" px={3} py={1} borderRadius="full">
                  Governance / Member Notice
                </Badge>
              </HStack>

              <Text fontSize="sm" color={mutedText}>
                <time dateTime="2026-01-23">23 January 2026</time>
              </Text>

              <Heading as="h1" size="xl" color="#1a365d" lineHeight="shorter">
                Official Notice: SATRF Governance Clarification
              </Heading>

              <Text fontSize="md" fontWeight="semibold" color="#1a365d">
                Communiqué — The South African Target Rifle Federation (&ldquo;SATRF&rdquo;)
              </Text>

              <Text fontWeight="medium" color="#1a365d">
                Dear Members of the Public
              </Text>

              <BodyText>
                It has come to the attention of the Committee of the South African Target Rifle Federation
                (&ldquo;SATRF&rdquo;), that the general public may be receiving inaccurate information with
                respect to the appropriate governing bodies that regulate rifle shooting sport events, governed
                by the International Shooting Sports Federation (and concomitantly the International Olympic
                Committee) within the Republic of South Africa.
              </BodyText>

              <BodyText>The purpose of this communique is to clarify matters.</BodyText>

              <Box
                bg={noticeBg}
                borderLeftWidth="4px"
                borderLeftColor={noticeBorder}
                px={5}
                py={4}
                borderRadius="md"
                role="note"
                aria-label="Important notice"
              >
                <Text fontWeight="semibold" color="#1a365d" mb={2}>
                  Important
                </Text>
                <Text color={mutedText} fontSize="sm" lineHeight="tall">
                  This notice is provided for public clarity. Where any uncertainty exists, members should
                  rely on written confirmation from SATRF and the relevant recognised national sport
                  structures.
                </Text>
              </Box>

              <Divider />

              <NoticeSection title="Jurisdiction and recognition">
                <OrderedList spacing={4} color={listColor} pl={4} styleType="decimal">
                  <ListItem>
                    All shooting sports within the Republic of South Africa fall under the jurisdiction of the{' '}
                    <Text as="span" fontWeight="semibold">
                      South African Shooting Sports Confederation (SASSCo)
                    </Text>
                    . SASSCo is accordingly recognised by inter alia the{' '}
                    <Text as="span" fontWeight="semibold">
                      South African Sports Confederation and Olympic and Paralympic Committee (SASCOC)
                    </Text>
                    , and the{' '}
                    <Text as="span" fontWeight="semibold">
                      International Shooting Sports Federation (ISSF)
                    </Text>{' '}
                    in this regard.
                  </ListItem>
                  <ListItem>
                    With respect to the ISSF rifle disciplines in particular, (including the Olympic
                    disciplines) SASSCo{' '}
                    <Text as="span" fontWeight="bold">
                      ONLY
                    </Text>{' '}
                    recognises 2 membership bodies, as being in good standing namely:
                    <UnorderedList mt={3} spacing={3} styleType="none" pl={0}>
                      <ListItem>
                        <Text as="span" fontWeight="semibold">
                          a.
                        </Text>{' '}
                        The{' '}
                        <Text as="span" fontWeight="semibold">
                          South African Air Rifle Association (&ldquo;SAARA&rdquo;)
                        </Text>{' '}
                        which has jurisdiction over all ISSF events utilising an air rifle and,
                      </ListItem>
                      <ListItem>
                        <Text as="span" fontWeight="semibold">
                          b.
                        </Text>{' '}
                        The{' '}
                        <Text as="span" fontWeight="semibold">
                          South African Target Rifle Federation
                        </Text>{' '}
                        for{' '}
                        <Text as="span" fontWeight="bold">
                          all other
                        </Text>{' '}
                        ISSF disciplines including but not limited to:
                        <OrderedList mt={2} spacing={2} styleType="lower-roman" pl={6}>
                          <ListItem>
                            The 50-meter 3 position event (
                            <Text as="span" fontWeight="semibold">
                              the sole non air rifle Olympic event
                            </Text>
                            )
                          </ListItem>
                          <ListItem>The 50-meter prone event</ListItem>
                          <ListItem>The 300-meter 3 position event</ListItem>
                          <ListItem>The 300-meter prone event</ListItem>
                          <ListItem>The 300-meter standard rifle open event</ListItem>
                        </OrderedList>
                      </ListItem>
                    </UnorderedList>
                  </ListItem>
                  <ListItem>
                    No other organisation in South Africa may in any way hold out or claim any official
                    jurisdiction with respect to these disciplines.
                  </ListItem>
                </OrderedList>
              </NoticeSection>

              <NoticeSection title="Eligibility">
                <BodyText>
                  With respect to the South African Target Rifle Federation{' '}
                  <Text as="span" fontWeight="bold">
                    ONLY
                  </Text>{' '}
                  members in good standing with the Federation are eligible to:
                </BodyText>
                <OrderedList spacing={3} color={listColor} pl={4} styleType="decimal">
                  <ListItem>
                    Represent South Africa{' '}
                    <Text as="span" fontWeight="semibold">
                      in any event held under the jurisdiction of the ISSF or related body
                    </Text>
                    , including the Olympic Games, (excluding Air Rifle events), in any capacity as an
                    athlete, coach or team official.
                  </ListItem>
                  <ListItem>
                    Obtain official accreditation from the ISSF as a technical officer or coach (unless
                    obtained via SAARA).
                  </ListItem>
                </OrderedList>
              </NoticeSection>

              <NoticeSection title="Membership">
                <BodyText>
                  Membership of SATRF include entities and persons that are provinces (being one of the 9
                  geographic provinces of South Africa), districts, associations, clubs and natural persons.
                </BodyText>
              </NoticeSection>

              <Box
                bg={warningBg}
                borderWidth="2px"
                borderColor="#1a365d"
                borderRadius="lg"
                px={5}
                py={5}
              >
                <Text color="#1a365d" fontWeight="bold" lineHeight="tall" textDecoration="underline">
                  Any entity, or persons claiming to have any jurisdiction (or purporting to be obtaining
                  recognition) in the disciplines mentioned above other than SATRF are to be dismissed as
                  baseless and ignored.
                </Text>
              </Box>

              <BodyText>
                Please note that the above only applies to the events or disciplines under the jurisdiction
                of SATRF, for all other disciplines members of the public are advised to contact SASSCo who
                will advise the member of the public as to which SASSCo organisation regulates their
                discipline.
              </BodyText>

              <BodyText>
                We trust the above clarifies the situation and wish all shooting sports participants and
                supporters the very best for 2026.
              </BodyText>

              <Divider />

              <NoticeSection title="Signed communiqué (original)">
                <VStack spacing={4} align="stretch">
                  <CommuniqueScan
                    src={SCAN_PAGE_1}
                    alt="Signed SATRF communiqué page 1 — jurisdiction, recognition and eligibility"
                    caption="Page 1 of 2"
                    borderColor={borderColor}
                  />
                  <CommuniqueScan
                    src={SCAN_PAGE_2}
                    alt="Signed SATRF communiqué page 2 — President J. Steyn signature, 23 January 2026"
                    caption="Page 2 of 2 — signature"
                    borderColor={borderColor}
                  />
                </VStack>
              </NoticeSection>

              <Box
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="lg"
                px={5}
                py={5}
                bg={signatureBg}
              >
                <Text fontWeight="semibold" color="#1a365d" mb={1}>
                  J. Steyn
                </Text>
                <Text color={mutedText} mb={3}>
                  President
                  <br />
                  The South African Target Rifle Federation
                  <br />
                  <time dateTime="2026-01-23">23 January 2026</time>
                </Text>
                <Text fontWeight="semibold" color="#1a365d" mb={1}>
                  By order of:
                </Text>
                <Text color={mutedText}>The committee of SATRF</Text>
              </Box>

              <Stack direction={{ base: 'column', sm: 'row' }} spacing={3} flexWrap="wrap" pt={2}>
                <Button
                  as={Link}
                  href="/contact"
                  colorScheme="blue"
                  bg="#3182ce"
                  _hover={{ bg: '#1a365d' }}
                  size="lg"
                  aria-label="Contact SATRF"
                >
                  Contact SATRF
                </Button>
                <Button
                  as="a"
                  href="https://www.issf-sports.org/rules"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outline"
                  colorScheme="blue"
                  size="lg"
                  rightIcon={<FiExternalLink aria-hidden="true" />}
                  aria-label="View ISSF Rules (opens in new tab)"
                >
                  View ISSF Rules
                </Button>
                {showPdfDownload ? (
                  <Button
                    as="a"
                    href="/documents/satrf-governance-communique-23-january-2026.pdf"
                    download
                    variant="outline"
                    colorScheme="gray"
                    size="lg"
                    leftIcon={<FiDownload aria-hidden="true" />}
                    aria-label="Download full signed communiqué PDF"
                  >
                    Download full signed communiqué
                  </Button>
                ) : (
                  <Button
                    as="a"
                    href={SCAN_PAGE_1}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outline"
                    colorScheme="gray"
                    size="lg"
                    rightIcon={<FiExternalLink aria-hidden="true" />}
                    aria-label="View signed scan (opens in new tab)"
                  >
                    View signed scan
                  </Button>
                )}
              </Stack>

              <Box as="section" pt={4}>
                <Heading as="h2" size="sm" color="#1a365d" mb={3}>
                  Reference links
                </Heading>
                <List spacing={2}>
                  {REFERENCE_LINKS.map((link) => (
                    <ListItem key={link.href}>
                      <ChakraLink
                        href={link.href}
                        isExternal
                        color="#3182ce"
                        fontWeight="medium"
                        _hover={{ color: '#1a365d', textDecoration: 'underline' }}
                        aria-label={`${link.label} (opens in new tab)`}
                      >
                        {link.label}
                      </ChakraLink>
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Text fontSize="sm" pt={2}>
                <Link href="/notices" className="text-[#3182ce] hover:text-[#1a365d]">
                  ← All official notices
                </Link>
              </Text>
            </VStack>
          </Box>
        </Box>
      </PublicPageShell>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  const showPdfDownload = fs.existsSync(path.join(process.cwd(), PDF_PATH));
  return { props: { showPdfDownload } };
};
