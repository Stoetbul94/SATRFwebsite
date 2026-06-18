import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Box,
  Button,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Text,
} from '@chakra-ui/react';
import { FiEdit, FiPlus, FiTrash2 } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminTableCard from '@/components/admin/AdminTableCard';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import AdminLoadingPanel from '@/components/admin/AdminLoadingPanel';
import { useProtectedRoute } from '@/contexts/AuthContext';
import { useContentEditorRoute } from '@/hooks/useContentEditorRoute';
import { auth } from '@/lib/firebase';
import type { InsightDocument } from '@/lib/insightsServer';
import { formatIsoDate } from '@/lib/firestoreSerialize';

const getToken = async (): Promise<string | null> => {
  const fresh = await auth.currentUser?.getIdToken().catch(() => null);
  if (fresh) return fresh;
  return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
};

export default function AdminFiringLineIndex() {
  useProtectedRoute();
  const { isContentEditor, isLoading } = useContentEditorRoute();
  const toast = useToast();
  const [insights, setInsights] = useState<InsightDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch('/api/admin/insights', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load insights');
      const data = await res.json();
      setInsights(data.insights ?? []);
    } catch {
      toast({
        title: 'Error',
        description: 'Could not load Firing Line posts.',
        status: 'error',
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isContentEditor) fetchInsights();
  }, [isContentEditor]);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;

    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`/api/admin/insights/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      toast({ title: 'Deleted', status: 'success', duration: 3000 });
      setInsights((prev) => prev.filter((item) => item.id !== id));
    } catch {
      toast({
        title: 'Error',
        description: 'Could not delete post.',
        status: 'error',
        duration: 4000,
      });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <AdminLoadingPanel label="Loading Firing Line…" />
      </AdminLayout>
    );
  }

  if (!isContentEditor) return null;

  return (
    <AdminLayout>
      <Head>
        <title>Firing Line — SATRF Admin</title>
      </Head>

      <AdminPageHeader
        title="Firing Line"
        subtitle="Draft, publish and manage articles for the public insights hub"
        actions={
          <Button
            as={Link}
            href="/admin/firing-line/new"
            leftIcon={<FiPlus />}
            colorScheme="green"
            size="sm"
          >
            New article
          </Button>
        }
      />

      <AdminTableCard>
        {loading ? (
          <AdminTableSkeleton columns={5} rows={4} />
        ) : insights.length === 0 ? (
          <AdminEmptyState
            title="No articles yet"
            description="Create your first Firing Line article to show on the homepage and /insights."
            action={
              <Button as={Link} href="/admin/firing-line/new" colorScheme="green" size="sm">
                New article
              </Button>
            }
          />
        ) : (
          <Box overflowX="auto">
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Title</Th>
                  <Th>Status</Th>
                  <Th>Featured</Th>
                  <Th>Published</Th>
                  <Th textAlign="right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {insights.map((item) => (
                  <Tr key={item.id}>
                    <Td>
                      <Text fontWeight="medium" noOfLines={1}>
                        {item.title}
                      </Text>
                      <Text fontSize="xs" color="text.muted">
                        /insights/{item.slug}
                      </Text>
                    </Td>
                    <Td>
                      <AdminStatusBadge
                        status={item.status === 'published' ? 'active' : 'draft'}
                      />
                    </Td>
                    <Td>{item.featured ? 'Yes' : '—'}</Td>
                    <Td>{formatIsoDate(item.publishedAt)}</Td>
                    <Td>
                      <HStack spacing={1} justify="flex-end">
                        {item.status === 'published' && item.slug && (
                          <Button
                            as="a"
                            href={`/insights/${item.slug}`}
                            target="_blank"
                            size="xs"
                            variant="ghost"
                          >
                            View
                          </Button>
                        )}
                        <Button
                          as={Link}
                          href={`/admin/firing-line/${item.id}`}
                          size="xs"
                          leftIcon={<FiEdit />}
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          leftIcon={<FiTrash2 />}
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleDelete(item.id, item.title)}
                        >
                          Delete
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </AdminTableCard>
    </AdminLayout>
  );
}
