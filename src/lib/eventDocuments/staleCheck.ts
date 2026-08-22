import type { CallForEntriesData } from '@/lib/eventDocuments/callForEntries/types';
import type { SerializedEventDocument } from '@/lib/eventDocuments/types';

export function isDocumentStale(
  doc: SerializedEventDocument,
  linkedEventUpdatedAt: Record<string, string | null | undefined>,
): boolean {
  if (!doc.generatedFromEventUpdatedAt) return false;
  const generatedAt = new Date(doc.generatedFromEventUpdatedAt).getTime();
  if (Number.isNaN(generatedAt)) return false;

  return doc.linkedEventIds.some((eventId) => {
    const updatedAt = linkedEventUpdatedAt[eventId];
    if (!updatedAt) return false;
    const eventUpdated = new Date(updatedAt).getTime();
    return !Number.isNaN(eventUpdated) && eventUpdated > generatedAt;
  });
}

export function buildDownloadFileName(data: CallForEntriesData, version: number): string {
  const slug = data.documentTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return `satrf-${slug || 'call-for-entries'}-v${version}.pdf`;
}
