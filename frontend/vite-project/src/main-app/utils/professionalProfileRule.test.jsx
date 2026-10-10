import { isProfessionalProfileDone } from './professionalProfileRule';
import { computeLockState } from './vettingLockout';

describe('isProfessionalProfileDone (provisional rule)', () => {
  test('false for null / all zero', () => {
    expect(isProfessionalProfileDone(null)).toBe(false);
    expect(isProfessionalProfileDone({ education: 0, certifications: 0, work: 0 })).toBe(false);
  });
  test('true with any one entry', () => {
    expect(isProfessionalProfileDone({ education: 1, certifications: 0, work: 0 })).toBe(true);
    expect(isProfessionalProfileDone({ education: 0, certifications: 1, work: 0 })).toBe(true);
    expect(isProfessionalProfileDone({ education: 0, certifications: 0, work: 1 })).toBe(true);
  });
  test('does not feed lockout: computeLockState ignores profile data', () => {
    const base = { ready: true, enforcementDate: '2020-01-01', classificationSet: false, guarantorCount: 0, addressComplete: false, clearance: null };
    expect(computeLockState({ ...base, profileDone: true })).toEqual(computeLockState({ ...base, profileDone: false }));
  });
});
