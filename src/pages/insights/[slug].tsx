import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import Layout from '@/components/layout/Layout';
import InsightMarkdown from '@/components/insights/InsightMarkdown';
import {
  FIRING_LINE_TYPE_LABELS,
  getFiringLineItemBySlug,
  FIRING_LINE_ITEMS,
  mapInsightDocToItem,
  type FiringLineItem,
} from '@/lib/firingLineContent';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { getPublishedInsightBySlug } from '@/lib/insightsServer';

interface InsightPageProps {
  item: FiringLineItem;
  bodyMarkdown: string;
}

export default function InsightArticlePage({ item, bodyMarkdown }: InsightPageProps) {
  return (
    <Layout>
      <Head>
        <title>{item.title} | SATRF Insights</title>
        <meta name="description" content={item.summary} />
        <link rel="canonical" href={`https://satrf.org.za/insights/${item.slug}`} />
      </Head>

      <article className="bg-white">
        <div className="relative aspect-[21/9] w-full bg-gray-100 sm:aspect-[3/1]">
          <Image
            src={item.image}
            alt={`${item.title} — ${item.category}`}
            fill
            className="object-cover"
            priority
            sizes="100vw"
            unoptimized={item.image.startsWith('http')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a365d]/80 via-transparent to-transparent" />
        </div>

        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#3182ce] px-3 py-1 text-xs font-semibold text-white">
              {FIRING_LINE_TYPE_LABELS[item.type]}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              {item.category}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
              {item.readTime}
            </span>
          </div>

          <h1 className="mb-4 text-3xl font-bold text-[#1a365d] sm:text-4xl">{item.title}</h1>
          <p className="mb-8 text-lg text-gray-600">{item.summary}</p>

          <InsightMarkdown content={bodyMarkdown} className="prose prose-gray max-w-none text-gray-700" />

          <div className="mt-10 flex flex-wrap gap-4 border-t border-gray-200 pt-8 text-sm font-medium">
            <Link href="/insights" className="text-[#3182ce] hover:text-[#1a365d]">
              ← All insights
            </Link>
            <Link href="/" className="text-gray-600 hover:text-[#1a365d]">
              Home
            </Link>
          </div>
        </div>
      </article>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<InsightPageProps> = async ({ params }) => {
  const slug = typeof params?.slug === 'string' ? params.slug : '';

  try {
    const db = getAdminDb();
    const doc = await getPublishedInsightBySlug(db, slug);

    if (doc) {
      const item = mapInsightDocToItem(doc);
      return {
        props: {
          item,
          bodyMarkdown: doc.bodyMarkdown || item.summary,
        },
      };
    }
  } catch (error) {
    console.error('insight page load error:', error);
  }

  const fallback = getFiringLineItemBySlug(slug, FIRING_LINE_ITEMS);
  if (fallback?.slug) {
    return {
      props: {
        item: fallback,
        bodyMarkdown: fallback.summary,
      },
    };
  }

  return { notFound: true };
};
