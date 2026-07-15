import { useState } from 'react';
import { adminWithdrawalService } from '../../../services/withdrawalService';
import './WithdrawalTokenLookup.css';

const WithdrawalTokenLookup = () => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const handleLookup = async (e) => {
    e.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) {
      setError('Please provide a token.');
      setData(null);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await adminWithdrawalService.getWithdrawalRequestByToken(trimmed);
      setData(result || null);
    } catch (err) {
      setData(null);
      setError(err?.message || 'Failed to fetch withdrawal by token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="withdrawal-token-lookup">
      <h2>Withdrawal Token Lookup</h2>
      <p className="lookup-subtitle">Finance QA utility for backend token-lookup authorization checks.</p>

      <form className="lookup-form" onSubmit={handleLookup}>
        <label htmlFor="token">Token</label>
        <input
          id="token"
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Enter withdrawal token"
        />
        <button type="submit" disabled={loading}>{loading ? 'Checking...' : 'Lookup Token'}</button>
      </form>

      {error && <div className="lookup-error">{error}</div>}

      {data && (
        <div className="lookup-result">
          <h3>Result</h3>
          <div><strong>Caregiver:</strong> {data.caregiverName || data.caregiverId || '—'}</div>
          <div><strong>Status:</strong> {data.status || '—'}</div>
          <div><strong>Amount Requested:</strong> {data.amountRequested ?? '—'}</div>
          <div><strong>Final Amount:</strong> {data.finalAmount ?? '—'}</div>
          <div><strong>Token:</strong> {data.token || token}</div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalTokenLookup;
