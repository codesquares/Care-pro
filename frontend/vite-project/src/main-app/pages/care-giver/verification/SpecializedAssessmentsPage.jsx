import { Helmet } from 'react-helmet-async';
import EligibilityDashboard from '../../../components/gigs/EligibilityDashboard';

/**
 * Standalone page for the full eligibility dashboard.
 * Reached via /app/caregiver/specialized-assessments
 */
const SpecializedAssessmentsPage = () => {
  return (
    <>
      <Helmet>
        <title>Specialized Assessments | CarePro</title>
      </Helmet>
      <div style={{ padding: '1rem', maxWidth: '960px', margin: '0 auto' }}>
        <EligibilityDashboard />
      </div>
    </>
  );
};

export default SpecializedAssessmentsPage;
