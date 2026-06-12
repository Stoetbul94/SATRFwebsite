'use client';

import { Badge, HStack } from '@chakra-ui/react';

const STATUS_PATTERNS: { pattern: RegExp; label: string; colorScheme: string }[] = [
  { pattern: /\bprohibited\b/i, label: 'Prohibited', colorScheme: 'red' },
  { pattern: /\bnot on the \d{4} prohibited list\b/i, label: 'Not listed', colorScheme: 'green' },
  { pattern: /\bpermitted\b/i, label: 'Permitted', colorScheme: 'green' },
  { pattern: /\bthreshold\b/i, label: 'Threshold', colorScheme: 'orange' },
  { pattern: /\bTUE\b/i, label: 'TUE required', colorScheme: 'orange' },
  { pattern: /\bverify\b/i, label: 'Verify', colorScheme: 'orange' },
];

export default function StatusBadges({ content }: { content: string }) {
  const matches = STATUS_PATTERNS.filter((item) => item.pattern.test(content));
  if (matches.length === 0) return null;

  return (
    <HStack spacing={2} flexWrap="wrap" mt={2}>
      {matches.map((item) => (
        <Badge key={item.label} colorScheme={item.colorScheme} fontSize="xs" px={2} py={0.5}>
          {item.label}
        </Badge>
      ))}
    </HStack>
  );
}

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export function MessageContent({ content, role }: { content: string; role: 'user' | 'assistant' }) {
  const paragraphs = content.split(/\n{2,}/).filter(Boolean);
  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p key={index} style={{ marginBottom: index < paragraphs.length - 1 ? '0.75rem' : 0 }}>
          {renderInlineMarkdown(paragraph)}
        </p>
      ))}
      {role === 'assistant' && <StatusBadges content={content} />}
    </>
  );
}
