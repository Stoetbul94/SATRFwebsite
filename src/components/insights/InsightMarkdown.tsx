import ReactMarkdown from 'react-markdown';

interface InsightMarkdownProps {
  content: string;
  className?: string;
}

export default function InsightMarkdown({ content, className }: InsightMarkdownProps) {
  return (
    <div className={className ?? 'prose prose-gray max-w-none'}>
      <ReactMarkdown
        components={{
          img: ({ alt, src }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt ?? ''} className="rounded-lg" loading="lazy" />
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-[#3182ce] hover:text-[#1a365d]"
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
