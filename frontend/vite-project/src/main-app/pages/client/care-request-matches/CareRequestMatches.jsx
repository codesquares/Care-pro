import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import CareRequestService from '../../../services/careRequestService';
import '../client-dashboard/marketplaceHero.css';
import './CareRequestMatches.css';

const POLL_INTERVAL = 30000; // 30s fallback polling

const scoreLabel = (score) => {
  if (score >= 80) return { text: 'Excellent Match', cls: 'excellent' };
  if (score >= 60) return { text: 'Good Match', cls: 'good' };
  if (score >= 40) return { text: 'Fair Match', cls: 'fair' };
  return { text: 'Possible Match', cls: 'low' };
};

const formatDistance = (km) => {
  if (km == null) return null;
  return km < 1 ? `${Math.round(km * 1000)}m away` : `${km.toFixed(1)}km away`;
};

const formatPrice = (price) => {
  if (price == null) return null;
  return `₦${Number(price).toLocaleString()}`;
};

const ScoreBreakdown = ({ breakdown }) => {
  const factors = [
    { key: 'categoryScore', label: 'Category', max: 25 },
    { key: 'proximityScore', label: 'Proximity', max: 25 },
    { key: 'budgetScore', label: 'Budget', max: 15 },
    { key: 'ratingScore', label: 'Ratings', max: 15 },
    { key: 'preferenceScore', label: 'Preferences', max: 10 },
    { key: 'engagementScore', label: 'Engagement', max: 5 },
    { key: 'profileScore', label: 'Profile', max: 5 },
  ];

  return (
    <div className="score-breakdown">
      <h4>Score Breakdown</h4>
      <div className="breakdown-bars">
        {factors.map(({ key, label, max }) => {
          const val = breakdown?.[key] ?? 0;
          const pct = (val / max) * 100;
          return (
            <div key={key} className="breakdown-row">
              <span className="breakdown-label">{label}</span>
              <div className="breakdown-track">
                <div
                  className="breakdown-fill"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="breakdown-value">{val.toFixed(1)}/{max}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MatchCard = ({ match, onViewProfile }) => {
  const [expanded, setExpanded] = useState(false);
  const { text: matchLabel, cls: matchCls } = scoreLabel(match.matchScore);

  return (
    <div className="match-card">
      <div className="match-card-header">
        <div className="match-rank">#{match.rank}</div>
        <div className="match-caregiver-info">
          {match.profileImage ? (
            <img
              src={match.profileImage}
              alt={match.caregiverName}
              className="match-avatar"
            />
          ) : (
            <div className="match-avatar-fallback">
              {match.caregiverName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
          )}
          <div className="match-name-block">
            <h3 className="match-name">{match.caregiverName}</h3>
            {match.location && (
              <span className="match-location">📍 {match.location}</span>
            )}
          </div>
        </div>
        <div className="match-score-block">
          <div className={`match-score-badge ${matchCls}`}>
            {Math.round(match.matchScore)}
          </div>
          <span className={`match-score-label ${matchCls}`}>{matchLabel}</span>
        </div>
      </div>

      <div className="match-card-body">
        <div className="match-tags">
          <span className="match-tag category">{match.matchedServiceCategory}</span>
          {match.isAvailable && <span className="match-tag available">Available</span>}
          {!match.isAvailable && <span className="match-tag unavailable">Unavailable</span>}
          {match.distanceKm != null && (
            <span className="match-tag distance">{formatDistance(match.distanceKm)}</span>
          )}
        </div>

        {match.gigTitle && (
          <div className="match-gig">
            <span className="match-gig-title">{match.gigTitle}</span>
            {match.gigPrice != null && (
              <span className="match-gig-price">{formatPrice(match.gigPrice)}</span>
            )}
          </div>
        )}

        <div className="match-stats">
          <div className="match-stat">
            <span className="stat-value">
              {'★'.repeat(Math.round(match.averageRating))}{'☆'.repeat(5 - Math.round(match.averageRating))}
            </span>
            <span className="stat-label">
              {match.averageRating.toFixed(1)} ({match.reviewCount} {match.reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        </div>

        {match.aboutMe && (
          <p className="match-about">
            {match.aboutMe.length > 150 && !expanded
              ? `${match.aboutMe.slice(0, 150)}...`
              : match.aboutMe}
            {match.aboutMe.length > 150 && (
              <button
                className="read-more-btn"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </p>
        )}

        {expanded && match.scoreBreakdown && (
          <ScoreBreakdown breakdown={match.scoreBreakdown} />
        )}
      </div>

      <div className="match-card-actions">
        <button
          className="btn-score-detail"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Hide Details' : 'Score Details'}
        </button>
        <button
          className="btn-view-profile"
          onClick={() => onViewProfile(match.caregiverId)}
        >
          View Profile
        </button>
      </div>
    </div>
  );
};

const CareRequestMatches = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const fetchMatches = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const result = await CareRequestService.getMatches(requestId);
      setData(result);
      setError(null);

      // Stop polling once we have a definitive result
      if (result.status !== 'pending' && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    } catch (err) {
      // Stop polling on auth errors to prevent infinite 401 loops
      if (err.response?.status === 401 || err.response?.status === 403) {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }
      setError(err.message);
      if (showLoader) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchMatches(true);

    // Polling fallback for when SignalR isn't available
    pollRef.current = setInterval(() => fetchMatches(false), POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMatches]);

  // Listen for SignalR notifications via CustomEvent (dispatched by notification system)
  useEffect(() => {
    const handleMatchNotification = (e) => {
      const { type, relatedEntityId } = e.detail || {};
      if (
        relatedEntityId === requestId &&
        (
          type === 'care_request_matched' || type === 'care_request_no_match' ||
          type === 'care_request_created' || type === 'care_request_paused' ||
          type === 'care_request_reopened' || type === 'care_request_closed'
        )
      ) {
        fetchMatches(false);
      }
    };

    window.addEventListener('care-request-update', handleMatchNotification);
    return () => window.removeEventListener('care-request-update', handleMatchNotification);
  }, [requestId, fetchMatches]);

  const handleViewProfile = (caregiverId) => {
    navigate(`/service/${caregiverId}`);
  };

  const isPending = data?.status === 'pending';
  const hasMatches = data?.matches?.length > 0;

  return (
    <div className="care-matches-page">
      {/* Banner */}
      <div className="marketplace-banner matches-banner">
        <div className="marketplace-banner-content">
          <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
          <h1 className="marketplace-banner-title">
            {loading
              ? 'Caregiver Matches'
              : error
              ? 'Caregiver Matches'
              : isPending
              ? 'Finding Caregivers...'
              : hasMatches
              ? `${data.totalMatches} Match${data.totalMatches !== 1 ? 'es' : ''} Found`
              : 'No Matches Yet'}
          </h1>
          {!loading && !error && data?.message && (
            <p className="marketplace-banner-subtitle">{data.message}</p>
          )}
        </div>
      </div>

      <div className="matches-content">
        {/* Loading */}
        {loading && (
          <div className="matches-loading">
            <div className="loading-spinner" />
            <p>Loading matches...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="matches-error">
            <span className="error-icon">⚠️</span>
            <h2>Something went wrong</h2>
            <p>{error}</p>
            <button className="btn-primary" onClick={() => fetchMatches(true)}>
              Try Again
            </button>
          </div>
        )}

        {/* Pending State */}
        {!loading && !error && isPending && (
          <div className="matches-pending">
            <div className="pending-animation">
              <div className="pulse-ring" />
              <span className="pending-icon">🔍</span>
            </div>
            <h2>We're matching you with caregivers</h2>
            <p>
              Our matching engine is analyzing available caregivers based on your requirements,
              location, budget, and preferences. This usually takes a couple of minutes.
            </p>
            <p className="pending-hint">
              We'll notify you as soon as results are ready. You can also stay on this page — it updates automatically.
            </p>
          </div>
        )}

        {/* No Matches State */}
        {!loading && !error && !isPending && !hasMatches && (
          <div className="matches-empty">
            <span className="empty-icon">😔</span>
            <h2>No matches found yet</h2>
            <p>
              We couldn't find caregivers that closely match your requirements right now.
              Our team has been notified and is working to find options for you.
            </p>
            {data?.hasAlternatives && (
              <p className="alternatives-note">
                We've expanded the search and included some alternative caregivers below
                that might work for you.
              </p>
            )}
            <div className="empty-actions">
              <button
                className="btn-secondary"
                onClick={() => navigate('/app/client/post-project')}
              >
                Adjust Requirements
              </button>
              <button
                className="btn-primary"
                onClick={() => navigate('/app/client/dashboard')}
              >
                Browse Marketplace
              </button>
            </div>
          </div>
        )}

        {/* Match Results */}
        {!loading && !error && hasMatches && (
          <div className="matches-list">
            {data.matches.map((match) => (
              <MatchCard
                key={match.caregiverId}
                match={match}
                onViewProfile={handleViewProfile}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CareRequestMatches;
