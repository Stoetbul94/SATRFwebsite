'use client';

import { lazy, Suspense, useCallback, useState } from 'react';
import { IconButton } from '@chakra-ui/react';
import { FiCrosshair } from 'react-icons/fi';
import { useToolbox } from './ToolboxProvider';

const ToolboxPanel = lazy(() => import('./ToolboxPanel'));

export default function ToolboxLauncher() {
  const { isOpen, open, registerLauncherRef } = useToolbox();
  const [panelLoaded, setPanelLoaded] = useState(false);

  const handleOpen = useCallback(() => {
    setPanelLoaded(true);
    open();
  }, [open]);

  return (
    <>
      <IconButton
        ref={registerLauncherRef}
        aria-label="Open SATRF Toolbox"
        icon={<FiCrosshair />}
        position="fixed"
        bottom={{ base: 4, md: 6 }}
        right={{ base: 4, md: 6 }}
        zIndex={1400}
        size="lg"
        variant="satrfGold"
        rounded="full"
        shadow="lg"
        minW="48px"
        minH="48px"
        onClick={handleOpen}
        data-testid="toolbox-launcher"
        sx={{
          '@media print': { display: 'none' },
        }}
      />

      {(panelLoaded || isOpen) && (
        <Suspense fallback={null}>
          <ToolboxPanel />
        </Suspense>
      )}
    </>
  );
}
