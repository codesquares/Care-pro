import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import caregiverVettingService from '../services/caregiverVettingService';
import './GuarantorConfirmationPage.css';

const GuarantorConfirmationPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  const isValidParams = !!token;

  const handleConfirm = async () => {
    setStatus('loading');
    setMessage('');
    const result = await caregiverVettingService.confirmGuarantorByToken(token);
    if (result.success) {
      setStatus('success');
      setMessage(result.data?.message || 'Thank you — your confirmation has been recorded.');
    } else {
      setStatus('error');
      setMessage(result.error || 'This confirmation link is invalid or has expired.');
    }
  };

  return (
    <div className="gcp-page">
      <div className="gcp-card">
        <div className="gcp-icon">🤝</div>
        <h1 className="gcp-title">Guarantor Confirmation</h1>

        {!isValidParams ? (
          <p className="gcp-invalid">
            This confirmation link is invalid. Please use the link from the email you received.
          </p>
        ) : status === 'success' ? (
          <div className="gcp-success-box">
            <p className="gcp-box-title">✅ Confirmed</p>
            <p className="gcp-box-message">{message}</p>
          </div>
        ) : status === 'error' ? (
          <>
            <div className="gcp-error-box">
              <p className="gcp-box-title">Unable to confirm</p>
              <p className="gcp-box-message">{message}</p>
            </div>
            <p className="gcp-help-text">
              Need help?{' '}
              <a href="mailto:codesquareltd@gmail.com" className="gcp-help-link">
                codesquareltd@gmail.com
              </a>
            </p>
          </>
        ) : (
          <>
            <p className="gcp-intro">
              A caregiver has listed you as a guarantor on CarePro. Clicking the button below confirms
              that you agree to vouch for them.
            </p>
            <button
              onClick={handleConfirm}
              disabled={status === 'loading'}
              className="gcp-confirm-btn"
            >
              {status === 'loading' ? 'Confirming...' : 'Yes, I confirm'}
            </button>
          </>
        )}

        <p className="gcp-footer">
          <Link to="/" className="gcp-footer-link">Back to CarePro</Link>
        </p>
      </div>
    </div>
  );
};

export default GuarantorConfirmationPage;
