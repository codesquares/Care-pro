import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import CareRequestService from '../../../services/careRequestService';
import './AdminCareRequestDetail.css';

const AdminCareRequestDetail = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [careRequest, setCareRequest] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rerunning, setRerunning] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [request, matches] = await Promise.all([
        CareRequestService.getCareRequest(requestId),
        CareRequestService.getMatches(requestId).catch(() => null),
      ]);
      setCareRequest(request);
      setMatchData(matches);
    } catch (err) {
      toast.error('Failed to load care request details');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRerunMatch = async () => {
    try {
      setRerunning(true);
      const result = await CareRequestService.triggerMatch(requestId);
      setMatchData(result);
      toast.success(`Matching complete — ${result.totalMatches} caregiver(s) found.`);
    } catch (err) {
      toast.error('Failed to trigger matching: ' + err.message);
    } finally {
      setRerunning(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-care-detail">
        <div className="admin-loading">Loading care request...</div>
      </div>
    );
  }

  return (
    <div className="admin-care-detail">
      <button className="admin-back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="admin-care-header">
        <h1>Care Request Details</h1>
        <span className={`admin-status-badge ${careRequest?.status || 'pending'}`}>
          {careRequest?.status || 'pending'}
        </span>
      </div>

      {careRequest && (
        <div className="admin-care-info">
          <div className="acrd-info-grid">
            <div className="acrd-info-item">
              <span className="acrd-info-label">Title</span>
              <span className="acrd-info-value">{careRequest.title}</span>
            </div>
            <div className="acrd-info-item">
              <span className="acrd-info-label">Category</span>
              <span className="acrd-info-value">{careRequest.serviceCategory}</span>
            </div>
            <div className="acrd-info-item">
              <span className="acrd-info-label">Client ID</span>
              <span className="acrd-info-value">{careRequest.clientId}</span>
            </div>
            <div className="acrd-info-item">
              <span className="acrd-info-label">Urgency</span>
              <span className="acrd-info-value">{careRequest.urgency}</span>
            </div>
            {careRequest.location && (
              <div className="acrd-info-item">
                <span className="acrd-info-label">Location</span>
                <span className="acrd-info-value">{careRequest.location}</span>
              </div>
            )}
            {careRequest.budget && (
              <div className="acrd-info-item">
                <span className="acrd-info-label">Budget</span>
                <span className="acrd-info-value">{careRequest.budget}</span>
              </div>
            )}
            <div className="acrd-info-item">
              <span className="acrd-info-label">Match Count</span>
              <span className="acrd-info-value">{careRequest.matchCount ?? 0}</span>
            </div>
            {careRequest.matchedAt && (
              <div className="acrd-info-item">
                <span className="acrd-info-label">Matched At</span>
                <span className="acrd-info-value">
                  {new Date(careRequest.matchedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
          {careRequest.description && (
            <div className="acrd-info-description">
              <span className="acrd-info-label">Description</span>
              <p>{careRequest.description}</p>
            </div>
          )}
        </div>
      )}

      {/* Admin Actions */}
      <div className="admin-actions">
        <button
          className="acrd-btn-rerun"
          onClick={handleRerunMatch}
          disabled={rerunning}
        >
          {rerunning ? 'Running...' : 'Re-run Matching'}
        </button>
      </div>

      {/* Matches */}
      <div className="admin-matches-section">
        <h2>
          Matches ({matchData?.totalMatches ?? 0})
          {matchData?.hasAlternatives && (
            <span className="acrd-alternatives-badge">Includes alternatives</span>
          )}
        </h2>

        {matchData?.matches?.length > 0 ? (
          <table className="admin-matches-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Caregiver</th>
                <th>Category</th>
                <th>Score</th>
                <th>Distance</th>
                <th>Rating</th>
                <th>Price</th>
                <th>Available</th>
              </tr>
            </thead>
            <tbody>
              {matchData.matches.map((m) => (
                <tr key={m.caregiverId}>
                  <td>{m.rank}</td>
                  <td>
                    <div className="admin-cg-name">
                      {m.caregiverName}
                      <small>{m.caregiverId}</small>
                    </div>
                  </td>
                  <td>{m.matchedServiceCategory}</td>
                  <td>
                    <span className={`admin-score ${m.matchScore >= 60 ? 'high' : 'low'}`}>
                      {Math.round(m.matchScore)}
                    </span>
                  </td>
                  <td>{m.distanceKm != null ? `${m.distanceKm.toFixed(1)} km` : '—'}</td>
                  <td>{m.averageRating.toFixed(1)} ({m.reviewCount})</td>
                  <td>{m.gigPrice != null ? `₦${m.gigPrice.toLocaleString()}` : '—'}</td>
                  <td>{m.isAvailable ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="admin-no-matches">
            {matchData?.status === 'pending'
              ? 'Matching is still in progress...'
              : 'No matches found for this care request.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminCareRequestDetail;
