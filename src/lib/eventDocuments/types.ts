export type EventDocumentType =
  | 'call-for-entries'
  | 'programme'
  | 'range-instructions'
  | 'results'
  | 'other';

export type EventDocumentStatus = 'draft' | 'published' | 'archived';

export type SerializedEventDocument = {
  id: string;
  eventId: string;
  linkedEventIds: string[];
  type: EventDocumentType;
  title: string;
  status: EventDocumentStatus;
  version: number;
  fileUrl?: string | null;
  storagePath?: string | null;
  downloadFileName?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  publishedAt?: string | null;
  createdBy?: string | null;
  generatedFromEventUpdatedAt?: string | null;
  metadata?: {
    templateVersion?: string;
    generatedFromEvent?: boolean;
  };
};

export type PublicEventDocument = {
  id: string;
  type: EventDocumentType;
  title: string;
  fileUrl: string;
  publishedAt: string | null;
  downloadFileName: string;
  version: number;
};
