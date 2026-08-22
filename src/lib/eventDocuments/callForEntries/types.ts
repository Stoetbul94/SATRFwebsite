export type CallForEntriesEventBlock = {
  eventId: string;
  title: string;
  disciplineLabel: string;
  dateLabel: string;
  startTime?: string;
  equipmentInspectionTime?: string;
  venue: string;
  registrationDeadlineLabel?: string;
  eventUrl: string;
};

export type CallForEntriesData = {
  documentTitle: string;
  linkedEventIds: string[];
  events: CallForEntriesEventBlock[];
  entryFeeLabel?: string;
  mapDirections?: string;
  registrationInfo?: string;
  paymentInfo?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  additionalNotes?: string;
};

export const CALL_FOR_ENTRIES_TEMPLATE_VERSION = 'call-for-entries-v1';
