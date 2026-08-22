import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  HStack,
  Spinner,
  Text,
  VStack,
  Heading,
} from '@chakra-ui/react';
import {
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiArrowLeft,
  FiExternalLink,
} from 'react-icons/fi';
import Link from 'next/link';
import {
  downloadFileName,
  downloadLabelForDocument,
  ruleViewerHref,
} from '@/lib/rulesDownloads';
import type { ResolvedRulesDocument } from '@/lib/rulesDocumentResolver';
import { getCurrentRulebookDocument } from '@/lib/rulesDocumentResolver';

type Props = {
  document: ResolvedRulesDocument;
  initialPage: number;
  ruleNumber?: string;
  heading?: string;
};

function statusBadge(status: ResolvedRulesDocument['status']) {
  if (status === 'current') {
    return (
      <Badge colorScheme="green" data-testid="viewer-status-current">
        CURRENT
      </Badge>
    );
  }
  if (status === 'superseded') {
    return (
      <Badge colorScheme="orange" data-testid="viewer-status-archive">
        ARCHIVE / SUPERSEDED
      </Badge>
    );
  }
  return (
    <Badge colorScheme="gray" data-testid="viewer-status-reference">
      REFERENCE
    </Badge>
  );
}

export default function RulesPdfViewer({
  document,
  initialPage,
  ruleNumber,
  heading,
}: Props) {
  const file = document.localPath;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [page, setPage] = useState(Math.max(1, initialPage || 1));
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pdfRef = useRef<import('pdfjs-dist').PDFDocumentProxy | null>(null);
  const currentRulebook = getCurrentRulebookDocument();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
        const task = pdfjs.getDocument({ url: file, withCredentials: false });
        const pdf = await task.promise;
        if (cancelled) {
          await pdf.destroy();
          return;
        }
        pdfRef.current = pdf;
        setPageCount(pdf.numPages);
        setPage(Math.min(Math.max(1, initialPage || 1), pdf.numPages));
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not open PDF');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      void pdfRef.current?.destroy();
      pdfRef.current = null;
    };
  }, [file, initialPage]);

  const renderPage = useCallback(async (pageNum: number) => {
    const pdf = pdfRef.current;
    const canvas = canvasRef.current;
    if (!pdf || !canvas) return;
    const pdfPage = await pdf.getPage(pageNum);
    const base = pdfPage.getViewport({ scale: 1 });
    const maxWidth = Math.min(window.innerWidth - 24, 900);
    const scale = maxWidth / base.width;
    const viewport = pdfPage.getViewport({ scale: Math.max(0.8, Math.min(scale, 2)) });
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await pdfPage.render({ canvasContext: ctx, viewport }).promise;
  }, []);

  useEffect(() => {
    if (loading || error || !pageCount) return;
    void renderPage(page);
  }, [page, pageCount, loading, error, renderPage]);

  const ruleTitle = [ruleNumber, ruleNumber && heading ? '—' : null, heading]
    .filter(Boolean)
    .join(' ');

  const canvasLabel =
    ruleNumber && heading && pageCount
      ? `Rule ${ruleNumber}, ${heading}. Page ${page} of ${pageCount}.`
      : pageCount
        ? `ISSF Rule Book page ${page} of ${pageCount}.`
        : 'Loading rule book page';

  const displayTitle = document.section || document.title.replace(/\.pdf$/i, '');

  return (
    <VStack align="stretch" spacing={3} minH="70vh" data-testid="rules-pdf-viewer">
      <HStack justify="space-between" flexWrap="wrap" gap={2}>
        <Button
          as={Link}
          href="/rules"
          leftIcon={<FiArrowLeft />}
          size="sm"
          variant="satrfOutline"
          minH="44px"
        >
          Back to Rule Finder
        </Button>
        <HStack spacing={2} flexWrap="wrap">
          {document.officialUrl && (
            <Button
              as="a"
              href={document.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              leftIcon={<FiExternalLink />}
              size="sm"
              variant="ghost"
              minH="44px"
            >
              View Official ISSF Source
            </Button>
          )}
          <Button
            as="a"
            href={file}
            download={downloadFileName(file)}
            leftIcon={<FiDownload />}
            size="sm"
            variant="satrfOutline"
            minH="44px"
          >
            {downloadLabelForDocument(displayTitle)}
          </Button>
        </HStack>
      </HStack>

      <Box>
        <HStack spacing={2} flexWrap="wrap" align="center">
          <Heading as="h1" size="md" data-testid="viewer-document-title">
            {displayTitle}
          </Heading>
          {statusBadge(document.status)}
        </HStack>
        {document.edition && (
          <Text fontSize="sm" color="text.muted" mt={1} data-testid="viewer-edition">
            {document.edition}
          </Text>
        )}
        {document.effectiveDate && (
          <Text fontSize="sm" color="text.muted">
            Effective {document.effectiveDate}
          </Text>
        )}
        {document.status === 'superseded' && (
          <Box mt={3} p={3} borderWidth="1px" borderColor="orange.200" borderRadius="md" bg="orange.50">
            <Text fontSize="sm" color="text.muted">
              This document is retained for reference and is not the current ISSF rulebook.
            </Text>
            {currentRulebook && (
              <Button
                as={Link}
                href={ruleViewerHref({ pdfUrl: currentRulebook.localPath })}
                size="sm"
                variant="satrf"
                mt={2}
                minH="44px"
              >
                Open Current Rule Book
              </Button>
            )}
          </Box>
        )}
        {ruleTitle && (
          <Heading as="h2" size="sm" mt={3}>
            {ruleTitle}
          </Heading>
        )}
        <Text fontSize="sm" color="text.muted" mt={1} data-testid="viewer-page-count">
          {pageCount ? `Page ${page} of ${pageCount}` : 'Loading pages…'}
        </Text>
      </Box>

      <HStack justify="center" spacing={3}>
        <Button
          leftIcon={<FiChevronLeft />}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          isDisabled={page <= 1 || loading}
          minH="44px"
          variant="satrfOutline"
          aria-label="Previous page"
        >
          Prev
        </Button>
        <Text fontSize="sm" minW="7rem" textAlign="center" aria-live="polite">
          {pageCount ? `${page} / ${pageCount}` : '—'}
        </Text>
        <Button
          rightIcon={<FiChevronRight />}
          onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          isDisabled={!pageCount || page >= pageCount || loading}
          minH="44px"
          variant="satrfOutline"
          aria-label="Next page"
        >
          Next
        </Button>
      </HStack>

      {loading && (
        <HStack justify="center" py={10}>
          <Spinner />
          <Text fontSize="sm">Loading page…</Text>
        </HStack>
      )}
      {error && (
        <Box>
          <Text color="red.500" mb={3}>
            {error}
          </Text>
          <Button as="a" href={file} target="_blank" rel="noopener noreferrer" variant="satrf">
            Open original PDF
          </Button>
        </Box>
      )}

      <Box
        overflowX="auto"
        mx={{ base: -4, md: 0 }}
        borderWidth="1px"
        borderColor="border.subtle"
        bg="gray.50"
        display={loading || error ? 'none' : 'block'}
      >
        <Box
          as="canvas"
          ref={canvasRef}
          mx="auto"
          display="block"
          maxW="100%"
          role="img"
          aria-label={canvasLabel}
        />
      </Box>
    </VStack>
  );
}
