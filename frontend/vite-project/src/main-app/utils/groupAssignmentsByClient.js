// One row per client for the caregiver's dashboard/profile assignments widget.
//
// Pure: takes the GET /api/caregiver/assignments rows, returns the rows to render plus true totals.
//  - Pending offers (PendingAcceptance) are ALWAYS shown, each as its own row, first. They carry no client id by design
//    (privacy until acceptance), so they are never grouped with anything — and never matched by name.
//  - Accepted assignments are grouped by clientId. The representative of a group is its latest assignment (by assignedAt);
//    the group's size is its "N active" count. An Accepted row with a missing/blank clientId is its own row (never merged).
//  - Cancelled / Declined (and anything unknown) are not shown.
//  - The cap applies to the total rows, but only the ACTIVE rows are trimmed to fit: pending offers are never cut, so with
//    more pending offers than the cap, every offer shows and no active row does.
//  - Ordering is stable: newest assignedAt first, ties keep the API's original order.
// The totals are real assignment counts (not capped, not de-duplicated by client) for the stats card.

export const PENDING = 'PendingAcceptance';
export const ACCEPTED = 'Accepted';
export const DEFAULT_MAX_ROWS = 10;

const time = (a) => {
  const t = a?.assignedAt ? new Date(a.assignedAt).getTime() : NaN;
  return Number.isNaN(t) ? 0 : t;
};

// newest first; ties keep original order (Array.prototype.sort is stable in modern engines, but be explicit)
const newestFirst = (a, b) => (time(b.item) - time(a.item)) || (a.index - b.index);

export function groupAssignmentsByClient(assignments, { maxRows = DEFAULT_MAX_ROWS } = {}) {
  const list = Array.isArray(assignments) ? assignments.filter(Boolean) : [];

  const pending = [];
  const accepted = [];
  list.forEach((item, index) => {
    if (item.status === PENDING) pending.push({ item, index });
    else if (item.status === ACCEPTED) accepted.push({ item, index });
  });

  const pendingRows = pending.sort(newestFirst).map(({ item }) => ({
    kind: 'offer', key: `offer:${item.id}`, assignment: item, activeCount: 0,
  }));

  // group accepted by client id; blank/missing ids stand alone
  const groups = new Map();
  accepted.forEach((entry) => {
    const clientId = typeof entry.item.clientId === 'string' ? entry.item.clientId.trim() : '';
    const key = clientId ? `client:${clientId}` : `solo:${entry.item.id ?? entry.index}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  });

  const activeRowsAll = [...groups.entries()]
    .map(([key, entries]) => {
      const sorted = [...entries].sort(newestFirst);
      return { key, rep: sorted[0], size: entries.length };
    })
    .sort((a, b) => newestFirst(a.rep, b.rep))
    .map(({ key, rep, size }) => ({
      kind: 'client', key, assignment: rep.item, activeCount: size,
    }));

  const cap = Math.max(0, Math.floor(maxRows));
  const activeSlots = Math.max(0, cap - pendingRows.length);
  const activeRows = activeRowsAll.slice(0, activeSlots);
  const rows = [...pendingRows, ...activeRows];

  const totalRows = pendingRows.length + activeRowsAll.length;
  const hidden = totalRows - rows.length;

  let label = null;
  if (hidden > 0) {
    label = pendingRows.length > cap
      ? `Showing all ${pendingRows.length} pending offers; ${activeRows.length} of ${activeRowsAll.length} active clients shown`
      : `Showing ${rows.length} of ${totalRows} clients`;
  }

  return {
    rows,
    label,
    hiddenCount: hidden,
    totals: {
      pendingCount: pending.length,                 // real assignments
      activeCount: accepted.length,                 // real assignments
      activeClientCount: activeRowsAll.length,      // distinct clients (blank ids each count as one)
      totalRows,
      shownRows: rows.length,
    },
  };
}

export default groupAssignmentsByClient;
