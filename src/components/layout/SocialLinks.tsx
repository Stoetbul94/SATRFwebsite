import { HStack, Icon, Link } from '@chakra-ui/react';
import { FaFacebook, FaInstagram } from 'react-icons/fa';
import { SATRF_SOCIAL_LINKS } from '@/lib/socialLinks';

const ICONS = {
  facebook: FaFacebook,
  instagram: FaInstagram,
} as const;

type SocialLinksProps = {
  size?: number;
  color?: string;
  hoverColor?: string;
  spacing?: number;
};

export default function SocialLinks({
  size = 5,
  color = 'whiteAlpha.700',
  hoverColor = 'satrf.gold.400',
  spacing = 4,
}: SocialLinksProps) {
  return (
    <HStack spacing={spacing}>
      {SATRF_SOCIAL_LINKS.map((social) => {
        const IconComponent = ICONS[social.id];
        return (
          <Link
            key={social.id}
            href={social.href}
            isExternal
            aria-label={`SATRF on ${social.label}${social.handle ? ` (${social.handle})` : ''}`}
            _hover={{ color: hoverColor }}
            color={color}
            transition="color 0.2s"
          >
            <Icon as={IconComponent} boxSize={size} />
          </Link>
        );
      })}
    </HStack>
  );
}
