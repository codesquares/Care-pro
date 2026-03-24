import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import CareRequestService from '../../../services/careRequestService';
import '../../client/client-dashboard/marketplaceHero.css';
import './YourRequests.css';

const normalizeStatus = (status) => {
  const s = (status || '').toLowerCase().trim();
  if (s === 'pending' || s === 'matched') return 'Active';
  if (s === 'accepted') return 'In Progress';
  if (s === 'completed') return 'Closed';
  if (s === 'cancelled' || s === 'canceled') return 'Cancelled';
  return 'Active';
};

const tabKeys = ['All Requests', 'Active', 'In Progress', 'Closed', 'Cancelled'];

const YourRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All Requests');
  const [serviceFilter, setServiceFilter] = useState('');
  const [budgetFilter, setBudgetFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await CareRequestService.getCareRequests();
        setRequests(data || []);
      } catch (err) {
        console.error('Failed to load care requests:', err);
        toast.error('Failed to load your requests.');
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  // Count per tab
  const tabCounts = useMemo(() => {
    const counts = {};
    tabKeys.forEach(k => { counts[k] = 0; });
    requests.forEach(r => {
      const norm = normalizeStatus(r.status);
      if (counts[norm] !== undefined) counts[norm]++;
    });
    counts['All Requests'] = requests.length;
    return counts;
  }, [requests]);

  // Filtered + sorted list
  const filteredRequests = useMemo(() => {
    let list = requests.map(r => ({ ...r, _status: normalizeStatus(r.status) }));

    if (activeTab !== 'All Requests') {
      list = list.filter(r => r._status === activeTab);
    }
    if (serviceFilter) {
      list = list.filter(r => r.serviceCategory === serviceFilter);
    }
    if (locationFilter) {
      list = list.filter(r => (r.location || '').toLowerCase().includes(locationFilter.toLowerCase()));
    }

    if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else if (sortBy === 'title') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return list;
  }, [requests, activeTab, serviceFilter, locationFilter, sortBy]);

  // Unique service categories for filter
  const serviceOptions = useMemo(() => {
    const set = new Set(requests.map(r => r.serviceCategory).filter(Boolean));
    return [...set].sort();
  }, [requests]);

  const handleViewRequest = (requestId) => {
    navigate(`/app/client/care-requests/${requestId}/matches`);
  };

  return (
    <div className="your-requests-page">
      {/* Banner */}
      <div className="marketplace-banner your-requests-banner">
        <div className="marketplace-banner-content">
          <h1 className="marketplace-banner-title">Your Requests</h1>
        </div>
        <div className="your-requests-banner-right">
          <p className="your-requests-tagline">
            Can't find the right caregiver?<br />
            Tell us what you need &amp; we'll help match you.
          </p>
          <button
            className="yr-create-btn"
            onClick={() => navigate('/app/client/post-project')}
          >
            Create Request
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="your-requests-content">
        {loading ? (
          <div className="your-requests-loading">Loading your requests...</div>
        ) : requests.length === 0 ? (
          /* Empty state */
          <>
            <div className="yr-table-head">
              <span>Request Title</span>
              <span>Status</span>
              <span>Responders</span>
              <span>Action</span>
            </div>
            <div className="your-requests-empty">
              <h2>Post your first Request</h2>
              <p>
                Describe your care needs &amp; generate a brief.<br />
                Choose from a curated shortlist of offers from caregivers
              </p>
              <button
                className="your-requests-cta"
                onClick={() => navigate('/app/client/post-project')}
              >
                Write your Request
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Tabs */}
            <div className="yr-tabs">
              {tabKeys.map(tab => (
                <button
                  key={tab}
                  className={`yr-tab ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab} ({tabCounts[tab] || 0})
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="yr-filters">
              <select
                value={serviceFilter}
                onChange={e => setServiceFilter(e.target.value)}
              >
                <option value="">Service options</option>
                {serviceOptions.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={budgetFilter}
                onChange={e => setBudgetFilter(e.target.value)}
              >
                <option value="">Budget</option>
                <option value="low">Under ₦10,000</option>
                <option value="mid">₦10,000 - ₦30,000</option>
                <option value="high">Above ₦30,000</option>
              </select>
              <select
                value={locationFilter}
                onChange={e => setLocationFilter(e.target.value)}
              >
                <option value="">Location</option>
              </select>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="newest">Sort By</option>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="title">Title A–Z</option>
              </select>
            </div>

            {/* Table */}
            <div className="yr-table-head">
              <span>Request Title</span>
              <span>Status</span>
              <span>Responders</span>
              <span>Action</span>
            </div>

            <div className="yr-table-body">
              {filteredRequests.length === 0 ? (
                <div className="yr-no-results">No requests match this filter.</div>
              ) : (
                filteredRequests.map((req) => {
                  const id = req.id || req.careRequestId;
                  const responders = req.matchCount ?? req.responders ?? 0;
                  return (
                    <div key={id} className="yr-row">
                      <span
                        className="yr-row-title"
                        onClick={() => handleViewRequest(id)}
                      >
                        {req.title}
                      </span>
                      <span className="yr-row-status">{req._status}</span>
                      <span className="yr-row-responders">{responders} Responders</span>
                      <span className="yr-row-action">
                        <button onClick={() => handleViewRequest(id)}>
                          View Request ▾
                        </button>
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default YourRequests;
