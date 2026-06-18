import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import { FiringLineCard } from '@/components/home/FromTheFiringLineSection';
import {
  FIRING_LINE_ITEMS,
  STATIC_FIRING_LINE_ITEMS,
  mergeFiringLineItems,
  type FiringLineItem,
} from '@/lib/firingLineContent';

export default function InsightsIndexPage() {
  const [items, setItems] = useState<FiringLineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/insights?limit=50');
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        const published = (data.items ?? []) as FiringLineItem[];
        const merged = mergeFiringLineItems(published, STATIC_FIRING_LINE_ITEMS);
        if (!cancelled) setItems(merged);
      } catch {
        if (!cancelled) setItems(FIRING_LINE_ITEMS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Layout>
      <Head>
        <title>From the Firing Line — Insights | SATRF</title>
        <meta
          name="description"
          content="Short reads, Inner Tens podcast episodes, and practical insights from South African target rifle shooting."
        />
        <link rel="canonical" href="https://satrf.org.za/insights" />
      </Head>

      <div className="bg-gray-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#3182ce]">
              SATRF content hub
            </p>
            <h1 className="mb-4 text-3xl font-bold text-[#1a365d] sm:text-4xl">
              From the Firing Line
            </h1>
            <p className="mx-auto max-w-2xl text-gray-600">
              Articles, podcast conversations and practical notes for shooters, coaches and clubs.
            </p>
          </div>

          {loading ? (
            <p className="text-center text-gray-500">Loading insights…</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 lg:gap-8">
              {items.map((item) => (
                <FiringLineCard key={item.id} item={item} featured={item.featured} />
              ))}
            </div>
          )}

          <p className="mt-10 text-center">
            <Link href="/" className="text-sm font-medium text-[#3182ce] hover:text-[#1a365d]">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
