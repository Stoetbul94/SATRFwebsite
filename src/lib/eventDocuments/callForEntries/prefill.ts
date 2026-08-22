import type { Discipline } from '@/types/scores';
import { disciplinePublicLabel } from '@/lib/eventDisciplines';
import { formatEventDate } from '@/lib/eventDisplay';
import type { CallForEntriesData, CallForEntriesEventBlock } from '@/lib/eventDocuments/callForEntries/types';
import {
  getOrganisationBankingDefaults,
  getOrganisationContactDefaults,
} from '@/lib/organisationDefaults';
import { getSiteUrl } from '@/lib/siteUrl';

function formatTime(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return value.trim();
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

function formatDeadline(value: unknown): string | undefined {
  if (!value) return undefined;
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return formatEventDate((value as { toDate: () => Date }).toDate());
  }
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return undefined;
  return formatEventDate(parsed);
}

function formatPrice(value: unknown): string | undefined {
  if (value == null || value === '') return undefined;
  const amount = Number(value);
  if (Number.isNaN(amount)) return undefined;
  return amount === 0 ? 'Free' : `R${amount}`;
}

function buildPaymentInfo(eventData: Record<string, unknown>): string | undefined {
  const parts: string[] = [];
  const banking = getOrganisationBankingDefaults();
  if (banking.accountName) parts.push(`Account name: ${banking.accountName}`);
  if (banking.bankName) parts.push(`Bank: ${banking.bankName}`);
  if (banking.accountNumber) parts.push(`Account number: ${banking.accountNumber}`);
  if (banking.branchCode) parts.push(`Branch code: ${banking.branchCode}`);
  if (banking.electronicBranchCode) {
    parts.push(`Electronic payments code: ${banking.electronicBranchCode}`);
  }
  if (banking.paymentNotes) parts.push(banking.paymentNotes);

  if (typeof eventData.eftInstructions === 'string' && eventData.eftInstructions.trim()) {
    parts.push(eventData.eftInstructions.trim());
  }

  return parts.length > 0 ? parts.join('\n') : undefined;
}

export function buildCallForEntriesEventBlock(
  eventId: string,
  data: Record<string, unknown>,
): CallForEntriesEventBlock {
  const site = getSiteUrl();
  const disciplines = Array.isArray(data.disciplines) ? data.disciplines : [];
  const disciplineLabel =
    disciplines.length > 0
      ? disciplines
          .map((d) => disciplinePublicLabel(String(d) as Discipline))
          .join(' · ')
      : String(data.type || 'Target Rifle');

  const dateValue = data.date;
  let dateLabel = 'Date TBC';
  if (
    dateValue &&
    typeof dateValue === 'object' &&
    'toDate' in (dateValue as object) &&
    typeof (dateValue as { toDate: () => Date }).toDate === 'function'
  ) {
    dateLabel = formatEventDate((dateValue as { toDate: () => Date }).toDate());
  } else if (dateValue) {
    const parsed = new Date(String(dateValue));
    if (!Number.isNaN(parsed.getTime())) dateLabel = formatEventDate(parsed);
  }

  return {
    eventId,
    title: String(data.title || data.name || 'SATRF Event'),
    disciplineLabel,
    dateLabel,
    startTime: formatTime(data.startTime),
    equipmentInspectionTime: formatTime(data.equipmentInspectionTime),
    venue: String(data.location || data.venue || ''),
    registrationDeadlineLabel: formatDeadline(data.registrationDeadline),
    eventUrl: `${site}/events/${eventId}`,
  };
}

export function prefillCallForEntriesData(input: {
  linkedEventIds: string[];
  eventsById: Record<string, Record<string, unknown>>;
  overrides?: Partial<CallForEntriesData>;
}): CallForEntriesData {
  const events = input.linkedEventIds.map((eventId) =>
    buildCallForEntriesEventBlock(eventId, input.eventsById[eventId] || {}),
  );

  const primary = input.eventsById[input.linkedEventIds[0]] || {};
  const contact = getOrganisationContactDefaults();
  const year = new Date().getFullYear();
  const defaultTitle =
    events.length === 1
      ? `${year} ${events[0]?.title || 'SATRF Event'}`
      : `${year} SATRF Call for Entries`;

  const uniqueFees = new Set(
    input.linkedEventIds
      .map((id) => formatPrice(input.eventsById[id]?.price))
      .filter(Boolean) as string[],
  );

  return {
    documentTitle: input.overrides?.documentTitle ?? defaultTitle,
    linkedEventIds: input.overrides?.linkedEventIds || input.linkedEventIds,
    events: input.overrides?.events?.length ? input.overrides.events : events,
    entryFeeLabel:
      input.overrides?.entryFeeLabel ??
      (uniqueFees.size === 1 ? Array.from(uniqueFees)[0] : undefined),
    mapDirections:
      input.overrides?.mapDirections ??
      (typeof primary.mapUrl === 'string' && primary.mapUrl.trim()
        ? primary.mapUrl.trim()
        : primary.location
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(primary.location))}`
          : undefined),
    registrationInfo:
      input.overrides?.registrationInfo ??
      `Register online at ${getSiteUrl().replace(/^https:\/\//, '')}`,
    paymentInfo: input.overrides?.paymentInfo ?? buildPaymentInfo(primary),
    contactName: input.overrides?.contactName ?? contact.name,
    contactPhone: input.overrides?.contactPhone ?? contact.phone,
    contactEmail: input.overrides?.contactEmail ?? contact.email,
    additionalNotes: input.overrides?.additionalNotes ?? '',
  };
}

export function validateCallForEntriesData(data: CallForEntriesData): string[] {
  const errors: string[] = [];
  if (!data.documentTitle.trim()) errors.push('Document title is required');
  if (!data.linkedEventIds.length) errors.push('At least one linked event is required');
  if (!data.events.length) errors.push('At least one event block is required');
  data.events.forEach((event, index) => {
    if (!event.title.trim()) errors.push(`Event ${index + 1}: title is required`);
    if (!event.venue.trim()) errors.push(`Event ${index + 1}: venue is required`);
  });
  return errors;
}
