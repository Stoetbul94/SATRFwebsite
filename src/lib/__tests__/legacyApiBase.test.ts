import {
  resolveLegacyApiBase,
  resolveLegacyBackendOrigin,
} from '@/lib/legacyApiBase';

describe('resolveLegacyApiBase', () => {
  it('uses the configured URL in production', () => {
    expect(resolveLegacyApiBase('production', 'https://example.test/api/')).toBe(
      'https://example.test/api'
    );
  });

  it('never falls back to localhost in production when unset', () => {
    expect(resolveLegacyApiBase('production', undefined)).toBeUndefined();
    expect(resolveLegacyApiBase('production', '')).toBeUndefined();
    expect(resolveLegacyApiBase('production', '   ')).toBeUndefined();
    expect(String(resolveLegacyApiBase('production', undefined) ?? '')).not.toContain('localhost');
  });

  it('allows localhost only outside production', () => {
    expect(resolveLegacyApiBase('development', undefined)).toBe('http://localhost:8000/api');
    expect(resolveLegacyApiBase('test', undefined)).toBe('http://localhost:8000/api');
  });
});

describe('resolveLegacyBackendOrigin', () => {
  it('never falls back to localhost in production when unset', () => {
    expect(resolveLegacyBackendOrigin('production', undefined)).toBeUndefined();
    expect(String(resolveLegacyBackendOrigin('production', undefined) ?? '')).not.toContain('localhost:8000');
  });

  it('allows localhost origin only outside production', () => {
    expect(resolveLegacyBackendOrigin('development', undefined)).toBe('http://localhost:8000');
  });
});
