import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import type { GetStaticPaths, GetStaticProps } from 'next';
import Layout from '@/components/layout/Layout';
import {
  FIRING_LINE_TYPE_LABELS,
  getArticleSlugs,
  getFiringLineItemBySlug,
  type FiringLineItem,
} from '@/lib/firingLineContent';

const PLACEHOLDER_BODY: Record<string, string[]> = {
  'understanding-3-position-rifle': [
    'Three-position rifle combines kneeling, prone and standing — each with its own stability challenges and sighting rhythm. At 50m, athletes shoot a defined series in each position before totals decide qualification standing.',
    'Kneeling rewards a solid support triangle and controlled breathing. Prone is the steadiest platform for precision. Standing demands balance, core strength and a repeatable natural point of aim.',
    'SATRF national events follow ISSF qualification formats. Use this guide as a starting point before your first 3P match or when helping new club members understand the discipline.',
  ],
  'strong-prone-position': [
    'A strong prone position starts with a natural alignment to the target — rifle, spine and legs working together so the sight picture returns after each shot without muscling the rifle.',
    'Contact points matter: chest support, elbow placement and head position should feel relaxed, not strained. Small adjustments beat big resets once you are on the line.',
    'Repeatability wins matches. Build a checklist for training: position, sight picture, follow-through — then trust it in competition.',
  ],
  'f-class-long-range-precision': [
    'F-Class extends precision shooting with specialized rifle setups and emphasis on reading wind and mirage over multiple distances.',
    'Equipment consistency — stock fit, trigger, and ammunition — frees attention for downrange conditions. Log your sight settings and learn how your rifle responds in different light.',
    'Whether you are moving from short-range target rifle or joining a club F-Class day, start with fundamentals and add complexity as your group size tightens.',
  ],
};

interface InsightPageProps {
  item: FiringLineItem;
}

export default function InsightArticlePage({ item }: InsightPageProps) {
  const paragraphs = item.slug ? PLACEHOLDER_BODY[item.slug] ?? [item.summary] : [item.summary];

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

          <div className="prose prose-gray max-w-none space-y-4 text-gray-700">
            {paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>

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

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getArticleSlugs().map((slug) => ({ params: { slug } }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<InsightPageProps> = async ({ params }) => {
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const item = getFiringLineItemBySlug(slug);

  if (!item || !item.slug) {
    return { notFound: true };
  }

  return { props: { item } };
};
