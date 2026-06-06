import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ContractService from '../../../services/contractService';
import VisitCheckinService from '../../../services/visitCheckinService';
import ProposedTasksList from '../../../components/task-proposals/ProposedTasksList';
import config from '../../../config';
import './ContractDetailPage.css';

const GPS_ACCURACY_THRESHOLD = 200; // metres — reject fix weaker than this

const ContractDetailPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pdfDownloading, setPdfDownloading] = useState(false);

    // GPS modal state
    const [showGpsModal, setShowGpsModal] = useState(false);
    const [capturingGps, setCapturingGps] = useState(false);
    const [savingLocation, setSavingLocation] = useState(false);

    useEffect(() => {
        const fetchContract = async () => {
            if (!orderId) return;
            const result = await ContractService.checkExistingContract(orderId);
            if (result.success && result.hasContract) {
                setContract(result.data);
                // If navigated here with ?autoGps=true (from service_location_not_set notification)
                // open GPS modal immediately, unless client already set their location
                if (searchParams.get('autoGps') === 'true') {
                    setSearchParams({}, { replace: true }); // strip the param from the URL
                    if (result.data?.serviceLocationSetByClient !== true) {
                        setShowGpsModal(true);
                    } else {
                        toast.info('Your service location is already confirmed.');
                    }
                }
            } else if (!result.success) {
                setError(result.error || 'Failed to load contract.');
            } else {
                setError('No contract found for this order.');
            }
            setLoading(false);
        };
        fetchContract();
    }, [orderId]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleDownloadPdf = async () => {
        if (!contract?.id) return;
        setPdfDownloading(true);
        try {
            const authToken = localStorage.getItem('authToken');
            const response = await fetch(`${config.BASE_URL}/contracts/${contract.id}/pdf`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            if (!response.ok) throw new Error('Failed to download PDF');
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `contract-${contract.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            toast.error('Failed to download contract PDF.');
        }
        setPdfDownloading(false);
    };

    const handleCaptureGps = async () => {
        setCapturingGps(true);
        const gps = await VisitCheckinService.getCurrentPosition();
        setCapturingGps(false);

        if (!gps.success) {
            toast.error(gps.error);
            return;
        }

        if (gps.coords.accuracy > GPS_ACCURACY_THRESHOLD) {
            toast.error('GPS signal too weak. Move outdoors and try again.');
            return;
        }

        setSavingLocation(true);
        const result = await ContractService.setServiceLocation(contract.id, {
            latitude: gps.coords.latitude,
            longitude: gps.coords.longitude,
            accuracy: gps.coords.accuracy,
        });
        setSavingLocation(false);

        if (result.success) {
            setContract(prev => ({
                ...prev,
                serviceLocationSetByClient: true,
                serviceLocationSetAt: result.data?.setAt || new Date().toISOString(),
            }));
            // Persist locally so the notification list can reflect the resolved state
            // without a fresh API fetch on every render
            if (contract?.id) {
                localStorage.setItem(`gps_set_contract_${contract.id}`, 'true');
            }
            setShowGpsModal(false);
            toast.success('Service location saved! Your caregiver will now check in within 1500m of this location.');
        } else {
            toast.error(result.error || 'Failed to save location. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="cdp-loading">
                <div className="cdp-spinner" />
                <p>Loading contract...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="cdp-error">
                <p>{error}</p>
                <button className="cdp-back-btn" onClick={() => navigate(`/app/client/my-order/${orderId}`)}>
                    ← Back to Order
                </button>
            </div>
        );
    }

    const scheduleSlots = contract.schedule?.length > 0 ? contract.schedule : contract.agreedSchedule;
    const locationSet = contract?.serviceLocationSetByClient === true;

    return (
        <div className="cdp-page">
            <ToastContainer position="top-right" autoClose={3000} />

            {/* ── Page header ── */}
            <div className="cdp-header">
                <button className="cdp-back-btn" onClick={() => navigate(`/app/client/my-order/${orderId}`)}>
                    ← Back to Order
                </button>
                <h1 className="cdp-title">📋 Contract Details</h1>
                <button
                    className="cdp-pdf-btn"
                    onClick={handleDownloadPdf}
                    disabled={pdfDownloading}
                >
                    {pdfDownloading ? 'Downloading...' : '⬇ Download PDF'}
                </button>
            </div>

            <div className="cdp-body">

                {/* ── GPS Location Banner ── */}
                <div className={`cdp-gps-banner ${locationSet ? 'cdp-gps-banner--set' : 'cdp-gps-banner--unset'}`}>
                    <div className="cdp-gps-banner-text">
                        {locationSet ? (
                            <>
                                <span className="cdp-gps-icon">✅</span>
                                <div>
                                    <strong>GPS location set</strong>
                                    <span>Your caregiver must be within 1500m of this location to check in.</span>
                                    {contract.serviceLocationSetAt && (
                                        <span className="cdp-gps-date">
                                            Last updated: {new Date(contract.serviceLocationSetAt).toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <span className="cdp-gps-icon">⚠️</span>
                                <div>
                                    <strong>GPS location not yet set</strong>
                                    <span>Caregivers may check in from any distance until you set your location.</span>
                                </div>
                            </>
                        )}
                    </div>
                    <button
                        className={`cdp-gps-btn ${locationSet ? 'cdp-gps-btn--update' : 'cdp-gps-btn--set'}`}
                        onClick={() => setShowGpsModal(true)}
                    >
                        📍 {locationSet ? 'Update GPS Location' : 'Set GPS Location'}
                    </button>
                </div>

                {/* ── Contract Overview ── */}
                <section className="cdp-section">
                    <h2 className="cdp-section-title">Contract Overview</h2>
                    <div className="cdp-info-grid">
                        <div className="cdp-info-row">
                            <span className="cdp-info-label">Contract ID</span>
                            <span className="cdp-info-value cdp-mono">{contract.id}</span>
                        </div>
                        <div className="cdp-info-row">
                            <span className="cdp-info-label">Initiated By</span>
                            <span className="cdp-info-value">{contract.initiatedByRole || 'Caregiver'}</span>
                        </div>
                        <div className="cdp-info-row">
                            <span className="cdp-info-label">Status</span>
                            <span className={`cdp-status-badge cdp-status-badge--${contract.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                                {ContractService.getStatusDisplayInfo(contract.status).label}
                            </span>
                        </div>
                        <div className="cdp-info-row">
                            <span className="cdp-info-label">Negotiation Round</span>
                            <span className="cdp-info-value">{contract.negotiationRound || 1}</span>
                        </div>
                        {contract.contractStartDate && contract.contractEndDate && (
                            <div className="cdp-info-row">
                                <span className="cdp-info-label">Contract Period</span>
                                <span className="cdp-info-value">
                                    {new Date(contract.contractStartDate).toLocaleDateString()} –{' '}
                                    {new Date(contract.contractEndDate).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                        {contract.totalAmount != null && (
                            <div className="cdp-info-row">
                                <span className="cdp-info-label">Total Amount</span>
                                <span className="cdp-info-value cdp-amount">₦{contract.totalAmount.toLocaleString()}</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Service Details ── */}
                <section className="cdp-section">
                    <h2 className="cdp-section-title">📍 Service Details</h2>
                    <div className="cdp-info-grid">
                        {contract.serviceAddress && (
                            <div className="cdp-info-row">
                                <span className="cdp-info-label">Service Address</span>
                                <span className="cdp-info-value">{contract.serviceAddress}</span>
                            </div>
                        )}
                        {contract.specialClientRequirements && (
                            <div className="cdp-info-row">
                                <span className="cdp-info-label">Special Requirements</span>
                                <span className="cdp-info-value">{contract.specialClientRequirements}</span>
                            </div>
                        )}
                        {contract.accessInstructions && (
                            <div className="cdp-info-row">
                                <span className="cdp-info-label">Access Instructions</span>
                                <span className="cdp-info-value">{contract.accessInstructions}</span>
                            </div>
                        )}
                        {(contract.caregiverAdditionalNotes || contract.additionalNotes) && (
                            <div className="cdp-info-row">
                                <span className="cdp-info-label">Caregiver Notes</span>
                                <span className="cdp-info-value">
                                    {contract.caregiverAdditionalNotes || contract.additionalNotes}
                                </span>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Service Schedule ── */}
                {scheduleSlots?.length > 0 && (
                    <section className="cdp-section">
                        <h2 className="cdp-section-title">📅 Service Schedule</h2>
                        <div className="cdp-schedule-list">
                            {scheduleSlots.map((visit, idx) => (
                                <div key={idx} className="cdp-schedule-row">
                                    <span className="cdp-schedule-day">{visit.dayOfWeek}</span>
                                    <span className="cdp-schedule-time">
                                        {ContractService.formatTimeForDisplay(visit.startTime)} –{' '}
                                        {ContractService.formatTimeForDisplay(visit.endTime)}
                                    </span>
                                    <span className="cdp-schedule-duration">
                                        {ContractService.calculateVisitDuration(visit.startTime, visit.endTime)} hrs
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Package Information ── */}
                {contract.selectedPackage && (
                    <section className="cdp-section">
                        <h2 className="cdp-section-title">📦 Package Information</h2>
                        <div className="cdp-info-grid">
                            <div className="cdp-info-row">
                                <span className="cdp-info-label">Type</span>
                                <span className="cdp-info-value">{contract.selectedPackage.packageType}</span>
                            </div>
                            <div className="cdp-info-row">
                                <span className="cdp-info-label">Visits per Week</span>
                                <span className="cdp-info-value">{contract.selectedPackage.visitsPerWeek}</span>
                            </div>
                            <div className="cdp-info-row">
                                <span className="cdp-info-label">Price per Visit</span>
                                <span className="cdp-info-value">₦{contract.selectedPackage.pricePerVisit?.toLocaleString()}</span>
                            </div>
                            <div className="cdp-info-row">
                                <span className="cdp-info-label">Duration</span>
                                <span className="cdp-info-value">{contract.selectedPackage.durationWeeks} weeks</span>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Tasks (complex object form) ── */}
                {contract.tasks?.length > 0 && (
                    <section className="cdp-section">
                        <h2 className="cdp-section-title">📝 Tasks &amp; Requirements</h2>
                        <div className="cdp-tasks-list">
                            {contract.tasks.map((task, idx) => (
                                <div key={idx} className="cdp-task-item">
                                    <h4 className="cdp-task-title">{task.title}</h4>
                                    <p className="cdp-task-desc">{task.description}</p>
                                    <div className="cdp-task-meta">
                                        <span>Category: {task.category}</span>
                                        <span>Priority: {task.priority}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Agreed Tasks (negotiation-generated string list) ── */}
                {!contract.tasks?.length && contract.agreedTasks?.length > 0 && (
                    <section className="cdp-section">
                        <h2 className="cdp-section-title">📝 Agreed Tasks</h2>
                        <ul className="cdp-agreed-tasks">
                            {contract.agreedTasks.map((task, idx) => (
                                <li key={idx}>{task}</li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* ── Proposed Tasks ── */}
                {contract.proposedTasks?.length > 0 && (
                    <section className="cdp-section">
                        <ProposedTasksList
                            proposedTasks={contract.proposedTasks}
                            userRole="Client"
                            showActions={false}
                        />
                    </section>
                )}

                {/* ── Client Review Feedback ── */}
                {contract.clientReviewComments && (
                    <section className="cdp-section">
                        <h2 className="cdp-section-title">📝 Your Review Feedback</h2>
                        <div className="cdp-feedback-box">
                            <p>{contract.clientReviewComments}</p>
                        </div>
                    </section>
                )}

                {/* ── Contract Terms ── */}
                {contract.generatedTerms && (
                    <section className="cdp-section">
                        <h2 className="cdp-section-title">📄 Contract Terms</h2>
                        <div className="cdp-terms-frame-wrap">
                            <iframe
                                srcDoc={contract.generatedTerms}
                                sandbox="allow-same-origin"
                                className="cdp-terms-frame"
                                title="Contract Terms"
                            />
                        </div>
                    </section>
                )}

                {/* ── PDF Download ── */}
                <div className="cdp-pdf-section">
                    <button
                        className="cdp-pdf-btn cdp-pdf-btn--large"
                        onClick={handleDownloadPdf}
                        disabled={pdfDownloading}
                    >
                        {pdfDownloading ? 'Downloading...' : '⬇ Download Contract PDF'}
                    </button>
                </div>

            </div>{/* end cdp-body */}

            {/* ── GPS Location Modal ── */}
            {showGpsModal && (
                <div
                    className="cdp-modal-overlay"
                    onClick={() => !capturingGps && !savingLocation && setShowGpsModal(false)}
                >
                    <div className="cdp-modal" onClick={e => e.stopPropagation()}>
                        <h3>📍 {locationSet ? 'Update GPS Location' : 'Set GPS Location'}</h3>

                        {contract.serviceAddress && (
                            <div className="cdp-modal-address">
                                <strong>Service Address:</strong> {contract.serviceAddress}
                            </div>
                        )}

                        <p>
                            {locationSet
                                ? 'Your caregiver is currently required to be within 1500m to check in. You can update if you have moved or the address has changed.'
                                : 'Once set, your caregiver will need to be within 1500m of this point to check in. Make sure you are physically at the service address before confirming.'}
                        </p>
                        <p className="cdp-modal-hint">
                            Your device must report GPS accuracy of 150 metres or better.
                            If you see a &ldquo;signal too weak&rdquo; error, move outdoors and try again.
                        </p>

                        <div className="cdp-modal-actions">
                            <button
                                className="cdp-modal-btn cdp-modal-btn--primary"
                                onClick={handleCaptureGps}
                                disabled={capturingGps || savingLocation}
                            >
                                {capturingGps
                                    ? 'Capturing GPS...'
                                    : savingLocation
                                    ? 'Saving...'
                                    : "📍 I'm here — capture my location"}
                            </button>
                            <button
                                className="cdp-modal-btn cdp-modal-btn--secondary"
                                onClick={() => setShowGpsModal(false)}
                                disabled={capturingGps || savingLocation}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ContractDetailPage;
