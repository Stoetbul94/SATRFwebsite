import { verifyRequestUser } from '@/lib/firebaseAdmin';

const DEFAULT_CONTENT_EDITOR_EMAIL = 'techaim10.9@gmail.com';

export function getContentEditorEmail(): string {
  return (process.env.CONTENT_EDITOR_EMAIL || DEFAULT_CONTENT_EDITOR_EMAIL).toLowerCase().trim();
}

export function isContentEditorEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().trim() === getContentEditorEmail();
}

export interface ContentEditorVerificationResult {
  isContentEditor: boolean;
  email: string | null;
  userId: string | null;
}

export async function verifyContentEditorFromToken(
  token: string
): Promise<ContentEditorVerificationResult> {
  const verified = await verifyRequestUser(`Bearer ${token}`);
  if (!verified) {
    return { isContentEditor: false, email: null, userId: null };
  }

  const isContentEditor = isContentEditorEmail(verified.email);
  return {
    isContentEditor,
    email: verified.email,
    userId: verified.uid,
  };
}

export async function requireContentEditorFromRequest(
  authorizationHeader?: string
): Promise<ContentEditorVerificationResult & { error?: { status: number; message: string } }> {
  const token = authorizationHeader?.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return {
      isContentEditor: false,
      email: null,
      userId: null,
      error: { status: 401, message: 'Unauthorized' },
    };
  }

  const result = await verifyContentEditorFromToken(token);
  if (!result.isContentEditor) {
    return {
      ...result,
      error: { status: 403, message: 'Forbidden: Firing Line editor access required' },
    };
  }

  return result;
}
