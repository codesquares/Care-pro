import React, { useState } from "react";
import { setVerificationStatus, getVerificationStatus } from "../../utilities/testingUtils";

/**
 * Testing component for toggling verification status
 * This component should only be used during development
 */
const TestVerificationToggle = () => {
  const [status, setStatus] = useState(getVerificationStatus() || "unverified");

  const toggleStatus = () => {
    const newStatus = status === "verified" ? "unverified" : "verified";
    if (setVerificationStatus(newStatus)) {
      setStatus(newStatus);
      // Refresh the page to see changes
      window.location.reload();
    }
  };

  return (
    <div 
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 1000,
        padding: "10px",
        background: "#f0f0f0",
        border: "1px solid #ddd",
        borderRadius: "5px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
      }}
    >
      <div style={{ marginBottom: "5px" }}>
        <strong>Dev Tools</strong>
      </div>
      <div style={{ fontSize: "14px", marginBottom: "10px" }}>
        Verification: <span style={{ fontWeight: "bold" }}>{status}</span>
      </div>
      <button 
        onClick={toggleStatus}
        style={{
          padding: "5px 10px",
          background: status === "verified" ? "#ff5555" : "#44cc44",
          color: "white",
          border: "none",
          borderRadius: "3px",
          cursor: "pointer"
        }}
      >
        {status === "verified" ? "Set to Unverified" : "Set to Verified"}
      </button>
    </div>
  );
};

export default TestVerificationToggle;
