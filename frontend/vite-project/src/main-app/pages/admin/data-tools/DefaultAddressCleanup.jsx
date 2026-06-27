import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../../../services/adminService';
import { isSuperAdmin } from '../../../utils/adminPermissions';
import './default-address-cleanup.css';

const VALID_SCOPES = ['All', 'Caregivers', 'Clients'];

const getValue = (obj, pascalKey, camelKey, fallback = 0) => {
  if (!obj) return fallback;
  if (Object.prototype.hasOwnProperty.call(obj, pascalKey)) return obj[pascalKey];
  if (Object.prototype.hasOwnProperty.call(obj, camelKey)) return obj[camelKey];
  return fallback;
};

const toPreviewRows = (payload) => {
  const rows = getValue(payload, 'CaregiverRecipientPreview', 'caregiverRecipientPreview', []);
  if (!Array.isArray(rows)) return [];

  return rows.map((row, idx) => ({
    id: row.UserId || row.userId || `row-${idx}`,
    email: row.Email || row.email || 'N/A',
    firstName: row.FirstName || row.firstName || 'N/A',
  }));
};

const DefaultAddressCleanup = () => {
  const navigate = useNavigate();
  const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
  const role = userDetails.role || userDetails.Role || '';
  const canRunCleanup = isSuperAdmin(role);

  const [scope, setScope] = useState('All');
  const [previewLimit, setPreviewLimit] = useState(100);
  const [reason, setReason] = useState('');
  const [reviewAcknowledged, setReviewAcknowledged] = useState(false);

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [showExecuteConfirm, setShowExecuteConfirm] = useState(false);

  const [validationErrors, setValidationErrors] = useState([]);
  const [requestError, setRequestError] = useState('');
  const [result, setResult] = useState(null);
  const [lastRunWasDryRun, setLastRunWasDryRun] = useState(false);

  const previewRows = useMemo(() => toPreviewRows(result), [result]);

  const hasDryRunResult = !!result && lastRunWasDryRun === true;
  const reasonTrimmed = reason.trim();
  const reasonTooLong = reasonTrimmed.length > 500;

  const executeDisabled =
    !canRunCleanup ||
    executing ||
    loadingPreview ||
    !hasDryRunResult ||
    !reviewAcknowledged ||
    !reasonTrimmed ||
    reasonTooLong;

  const resetErrors = () => {
    setValidationErrors([]);
    setRequestError('');
  };

  const validateCommon = () => {
    const errors = [];

    if (!VALID_SCOPES.includes(scope)) {
      errors.push('Scope must be one of: All, Caregivers, Clients.');
    }

    const parsed = Number(previewLimit);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 500) {
      errors.push('Preview limit must be an integer between 1 and 500.');
    }

    return errors;
  };

  const runDryRun = async () => {
    if (!canRunCleanup) return;

    resetErrors();
    const errors = validateCommon();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoadingPreview(true);
    setReviewAcknowledged(false);

    const response = await adminService.runDefaultAddressCleanup({
      dryRun: true,
      scope,
      previewLimit: Number(previewLimit),
      reason: null,
    });

    if (response.success) {
      setResult(response.data);
      setLastRunWasDryRun(true);
    } else {
      setRequestError(response.error || 'Failed to run dry-run preview.');
      if (response.validationErrors?.length) {
        setValidationErrors(response.validationErrors);
      }
    }

    setLoadingPreview(false);
  };

  const requestExecute = () => {
    resetErrors();

    const errors = validateCommon();
    if (!reasonTrimmed) {
      errors.push('Reason is required when DryRun is false.');
    }
    if (reasonTrimmed.length > 500) {
      errors.push('Reason cannot exceed 500 characters.');
    }
    if (!hasDryRunResult) {
      errors.push('Run a dry-run preview before executing cleanup.');
    }
    if (!reviewAcknowledged) {
      errors.push('Please confirm you have reviewed the dry-run results.');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setShowExecuteConfirm(true);
  };

  const runExecute = async () => {
    if (!canRunCleanup) return;

    setShowExecuteConfirm(false);
    resetErrors();
    setExecuting(true);

    const response = await adminService.runDefaultAddressCleanup({
      dryRun: false,
      scope,
      previewLimit: Number(previewLimit),
      reason: reasonTrimmed,
    });

    if (response.success) {
      setResult(response.data);
      setLastRunWasDryRun(false);
    } else {
      setRequestError(response.error || 'Failed to execute cleanup.');
      if (response.validationErrors?.length) {
        setValidationErrors(response.validationErrors);
      }
    }

    setExecuting(false);
  };

  const handleProceedToEmail = () => {
    if (!previewRows.length) return;

    const prefillRecipients = previewRows.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.firstName,
      type: 'Caregiver',
    }));

    navigate('/app/admin/emails', {
      state: {
        prefillRecipients,
        prefillSource: 'DefaultAddressCleanup',
      },
    });
  };

  const affectedCaregivers = getValue(result, 'AffectedCaregiverUsers', 'affectedCaregiverUsers', 0);
  const affectedClients = getValue(result, 'AffectedClientUsers', 'affectedClientUsers', 0);
  const affectedLocations = getValue(result, 'AffectedLocationRecords', 'affectedLocationRecords', 0);

  const updatedCaregivers = getValue(result, 'UpdatedCaregiverUsers', 'updatedCaregiverUsers', 0);
  const updatedClients = getValue(result, 'UpdatedClientUsers', 'updatedClientUsers', 0);
  const updatedLocations = getValue(result, 'UpdatedLocationRecords', 'updatedLocationRecords', 0);

  const failedUsers = getValue(result, 'FailedUsers', 'failedUsers', 0);
  const failedUserIds = getValue(result, 'FailedUserIds', 'failedUserIds', []);
  const errorsList = getValue(result, 'Errors', 'errors', []);

  return (
    <div className="dac-page">
      <div className="dac-header">
        <div>
          <h1>Default Address Cleanup</h1>
          <p>Preview and clean legacy placeholder addresses for users and location records.</p>
        </div>
      </div>

      {!canRunCleanup && (
        <div className="dac-alert dac-alert-error">
          <strong>Forbidden:</strong> This tool is restricted to SuperAdmin users.
        </div>
      )}

      <div className="dac-card">
        <h2>Cleanup Request</h2>

        <div className="dac-grid">
          <div className="dac-field">
            <label htmlFor="scope">Scope</label>
            <select
              id="scope"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              disabled={!canRunCleanup || loadingPreview || executing}
            >
              {VALID_SCOPES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="dac-field">
            <label htmlFor="previewLimit">Preview Limit (1-500)</label>
            <input
              id="previewLimit"
              type="number"
              min={1}
              max={500}
              value={previewLimit}
              onChange={(e) => setPreviewLimit(e.target.value)}
              disabled={!canRunCleanup || loadingPreview || executing}
            />
          </div>

          <div className="dac-field dac-field-full">
            <label htmlFor="reason">Reason (required for execute, max 500 chars)</label>
            <textarea
              id="reason"
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={!canRunCleanup || loadingPreview || executing}
              placeholder="Explain why this cleanup is being executed..."
            />
            <div className="dac-char-count">{reasonTrimmed.length}/500</div>
          </div>
        </div>

        <div className="dac-actions">
          <button
            className="dac-btn dac-btn-secondary"
            onClick={runDryRun}
            disabled={!canRunCleanup || loadingPreview || executing}
          >
            {loadingPreview ? 'Running Dry-Run...' : 'Run Dry-Run Preview'}
          </button>

          <button
            className="dac-btn dac-btn-primary"
            onClick={requestExecute}
            disabled={executeDisabled}
          >
            {executing ? 'Executing...' : 'Execute Cleanup'}
          </button>
        </div>

        <label className="dac-review-check">
          <input
            type="checkbox"
            checked={reviewAcknowledged}
            onChange={(e) => setReviewAcknowledged(e.target.checked)}
            disabled={!hasDryRunResult || !canRunCleanup || loadingPreview || executing}
          />
          <span>I have reviewed the dry-run summary and caregiver preview list.</span>
        </label>
      </div>

      {(requestError || validationErrors.length > 0) && (
        <div className="dac-card">
          {requestError && <div className="dac-alert dac-alert-error">{requestError}</div>}
          {validationErrors.length > 0 && (
            <ul className="dac-errors">
              {validationErrors.map((error, idx) => (
                <li key={`${error}-${idx}`}>{error}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {result && (
        <>
          <div className="dac-card">
            <h2>{lastRunWasDryRun ? 'Dry-Run Summary' : 'Execution Summary'}</h2>
            <div className="dac-stats-grid">
              <div className="dac-stat">
                <span className="dac-stat-value">{affectedCaregivers}</span>
                <span className="dac-stat-label">Affected Caregivers</span>
              </div>
              <div className="dac-stat">
                <span className="dac-stat-value">{affectedClients}</span>
                <span className="dac-stat-label">Affected Clients</span>
              </div>
              <div className="dac-stat">
                <span className="dac-stat-value">{affectedLocations}</span>
                <span className="dac-stat-label">Affected Location Records</span>
              </div>
              <div className="dac-stat">
                <span className="dac-stat-value">{updatedCaregivers}</span>
                <span className="dac-stat-label">Updated Caregivers</span>
              </div>
              <div className="dac-stat">
                <span className="dac-stat-value">{updatedClients}</span>
                <span className="dac-stat-label">Updated Clients</span>
              </div>
              <div className="dac-stat">
                <span className="dac-stat-value">{updatedLocations}</span>
                <span className="dac-stat-label">Updated Location Records</span>
              </div>
            </div>

            {failedUsers > 0 && (
              <div className="dac-alert dac-alert-warn">
                <strong>Warning:</strong> {failedUsers} user updates failed.
              </div>
            )}

            {Array.isArray(failedUserIds) && failedUserIds.length > 0 && (
              <div className="dac-list-block">
                <h3>Failed User IDs</h3>
                <div className="dac-chip-list">
                  {failedUserIds.map((id) => (
                    <span key={id} className="dac-chip">{id}</span>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(errorsList) && errorsList.length > 0 && (
              <div className="dac-list-block">
                <h3>Errors</h3>
                <ul>
                  {errorsList.map((err, idx) => (
                    <li key={`${err}-${idx}`}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="dac-card">
            <div className="dac-preview-header">
              <h2>Caregiver Recipient Preview</h2>
              <button
                className="dac-btn dac-btn-secondary"
                onClick={handleProceedToEmail}
                disabled={!previewRows.length}
              >
                Proceed To Bulk Email
              </button>
            </div>

            {previewRows.length === 0 ? (
              <p className="dac-muted">No caregiver recipients in this response.</p>
            ) : (
              <div className="dac-table-wrap">
                <table className="dac-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Email</th>
                      <th>First Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>{row.email}</td>
                        <td>{row.firstName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {showExecuteConfirm && (
        <div className="dac-modal-overlay" onClick={() => setShowExecuteConfirm(false)}>
          <div className="dac-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Cleanup Execution</h3>
            <p>
              You are about to execute default address cleanup for scope <strong>{scope}</strong> with preview limit <strong>{previewLimit}</strong>.
            </p>
            <p>
              Reason: <strong>{reasonTrimmed || 'N/A'}</strong>
            </p>
            <div className="dac-modal-actions">
              <button className="dac-btn dac-btn-secondary" onClick={() => setShowExecuteConfirm(false)}>
                Cancel
              </button>
              <button className="dac-btn dac-btn-danger" onClick={runExecute}>
                Confirm Execute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DefaultAddressCleanup;
