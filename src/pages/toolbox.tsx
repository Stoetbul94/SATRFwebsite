'use client';

import Head from 'next/head';
import { SimpleGrid, Text, VStack } from '@chakra-ui/react';
import Layout from '@/components/layout/Layout';
import PublicPageShell from '@/components/layout/PublicPageShell';
import PublicPageHeader from '@/components/layout/PublicPageHeader';
import ToolboxToolCard from '@/components/toolbox/ToolboxToolCard';
import { useToolboxEnabled } from '@/contexts/ToolboxEnabledContext';
import { TOOLBOX_TOOLS } from '@/lib/toolbox/registry';
import { useToolbox } from '@/components/toolbox/ToolboxProvider';

function ToolboxPageContent() {
  const toolboxEnabled = useToolboxEnabled();
  const { open } = useToolbox();

  return (
    <PublicPageShell>
      <VStack align="stretch" spacing={8} data-testid="toolbox-page">
        <PublicPageHeader
          eyebrow="AI Assistants"
          title="SATRF Toolbox"
          subtitle={
            toolboxEnabled
              ? 'Practical AI tools for South African target shooters, coaches, and officials. Ask the Range Officer about ISSF rules, WADA prohibited substances, and medication checks.'
              : 'Practical AI tools for South African target shooters, coaches, and officials — coming soon to SATRF.'
          }
        />

        {!toolboxEnabled && (
          <Text fontSize="sm" color="text.muted" data-testid="toolbox-disabled-notice">
            AI assistants are being prepared for launch. Tool cards below will open as they become available.
          </Text>
        )}

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {TOOLBOX_TOOLS.map((tool) => (
            <ToolboxToolCard
              key={tool.id}
              tool={tool}
              toolboxEnabled={toolboxEnabled}
              onOpen={toolboxEnabled ? open : undefined}
            />
          ))}
        </SimpleGrid>
      </VStack>
    </PublicPageShell>
  );
}

function ToolboxPageDisabled() {
  const toolboxEnabled = useToolboxEnabled();

  return (
    <Layout>
      <Head>
        <title>SATRF AI Toolbox — ISSF Rules & Anti-Doping Assistant</title>
        <meta
          name="description"
          content="AI tools for target shooters: ISSF rules assistant, shooting sport anti-doping checker, medication guidance, and official resources for South African athletes."
        />
        <meta
          property="og:title"
          content="SATRF AI Toolbox — ISSF Rules & Anti-Doping Assistant"
        />
        <meta
          property="og:description"
          content="AI tools for target shooters, coaches, and officials — including the Range Officer for ISSF rules and anti-doping answers."
        />
        <meta property="og:type" content="website" />
      </Head>
      <PublicPageShell>
        <VStack align="stretch" spacing={8} data-testid="toolbox-page">
          <PublicPageHeader
            eyebrow="AI Assistants"
            title="SATRF Toolbox"
            subtitle="Practical AI tools for South African target shooters, coaches, and officials — coming soon to SATRF."
          />
          <Text fontSize="sm" color="text.muted" data-testid="toolbox-disabled-notice">
            AI assistants are being prepared for launch. Tool cards below will open as they become available.
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {TOOLBOX_TOOLS.map((tool) => (
              <ToolboxToolCard key={tool.id} tool={tool} toolboxEnabled={toolboxEnabled} />
            ))}
          </SimpleGrid>
        </VStack>
      </PublicPageShell>
    </Layout>
  );
}

function ToolboxPageEnabled() {
  return (
    <Layout>
      <Head>
        <title>SATRF AI Toolbox — ISSF Rules & Anti-Doping Assistant</title>
        <meta
          name="description"
          content="AI tools for target shooters: ISSF rules assistant, shooting sport anti-doping checker, medication guidance, and official resources for South African athletes."
        />
        <meta
          property="og:title"
          content="SATRF AI Toolbox — ISSF Rules & Anti-Doping Assistant"
        />
        <meta
          property="og:description"
          content="AI tools for target shooters, coaches, and officials — including the Range Officer for ISSF rules and anti-doping answers."
        />
        <meta property="og:type" content="website" />
      </Head>
      <ToolboxPageContent />
    </Layout>
  );
}

export default function ToolboxPage() {
  const toolboxEnabled = useToolboxEnabled();
  return toolboxEnabled ? <ToolboxPageEnabled /> : <ToolboxPageDisabled />;
}
