import { getNotificationRoute } from './notificationRoutes';

// Guarantor questionnaire: flagged answers alert admins; a rejected guarantor tells the caregiver to replace them.
describe('guarantor_needs_review (admin review queue)', () => {
  test.each(['Admin', 'SuperAdmin'])('%s -> the guarantors screen, deep-linked to the guarantor', (role) => {
    expect(getNotificationRoute({ type: 'guarantor_needs_review', relatedEntityId: 'G1' }, role)).toBe('/app/admin/guarantors?guarantor=G1');
    expect(getNotificationRoute({ type: 'guarantor_needs_review' }, role)).toBe('/app/admin/guarantors');
  });
  test('is not an admin link for a caregiver', () => {
    expect(getNotificationRoute({ type: 'guarantor_needs_review', relatedEntityId: 'G1' }, 'Caregiver')).toBeNull();
  });
});

describe('guarantor_rejected (caregiver)', () => {
  test('caregiver -> the guarantors page', () => {
    expect(getNotificationRoute({ type: 'guarantor_rejected', relatedEntityId: 'G1' }, 'Caregiver')).toBe('/app/caregiver/vetting/guarantors');
  });
});
