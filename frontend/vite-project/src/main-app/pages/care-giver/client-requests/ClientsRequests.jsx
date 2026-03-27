import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import CareRequestService from '../../../services/careRequestService';
import RequestDetailModal from './RequestDetailModal';
import ResponseSuccessModal from './ResponseSuccessModal';
import '../../../pages/client/client-dashboard/marketplaceHero.css';
import './ClientsRequests.css';

const formatBudget = (req) => {
  if (req.budgetMin != null && req.budgetMax != null) {
    return `₦${Number(req.budgetMin).toLocaleString()}–₦${Number(req.budgetMax).toLocaleString()}`;
  }
  if (req.budget) return req.budget;
  return 'Not specified';
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
};

const SERVICE_ICONS = {
  'Adult & Elderly Care': '👴',
  'Child Care': '👶',
  'Pet Care': '🐾',
  'Home Care': '🏠',
  'Post Surgery Care': '🏥',
  'Special Needs Care': '♿',
  'Mobility Support': '🦽',
  'Home Medical Support': '💊',
};

const ClientsRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceFilter, setServiceFilter] = useState('');
  const [budgetFilter, setBudgetFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  // Modal states
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await CareRequestService.getMatchedRequestsForCaregiver({
        serviceType: serviceFilter || undefined,
        location: locationFilter || undefined,
      });
      setRequests(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      console.error('Failed to load client requests:', err);
      toast.error('Failed to load client requests.');
    } finally {
      setLoading(false);
    }
  };

  const serviceOptions = useMemo(() => {
    const set = new Set(requests.map(r => r.serviceCategory).filter(Boolean));
    return [...set].sort();
  }, [requests]);

  const filteredRequests = useMemo(() => {
    let list = [...requests];
    if (serviceFilter) {
      list = list.filter(r => r.serviceCategory === serviceFilter);
    }
    if (locationFilter) {
      list = list.filter(r => (r.location || '').toLowerCase().includes(locationFilter.toLowerCase()));
    }
    return list;
  }, [requests, serviceFilter, locationFilter]);

  const handleReadMore = async (requestId) => {
    setDetailLoading(true);
    setShowDetailModal(true);
    try {
      const detail = await CareRequestService.getCaregiverViewRequest(requestId);
      setSelectedRequest(detail);
    } catch (err) {
      console.error('Failed to load request detail:', err);
      toast.error('Failed to load request details.');
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRespondToRequest = async (requestId) => {
    setDetailLoading(true);
    setShowDetailModal(true);
    try {
      const detail = await CareRequestService.getCaregiverViewRequest(requestId);
      setSelectedRequest(detail);
    } catch (err) {
      console.error('Failed to load request detail:', err);
      toast.error('Failed to load request details.');
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSubmitResponse = async (requestId, payload) => {
    try {
      await CareRequestService.respondToRequest(requestId, payload);
      setShowDetailModal(false);
      setSelectedRequest(null);
      setShowSuccessModal(true);
      // Refresh list to update hasResponded status
      fetchRequests();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit response.';
      toast.error(msg);
    }
  };

  return (
    <div className="clients-requests-page">
      {/* Banner */}
      <div className="marketplace-banner clients-requests-banner">
        <div className="marketplace-banner-content">
          <h1 className="marketplace-banner-title">Clients Requests</h1>
        </div>
        <div className="clients-requests-banner-right">
          <p className="clients-requests-tagline">
            Can't find the right caregiver?<br />
            Tell us what you need &amp; we'll help match you.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="cr-content">
        <div className="cr-filters">
          <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)}>
            <option value="">Service options ▾</option>
            {serviceOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={budgetFilter} onChange={e => setBudgetFilter(e.target.value)}>
            <option value="">Budget ▾</option>
            <option value="low">Under ₦10,000</option>
            <option value="mid">₦10,000 – ₦30,000</option>
            <option value="high">Above ₦30,000</option>
          </select>
          <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)}>
            <option value="">Location ▾</option>
          </select>
        </div>

        {/* Request Cards */}
        {loading ? (
          <div className="cr-loading">Loading client requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="cr-empty">
            <h2>No matching requests right now</h2>
            <p>Check back later — new client requests matching your profile will appear here.</p>
          </div>
        ) : (
          <div className="cr-request-list">
            {filteredRequests.map((req) => (
              <div key={req.id} className="cr-request-card">
                <div className="cr-card-meta">
                  <span className="cr-posted">Posted {formatTimeAgo(req.postedAt)}</span>
                  {req.respondersCount > 0 && (
                    <span className="cr-responders-badge">{req.respondersCount} Caregiver{req.respondersCount !== 1 ? 's' : ''} Responded</span>
                  )}
                </div>

                <div className="cr-card-body">
                  <div className="cr-card-left">
                    <h3 className="cr-card-title">{req.title}</h3>
                    <p className="cr-card-notes">{req.notes || 'No description provided.'}</p>
                  </div>

                  <div className="cr-card-right">
                    <div className="cr-detail-row">
                      <span className="cr-detail-label">Service Type:</span>
                      <span className="cr-detail-value">
                        {SERVICE_ICONS[req.serviceCategory] || '📋'} {req.serviceCategory}
                      </span>
                    </div>
                    <div className="cr-detail-row">
                      <span className="cr-detail-label">Location:</span>
                      <span className="cr-detail-value">{req.location || 'Not specified'}</span>
                    </div>
                    <div className="cr-detail-row">
                      <span className="cr-detail-label">Budget:</span>
                      <span className="cr-detail-value">{formatBudget(req)}</span>
                    </div>
                  </div>
                </div>

                <div className="cr-card-actions">
                  <button className="cr-btn-read-more" onClick={() => handleReadMore(req.id)}>
                    Read More
                  </button>
                  {req.hasResponded ? (
                    <button className="cr-btn-responded" disabled>Responded</button>
                  ) : (
                    <button className="cr-btn-respond" onClick={() => handleRespondToRequest(req.id)}>
                      Respond to Request
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && (
        <RequestDetailModal
          request={selectedRequest}
          loading={detailLoading}
          onClose={() => { setShowDetailModal(false); setSelectedRequest(null); }}
          onRespond={handleSubmitResponse}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <ResponseSuccessModal onClose={() => setShowSuccessModal(false)} />
      )}
    </div>
  );
};

export default ClientsRequests;
