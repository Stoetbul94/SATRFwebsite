import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  Input,
  Select,
  Textarea,
  VStack,
  useToast,
  Text,
  Image,
  Progress,
} from '@chakra-ui/react';
import { FiArrowLeft, FiExternalLink, FiImage, FiSave } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminLoadingPanel from '@/components/admin/AdminLoadingPanel';
import InsightMarkdown from '@/components/insights/InsightMarkdown';
import { useProtectedRoute } from '@/contexts/AuthContext';
import { useContentEditorRoute } from '@/hooks/useContentEditorRoute';
import { auth } from '@/lib/firebase';
import { slugifyTitle } from '@/lib/insightsServer';
import type { InsightDocument } from '@/lib/insightsServer';

const getToken = async (): Promise<string | null> => {
  const fresh = await auth.currentUser?.getIdToken().catch(() => null);
  if (fresh) return fresh;
  return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const emptyForm = {
  title: '',
  slug: '',
  category: 'General',
  summary: '',
  readTime: '3 min read',
  bodyMarkdown: '',
  coverImageUrl: '',
  status: 'draft' as 'draft' | 'published',
  featured: false,
};

export default function AdminFiringLineEditor() {
  useProtectedRoute();
  const { isContentEditor, isLoading: authLoading } = useContentEditorRoute();
  const router = useRouter();
  const toast = useToast();
  const { id } = router.query;
  const insightId = typeof id === 'string' ? id : '';
  const isNew = insightId === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [docId, setDocId] = useState<string | null>(isNew ? null : insightId);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isContentEditor || isNew || !insightId) return;

    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch(`/api/admin/insights/${insightId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        const insight: InsightDocument = data.insight;
        setForm({
          title: insight.title,
          slug: insight.slug,
          category: insight.category,
          summary: insight.summary,
          readTime: insight.readTime,
          bodyMarkdown: insight.bodyMarkdown,
          coverImageUrl: insight.coverImageUrl,
          status: insight.status,
          featured: insight.featured,
        });
        setDocId(insight.id);
      } catch {
        toast({
          title: 'Not found',
          description: 'This article could not be loaded.',
          status: 'error',
          duration: 4000,
        });
        router.push('/admin/firing-line');
      } finally {
        setLoading(false);
      }
    })();
  }, [isContentEditor, isNew, insightId, router, toast]);

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'title' && (!prev.slug || prev.slug === slugifyTitle(prev.title))) {
        next.slug = slugifyTitle(String(value));
      }
      return next;
    });
  };

  const ensureDocId = async (): Promise<string | null> => {
    if (docId) return docId;
    const token = await getToken();
    if (!token) return null;

    const res = await fetch('/api/admin/insights', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: form.title || 'Untitled draft',
        slug: form.slug,
        category: form.category,
        summary: form.summary,
        readTime: form.readTime,
        bodyMarkdown: form.bodyMarkdown,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const newId = data.insight.id as string;
    setDocId(newId);
    if (isNew) {
      router.replace(`/admin/firing-line/${newId}`, undefined, { shallow: true });
    }
    return newId;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const idToUse = await ensureDocId();
      if (!idToUse) throw new Error('Could not create draft');

      const res = await fetch(`/api/admin/insights/${idToUse}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          slug: slugifyTitle(form.slug || form.title),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Save failed');
      }

      toast({
        title: form.status === 'published' ? 'Published' : 'Saved',
        status: 'success',
        duration: 3000,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Save failed';
      toast({ title: 'Error', description: message, status: 'error', duration: 5000 });
    } finally {
      setSaving(false);
    }
  };

  const handleCoverUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 5MB', status: 'error', duration: 3000 });
      return;
    }

    setUploadingCover(true);
    try {
      const idToUse = await ensureDocId();
      if (!idToUse) throw new Error('Save draft first');

      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const imageBase64 = await fileToBase64(file);
      const res = await fetch(`/api/admin/insights/${idToUse}/image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64, contentType: file.type }),
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      updateField('coverImageUrl', data.imageUrl);
      toast({ title: 'Cover uploaded', status: 'success', duration: 2500 });
    } catch {
      toast({ title: 'Upload failed', status: 'error', duration: 4000 });
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleInlineUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 5MB', status: 'error', duration: 3000 });
      return;
    }

    setUploadingInline(true);
    try {
      const idToUse = await ensureDocId();
      if (!idToUse) throw new Error('Save draft first');

      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const imageBase64 = await fileToBase64(file);
      const res = await fetch(`/api/admin/insights/${idToUse}/inline-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64, contentType: file.type }),
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const markdown = `\n\n![${file.name}](${data.imageUrl})\n\n`;
      const el = bodyRef.current;
      const start = el?.selectionStart ?? form.bodyMarkdown.length;
      const end = el?.selectionEnd ?? start;
      const next =
        form.bodyMarkdown.slice(0, start) + markdown + form.bodyMarkdown.slice(end);
      updateField('bodyMarkdown', next);
      toast({ title: 'Image inserted into body', status: 'success', duration: 2500 });
    } catch {
      toast({ title: 'Upload failed', status: 'error', duration: 4000 });
    } finally {
      setUploadingInline(false);
      if (inlineInputRef.current) inlineInputRef.current.value = '';
    }
  };

  const handlePreviewDraft = async () => {
    const idToUse = await ensureDocId();
    if (!idToUse) {
      toast({ title: 'Save failed', description: 'Could not create draft for preview.', status: 'error', duration: 4000 });
      return;
    }

    // Persist current form state before preview
    const token = await getToken();
    if (token) {
      await fetch(`/api/admin/insights/${idToUse}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          slug: slugifyTitle(form.slug || form.title),
        }),
      }).catch(() => undefined);
    }

    window.open(`/insights/preview/${idToUse}`, '_blank', 'noopener,noreferrer');
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <AdminLoadingPanel label="Loading editor…" />
      </AdminLayout>
    );
  }

  if (!isContentEditor) return null;

  return (
    <AdminLayout>
      <Head>
        <title>{isNew ? 'New article' : 'Edit article'} — Firing Line</title>
      </Head>

      <AdminPageHeader
        title={isNew ? 'New Firing Line article' : 'Edit article'}
        subtitle="Write in Markdown. Upload charts or photos as images."
        actions={
          <HStack spacing={2}>
            <Button as={Link} href="/admin/firing-line" leftIcon={<FiArrowLeft />} variant="ghost" size="sm">
              Back
            </Button>
            <Button
              leftIcon={<FiExternalLink />}
              variant="outline"
              size="sm"
              onClick={handlePreviewDraft}
              isDisabled={!form.title.trim()}
            >
              Preview
            </Button>
            <Button
              leftIcon={<FiSave />}
              colorScheme="green"
              size="sm"
              onClick={handleSave}
              isLoading={saving}
            >
              {form.status === 'published' ? 'Publish / save' : 'Save draft'}
            </Button>
          </HStack>
        }
      />

      <Box
        bg="bg.surface"
        borderWidth="1px"
        borderColor="border.default"
        borderRadius="lg"
        p={6}
        boxShadow="sm"
      >
        <VStack align="stretch" spacing={5}>
          <FormControl isRequired>
            <FormLabel>Title</FormLabel>
            <Input value={form.title} onChange={(e) => updateField('title', e.target.value)} />
          </FormControl>

          <FormControl>
            <FormLabel>URL slug</FormLabel>
            <Input
              value={form.slug}
              onChange={(e) => updateField('slug', slugifyTitle(e.target.value))}
              placeholder="my-article-slug"
            />
          </FormControl>

          <HStack align="flex-start" spacing={4} flexWrap="wrap">
            <FormControl flex="1" minW="200px">
              <FormLabel>Category</FormLabel>
              <Input value={form.category} onChange={(e) => updateField('category', e.target.value)} />
            </FormControl>
            <FormControl flex="1" minW="200px">
              <FormLabel>Read time</FormLabel>
              <Input
                value={form.readTime}
                onChange={(e) => updateField('readTime', e.target.value)}
                placeholder="3 min read"
              />
            </FormControl>
            <FormControl flex="1" minW="160px">
              <FormLabel>Status</FormLabel>
              <Select
                value={form.status}
                onChange={(e) => updateField('status', e.target.value as 'draft' | 'published')}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
            </FormControl>
          </HStack>

          <FormControl>
            <FormLabel>Summary</FormLabel>
            <Textarea
              value={form.summary}
              onChange={(e) => updateField('summary', e.target.value)}
              rows={3}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Cover image</FormLabel>
            {form.coverImageUrl && (
              <Box mb={3} maxW="320px">
                <Image src={form.coverImageUrl} alt="Cover preview" borderRadius="md" />
              </Box>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCoverUpload(file);
              }}
            />
            <Button
              leftIcon={<FiImage />}
              size="sm"
              variant="outline"
              onClick={() => coverInputRef.current?.click()}
              isLoading={uploadingCover}
            >
              Upload cover
            </Button>
            {uploadingCover && <Progress size="xs" isIndeterminate mt={2} />}
          </FormControl>

          <FormControl>
            <HStack justify="space-between" mb={2}>
              <FormLabel mb={0}>Body (Markdown)</FormLabel>
              <input
                ref={inlineInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleInlineUpload(file);
                }}
              />
              <Button
                size="xs"
                variant="outline"
                leftIcon={<FiImage />}
                onClick={() => inlineInputRef.current?.click()}
                isLoading={uploadingInline}
              >
                Insert image / chart
              </Button>
            </HStack>
            <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={4}>
              <GridItem>
                <Textarea
                  ref={bodyRef}
                  value={form.bodyMarkdown}
                  onChange={(e) => updateField('bodyMarkdown', e.target.value)}
                  rows={20}
                  fontFamily="mono"
                  fontSize="sm"
                />
                <Text fontSize="xs" color="text.muted" mt={1}>
                  Use **bold**, headings with #, and upload PNG/JPG graphs via Insert image.
                </Text>
              </GridItem>
              <GridItem>
                <Text fontSize="xs" fontWeight="semibold" color="text.muted" mb={2} textTransform="uppercase">
                  Preview
                </Text>
                <Box
                  borderWidth="1px"
                  borderColor="border.default"
                  borderRadius="md"
                  p={4}
                  minH="320px"
                  maxH="480px"
                  overflowY="auto"
                  bg="bg.canvas"
                >
                  {form.bodyMarkdown.trim() ? (
                    <InsightMarkdown
                      content={form.bodyMarkdown}
                      className="prose prose-sm prose-gray max-w-none"
                    />
                  ) : (
                    <Text fontSize="sm" color="text.muted">
                      Start writing to see a live preview.
                    </Text>
                  )}
                </Box>
              </GridItem>
            </Grid>
          </FormControl>

          <Checkbox
            isChecked={form.featured}
            onChange={(e) => updateField('featured', e.target.checked)}
          >
            Feature on homepage (replaces current featured article)
          </Checkbox>

          {form.slug && (
            <Text fontSize="sm">
              {form.status === 'published' ? 'Public URL: ' : 'Preview URL (after save): '}
              {form.status === 'published' ? (
                <Link href={`/insights/${form.slug}`} target="_blank" style={{ color: '#3182ce' }}>
                  /insights/{form.slug}
                </Link>
              ) : (
                <Text as="span" color="text.muted">
                  Use Preview button above
                </Text>
              )}
            </Text>
          )}
        </VStack>
      </Box>
    </AdminLayout>
  );
}
