import { useState, useEffect, useCallback } from 'react';
import CaregiverAssignmentService from '../../../services/caregiverAssignmentService';

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

  return { assignments, pending, active, loading, error, reload: load };
};

export default useCaregiverAssignments;
