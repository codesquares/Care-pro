import { groupAssignmentsByClient } from './groupAssignmentsByClient';

let n = 0;
const A = (over = {}) => ({
  id: `a${++n}`, status: 'Accepted', clientId: 'c1', clientName: 'Spec Client',
  packageCategory: 'Adult/Elder Care', packageTierLabel: 'Essential', assignedAt: '2026-10-01T10:00:00Z', ...over,
});
const offer = (over = {}) => A({ status: 'PendingAcceptance', clientId: '', clientName: 'Spec', ...over });
const clientsN = (k, startDay = 1) => Array.from({ length: k }, (_, i) =>
  A({ clientId: `cl${i}`, clientName: `Client ${i}`, assignedAt: `2026-09-${String(startDay + i).padStart(2, '0')}T10:00:00Z` }));

beforeEach(() => { n = 0; });

describe('groupAssignmentsByClient', () => {
  test('26 assignments for one client collapse to one row with a count', () => {
    const list = Array.from({ length: 26 }, (_, i) => A({ assignedAt: `2026-10-${String((i % 28) + 1).padStart(2, '0')}T08:00:00Z` }));
    const r = groupAssignmentsByClient(list);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].activeCount).toBe(26);
    expect(r.rows[0].assignment.assignedAt).toBe('2026-10-26T08:00:00Z'); // latest of the group is the representative
    expect(r.label).toBeNull();
    expect(r.totals).toMatchObject({ activeCount: 26, activeClientCount: 1, pendingCount: 0 });
  });

  test('a client with a single active assignment has count 1', () => {
    expect(groupAssignmentsByClient([A()]).rows[0].activeCount).toBe(1);
  });

  test('pending offers stay separate and first, even when the same client has active ones', () => {
    const list = [A({ assignedAt: '2026-10-05T00:00:00Z' }), offer({ assignedAt: '2026-09-01T00:00:00Z' }), offer({ assignedAt: '2026-10-09T00:00:00Z' })];
    const r = groupAssignmentsByClient(list);
    expect(r.rows.map((x) => x.kind)).toEqual(['offer', 'offer', 'client']);
    expect(r.rows[0].assignment.assignedAt).toBe('2026-10-09T00:00:00Z');
    expect(r.totals.pendingCount).toBe(2);
  });

  test('pending offers are never merged by empty client id or by name', () => {
    const r = groupAssignmentsByClient([offer({ clientName: 'Spec' }), offer({ clientName: 'Spec' }), A({ clientName: 'Spec' })]);
    expect(r.rows.filter((x) => x.kind === 'offer')).toHaveLength(2);
    expect(r.rows).toHaveLength(3);
  });

  test('more than 10 clients caps at 10 with the correct "of N" text', () => {
    const r = groupAssignmentsByClient(clientsN(12));
    expect(r.rows).toHaveLength(10);
    expect(r.label).toBe('Showing 10 of 12 clients');
    expect(r.hiddenCount).toBe(2);
    expect(r.totals).toMatchObject({ activeCount: 12, activeClientCount: 12, totalRows: 12, shownRows: 10 });
  });

  test('exactly 10 clients shows all with no label', () => {
    const r = groupAssignmentsByClient(clientsN(10));
    expect(r.rows).toHaveLength(10);
    expect(r.label).toBeNull();
  });

  test('pending offers count toward the cap, but only the active rows are trimmed', () => {
    const r = groupAssignmentsByClient([offer(), offer(), ...clientsN(12)]);
    expect(r.rows).toHaveLength(10);
    expect(r.rows.filter((x) => x.kind === 'offer')).toHaveLength(2);
    expect(r.label).toBe('Showing 10 of 14 clients');
  });

  test('more than 10 pending offers: all show, no active rows, and the label says so', () => {
    const offers = Array.from({ length: 12 }, () => offer());
    const r = groupAssignmentsByClient([...offers, ...clientsN(4)]);
    expect(r.rows).toHaveLength(12);
    expect(r.rows.every((x) => x.kind === 'offer')).toBe(true);
    expect(r.label).toBe('Showing all 12 pending offers; 0 of 4 active clients shown');
  });

  test('more than 10 pending offers and no active clients: nothing hidden, no label', () => {
    const r = groupAssignmentsByClient(Array.from({ length: 11 }, () => offer()));
    expect(r.rows).toHaveLength(11);
    expect(r.label).toBeNull();
  });

  test('cancelled, declined and unknown statuses are excluded and not counted', () => {
    const r = groupAssignmentsByClient([A({ status: 'Cancelled' }), A({ status: 'Declined' }), A({ status: 'Whatever' }), A()]);
    expect(r.rows).toHaveLength(1);
    expect(r.totals).toMatchObject({ activeCount: 1, pendingCount: 0 });
  });

  test('missing, null, blank and non-string client ids do not crash or merge', () => {
    const list = [A({ clientId: undefined }), A({ clientId: null }), A({ clientId: '' }), A({ clientId: '   ' }), A({ clientId: 42 })];
    const r = groupAssignmentsByClient(list);
    expect(r.rows).toHaveLength(5);
    expect(r.rows.every((x) => x.activeCount === 1)).toBe(true);
    expect(r.totals.activeClientCount).toBe(5);
  });

  test('null / undefined / non-array input is an empty result', () => {
    for (const v of [undefined, null, 'x', {}]) {
      const r = groupAssignmentsByClient(v);
      expect(r.rows).toEqual([]);
      expect(r.totals).toMatchObject({ activeCount: 0, pendingCount: 0, activeClientCount: 0 });
    }
    expect(groupAssignmentsByClient([null, undefined, A()]).rows).toHaveLength(1);
  });

  test('ordering: newest representative first, ties keep the original order, and it is stable across calls', () => {
    const same = '2026-10-01T00:00:00Z';
    const list = [A({ clientId: 'x', assignedAt: same }), A({ clientId: 'y', assignedAt: same }), A({ clientId: 'z', assignedAt: '2026-10-02T00:00:00Z' }), A({ clientId: 'w', assignedAt: same })];
    const order = groupAssignmentsByClient(list).rows.map((r) => r.assignment.clientId);
    expect(order).toEqual(['z', 'x', 'y', 'w']);
    expect(groupAssignmentsByClient(list).rows.map((r) => r.assignment.clientId)).toEqual(order);
  });

  test('missing/invalid assignedAt sorts last without crashing', () => {
    const r = groupAssignmentsByClient([A({ clientId: 'a', assignedAt: undefined }), A({ clientId: 'b', assignedAt: 'nope' }), A({ clientId: 'c' })]);
    expect(r.rows[0].assignment.clientId).toBe('c');
  });

  test('totals are real assignment counts, not capped or de-duplicated', () => {
    const list = [...clientsN(12), ...clientsN(12), offer(), offer()];
    const r = groupAssignmentsByClient(list);
    expect(r.totals).toMatchObject({ activeCount: 24, activeClientCount: 12, pendingCount: 2 });
    expect(r.rows).toHaveLength(10);
  });

  test('maxRows is configurable and 0 still shows every pending offer', () => {
    expect(groupAssignmentsByClient(clientsN(5), { maxRows: 3 }).rows).toHaveLength(3);
    const r = groupAssignmentsByClient([offer(), ...clientsN(3)], { maxRows: 0 });
    expect(r.rows).toHaveLength(1);
  });
});
