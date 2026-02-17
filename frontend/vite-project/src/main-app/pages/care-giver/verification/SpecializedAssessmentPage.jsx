import { Helmet } from 'react-helmet-async';
import SpecializedAssessment from '../../../components/gigs/SpecializedAssessment';
import './assessment-page.css';

/**
 * Standalone page wrapper for taking a specialized assessment.
 * Reached via /app/caregiver/specialized-assessment?category=medical_support
 */
const SpecializedAssessmentPage = () => {
  return (
    <>
      <Helmet>
        <title>Specialized Assessment | CarePro</title>
      </Helmet>
      <div className="specialized-assessment-page">
        <SpecializedAssessment />
      </div>
    </>
  );
};

export default SpecializedAssessmentPage;
