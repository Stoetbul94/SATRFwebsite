import {
  getCurrentRulebookDocument,
  isSuspiciousRulesPathInput,
  parseViewerPage,
  resolveRulesDocument,
  resolveRulesDocumentById,
  resolveRulesDocumentByPath,
} from '@/lib/rulesDocumentResolver';

const SECOND_PRINT =
  '/documents/issf/issf-rule-book-2026-edition-2025-second-print-07-2026-effective-1-july-2026.pdf';
const FIRST_PRINT =
  '/documents/issf/issf-rule-book-2026-edition-2025-first-print-12-2025-effective-1-january-2026.pdf';
const SECOND_PRINT_ID =
  'issf-rule-book-2026-edition-2025-second-print-07-2026-effective-1-july-2026';
const FIRST_PRINT_ID =
  'issf-rule-book-2026-edition-2025-first-print-12-2025-effective-1-january-2026';

describe('rules document resolver', () => {
  describe('parseViewerPage', () => {
    it.each([
      ['342', 342],
      ['1', 1],
      ['0', 1],
      ['-5', 1],
      ['abc', 1],
      [undefined, 1],
    ])('parseViewerPage(%s) → %i', (raw, expected) => {
      expect(parseViewerPage(raw)).toBe(expected);
    });
  });

  describe('security matrix', () => {
    it('accepts known current PDF by exact path', () => {
      const doc = resolveRulesDocumentByPath(SECOND_PRINT);
      expect(doc?.id).toBe(SECOND_PRINT_ID);
      expect(doc?.status).toBe('current');
      expect(doc?.localPath).toBe(SECOND_PRINT);
    });

    it('accepts known archive PDF by exact path', () => {
      const doc = resolveRulesDocumentByPath(FIRST_PRINT);
      expect(doc?.id).toBe(FIRST_PRINT_ID);
      expect(doc?.status).toBe('superseded');
    });

    it('accepts known document by catalogue ID', () => {
      const doc = resolveRulesDocumentById(SECOND_PRINT_ID);
      expect(doc?.localPath).toBe(SECOND_PRINT);
    });

    it.each([
      ['unknown PDF', '/documents/issf/totally-unknown.pdf'],
      ['../ traversal', '/documents/issf/../issf/fake.pdf'],
      ['../../ traversal', '/documents/issf/../../../etc/passwd.pdf'],
      ['encoded traversal', '/documents/issf/%2e%2e/fake.pdf'],
      ['encoded backslash', '/documents/issf/%5c..%5cfake.pdf'],
      ['backslash traversal', '/documents/issf\\..\\fake.pdf'],
      ['external https', 'https://example.com/test.pdf'],
      ['external http', 'http://example.com/test.pdf'],
      ['protocol-relative', '//example.com/test.pdf'],
      ['file protocol', 'file:///etc/passwd'],
      ['windows path', 'C:\\test.pdf'],
      ['query injection', '/documents/issf/rulebook.pdf?evil=true'],
      ['empty', ''],
      ['non-pdf local', '/documents/issf/readme.txt'],
      ['similar prefix unknown', '/documents/issf/not-in-catalogue.pdf'],
    ])('rejects %s', (_label, input) => {
      expect(resolveRulesDocumentByPath(input)).toBeNull();
    });

    it('resolveRulesDocument prefers document ID over path', () => {
      const doc = resolveRulesDocument({
        documentId: SECOND_PRINT_ID,
        requestedPath: '/documents/issf/totally-unknown.pdf',
      });
      expect(doc?.localPath).toBe(SECOND_PRINT);
    });

    it('resolveRulesDocument rejects unknown document ID', () => {
      expect(resolveRulesDocumentById('fake-document-id')).toBeNull();
    });

    it('isSuspiciousRulesPathInput catches encoded patterns', () => {
      expect(isSuspiciousRulesPathInput('/documents/issf/%2E%2E/x.pdf')).toBe(true);
      expect(isSuspiciousRulesPathInput('/documents/issf/%5C/x.pdf')).toBe(true);
    });
  });

  it('getCurrentRulebookDocument returns Second Print', () => {
    expect(getCurrentRulebookDocument()?.localPath).toBe(SECOND_PRINT);
  });
});
