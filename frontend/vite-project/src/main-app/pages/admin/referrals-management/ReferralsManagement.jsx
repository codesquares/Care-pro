import { useCallback, useEffect, useMemo, useState } from 'react';
import referralAdminService from '../../../services/referralAdminService';
import { getAliasError } from '../../../utils/aliasValidation';
import './referrals-management.css';

const TABS = {
  APPLICATIONS: 'applications',
  REFERRERS: 'referrers',
  CODES: 'codes',
  REDEMPTIONS: 'redemptions',
};

const APPLICATION_FILTERS = ['PendingApproval', 'Approved', 'Rejected', 'All'];

const APPLICATION_FILTER_LABELS = {
  PendingApproval: 'Pending',
  Approved: 'Approved',
  Rejected: 'Rejected',
  All: 'All',
};

const initialReferrerForm = {
  fullName: '',
  email: '',
  phoneNo: '',
  alias: '',
  bankName: '',
  accountNumber: '',
  accountName: '',
};

const ReferralsManagement = () => {
  const [activeTab, setActiveTab] = useState(TABS.REFERRERS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [referrerForm, setReferrerForm] = useState(initialReferrerForm);
  const [aliasError, setAliasError] = useState(null);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [referrerIdInput, setReferrerIdInput] = useState('');
  const [referrers, setReferrers] = useState([]);
  const [loadingReferrers, setLoadingReferrers] = useState(false);
  const [isReferrerLookupUnavailable, setIsReferrerLookupUnavailable] = useState(false);

  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [applicationsFilter, setApplicationsFilter] = useState('PendingApproval');
  const [actioningId, setActioningId] = useState(null);
  const [confirmingRejectId, setConfirmingRejectId] = useState(null);
  const [generatedCodesByReferrerId, setGeneratedCodesByReferrerId] = useState({});

  const [redemptions, setRedemptions] = useState([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(false);
  const [filterDates, setFilterDates] = useState({ startDate: '', endDate: '' });
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [markPaidTarget, setMarkPaidTarget] = useState(null);
  const [localOnlyNotes, setLocalOnlyNotes] = useState('');

  const clearAlerts = useCallback(() => {
    setError(null);
    setSuccessMessage('');
  }, []);

  const hasBankDetails = useMemo(() => {
    return (
      referrerForm.bankName.trim() ||
      referrerForm.accountNumber.trim() ||
      referrerForm.accountName.trim()
    );
  }, [referrerForm.accountName, referrerForm.accountNumber, referrerForm.bankName]);

  const loadReferrers = useCallback(async () => {
    clearAlerts();
    setLoadingReferrers(true);
    const result = await referralAdminService.getReferrers();
    setLoadingReferrers(false);

    if (!result.success) {
      if (result.methodNotAllowed) {
        setIsReferrerLookupUnavailable(true);
        setReferrers([]);
        setError('Backend does not support listing referrers on this environment (405). Enter Referrer ID manually or create a new referrer and use the returned ID.');
        return;
      }
      setError(result.error || 'Failed to load referrers.');
      return;
    }

    setIsReferrerLookupUnavailable(false);
    setReferrers(result.data || []);
  }, [clearAlerts]);

  useEffect(() => {
    if (activeTab === TABS.CODES) {
      loadReferrers();
    }
  }, [activeTab, loadReferrers]);

  const loadApplications = useCallback(async () => {
    clearAlerts();
    setLoadingApplications(true);
    const result = await referralAdminService.getReferrers();
    setLoadingApplications(false);

    if (!result.success) {
      setError(result.error || 'Failed to load referral applications.');
      return;
    }

    setApplications(result.data || []);
  }, [clearAlerts]);

  useEffect(() => {
    if (activeTab === TABS.APPLICATIONS) {
      loadApplications();
    }
  }, [activeTab, loadApplications]);

  const filteredApplications = useMemo(() => {
    if (applicationsFilter === 'All') return applications;
    return applications.filter((a) => a.status === applicationsFilter);
  }, [applications, applicationsFilter]);

  const handleApprove = async (referrerId) => {
    clearAlerts();
    setActioningId(referrerId);
    const result = await referralAdminService.approveReferrer(referrerId);
    setActioningId(null);

    if (!result.success) {
      setError(result.error || 'Failed to approve referrer.');
      return;
    }

    setSuccessMessage('Referrer approved.');
    await loadApplications();
  };

  const handleRejectClick = (referrerId) => {
    clearAlerts();
    setConfirmingRejectId(referrerId);
  };

  const handleCancelReject = () => {
    setConfirmingRejectId(null);
  };

  const handleConfirmReject = async (referrerId) => {
    clearAlerts();
    setActioningId(referrerId);
    const result = await referralAdminService.rejectReferrer(referrerId);
    setActioningId(null);
    setConfirmingRejectId(null);

    if (!result.success) {
      setError(result.error || 'Failed to reject referrer.');
      return;
    }

    setSuccessMessage('Referrer rejected.');
    await loadApplications();
  };

  const handleGenerateCodeForRow = async (referrerId) => {
    clearAlerts();
    setActioningId(referrerId);
    const result = await referralAdminService.generateReferralCode(referrerId);
    setActioningId(null);

    if (!result.success) {
      setError(result.error || 'Failed to generate referral code.');
      return;
    }

    setGeneratedCodesByReferrerId((prev) => ({
      ...prev,
      [referrerId]: { id: result.data?.id, code: result.data?.code, sent: false },
    }));
    setSuccessMessage(`Referral code generated: ${result.data?.code}`);
  };

  const handleSendEmailForRow = async (referrerId) => {
    const entry = generatedCodesByReferrerId[referrerId];
    if (!entry?.id) return;

    clearAlerts();
    setActioningId(referrerId);
    const result = await referralAdminService.sendReferralCodeEmail(entry.id);
    setActioningId(null);

    if (!result.success) {
      setError(result.error || 'Failed to send referral code email.');
      return;
    }

    setGeneratedCodesByReferrerId((prev) => ({
      ...prev,
      [referrerId]: { ...prev[referrerId], sent: true },
    }));
    setSuccessMessage('Referral code emailed to referrer.');
  };

  const handleCreateReferrer = async (e) => {
    e.preventDefault();
    clearAlerts();

    const aliasValidationError = getAliasError(referrerForm.alias);
    if (aliasValidationError) {
      setAliasError(aliasValidationError);
      return;
    }
    setAliasError(null);

    setIsSubmitting(true);

    const payload = {
      fullName: referrerForm.fullName.trim(),
      email: referrerForm.email.trim(),
      phoneNo: referrerForm.phoneNo.trim(),
      alias: referrerForm.alias.trim(),
      ...(hasBankDetails
        ? {
            bankAccount: {
              fullName: referrerForm.fullName.trim(),
              bankName: referrerForm.bankName.trim(),
              accountNumber: referrerForm.accountNumber.trim(),
              accountName: referrerForm.accountName.trim(),
            },
          }
        : {}),
    };

    const result = await referralAdminService.createReferrer(payload);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Unable to create referrer.');
      return;
    }

    const created = result.data;
    setSuccessMessage(`Referrer created: ${created?.fullName || 'Success'}`);
    setReferrerForm(initialReferrerForm);
    setAliasError(null);
    if (created?.id) {
      setReferrerIdInput(created.id);
      setReferrers((prev) => {
        const alreadyExists = prev.some((r) => r.id === created.id);
        if (alreadyExists) return prev;
        return [created, ...prev];
      });
    }
  };

  const handleGenerateCode = async (e) => {
    e.preventDefault();
    clearAlerts();
    if (!referrerIdInput.trim()) {
      setError('Referrer ID is required.');
      return;
    }

    setIsSubmitting(true);
    const result = await referralAdminService.generateReferralCode(referrerIdInput.trim());
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Failed to generate code.');
      return;
    }

    setGeneratedCode(result.data);
    setSuccessMessage('Referral code generated successfully.');
  };

  const handleFetchRedemptions = async () => {
    clearAlerts();
    setLoadingRedemptions(true);
    const result = await referralAdminService.getRedemptions(filterDates);
    setLoadingRedemptions(false);

    if (!result.success) {
      setError(result.error || 'Failed to load redemptions.');
      return;
    }

    setRedemptions(result.data);
  };

  const openMarkPaidModal = (row) => {
    setMarkPaidTarget(row);
    setLocalOnlyNotes('');
    setShowMarkPaidModal(true);
  };

  const handleConfirmMarkPaid = async () => {
    if (!markPaidTarget?.redemptionId) return;
    clearAlerts();
    setIsSubmitting(true);

    const result = await referralAdminService.markRedemptionPaid(markPaidTarget.redemptionId);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Failed to mark as paid.');
      return;
    }

    setSuccessMessage('Redemption marked as paid.');
    setShowMarkPaidModal(false);
    setMarkPaidTarget(null);
    await handleFetchRedemptions();
  };

  const handleExportRedemptions = async () => {
    clearAlerts();
    setIsSubmitting(true);
    const result = await referralAdminService.exportReferralRedemptions(filterDates);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Export failed.');
      return;
    }

    setSuccessMessage('Referral redemptions export started.');
  };

  return (
    <div className="referrals-admin-page">
      <div className="referrals-admin-header">
        <h1>Referral Management</h1>
        <p>Finance tools for referrers, referral codes, redemptions, and payout actions.</p>
      </div>

      <div className="referrals-admin-tabs">
        <button
          className={`tab-btn ${activeTab === TABS.APPLICATIONS ? 'active' : ''}`}
          onClick={() => setActiveTab(TABS.APPLICATIONS)}
        >
          Applications
        </button>
        <button
          className={`tab-btn ${activeTab === TABS.REFERRERS ? 'active' : ''}`}
          onClick={() => setActiveTab(TABS.REFERRERS)}
        >
          Referrers
        </button>
        <button
          className={`tab-btn ${activeTab === TABS.CODES ? 'active' : ''}`}
          onClick={() => setActiveTab(TABS.CODES)}
        >
          Codes
        </button>
        <button
          className={`tab-btn ${activeTab === TABS.REDEMPTIONS ? 'active' : ''}`}
          onClick={() => setActiveTab(TABS.REDEMPTIONS)}
        >
          Redemptions
        </button>
      </div>

      {error && <div className="ref-alert ref-alert--error">{error}</div>}
      {successMessage && <div className="ref-alert ref-alert--success">{successMessage}</div>}

      {activeTab === TABS.APPLICATIONS && (
        <section className="ref-card">
          <h2>Referral Applications</h2>

          <div className="ref-filter-row">
            {APPLICATION_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`btn-secondary btn-small ${applicationsFilter === filter ? 'active' : ''}`}
                onClick={() => setApplicationsFilter(filter)}
              >
                {APPLICATION_FILTER_LABELS[filter]}
              </button>
            ))}
            <button type="button" className="btn-secondary btn-small" onClick={loadApplications} disabled={loadingApplications}>
              {loadingApplications ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {loadingApplications ? (
            <div className="ref-empty">Loading applications…</div>
          ) : filteredApplications.length === 0 ? (
            <div className="ref-empty">No applications match this filter.</div>
          ) : (
            <div className="ref-table-wrap">
              <table className="ref-table">
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Alias</th>
                    <th>Status</th>
                    <th>Applied</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app) => {
                    const isActioning = actioningId === app.id;
                    const codeEntry = generatedCodesByReferrerId[app.id];
                    return (
                      <tr key={app.id}>
                        <td>{app.fullName || 'Unnamed'}</td>
                        <td>{app.email}</td>
                        <td>{app.alias || '—'}</td>
                        <td>
                          <span className={`status-badge status-badge--${(app.status || 'unknown').toLowerCase()}`}>
                            {app.status || 'Unknown'}
                          </span>
                        </td>
                        <td>{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '—'}</td>
                        <td>
                          {app.status === 'PendingApproval' && (
                            confirmingRejectId === app.id ? (
                              <span className="ref-actions">
                                <button
                                  className="btn-danger btn-small"
                                  onClick={() => handleConfirmReject(app.id)}
                                  disabled={isActioning}
                                >
                                  {isActioning ? 'Rejecting…' : 'Confirm reject?'}
                                </button>
                                <button className="btn-secondary btn-small" onClick={handleCancelReject} disabled={isActioning}>
                                  Cancel
                                </button>
                              </span>
                            ) : (
                              <span className="ref-actions">
                                <button
                                  className="btn-primary btn-small"
                                  onClick={() => handleApprove(app.id)}
                                  disabled={isActioning}
                                >
                                  {isActioning ? 'Approving…' : 'Approve'}
                                </button>
                                <button
                                  className="btn-secondary btn-small"
                                  onClick={() => handleRejectClick(app.id)}
                                  disabled={isActioning}
                                >
                                  Reject
                                </button>
                              </span>
                            )
                          )}

                          {app.status === 'Approved' && (
                            codeEntry ? (
                              <span className="ref-actions">
                                <span className="ref-generated-code">{codeEntry.code}</span>
                                <button
                                  className="btn-primary btn-small"
                                  onClick={() => handleSendEmailForRow(app.id)}
                                  disabled={isActioning || codeEntry.sent}
                                >
                                  {codeEntry.sent ? 'Email Sent' : isActioning ? 'Sending…' : 'Send Email'}
                                </button>
                              </span>
                            ) : (
                              <button
                                className="btn-primary btn-small"
                                onClick={() => handleGenerateCodeForRow(app.id)}
                                disabled={isActioning}
                              >
                                {isActioning ? 'Generating…' : 'Generate Code'}
                              </button>
                            )
                          )}

                          {app.status === 'Rejected' && <span className="ref-empty">No action</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === TABS.REFERRERS && (
        <section className="ref-card">
          <h2>Create Referrer</h2>
          <form onSubmit={handleCreateReferrer} className="ref-grid-form">
            <label>
              Full Name
              <input value={referrerForm.fullName} onChange={(e) => setReferrerForm((p) => ({ ...p, fullName: e.target.value }))} required />
            </label>
            <label>
              Email
              <input type="email" value={referrerForm.email} onChange={(e) => setReferrerForm((p) => ({ ...p, email: e.target.value }))} required />
            </label>
            <label>
              Phone Number
              <input value={referrerForm.phoneNo} onChange={(e) => setReferrerForm((p) => ({ ...p, phoneNo: e.target.value }))} required />
            </label>
            <label>
              Alias
              <input
                value={referrerForm.alias}
                onChange={(e) => {
                  const value = e.target.value;
                  setReferrerForm((p) => ({ ...p, alias: value }));
                  setAliasError(value ? getAliasError(value) : null);
                }}
                placeholder="e.g. drwealth"
                required
              />
              {aliasError && <span className="ref-field-error">{aliasError}</span>}
            </label>

            <div className="ref-subtitle">Optional Bank Account</div>

            <label>
              Bank Name
              <input value={referrerForm.bankName} onChange={(e) => setReferrerForm((p) => ({ ...p, bankName: e.target.value }))} />
            </label>
            <label>
              Account Number
              <input value={referrerForm.accountNumber} onChange={(e) => setReferrerForm((p) => ({ ...p, accountNumber: e.target.value }))} />
            </label>
            <label>
              Account Name
              <input value={referrerForm.accountName} onChange={(e) => setReferrerForm((p) => ({ ...p, accountName: e.target.value }))} />
            </label>

            <div className="ref-actions">
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Creating…' : 'Create Referrer'}
              </button>
            </div>
          </form>
        </section>
      )}

      {activeTab === TABS.CODES && (
        <section className="ref-card">
          <h2>Generate Referral Code</h2>
          <form onSubmit={handleGenerateCode} className="ref-single-form">
            <label>
              {isReferrerLookupUnavailable ? 'Referrer ID' : 'Select Referrer'}
              {isReferrerLookupUnavailable ? (
                <input
                  value={referrerIdInput}
                  onChange={(e) => setReferrerIdInput(e.target.value)}
                  placeholder="Enter referrer ID"
                  required
                />
              ) : (
                <select
                  value={referrerIdInput}
                  onChange={(e) => setReferrerIdInput(e.target.value)}
                  required
                >
                  <option value="">Select a referrer</option>
                  {referrers.map((referrer) => (
                    <option key={referrer.id} value={referrer.id}>
                      {referrer.fullName || 'Unnamed'} {referrer.email ? `(${referrer.email})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </label>
            <div className="ref-actions">
              {!isReferrerLookupUnavailable && (
                <button type="button" className="btn-secondary" onClick={loadReferrers} disabled={loadingReferrers || isSubmitting}>
                  {loadingReferrers ? 'Refreshing…' : 'Refresh Referrers'}
                </button>
              )}
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Generating…' : 'Generate Code'}
              </button>
            </div>
          </form>

          {referrerIdInput && (
            <div className="ref-result">
              <div><strong>Selected Referrer ID:</strong> {referrerIdInput}</div>
            </div>
          )}

          {generatedCode && (
            <div className="ref-result">
              <div><strong>Code:</strong> {generatedCode.code}</div>
              <div><strong>Referrer ID:</strong> {generatedCode.referrerId}</div>
              <div><strong>Status:</strong> {generatedCode.isActive ? 'Active' : 'Inactive'}</div>
            </div>
          )}
        </section>
      )}

      {activeTab === TABS.REDEMPTIONS && (
        <section className="ref-card">
          <h2>Referral Redemptions</h2>

          <div className="ref-filter-row">
            <label>
              Start Date
              <input
                type="date"
                value={filterDates.startDate}
                onChange={(e) => setFilterDates((p) => ({ ...p, startDate: e.target.value }))}
              />
            </label>
            <label>
              End Date
              <input
                type="date"
                value={filterDates.endDate}
                onChange={(e) => setFilterDates((p) => ({ ...p, endDate: e.target.value }))}
              />
            </label>
            <div className="ref-actions">
              <button className="btn-secondary" onClick={handleFetchRedemptions} disabled={loadingRedemptions}>
                {loadingRedemptions ? 'Loading…' : 'Load Redemptions'}
              </button>
              <button className="btn-secondary" onClick={handleExportRedemptions} disabled={isSubmitting}>
                Export XLSX
              </button>
            </div>
          </div>

          {redemptions.length === 0 ? (
            <div className="ref-empty">No redemptions loaded for the selected range.</div>
          ) : (
            <div className="ref-table-wrap">
              <table className="ref-table">
                <thead>
                  <tr>
                    <th>Referral Code</th>
                    <th>Referrer</th>
                    <th>Discount</th>
                    <th>Payout</th>
                    <th>Status</th>
                    <th>Redeemed At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {redemptions.map((row) => (
                    <tr key={row.redemptionId}>
                      <td>{row.referralCode}</td>
                      <td>{row.referrerName || row.referrerEmail}</td>
                      <td>₦{(row.discountAmount || 0).toLocaleString()}</td>
                      <td>₦{(row.payoutAmount || 0).toLocaleString()}</td>
                      <td>{row.payoutStatus}</td>
                      <td>{row.redeemedAt ? new Date(row.redeemedAt).toLocaleString() : '—'}</td>
                      <td>
                        {row.payoutStatus === 'Pending' ? (
                          <button className="btn-primary btn-small" onClick={() => openMarkPaidModal(row)}>
                            Mark Paid
                          </button>
                        ) : (
                          <span className="status-paid">Paid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {showMarkPaidModal && (
        <div className="ref-modal-overlay" onClick={() => setShowMarkPaidModal(false)}>
          <div className="ref-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Mark Redemption as Paid</h3>
            <p>
              Confirm marking this redemption as paid for code <strong>{markPaidTarget?.referralCode}</strong>.
            </p>
            <label>
              Optional Notes (local-only)
              <textarea
                rows={3}
                value={localOnlyNotes}
                onChange={(e) => setLocalOnlyNotes(e.target.value)}
                placeholder="Notes are not sent to backend in current contract."
              />
            </label>
            <div className="ref-modal-note">
              Backend currently does not accept notes for mark-paid. This field is informational only.
            </div>
            <div className="ref-actions">
              <button className="btn-primary" onClick={handleConfirmMarkPaid} disabled={isSubmitting}>
                {isSubmitting ? 'Updating…' : 'Confirm Mark Paid'}
              </button>
              <button className="btn-secondary" onClick={() => setShowMarkPaidModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralsManagement;
