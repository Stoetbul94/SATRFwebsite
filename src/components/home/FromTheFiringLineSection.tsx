import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  FIRING_LINE_ITEMS,
  FIRING_LINE_TYPE_LABELS,
  STATIC_FIRING_LINE_ITEMS,
  getFeaturedItem,
  getSecondaryItems,
  mergeFiringLineItems,
  type FiringLineItem,
} from '@/lib/firingLineContent';

const TYPE_BADGE_STYLES: Record<FiringLineItem['type'], string> = {
  article: 'bg-[#3182ce] text-white',
  podcast: 'bg-[#e53e3e] text-white',
  coaching: 'bg-[#1a365d] text-white',
  event: 'bg-gray-600 text-white',
};

function CardSkeleton({ featured }: { featured?: boolean }) {
  return (
    <div
      className={`animate-pulse rounded-xl border border-gray-100 bg-white shadow-md ${
        featured ? 'h-full min-h-[320px]' : 'h-full min-h-[200px]'
      }`}
    >
      <div className={`bg-gray-200 ${featured ? 'aspect-[16/10]' : 'aspect-video'}`} />
      <div className="space-y-3 p-5">
        <div className="h-3 w-16 rounded bg-gray-200" />
        <div className="h-5 w-3/4 rounded bg-gray-200" />
        <div className="h-4 w-full rounded bg-gray-200" />
      </div>
    </div>
  );
}

function FiringLineCard({
  item,
  featured = false,
}: {
  item: FiringLineItem;
  featured?: boolean;
}) {
  const imageAlt = `${item.title} — ${item.category} ${FIRING_LINE_TYPE_LABELS[item.type]}`;
  const cardClass = [
    'group flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-md transition-shadow duration-200 hover:shadow-lg',
    'focus-within:ring-2 focus-within:ring-[#3182ce] focus-within:ring-offset-2',
  ].join(' ');

  const imageWrapClass = featured
    ? 'relative aspect-[16/10] w-full overflow-hidden bg-gray-100'
    : 'relative aspect-video w-full overflow-hidden bg-gray-100';

  const inner = (
    <>
      <div className={imageWrapClass}>
        <Image
          src={item.image}
          alt={imageAlt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          sizes={featured ? '(min-width: 1024px) 50vw, 100vw' : '(min-width: 1024px) 25vw, 100vw'}
          unoptimized={item.image.startsWith('http')}
        />
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${TYPE_BADGE_STYLES[item.type]}`}
        >
          {FIRING_LINE_TYPE_LABELS[item.type]}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <span className="mb-2 inline-flex w-fit rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
          {item.category}
        </span>
        <h3
          className={`mb-2 font-bold text-[#1a365d] line-clamp-2 ${featured ? 'text-xl sm:text-2xl' : 'text-lg'}`}
        >
          {item.title}
        </h3>
        <p className="mb-4 flex-1 text-sm text-gray-600 line-clamp-2 sm:text-base">{item.summary}</p>
        <p className="text-sm font-medium text-[#3182ce]">{item.readTime}</p>
      </div>
    </>
  );

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={cardClass}
        aria-label={`${item.title} (opens in new tab)`}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={item.href} className={cardClass}>
      {inner}
    </Link>
  );
}

export default function FromTheFiringLineSection() {
  const [items, setItems] = useState<FiringLineItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/insights?limit=10');
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        const published = (data.items ?? []) as FiringLineItem[];
        const merged = mergeFiringLineItems(published, STATIC_FIRING_LINE_ITEMS);
        if (!cancelled) setItems(merged.slice(0, 4));
      } catch {
        if (!cancelled) setItems(FIRING_LINE_ITEMS.slice(0, 4));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const displayItems = items ?? [];
  const loading = items === null;
  const featured = displayItems.length ? getFeaturedItem(displayItems) : null;
  const secondary = displayItems.length ? getSecondaryItems(displayItems) : [];

  return (
    <section className="bg-gray-50 py-16 sm:py-20" aria-labelledby="firing-line-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center sm:mb-12">
          <h2
            id="firing-line-heading"
            className="mb-4 text-3xl font-bold text-[#1a365d] sm:text-4xl"
          >
            From the Firing Line
          </h2>
          <p className="mx-auto max-w-2xl text-base text-gray-600 sm:text-lg">
            Short reads, podcast conversations and practical insights from South African target
            rifle shooting.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-3 lg:gap-8">
          <div className="md:col-span-2 lg:col-span-2 lg:row-span-3">
            {loading || !featured ? (
              <CardSkeleton featured />
            ) : (
              <FiringLineCard item={featured} featured />
            )}
          </div>
          {(loading ? [0, 1, 2] : secondary).map((item, index) => (
            <div key={loading ? `sk-${index}` : (item as FiringLineItem).id} className="lg:col-span-1">
              {loading ? <CardSkeleton /> : <FiringLineCard item={item as FiringLineItem} />}
            </div>
          ))}
        </div>

        <p className="mt-10 text-center">
          <Link
            href="/insights"
            className="text-sm font-semibold text-[#3182ce] transition-colors hover:text-[#1a365d] sm:text-base"
          >
            Browse all insights →
          </Link>
        </p>
      </div>
    </section>
  );
}

export { FiringLineCard };
