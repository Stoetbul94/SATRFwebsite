import { buildSportsOrganizationJsonLd } from '@/lib/organizationJsonLd';
import { SATRF_SOCIAL_LINKS } from '@/lib/socialLinks';

describe('homepage SportsOrganization JSON-LD', () => {
  const jsonLd = buildSportsOrganizationJsonLd();

  it('describes SATRF with the production site URL', () => {
    expect(jsonLd['@type']).toBe('SportsOrganization');
    expect(jsonLd.name).toBe('South African Target Rifle Federation');
    expect(jsonLd.alternateName).toBe('SATRF');
    expect(jsonLd.url).toBe('https://www.rifleshooting.co.za/');
    expect(jsonLd.logo).toContain('rifleshooting.co.za');
    expect(JSON.stringify(jsonLd)).not.toContain('satrf.org.za');
  });

  it('does not claim SATRF is a member of the ISSF', () => {
    const serialised = JSON.stringify(jsonLd);
    expect(jsonLd.memberOf.name).toBe('South African Shooting Sport Confederation');
    expect(jsonLd.memberOf.alternateName).toBe('SASSCo');
    expect(jsonLd.memberOf.url).toBe('https://www.sassco.co.za/');
    expect(serialised).not.toMatch(/memberOf[^}]*ISSF/i);
    expect(jsonLd.memberOf.name).not.toMatch(/ISSF/i);
    expect(serialised).not.toMatch(/International Olympic Committee/);
  });

  it('omits fake address and phone and uses verified social sameAs only', () => {
    const serialised = JSON.stringify(jsonLd);
    expect(jsonLd).not.toHaveProperty('address');
    expect(jsonLd).not.toHaveProperty('telephone');
    expect(serialised).not.toContain('123 Shooting Range Road');
    expect(serialised).not.toContain('012 345 6789');
    expect(serialised).not.toContain('11 123 4567');
    expect(jsonLd.sameAs).toEqual(SATRF_SOCIAL_LINKS.map((link) => link.href));
    expect(jsonLd.sameAs).not.toEqual(expect.arrayContaining(['https://www.issf-sports.org/']));
    expect(jsonLd.sameAs).not.toEqual(expect.arrayContaining(['https://www.sassco.co.za/']));
  });
});
