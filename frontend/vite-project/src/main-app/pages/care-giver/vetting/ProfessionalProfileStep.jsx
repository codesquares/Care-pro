import { useNavigate } from 'react-router-dom';
import ProfessionalProfileForms from '../../../components/caregiver_settings/ProfessionalProfileForms';
import './vetting.css';

// Vetting Hub step: "Complete your professional profile". Moved here from
// Account Settings (the card there is retired, preserved as a comment).
const ProfessionalProfileStep = () => {
  const navigate = useNavigate();
  return (
    <div className="vet-page">
      <div className="vet-header">
        <button className="vet-back-link" onClick={() => navigate('/app/caregiver/vetting')}>
          <i className="fas fa-arrow-left"></i> Back to Vetting
        </button>
        <h1><i className="fas fa-user-graduate"></i> Professional Profile</h1>
        <p>Add your education, qualifications and work history so clients can trust your profile.</p>
      </div>
      <ProfessionalProfileForms />
    </div>
  );
};

export default ProfessionalProfileStep;
