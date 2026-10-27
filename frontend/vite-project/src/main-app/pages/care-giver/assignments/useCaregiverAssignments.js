import { useState, useEffect, useCallback, useMemo } from 'react';
import CaregiverAssignmentService from '../../../services/caregiverAssignmentService';
import { groupAssignmentsByClient } from '../../../utils/groupAssignmentsByClient';

// Shared by the dashboard widget/stat card and the profile section so both
// read the same GET /api/caregiver/assignments payload.
const useCaregiverAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await CaregiverAssignmentService.getMyAssignments();
    if (result.success) setAssignments(result.data);
    else setError(result.error);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const pending = assignments.filter((a) => a.status === 'PendingAcceptance');
  const active = assignments.filter((a) => a.status === 'Accepted');

  // One row per client, pending offers first, capped — plus true (uncapped, not de-duplicated) totals for the stats card.
  const grouped = useMemo(() => groupAssignmentsByClient(assignments), [assignments]);

  return { assignments, pending, active, grouped, loading, error, reload: load };
};

export default useCaregiverAssignments;
