export type SocialLink = {
  id: 'facebook' | 'instagram';
  label: string;
  href: string;
  handle?: string;
};

export const SATRF_SOCIAL_LINKS: readonly SocialLink[] = [
  {
    id: 'facebook',
    label: 'Facebook',
    href: 'https://www.facebook.com/p/South-African-Target-Rifle-Federation-61583323393321/',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    href: 'https://www.instagram.com/satrfshooting/',
    handle: '@satrfshooting',
  },
];
