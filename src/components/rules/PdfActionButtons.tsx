import type { ReactNode } from 'react';
import { Button, Stack } from '@chakra-ui/react';
import { FiDownload, FiExternalLink } from 'react-icons/fi';
import { downloadFileName, isLocalAsset } from '@/lib/rulesDownloads';

const tapProps = {
  size: 'sm' as const,
  minH: '44px',
  px: 4,
};

type Props = {
  openHref?: string;
  openLabel: ReactNode;
  /** When true (default), Open opens a new tab. Use false for in-app PDF viewer. */
  openInNewTab?: boolean;
  downloadHref?: string;
  downloadLabel: string;
  officialHref?: string;
  officialLabel?: string;
};

export default function PdfActionButtons({
  openHref,
  openLabel,
  openInNewTab = true,
  downloadHref,
  downloadLabel,
  officialHref,
  officialLabel = 'Official ISSF Source',
}: Props) {
  const canDownload = isLocalAsset(downloadHref);

  return (
    <Stack
      direction={{ base: 'column', sm: 'row' }}
      spacing={2}
      align={{ base: 'stretch', sm: 'center' }}
      flexWrap="wrap"
    >
      {openHref && (
        <Button
          as="a"
          href={openHref}
          target={openInNewTab ? '_blank' : undefined}
          rel={openInNewTab ? 'noopener noreferrer' : undefined}
          variant="satrf"
          {...tapProps}
        >
          {openLabel}
        </Button>
      )}
      {canDownload && (
        <Button
          as="a"
          href={downloadHref}
          download={downloadFileName(downloadHref)}
          variant="satrfOutline"
          leftIcon={<FiDownload />}
          {...tapProps}
        >
          {downloadLabel}
        </Button>
      )}
      {officialHref && (
        <Button
          as="a"
          href={officialHref}
          target="_blank"
          rel="noopener noreferrer"
          variant="ghost"
          leftIcon={<FiExternalLink />}
          {...tapProps}
        >
          {officialLabel}
        </Button>
      )}
    </Stack>
  );
}
