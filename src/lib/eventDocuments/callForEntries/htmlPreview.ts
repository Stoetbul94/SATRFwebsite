import type { CallForEntriesData } from '@/lib/eventDocuments/callForEntries/types';
import { getSiteUrl } from '@/lib/siteUrl';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderCallForEntriesPreviewHtml(data: CallForEntriesData): string {
  const eventsHtml = data.events
    .map(
      (event, index) => `
      <section class="event-block">
        <p class="eyebrow">Event ${index + 1}</p>
        <h3>${escapeHtml(event.disciplineLabel)}</h3>
        <p>${escapeHtml(event.dateLabel)}</p>
        ${event.startTime ? `<p>Start time: ${escapeHtml(event.startTime)}</p>` : ''}
        ${
          event.equipmentInspectionTime
            ? `<p>Equipment inspection: ${escapeHtml(event.equipmentInspectionTime)}</p>`
            : ''
        }
        <p>${escapeHtml(event.venue)}</p>
        ${
          event.registrationDeadlineLabel
            ? `<p><strong>Entries close:</strong> ${escapeHtml(event.registrationDeadlineLabel)}</p>`
            : ''
        }
      </section>`,
    )
    .join('<hr />');

  return `<!DOCTYPE html>
<html lang="en-ZA">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(data.documentTitle)} — Preview</title>
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; color: #1a202c; margin: 0; padding: 32px; background: #f7fafc; }
    .page { max-width: 720px; margin: 0 auto; background: #fff; padding: 40px; border: 1px solid #e2e8f0; }
    .org { font-size: 12px; letter-spacing: 0.08em; color: #1a365d; font-weight: 700; }
    h1 { color: #2d6a4f; font-size: 28px; margin: 16px 0 8px; }
    h2 { color: #1a365d; font-size: 20px; margin: 0 0 24px; }
    h3 { color: #1a365d; margin: 0 0 8px; }
    .eyebrow { color: #2d6a4f; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; margin-bottom: 4px; }
    hr { border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0; }
    .section-title { color: #2d6a4f; font-size: 16px; font-weight: 700; margin: 0 0 12px; }
    .footer { margin-top: 32px; text-align: center; color: #718096; font-size: 12px; }
    pre { white-space: pre-wrap; font-family: inherit; margin: 0; }
  </style>
</head>
<body>
  <article class="page">
    <p class="org">SOUTH AFRICAN TARGET RIFLE FEDERATION</p>
    <h1>CALL FOR ENTRIES</h1>
    <h2>${escapeHtml(data.documentTitle)}</h2>
    ${eventsHtml}
    <hr />
    <p class="section-title">ENTRY INFORMATION</p>
    ${data.entryFeeLabel ? `<p><strong>Entry fee</strong><br />${escapeHtml(data.entryFeeLabel)}</p>` : ''}
    <p><strong>Registration</strong><br />${escapeHtml(data.registrationInfo || `Register online at ${getSiteUrl()}`)}</p>
    ${data.events.map((event) => `<p><a href="${escapeHtml(event.eventUrl)}">${escapeHtml(event.title)}</a></p>`).join('')}
    ${data.paymentInfo ? `<p><strong>Payment information</strong></p><pre>${escapeHtml(data.paymentInfo)}</pre>` : ''}
    ${
      data.contactName || data.contactPhone || data.contactEmail
        ? `<p><strong>Contact</strong><br />${[data.contactName, data.contactPhone, data.contactEmail]
            .filter(Boolean)
            .map((line) => escapeHtml(String(line)))
            .join('<br />')}</p>`
        : ''
    }
    ${data.additionalNotes ? `<p><strong>Additional notes</strong></p><pre>${escapeHtml(data.additionalNotes)}</pre>` : ''}
    <p class="footer">${escapeHtml(getSiteUrl())}</p>
  </article>
</body>
</html>`;
}
