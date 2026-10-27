import { getNotificationRoute } from './notificationRoutes';

// Incident / observation notifications: legacy order visits send an orderId; package visits send none and
// carry the PackageRequestId as relatedEntityId for the client.
describe.each(['incident_reported', 'observation_report_filed'])('%s client routing', (type) => {
  test('legacy order visit still routes to the order', () => {
    expect(getNotificationRoute({ type, orderId: 'ORD1', relatedEntityId: 'REP1' }, 'Client')).toBe('/app/client/my-order/ORD1');
  });
  test('package visit (no orderId) routes to the package request', () => {
    expect(getNotificationRoute({ type, relatedEntityId: 'PR1' }, 'Client')).toBe('/app/client/requests/PR1');
  });
});

test('admin incident link is unchanged: report id', () => {
  expect(getNotificationRoute({ type: 'incident_reported', relatedEntityId: 'REP1' }, 'SuperAdmin')).toBe('/app/admin/incidents/REP1');
});

describe('visit_absence_notified (package caregiver "can\'t attend")', () => {
  test('client -> the package request', () => {
    expect(getNotificationRoute({ type: 'visit_absence_notified', relatedEntityId: 'PR1' }, 'Client')).toBe('/app/client/requests/PR1');
  });
  test.each(['Admin', 'SuperAdmin'])('%s -> the absence-notices screen, deep-linked to the notice when an id is present', (role) => {
    expect(getNotificationRoute({ type: 'visit_absence_notified', relatedEntityId: 'N1' }, role)).toBe('/app/admin/absence-notices?notice=N1');
    expect(getNotificationRoute({ type: 'visit_absence_notified' }, role)).toBe('/app/admin/absence-notices');
  });
});
