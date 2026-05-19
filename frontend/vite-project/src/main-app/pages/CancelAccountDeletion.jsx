import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import accountDeletionService from '../services/accountDeletionService';

const CancelAccountDeletion = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const role = searchParams.get('role');

  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  const isValidParams = token && role && (role === 'Caregiver' || role === 'Client');

  const handleCancel = async () => {
    setStatus('loading');
    setMessage('');
    try {
      const data = await accountDeletionService.cancelByToken(role, token);
      setStatus('success');
      setMessage(data?.message || 'Your account has been restored. You can now log in.');
    } catch (err) {
      setStatus('error');
      if (err.status === 400 || err.status === 404) {
        setMessage(err.data?.message || 'This cancellation link is invalid or has expired.');
      } else {
        setMessage('Something went wrong. Please try again or contact codesquareltd@gmail.com.');
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f9fafb',
      padding: '1rem',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '460px',
        width: '100%',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🗑️</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>
          Cancel Account Deletion
        </h1>

        {!isValidParams ? (
          <p style={{ color: '#6b7280', marginTop: '1rem' }}>
            This cancellation link is invalid. Please ensure you are using the correct link from your email.
          </p>
        ) : status === 'success' ? (
          <>
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '1rem',
              marginTop: '1rem',
              marginBottom: '1.25rem',
              color: '#166534',
            }}>
              <p style={{ margin: 0, fontWeight: 600 }}>✅ Your account has been restored.</p>
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.9rem' }}>
                {message}
              </p>
            </div>
            <Link
              to="/login"
              style={{
                display: 'inline-block',
                background: '#2563eb',
                color: '#fff',
                borderRadius: '7px',
                padding: '0.6rem 1.4rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Go to Login
            </Link>
          </>
        ) : status === 'error' ? (
          <>
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '1rem',
              marginTop: '1rem',
              color: '#b91c1c',
            }}>
              <p style={{ margin: 0, fontWeight: 600 }}>Unable to cancel deletion</p>
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.9rem' }}>{message}</p>
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
              Need help?{' '}
              <a href="mailto:codesquareltd@gmail.com" style={{ color: '#2563eb' }}>
                codesquareltd@gmail.com
              </a>
            </p>
          </>
        ) : (
          <>
            <p style={{ color: '#374151', marginTop: '0.5rem', lineHeight: 1.6 }}>
              You requested to delete your account. Clicking the button below will cancel this
              request and fully restore your account.
            </p>
            <button
              onClick={handleCancel}
              disabled={status === 'loading'}
              style={{
                marginTop: '1.25rem',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '7px',
                padding: '0.7rem 1.6rem',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                opacity: status === 'loading' ? 0.7 : 1,
              }}
            >
              {status === 'loading' ? 'Processing...' : 'Yes, cancel my deletion'}
            </button>
            <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#9ca3af' }}>
              This link expires 30 days after your deletion was scheduled.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default CancelAccountDeletion;
