import { useState, useEffect, useMemo, useRef } from 'react';
import AdminPackagePaymentService from '../../../services/adminPackagePaymentService';
import AdminPackageService from '../../../services/adminPackageService';
import adminService from '../../../services/adminService';
import './payment-links.css';

const MAX_EXTRA_DAYS = 365;
const MAX_NOTES_LENGTH = 2000;

const BILLING_OPTIONS = [
  { value: 'OneTime', label: 'One-time', hint: 'Client pays once for this package.' },
  { value: 'Recurring', label: 'Recurring', hint: "Client's card is saved and re-billed automatically." },
];

const fmtNaira = (value) =>
  value === null || value === undefined || value === ''
    ? '—'
    : `₦${Number(value).toLocaleString('en-NG')}`;

const clientName = (c) => `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email;
const packageLabel = (p) => `${p.category} — ${p.tierLabel}`;

const PaymentLinkGenerator = () => {
  const [toast, setToast] = useState(null);
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 6000);
  };

  // ─── Client picker ─────────────────────────────────────────
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientsError, setClientsError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  // ─── Packages ──────────────────────────────────────────────
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [packagesError, setPackagesError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoadingClients(true);
      setClientsError(null);
      const result = await adminService.getAllClients();
      if (result.success) {
        setClients(result.data || []);
      } else {
        setClientsError(result.error || 'Failed to load clients');
      }
      setLoadingClients(false);
    })();
    (async () => {
      setLoadingPackages(true);
      setPackagesError(null);
      const result = await AdminPackageService.getAllPackages();
      if (result.success) {
        // Inactive packages are rejected by the backend, so don't offer them.
        setPackages((result.data || []).filter((p) => p.isActive));
      } else {
        setPackagesError(result.error || 'Failed to load packages');
      }
      setLoadingPackages(false);
    })();
  }, []);

  const visibleClients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((c) =>
      `${c.firstName || ''} ${c.lastName || ''} ${c.email || ''}`.toLowerCase().includes(term)
    );
  }, [clients, searchTerm]);

  // ─── Form ──────────────────────────────────────────────────
  const [packageId, setPackageId] = useState('');
  const [billingType, setBillingType] = useState('OneTime');
  const [extraDays, setExtraDays] = useState('0');
  const [notes, setNotes] = useState('');

  const selectedPackage = useMemo(
    () => packages.find((p) => p.id === packageId) || null,
    [packages, packageId]
  );
  const supportsExtraDays =
    selectedPackage?.additionalDayPrice !== null && selectedPackage?.additionalDayPrice !== undefined;

  const extraDaysNum = supportsExtraDays ? Number(extraDays) : 0;
  const extraDaysInvalid =
    supportsExtraDays &&
    (extraDays === '' || !Number.isInteger(extraDaysNum) || extraDaysNum < 0 || extraDaysNum > MAX_EXTRA_DAYS);

  const quote = useMemo(() => {
    if (!selectedPackage || extraDaysInvalid) return null;
    const additional = supportsExtraDays ? selectedPackage.additionalDayPrice * extraDaysNum : 0;
    return { base: selectedPackage.basePrice, additional, total: selectedPackage.basePrice + additional };
  }, [selectedPackage, supportsExtraDays, extraDaysNum, extraDaysInvalid]);

  const clientHasNoEmail = selectedClient && !selectedClient.email?.trim();
  const canGenerate = !!selectedClient && !!selectedPackage && !extraDaysInvalid && !clientHasNoEmail;

  const selectClient = (client) => {
    setSelectedClient(client);
    setResult(null);
  };

  const selectPackage = (id) => {
    setPackageId(id);
    setExtraDays('0');
  };

  // ─── Generate ──────────────────────────────────────────────
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  // Snapshot of what was actually submitted, so the confirmation card stays
  // truthful even if staff keep editing the form afterwards.
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setGenerateError(null);
    setResult(null);
    setCopied(false);
    const response = await AdminPackagePaymentService.initiatePaymentLink({
      clientId: selectedClient.id,
      packageId: selectedPackage.id,
      extraDays: extraDaysNum,
      billingType,
      notes,
    });
    if (response.success) {
      setResult({
        ...response.data,
        clientName: clientName(selectedClient),
        clientEmail: selectedClient.email,
        packageName: packageLabel(selectedPackage),
      });
    } else {
      setGenerateError(response.error || 'Failed to generate payment link');
    }
    setGenerating(false);
  };

  // ─── Copy ──────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);
  const linkInputRef = useRef(null);

  const handleCopy = async () => {
    if (!result?.paymentLink) return;
    try {
      await navigator.clipboard.writeText(result.paymentLink);
    } catch {
      // Clipboard API unavailable (e.g. non-secure context) — fall back to selecting the field.
      const input = linkInputRef.current;
      if (!input) return;
      input.focus();
      input.select();
      if (!document.execCommand('copy')) {
        showToast('error', 'Could not copy automatically — the link is selected, press Ctrl/Cmd+C.');
        return;
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="payment-links">
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <i className="fas fa-link"></i>
          </div>
          <div>
            <h1>Payment Links</h1>
            <p>Generate a Flutterwave payment link for a client and package, then send it to them (e.g. over WhatsApp)</p>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`alert alert-${toast.type === 'error' ? 'error' : 'success'}`}>
          <i className={`fas fa-${toast.type === 'error' ? 'exclamation-circle' : 'check-circle'}`}></i>
          <div><p>{toast.msg}</p></div>
          <button className="alert-close" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      <div className="pl-layout">
        {/* ── Left: client picker ── */}
        <div className="pl-panel pl-panel--clients">
          <div className="pl-panel-header">
            <h2>1. Choose client</h2>
          </div>
          <div className="pl-search-wrap">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search by name or email…"
              aria-label="Search clients"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {clientsError && (
            <div className="alert alert-error">
              <i className="fas fa-exclamation-circle"></i>
              <div><p>{clientsError}</p></div>
            </div>
          )}

          {loadingClients ? (
            <div className="pkg-loading"><div className="spinner"></div><p>Loading…</p></div>
          ) : visibleClients.length === 0 ? (
            <div className="pkg-empty"><i className="fas fa-inbox"></i><p>No clients found</p></div>
          ) : (
            <ul className="pl-client-list">
              {visibleClients.map((c) => (
                <li
                  key={c.id}
                  className={`pl-client-item${selectedClient?.id === c.id ? ' pl-client-item--active' : ''}`}
                  onClick={() => selectClient(c)}
                >
                  <strong>{clientName(c)}</strong>
                  <span>{c.email || 'No email on file'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Right: package + billing + generate ── */}
        <div className="pl-panel pl-panel--form">
          {!selectedClient ? (
            <div className="pkg-empty">
              <i className="fas fa-hand-point-left"></i>
              <p>Select a client to start</p>
            </div>
          ) : (
            <>
              <div className="pl-selected-client">
                <div>
                  <strong>{clientName(selectedClient)}</strong>
                  <span>{selectedClient.email || 'No email on file'}</span>
                </div>
              </div>

              {clientHasNoEmail && (
                <div className="alert alert-error">
                  <i className="fas fa-exclamation-circle"></i>
                  <div><p>This client has no email on file, so a Flutterwave link can't be generated for them.</p></div>
                </div>
              )}

              {packagesError && (
                <div className="alert alert-error">
                  <i className="fas fa-exclamation-circle"></i>
                  <div><p>{packagesError}</p></div>
                </div>
              )}

              <div className="pl-panel-header"><h2>2. Choose package</h2></div>
              <div className="form-group">
                <label htmlFor="pl-package">Package <span className="required">*</span></label>
                <select
                  id="pl-package"
                  value={packageId}
                  onChange={(e) => selectPackage(e.target.value)}
                  disabled={loadingPackages}
                >
                  <option value="">{loadingPackages ? 'Loading packages…' : 'Select a package…'}</option>
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {packageLabel(p)} — {fmtNaira(p.basePrice)}
                    </option>
                  ))}
                </select>
                {selectedPackage?.description && <p className="pl-hint">{selectedPackage.description}</p>}
              </div>

              <div className="form-group">
                <label>Billing type <span className="required">*</span></label>
                <div className="pl-radio-row" role="radiogroup" aria-label="Billing type">
                  {BILLING_OPTIONS.map((o) => (
                    <label
                      key={o.value}
                      className={`pl-radio-card${billingType === o.value ? ' pl-radio-card--active' : ''}`}
                    >
                      <input
                        type="radio"
                        name="pl-billing"
                        value={o.value}
                        checked={billingType === o.value}
                        onChange={() => setBillingType(o.value)}
                      />
                      <strong>{o.label}</strong>
                      <span>{o.hint}</span>
                    </label>
                  ))}
                </div>
              </div>

              {supportsExtraDays && (
                <div className="form-group">
                  <label htmlFor="pl-extra-days">
                    Extra days ({fmtNaira(selectedPackage.additionalDayPrice)} per day)
                  </label>
                  <input
                    id="pl-extra-days"
                    type="number"
                    min="0"
                    max={MAX_EXTRA_DAYS}
                    step="1"
                    value={extraDays}
                    onChange={(e) => setExtraDays(e.target.value)}
                  />
                  {extraDaysInvalid && (
                    <p className="pl-field-error">Enter a whole number of days between 0 and {MAX_EXTRA_DAYS}.</p>
                  )}
                </div>
              )}
              {selectedPackage && !supportsExtraDays && (
                <p className="pl-hint" style={{ marginBottom: '1rem' }}>This package doesn't offer an extra-days add-on.</p>
              )}

              <div className="form-group">
                <label htmlFor="pl-notes">Staff note <span className="optional">(optional — carried onto the package request)</span></label>
                <textarea
                  id="pl-notes"
                  rows={2}
                  maxLength={MAX_NOTES_LENGTH}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Agreed on WhatsApp, start date 1 Oct"
                />
              </div>

              {quote && (
                <div className="pl-quote">
                  <div className="pl-quote-row"><span>Base price</span><span>{fmtNaira(quote.base)}</span></div>
                  {supportsExtraDays && (
                    <div className="pl-quote-row">
                      <span>Extra days ({extraDaysNum})</span><span>{fmtNaira(quote.additional)}</span>
                    </div>
                  )}
                  <div className="pl-quote-row pl-quote-row--total"><span>Total</span><span>{fmtNaira(quote.total)}</span></div>
                </div>
              )}

              {generateError && (
                <div className="alert alert-error">
                  <i className="fas fa-exclamation-circle"></i>
                  <div><p>{generateError}</p></div>
                </div>
              )}

              <div className="form-actions">
                <button className="pl-btn-primary" onClick={handleGenerate} disabled={!canGenerate || generating}>
                  {generating
                    ? <><i className="fas fa-spinner fa-spin"></i> Generating…</>
                    : <><i className="fas fa-link"></i> Generate Payment Link</>}
                </button>
              </div>

              {/* ── Confirmation of what was just generated ── */}
              {result && (
                <div className="pl-result" role="status">
                  <h3><i className="fas fa-check-circle"></i> {result.message || 'Payment link generated'}</h3>
                  <dl className="pl-result-grid">
                    <dt>Client</dt><dd>{result.clientName} ({result.clientEmail})</dd>
                    <dt>Package</dt><dd>{result.packageName}</dd>
                    <dt>Billing</dt><dd>{result.billingType === 'Recurring' ? 'Recurring' : 'One-time'}</dd>
                    <dt>Base price</dt><dd>{fmtNaira(result.basePrice)}</dd>
                    {result.extraDays > 0 && (
                      <>
                        <dt>Extra days</dt>
                        <dd>{result.extraDays} × {fmtNaira(result.additionalDayAmount / result.extraDays)} = {fmtNaira(result.additionalDayAmount)}</dd>
                      </>
                    )}
                    <dt>Total to pay</dt><dd>{fmtNaira(result.totalAmount)} {result.currency}</dd>
                    <dt>Reference</dt><dd>{result.transactionReference}</dd>
                  </dl>

                  <div className="pl-link-row">
                    <input
                      ref={linkInputRef}
                      type="text"
                      readOnly
                      aria-label="Payment link"
                      value={result.paymentLink || ''}
                      onFocus={(e) => e.target.select()}
                    />
                    <button className="pl-btn-primary" onClick={handleCopy}>
                      {copied
                        ? <><i className="fas fa-check"></i> Copied</>
                        : <><i className="fas fa-copy"></i> Copy link</>}
                    </button>
                  </div>
                  <div className="pl-link-actions">
                    <a className="pl-btn-secondary btn-sm" href={result.paymentLink} target="_blank" rel="noopener noreferrer">
                      <i className="fas fa-external-link-alt"></i> Open link
                    </a>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentLinkGenerator;
