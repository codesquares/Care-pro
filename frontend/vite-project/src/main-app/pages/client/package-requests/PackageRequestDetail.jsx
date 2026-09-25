import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ClientPackageRequestService from "../../../services/clientPackageRequestService";
import { getInitials } from "../../../utils/avatarHelpers";
import "../client-dashboard/clientDashboard.css";
import "./packageRequests.css";

const STATUS_COPY = {
  pending: {
    title: "We're finding your caregiver",
    body: "Your request is in. CarePro's team is matching you with a vetted caregiver for this package — you'll see them here as soon as they're confirmed.",
  },
  assigned: {
    title: "We're finding your caregiver",
    body: "A caregiver has been proposed internally and is confirming their availability. You'll see their details here once they accept.",
  },
  cancelled: {
    title: "This request was cancelled",
    body: "This care package request is no longer active. If this wasn't expected, reach out to CarePro support.",
  },
};

const PackageRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [contract, setContract] = useState(null);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractError, setContractError] = useState(null);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  const loadRequest = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await ClientPackageRequestService.getRequestById(id);
    if (result.success) {
      setRequest(result.data);
    } else {
      setError(result.status === 404 ? "Request not found." : result.error);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  const loadContract = useCallback(async () => {
    setContractLoading(true);
    setContractError(null);
    const result = await ClientPackageRequestService.getContract(id);
    if (result.success) {
      setContract(result.data);
    } else if (result.status !== 404) {
      // A 404 just means the contract hasn't been generated yet — not an error to surface.
      setContractError(result.error);
    }
    setContractLoading(false);
  }, [id]);

  useEffect(() => {
    if (request?.status === "confirmed") {
      loadContract();
    }
  }, [request?.status, loadContract]);

  const handleDownloadPdf = async () => {
    setPdfDownloading(true);
    const result = await ClientPackageRequestService.downloadContractPdf(id);
    if (!result.success) {
      setContractError(result.error);
    }
    setPdfDownloading(false);
  };

  if (loading) {
    return (
      <div className="dashboard client-dashboard-flex">
        <div className="rightbar">
          <div className="spinner-container">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="dashboard client-dashboard-flex">
        <div className="rightbar">
          <div className="no-results">
            <h3>Something went wrong</h3>
            <p className="error-message">{error || "Request not found."}</p>
            <div className="reset-buttons">
              <button className="reset-button" onClick={() => navigate("/app/client/requests")}>
                Back to My Requests
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_COPY[request.status];
  const caregiver = request.confirmedCaregiver;

  return (
    <div className="dashboard client-dashboard-flex">
      <div className="rightbar">
        <div className="category-page-header">
          <button type="button" className="back-to-marketplace" onClick={() => navigate("/app/client/requests")}>
            ← My Requests
          </button>
          <div className="pr-header-row">
            <div className="category-header-content">
              <h1 className="category-title">{request.packageCategory}</h1>
              <p className="category-subtitle">{request.packageTierLabel}</p>
            </div>
            <button type="button" className="pr-refresh-btn" onClick={loadRequest}>
              Refresh
            </button>
          </div>
        </div>

        <span className={`pr-status-badge pr-status-badge--${request.status}`}>
          {request.status === "confirmed" ? "Caregiver confirmed" : statusInfo?.title || request.status}
        </span>

        {request.status !== "confirmed" && statusInfo && (
          <div className="pr-status-panel">
            <h2>{statusInfo.title}</h2>
            <p>{statusInfo.body}</p>
          </div>
        )}

        {request.status === "confirmed" && (
          <>
            <div className="pr-caregiver-card">
              <h2>Your caregiver</h2>
              {caregiver ? (
                <div className="pr-caregiver-body">
                  {caregiver.profileImage ? (
                    <img
                      src={caregiver.profileImage}
                      alt={caregiver.name}
                      className="pr-caregiver-photo"
                    />
                  ) : (
                    <div className="pr-caregiver-photo pr-caregiver-photo--initials">
                      {getInitials(caregiver.name)}
                    </div>
                  )}
                  <div>
                    <div className="pr-caregiver-name">{caregiver.name}</div>
                    <div className="pr-caregiver-meta">
                      {caregiver.caregiverType}
                      {caregiver.specialty ? ` · ${caregiver.specialty}` : ""}
                    </div>
                    {caregiver.confirmedAt && (
                      <div className="pr-caregiver-confirmed">
                        Confirmed {new Date(caregiver.confirmedAt).toLocaleDateString()}
                      </div>
                    )}
                    <button
                      type="button"
                      className="pr-message-btn"
                      onClick={() => navigate(`/app/client/message/${caregiver.caregiverId}`)}
                    >
                      Message your caregiver
                    </button>
                  </div>
                </div>
              ) : (
                <p>Caregiver details are being finalized — check back shortly.</p>
              )}
            </div>

            <div className="pr-contract-card">
              <h2>Contract</h2>
              {contractLoading && <p>Loading contract…</p>}
              {!contractLoading && contractError && (
                <p className="error-message">{contractError}</p>
              )}
              {!contractLoading && !contract && !contractError && (
                <p>Your contract is being generated — check back shortly.</p>
              )}
              {!contractLoading && contract && (
                <>
                  <div className="pr-contract-summary">
                    <div>
                      <span className="pr-contract-label">Status</span>
                      <span>{contract.status}</span>
                    </div>
                    {contract.totalAmount != null && (
                      <div>
                        <span className="pr-contract-label">Total Amount</span>
                        <span>₦{contract.totalAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {contract.contractStartDate && contract.contractEndDate && (
                      <div>
                        <span className="pr-contract-label">Contract Period</span>
                        <span>
                          {new Date(contract.contractStartDate).toLocaleDateString()} –{" "}
                          {new Date(contract.contractEndDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {contract.generatedTermsHtml && (
                    <div className="pr-contract-terms-wrap">
                      <iframe
                        srcDoc={contract.generatedTermsHtml}
                        sandbox="allow-same-origin"
                        className="pr-contract-terms-frame"
                        title="Contract Terms"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    className="pr-refresh-btn pr-download-btn"
                    onClick={handleDownloadPdf}
                    disabled={pdfDownloading}
                  >
                    {pdfDownloading ? "Downloading…" : "Download Contract PDF"}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PackageRequestDetail;
