import { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  useColorModeValue,
  Spinner,
  Center,
  Text,
  Badge,
  Select,
  HStack,
} from '@chakra-ui/react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminTableCard from '@/components/admin/AdminTableCard';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton';
import { useAdminRoute } from '@/hooks/useAdminRoute';
import { useProtectedRoute } from '@/contexts/AuthContext';

interface AdminAction {
  id: string;
  adminId: string;
  adminEmail?: string;
  action: string;
  targetId?: string;
  details?: any;
  timestamp: string;
}

export default function AdminAudit() {
  useProtectedRoute();
  const { isAdmin, isLoading: authLoading } = useAdminRoute();
  const toast = useToast();
  // All useColorModeValue calls must be at the very top, before any other hooks
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');

  useEffect(() => {
    fetchAuditLog();
  }, [isAdmin, actionFilter]);

  const fetchAuditLog = async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) return;

      const params = new URLSearchParams();
      if (actionFilter !== 'all') {
        params.append('action', actionFilter);
      }

      const response = await fetch(`/api/admin/audit?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActions(data.actions || []);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch audit log',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error fetching audit log:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch audit log',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      create_event: 'green',
      update_event: 'blue',
      archive_event: 'orange',
      update_score: 'blue',
      delete_score: 'red',
      change_user_role: 'purple',
      activate_user: 'green',
      deactivate_user: 'red',
    };
    return (
      <Badge colorScheme={colors[action] || 'gray'}>
        {action.replace(/_/g, ' ')}
      </Badge>
    );
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <AdminPageHeader title="Audit Log" subtitle="View all admin actions and system events" />
        <AdminTableSkeleton columns={5} />
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <Head>
        <title>Admin Audit Log - SATRF</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <AdminPageHeader title="Audit Log" subtitle="View all admin actions and system events" />

      <Box bg="bg.surface" p={4} borderRadius="lg" borderWidth="1px" borderColor="border.default" mb={4} boxShadow="sm">
        <HStack wrap="wrap" spacing={3}>
          <Text fontSize="sm" color="text.muted">Filter by action:</Text>
          <Select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            w="250px"
          >
            <option value="all">All Actions</option>
            <option value="create_event">Create Event</option>
            <option value="update_event">Update Event</option>
            <option value="archive_event">Archive Event</option>
            <option value="update_score">Update Score</option>
            <option value="delete_score">Delete Score</option>
            <option value="change_user_role">Change User Role</option>
            <option value="activate_user">Activate User</option>
            <option value="deactivate_user">Deactivate User</option>
          </Select>
        </HStack>
      </Box>

      <AdminTableCard>
        <Table variant="admin" size="sm">
          <Thead>
            <Tr>
              <Th>Timestamp</Th>
              <Th>Admin</Th>
              <Th>Action</Th>
              <Th>Target ID</Th>
              <Th>Details</Th>
            </Tr>
          </Thead>
          <Tbody>
            {actions.length === 0 ? (
              <Tr>
                <Td colSpan={5} p={0} border={0}>
                  <AdminEmptyState title="No audit log entries" description="Admin actions will appear here as they occur." />
                </Td>
              </Tr>
            ) : (
              actions.map((action) => (
                <Tr key={action.id}>
                  <Td>{new Date(action.timestamp).toLocaleString()}</Td>
                  <Td>{action.adminEmail || action.adminId}</Td>
                  <Td>{getActionBadge(action.action)}</Td>
                  <Td>
                    <Text fontSize="sm" fontFamily="mono">
                      {action.targetId || '-'}
                    </Text>
                  </Td>
                  <Td>
                    {action.details ? (
                      <Text fontSize="sm" maxW="300px" isTruncated>
                        {JSON.stringify(action.details)}
                      </Text>
                    ) : (
                      '-'
                    )}
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </AdminTableCard>
    </AdminLayout>
  );
}









