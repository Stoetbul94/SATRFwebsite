import { Skeleton, Stack, Tbody, Td, Tr } from '@chakra-ui/react';
import AdminTableCard from './AdminTableCard';

interface AdminTableSkeletonProps {
  columns: number;
  rows?: number;
}

export default function AdminTableSkeleton({ columns, rows = 6 }: AdminTableSkeletonProps) {
  return (
    <AdminTableCard>
      <Stack spacing={0}>
        <Skeleton height="44px" borderTopRadius="lg" />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} height="52px" mt="1px" />
        ))}
      </Stack>
    </AdminTableCard>
  );
}

/** Inline skeleton rows inside an existing table body */
export function AdminTableBodySkeleton({ columns, rows = 5 }: AdminTableSkeletonProps) {
  return (
    <Tbody>
      {Array.from({ length: rows }).map((_, row) => (
        <Tr key={row}>
          {Array.from({ length: columns }).map((__, col) => (
            <Td key={col}>
              <Skeleton height="16px" />
            </Td>
          ))}
        </Tr>
      ))}
    </Tbody>
  );
}
