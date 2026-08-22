/** Deterministic notification IDs for automatic triggers (idempotent publishes). */
export function buildCallForEntriesNotificationId(
  documentId: string,
  version: number,
): string {
  const safeDoc = documentId.replace(/[^a-zA-Z0-9_-]/g, '');
  return `cfe-published-${safeDoc}-v${version}`;
}

export function buildManualNotificationId(): string {
  return `manual-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
