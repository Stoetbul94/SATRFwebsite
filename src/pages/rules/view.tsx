import Head from 'next/head';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { Spinner, Text, VStack } from '@chakra-ui/react';
import Layout from '@/components/layout/Layout';
import PublicPageShell from '@/components/layout/PublicPageShell';
import { isAllowedRulesPdfPath } from '@/lib/rulesDownloads';

const RulesPdfViewer = dynamic(() => import('@/components/rules/RulesPdfViewer'), {
  ssr: false,
  loading: () => (
    <VStack py={12}>
      <Spinner />
      <Text fontSize="sm">Opening rule…</Text>
    </VStack>
  ),
});

export default function RulesViewPage() {
  const router = useRouter();
  const file = typeof router.query.file === 'string' ? router.query.file : '';
  const pageRaw = typeof router.query.page === 'string' ? Number(router.query.page) : 1;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const ruleNumber = typeof router.query.rule === 'string' ? router.query.rule : undefined;
  const heading = typeof router.query.heading === 'string' ? router.query.heading : undefined;

  const allowed = isAllowedRulesPdfPath(file);

  return (
    <Layout>
      <Head>
        <title>{`${ruleNumber ? `Rule ${ruleNumber} | ` : ''}ISSF Rule Viewer | SATRF`}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <PublicPageShell>
        {!router.isReady ? (
          <VStack py={12}>
            <Spinner />
          </VStack>
        ) : !allowed ? (
          <Text>
            Invalid document path.{' '}
            <Text as="a" href="/rules" color="brand" textDecoration="underline">
              Return to Rule Finder
            </Text>
          </Text>
        ) : (
          <RulesPdfViewer
            file={file}
            initialPage={page}
            ruleNumber={ruleNumber}
            heading={heading}
          />
        )}
      </PublicPageShell>
    </Layout>
  );
}
