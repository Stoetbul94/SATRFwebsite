import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  HStack,
  Spinner,
  Text,
  VStack,
  Heading,
} from '@chakra-ui/react';
import { FiChevronLeft, FiChevronRight, FiDownload, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';
import { downloadFileName, downloadLabelForDocument } from '@/lib/rulesDownloads';

type Props = {
  file: string;
  initialPage: number;
  ruleNumber?: string;
  heading?: string;
  documentTitle?: string;
};

export default function RulesPdfViewer({
  file,
  initialPage,
  ruleNumber,
  heading,
  documentTitle = 'ISSF Rule Book',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [page, setPage] = useState(Math.max(1, initialPage || 1));
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pdfRef = useRef<import('pdfjs-dist').PDFDocumentProxy | null>(null);

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
    // initialPage is read when the PDF finishes loading; remount when file changes.
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

  const titleBits = [
    ruleNumber,
    ruleNumber && heading ? '—' : null,
    heading,
  ]
    .filter(Boolean)
    .join(' ');
  const title = titleBits || documentTitle;

  return (
    <VStack align="stretch" spacing={3} minH="70vh">
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
        <Button
          as="a"
          href={file}
          download={downloadFileName(file)}
          leftIcon={<FiDownload />}
          size="sm"
          variant="satrfOutline"
          minH="44px"
        >
          {downloadLabelForDocument(documentTitle)}
        </Button>
      </HStack>

      <Box>
        <Heading as="h1" size="md">
          {title || 'Rule viewer'}
        </Heading>
        <Text fontSize="sm" color="text.muted" mt={1}>
          {documentTitle}
          {pageCount ? ` · Page ${page} of ${pageCount}` : ''}
        </Text>
        <Text fontSize="xs" color="text.muted" mt={1}>
          In-browser viewer — works on phones where native PDF apps ignore page links.
        </Text>
      </Box>

      <HStack justify="center" spacing={3}>
        <Button
          leftIcon={<FiChevronLeft />}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          isDisabled={page <= 1 || loading}
          minH="44px"
          variant="satrfOutline"
        >
          Prev
        </Button>
        <Text fontSize="sm" minW="7rem" textAlign="center">
          {pageCount ? `${page} / ${pageCount}` : '—'}
        </Text>
        <Button
          rightIcon={<FiChevronRight />}
          onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          isDisabled={!pageCount || page >= pageCount || loading}
          minH="44px"
          variant="satrfOutline"
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
        <Box as="canvas" ref={canvasRef} mx="auto" display="block" maxW="100%" />
      </Box>
    </VStack>
  );
}
