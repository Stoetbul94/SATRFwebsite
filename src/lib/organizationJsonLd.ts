import { SATRF_SOCIAL_LINKS } from '@/lib/socialLinks';
import { absoluteUrl } from '@/lib/siteUrl';

/** Verified SASSCo listing: SATRF is a SASSCo affiliate, not the ISSF member federation. */
export const SASSCO_ORGANIZATION = {
  '@type': 'SportsOrganization' as const,
  name: 'South African Shooting Sport Confederation',
  alternateName: 'SASSCo',
  url: 'https://www.sassco.co.za/',
};

/**
 * Homepage SportsOrganization JSON-LD.
 * memberOf uses schema.org “Organisation this organisation belongs to” for the
 * verified SASSCo affiliate relationship. Do not set memberOf to ISSF.
 */
export function buildSportsOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsOrganization',
    name: 'South African Target Rifle Federation',
    alternateName: 'SATRF',
    sport: 'Target rifle shooting',
    url: absoluteUrl('/'),
    logo: absoluteUrl('/brand/satrf-emblem-transparent.png'),
    description:
      'The South African Target Rifle Federation promotes competitive target rifle shooting in South Africa. SATRF is listed as an affiliate of the South African Shooting Sport Confederation (SASSCo).',
    memberOf: SASSCO_ORGANIZATION,
    sameAs: SATRF_SOCIAL_LINKS.map((link) => link.href),
    areaServed: {
      '@type': 'Country',
      name: 'South Africa',
    },
  };
}
