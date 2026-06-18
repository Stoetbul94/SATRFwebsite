import { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import InsightMarkdown from '@/components/insights/InsightMarkdown';
import AdminLoadingPanel from '@/components/admin/AdminLoadingPanel';
import { FIRING_LINE_TYPE_LABELS } from '@/lib/firingLineContent';
import { useProtectedRoute } from '@/contexts/AuthContext';
import { useContentEditorRoute } from '@/hooks/useContentEditorRoute';
import { auth } from '@/lib/firebase';
import type { InsightDocument } from '@/lib/insightsServer';

const getToken = async (): Promise<string | null> => {
  const fresh = await auth.currentUser?.getIdToken().catch(() => null);
  if (fresh) return fresh;
  return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
};

export default function InsightPreviewPage() {
  useProtectedRoute();
  const { isContentEditor, isLoading: authLoading } = useContentEditorRoute('/admin/dashboard');
  const router = useRouter();
  const { id } = router.query;
  const insightId = typeof id === 'string' ? id : '';

  const [insight, setInsight] = useState<InsightDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isContentEditor || !insightId) return;

    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch(`/api/admin/insights/${insightId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setInsight(data.insight);
      } catch {
        setInsight(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [isContentEditor, insightId]);

  if (authLoading || loading) {
    return (
      <Layout>
        <AdminLoadingPanel label="Loading preview…" />
      </Layout>
    );
  }

  if (!isContentEditor || !insight) {
    return null;
  }

  const coverImage = insight.coverImageUrl || '/images/sport-collage-satrf.png';

  return (
    <Layout>
      <Head>
        <title>Preview: {insight.title}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-900">
        Draft preview — only visible to you.{' '}
        {insight.status === 'published' && insight.slug ? (
          <Link href={`/insights/${insight.slug}`} className="underline hover:text-amber-950">
            View live page
          </Link>
        ) : (
          <span>Not published yet.</span>
        )}
      </div>

      <article className="bg-white">
        <div className="relative aspect-[21/9] w-full bg-gray-100 sm:aspect-[3/1]">
          <Image
            src={coverImage}
            alt={`${insight.title} — ${insight.category}`}
            fill
            className="object-cover"
            priority
            sizes="100vw"
            unoptimized={coverImage.startsWith('http')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a365d]/80 via-transparent to-transparent" />
        </div>

        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#3182ce] px-3 py-1 text-xs font-semibold text-white">
              {FIRING_LINE_TYPE_LABELS[insight.type]}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              {insight.category}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
              {insight.readTime}
            </span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
              {insight.status}
            </span>
          </div>

          <h1 className="mb-4 text-3xl font-bold text-[#1a365d] sm:text-4xl">{insight.title}</h1>
          <p className="mb-8 text-lg text-gray-600">{insight.summary}</p>

          <InsightMarkdown
            content={insight.bodyMarkdown || insight.summary}
            className="prose prose-gray max-w-none text-gray-700"
          />

          <div className="mt-10 flex flex-wrap gap-4 border-t border-gray-200 pt-8 text-sm font-medium">
            <Link href={`/admin/firing-line/${insight.id}`} className="text-[#3182ce] hover:text-[#1a365d]">
              ← Back to editor
            </Link>
          </div>
        </div>
      </article>
    </Layout>
  );
}
