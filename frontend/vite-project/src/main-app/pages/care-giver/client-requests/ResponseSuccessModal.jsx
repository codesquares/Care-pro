import { useNavigate } from 'react-router-dom';
import './ResponseSuccessModal.css';

const ResponseSuccessModal = ({ onClose }) => {
  const navigate = useNavigate();

  return (
    <div className="rsm-overlay" onClick={onClose}>
      <div className="rsm-modal" onClick={e => e.stopPropagation()}>
        <button className="rsm-close" onClick={onClose}>×</button>

        <div className="rsm-content">
          <div className="rsm-icon">✓</div>
          <h2 className="rsm-title">Your Response has been sent to the client</h2>
          <p className="rsm-subtitle">
            The client will send you a message if you meet the requirement.
          </p>
          <button
            className="rsm-btn"
            onClick={() => {
              onClose();
              navigate('/app/caregiver/client-requests');
            }}
          >
            Back to Request Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResponseSuccessModal;
