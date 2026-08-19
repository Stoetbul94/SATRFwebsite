import fs from 'fs';
import path from 'path';
import { absoluteUrl, DEFAULT_SITE_URL, getSiteUrl } from '@/lib/siteUrl';

describe('siteUrl', () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = original;
  });

  it('defaults to the production canonical host', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(DEFAULT_SITE_URL).toBe('https://www.rifleshooting.co.za');
    expect(getSiteUrl()).toBe('https://www.rifleshooting.co.za');
    expect(absoluteUrl('/')).toBe('https://www.rifleshooting.co.za/');
    expect(absoluteUrl('/events')).toBe('https://www.rifleshooting.co.za/events');
  });

  it('does not use satrf.org.za', () => {
    expect(getSiteUrl()).not.toContain('satrf.org.za');
    expect(absoluteUrl('/insights')).not.toContain('satrf.org.za');
  });
});

describe('runtime SEO artefacts', () => {
  it('robots.txt and sitemap.xml use rifleshooting.co.za', () => {
    const robots = fs.readFileSync(path.join(process.cwd(), 'public/robots.txt'), 'utf8');
    const sitemap = fs.readFileSync(path.join(process.cwd(), 'public/sitemap.xml'), 'utf8');
    expect(robots).toContain('Sitemap: https://www.rifleshooting.co.za/sitemap.xml');
    expect(robots).not.toContain('satrf.org.za');
    expect(sitemap).toContain('https://www.rifleshooting.co.za/');
    expect(sitemap).toContain('https://www.rifleshooting.co.za/scores');
    expect(sitemap).not.toContain('satrf.org.za');
  });

  it('redirects /results to /scores', () => {
    const vercel = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf8'));
    const nextConfig = fs.readFileSync(path.join(process.cwd(), 'next.config.js'), 'utf8');
    const resultsRedirect = vercel.redirects.find((r: { source: string }) => r.source === '/results');
    expect(resultsRedirect.destination).toBe('/scores');
    expect(resultsRedirect.permanent).toBe(true);
    expect(nextConfig).toContain("source: '/results'");
    expect(nextConfig).toContain("destination: '/scores'");
  });
});
