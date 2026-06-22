import { GUEST_MEMBER } from '@/lib/scoreFormState';
import { isRegisteredMember, shooterIsAssigned } from '@/lib/pdfImport/shooterAssignment';

describe('pdfImport shooterAssignment', () => {
  it('treats registered member as assigned', () => {
    expect(isRegisteredMember('user-1')).toBe(true);
    expect(shooterIsAssigned('user-1', '', '')).toBe(true);
  });

  it('requires name and club for guest/manual', () => {
    expect(isRegisteredMember(GUEST_MEMBER)).toBe(false);
    expect(isRegisteredMember('')).toBe(false);
    expect(shooterIsAssigned(GUEST_MEMBER, 'Jane Guest', 'Club A')).toBe(true);
    expect(shooterIsAssigned('', 'Jane Guest', 'Club A')).toBe(true);
    expect(shooterIsAssigned(GUEST_MEMBER, 'Jane Guest', '')).toBe(false);
    expect(shooterIsAssigned(GUEST_MEMBER, '', 'Club A')).toBe(false);
  });
});
