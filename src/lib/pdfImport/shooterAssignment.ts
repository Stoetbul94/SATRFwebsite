import { GUEST_MEMBER } from '@/lib/scoreFormState';

export function isRegisteredMember(selectedMemberId: string): boolean {
  return Boolean(selectedMemberId && selectedMemberId !== GUEST_MEMBER);
}

export function shooterIsAssigned(
  selectedMemberId: string,
  shooterName: string,
  club: string
): boolean {
  if (isRegisteredMember(selectedMemberId)) return true;
  return Boolean(shooterName.trim() && club.trim());
}
