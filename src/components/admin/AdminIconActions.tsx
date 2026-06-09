import { HStack, IconButton, Tooltip, type IconButtonProps } from '@chakra-ui/react';
import type { ReactElement } from 'react';

export interface AdminIconAction {
  label: string;
  icon: ReactElement;
  onClick: () => void;
  colorScheme?: IconButtonProps['colorScheme'];
  variant?: IconButtonProps['variant'];
  isDisabled?: boolean;
}

export default function AdminIconActions({ actions }: { actions: AdminIconAction[] }) {
  return (
    <HStack spacing={2} justify="flex-end">
      {actions.map((action) => (
        <Tooltip key={action.label} label={action.label} hasArrow openDelay={400}>
          <IconButton
            aria-label={action.label}
            icon={action.icon}
            size="sm"
            variant={action.variant ?? 'outline'}
            colorScheme={action.colorScheme ?? 'green'}
            borderColor="border.default"
            onClick={action.onClick}
            isDisabled={action.isDisabled}
            _hover={{ bg: 'satrf.green.50', borderColor: 'satrf.green.300' }}
          />
        </Tooltip>
      ))}
    </HStack>
  );
}
