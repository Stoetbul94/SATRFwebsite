'use client';

import { Box } from '@chakra-ui/react';
import ToolboxChatShell from '../ToolboxChatShell';

export default function RangeOfficerTool({ toolId }: { toolId: string }) {
  return (
    <Box flex="1" minH={0} display="flex" flexDirection="column">
      <ToolboxChatShell toolId={toolId} />
    </Box>
  );
}
