import { Badge, type BadgeProps } from '@chakra-ui/react';

type AdminStatus =
  | 'open'
  | 'full'
  | 'closed'
  | 'pending'
  | 'active'
  | 'rejected'
  | 'suspended'
  | 'official'
  | 'provisional'
  | 'draft'
  | string;

const STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  open: 'statusOpen',
  active: 'statusOpen',
  official: 'statusOpen',
  full: 'statusClosing',
  pending: 'statusClosing',
  provisional: 'statusClosing',
  closed: 'statusClosed',
  rejected: 'statusClosed',
  suspended: 'statusClosed',
  draft: 'statusClosed',
};

export default function AdminStatusBadge({
  status,
  ...props
}: { status: AdminStatus } & BadgeProps) {
  const key = String(status).toLowerCase();
  const variant = STATUS_VARIANT[key] || 'statusClosed';
  return (
    <Badge variant={variant} textTransform="capitalize" {...props}>
      {status}
    </Badge>
  );
}
