import Head from 'next/head';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { Spinner, VStack } from '@chakra-ui/react';
import Layout from '@/components/layout/Layout';
import PublicPageShell from '@/components/layout/PublicPageShell';
import RulesViewerInvalidDocument from '@/components/rules/RulesViewerInvalidDocument';
import {
  parseViewerPage,
  resolveRulesDocument,
} from '@/lib/rulesDocumentResolver';

const RulesPdfViewer = dynamic(() => import('@/components/rules/RulesPdfViewer'), {
  ssr: false,
  loading: () => (
    <VStack py={12}>
      <Spinner />
    </VStack>
  ),
});

export default function RulesViewPage() {
  const router = useRouter();
  const documentId =
    typeof router.query.document === 'string' ? router.query.document : undefined;
  const fileParam = typeof router.query.file === 'string' ? router.query.file : undefined;
  const page = parseViewerPage(router.query.page);
  const ruleNumber = typeof router.query.rule === 'string' ? router.query.rule : undefined;
  const heading = typeof router.query.heading === 'string' ? router.query.heading : undefined;

  const resolved =
    router.isReady
      ? resolveRulesDocument({ documentId, requestedPath: fileParam })
      : null;

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
        ) : !resolved ? (
          <RulesViewerInvalidDocument />
        ) : (
          <RulesPdfViewer
            document={resolved}
            initialPage={page}
            ruleNumber={ruleNumber}
            heading={heading}
          />
        )}
      </PublicPageShell>
    </Layout>
  );
}
