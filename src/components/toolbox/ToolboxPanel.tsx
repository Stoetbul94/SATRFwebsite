'use client';

import { Suspense } from 'react';
import {
  Box,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  HStack,
  IconButton,
  Link,
  Spinner,
  Text,
  VStack,
  useBreakpointValue,
} from '@chakra-ui/react';
import { FiArrowLeft, FiX } from 'react-icons/fi';
import { getToolById, TOOLBOX_TOOLS } from '@/lib/toolbox/registry';
import { TOOL_COMPONENTS } from './toolComponents';
import { useToolbox } from './ToolboxProvider';
import ToolboxToolPicker from './ToolboxToolPicker';

export default function ToolboxPanel() {
  const {
    isOpen,
    close,
    activeToolId,
    panelView,
    backToPicker,
  } = useToolbox();
  const drawerSize = useBreakpointValue({ base: 'full', md: 'md' }) ?? 'md';
  const activeTool = activeToolId ? getToolById(activeToolId) : undefined;
  const ActiveComponent = activeTool ? TOOL_COMPONENTS[activeTool.componentKey] : null;
  const showBack = panelView === 'tool' && TOOLBOX_TOOLS.length > 1;

  return (
    <Drawer
      isOpen={isOpen}
      placement="right"
      onClose={close}
      size={drawerSize}
    >
      <DrawerOverlay />
      <DrawerContent
        role="dialog"
        aria-modal="true"
        aria-label={activeTool ? `${activeTool.name} toolbox` : 'SATRF Toolbox'}
        data-testid="toolbox-panel"
        display="flex"
        flexDirection="column"
        maxH="100dvh"
      >
        <DrawerHeader
          bg="satrf.navy"
          color="white"
          py={4}
          borderBottomWidth="0"
          flexShrink={0}
        >
          <HStack justify="space-between" align="start">
            <HStack align="start" spacing={2}>
              {showBack && (
                <IconButton
                  aria-label="Back to tool picker"
                  icon={<FiArrowLeft />}
                  variant="ghost"
                  color="white"
                  size="sm"
                  mt={1}
                  onClick={backToPicker}
                />
              )}
              <VStack align="start" spacing={0}>
                <Text textStyle="eyebrow" color="satrf.gold.300" fontSize="xs">
                  SATRF Toolbox
                </Text>
                <Text fontFamily="heading" fontSize="lg" fontWeight="700">
                  {panelView === 'picker' ? 'Choose a tool' : activeTool?.name}
                </Text>
                {panelView === 'tool' && activeTool?.tagline && (
                  <Text fontSize="sm" color="whiteAlpha.800">
                    {activeTool.tagline}
                  </Text>
                )}
              </VStack>
            </HStack>
            <IconButton
              aria-label="Close toolbox"
              icon={<FiX />}
              variant="ghost"
              color="white"
              onClick={close}
            />
          </HStack>
        </DrawerHeader>

        <DrawerBody p={0} display="flex" flexDirection="column" flex="1" minH={0} overflow="hidden">
          {panelView === 'picker' ? (
            <ToolboxToolPicker />
          ) : ActiveComponent && activeTool ? (
            <Suspense
              fallback={
                <Box flex="1" display="flex" alignItems="center" justifyContent="center">
                  <Spinner color="brand" />
                </Box>
              }
            >
              <Box flex="1" minH={0} display="flex" flexDirection="column">
                <ActiveComponent toolId={activeTool.id} />
              </Box>
            </Suspense>
          ) : null}

          {panelView === 'tool' && activeTool && (
            <Box
              px={4}
              py={3}
              borderTopWidth="1px"
              borderColor="gray.200"
              bg="satrf.green.50"
              flexShrink={0}
            >
              <Text fontSize="xs" color="text.muted" mb={activeTool.footerLinks.length ? 2 : 0}>
                {activeTool.pinnedDisclaimer}
              </Text>
              {activeTool.footerLinks.length > 0 && (
                <HStack spacing={3} flexWrap="wrap">
                  {activeTool.footerLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      isExternal
                      fontSize="xs"
                      fontWeight="600"
                      color="brand"
                    >
                      {link.label}
                    </Link>
                  ))}
                </HStack>
              )}
            </Box>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
