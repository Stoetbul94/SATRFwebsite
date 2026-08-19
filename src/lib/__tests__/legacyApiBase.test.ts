import fs from 'fs';
import path from 'path';
import { getLegacyApiBaseUrl } from '@/lib/legacyApiBase';

describe('legacyApiBase', () => {
  const originalBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  afterEach(() => {
    if (originalBase === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL;
    else process.env.NEXT_PUBLIC_API_BASE_URL = originalBase;
  });

  it('uses NEXT_PUBLIC_API_BASE_URL when set', () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://example.test/api/';
    expect(getLegacyApiBaseUrl()).toBe('https://example.test/api');
  });

  it('only allows localhost as a non-production fallback', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/lib/legacyApiBase.ts'), 'utf8');
    expect(src).toContain("process.env.NODE_ENV !== 'production'");
    expect(src).toMatch(/return 'http:\/\/localhost:8000\/api'/);
  });
});
