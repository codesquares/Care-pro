import { getNotificationRoute } from './notificationRoutes';

// Every notification type the backend sends to ADMINS. None may resolve to null (A2.3).
const ADMIN_BOUND = [
  'package_request_received',
  'package_assignment_declined',
  'package_contract_delivery_failed',
  'package_payment_request_failed',
  'incident_reported',
  'dispute_raised',
  'withdrawal_request',
];

// Both admin roles must resolve (SuperAdmin used to resolve to null for every admin link).
const ROLES = ['Admin', 'SuperAdmin'];
const CASES = ROLES.flatMap((role) => ADMIN_BOUND.map((type) => [role, type]));

describe('admin-bound notification routes', () => {
  test.each(CASES)('%s: %s resolves with and without a related id', (role, type) => {
    const withId = getNotificationRoute({ type, relatedEntityId: 'REL123' }, role);
    const without = getNotificationRoute({ type }, role);
    // eslint-disable-next-line no-console
    console.log('ROUTE', role, type, '=>', withId, '|', without);
    expect(withId).toMatch(/^\/app\/admin\//);
    expect(without).toMatch(/^\/app\/admin\//);
  });
});
