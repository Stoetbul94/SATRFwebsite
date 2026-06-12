'use client';

import { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Button, Text, VStack } from '@chakra-ui/react';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import PublicPageShell from '@/components/layout/PublicPageShell';
import ToolboxComingSoonDetail from '@/components/toolbox/ToolboxComingSoonDetail';
import { getToolById } from '@/lib/toolbox/registry';
import { useToolboxEnabled } from '@/contexts/ToolboxEnabledContext';
import { useToolbox } from '@/components/toolbox/ToolboxProvider';

function ToolboxToolPageEnabled() {
  const router = useRouter();
  const { open } = useToolbox();
  const toolId = typeof router.query.toolId === 'string' ? router.query.toolId : '';
  const tool = toolId ? getToolById(toolId) : undefined;

  useEffect(() => {
    if (!router.isReady || !tool) return;
    open(tool.id);
  }, [router.isReady, tool, open]);

  if (!router.isReady) {
    return null;
  }

  if (!tool) {
    return (
      <Layout>
        <Head>
          <title>Toolbox tool not found - SATRF</title>
        </Head>
        <PublicPageShell>
          <VStack spacing={4} align="start">
            <Text>That toolbox tool could not be found.</Text>
            <Button as={Link} href="/toolbox" variant="satrf">
              Back to Toolbox
            </Button>
          </VStack>
        </PublicPageShell>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{tool.name} — SATRF Toolbox</title>
        <meta name="description" content={tool.description} />
      </Head>
      <PublicPageShell>
        <VStack align="start" spacing={4} data-testid="toolbox-tool-page">
          <Text fontSize="lg" fontWeight="700" fontFamily="heading">
            {tool.name}
          </Text>
          <Text color="text.muted">{tool.description}</Text>
          <Text fontSize="sm" color="text.muted">
            The assistant panel should open automatically. If it did not, use the button below or the floating toolbox launcher.
          </Text>
          <Button variant="satrf" onClick={() => open(tool.id)}>
            Open {tool.name}
          </Button>
          <Button as={Link} href="/toolbox" variant="satrfOutline">
            All toolbox tools
          </Button>
        </VStack>
      </PublicPageShell>
    </Layout>
  );
}

function ToolboxToolPageDisabled() {
  const router = useRouter();
  const toolId = typeof router.query.toolId === 'string' ? router.query.toolId : '';
  const tool = toolId ? getToolById(toolId) : undefined;

  if (!router.isReady) {
    return null;
  }

  if (!tool) {
    return (
      <Layout>
        <Head>
          <title>Toolbox tool not found - SATRF</title>
        </Head>
        <PublicPageShell>
          <VStack spacing={4} align="start">
            <Text>That toolbox tool could not be found.</Text>
            <Button as={Link} href="/toolbox" variant="satrf">
              Back to Toolbox
            </Button>
          </VStack>
        </PublicPageShell>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{tool.name} — SATRF Toolbox</title>
        <meta name="description" content={tool.description} />
      </Head>
      <PublicPageShell>
        <ToolboxComingSoonDetail tool={tool} />
      </PublicPageShell>
    </Layout>
  );
}

export default function ToolboxToolPage() {
  const toolboxEnabled = useToolboxEnabled();
  return toolboxEnabled ? <ToolboxToolPageEnabled /> : <ToolboxToolPageDisabled />;
}
