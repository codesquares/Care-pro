

/**
 * DEVELOPER TESTING TOOL
 * 
 * Testing component for toggling verification status
 * This component should only be used during development and MUST be removed in production
 */
const TestVerificationToggle = () => {
  // const [status, setStatus] = useState("unknown");

  // useEffect(() => {
  //   // Get the current verification status on mount
  //   const checkStatus = async () => {
  //     try {
  //       const result = await verificationService.getVerificationStatus();
  //       setStatus(result?.verificationStatus || "unknown");
  //     } catch (err) {
  //       console.error("Failed to get verification status", err);
  //     }
  //   };
    
  //   checkStatus();
  // }, []);

  // const toggleStatus = async () => {
  //   try {
  //     if (status === "verified") {
  //       // Set to unverified
  //       verificationService.saveVerificationStatus(false, "unverified", "Verification status reset by developer");
  //       setStatus("unverified");
  //     } else {
  //       // Set to verified
  //       await verificationService.forceVerification();
  //       setStatus("verified");
  //     }
      
  //     // Refresh the page to reflect changes
  //     window.location.reload();
  //   } catch (err) {
  //     console.error("Error toggling verification status", err);
  //   }
  // };

  // return (
  //   <div 
  //     style={{
  //       position: "fixed",
  //       bottom: "20px",
  //       right: "20px",
  //       zIndex: 1000,
  //       padding: "10px",
  //       background: "#f0f0f0",
  //       border: "1px solid #ddd",
  //       borderRadius: "5px",
  //       boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
  //     }}
  //   >
  //     <div style={{ marginBottom: "5px" }}>
  //       <strong>Dev Tools - TEST ONLY</strong>
  //     </div>
  //     <div style={{ fontSize: "14px", marginBottom: "10px" }}>
  //       Verification: <span style={{ fontWeight: "bold" }}>{status}</span>
  //     </div>
  //     <button 
  //       onClick={toggleStatus}
  //       style={{
  //         padding: "5px 10px",
  //         background: status === "verified" ? "#ff5555" : "#44cc44",
  //         color: "white",
  //         border: "none",
  //         borderRadius: "3px",
  //         cursor: "pointer"
  //       }}
  //     >
  //       {status === "verified" ? "Set to Unverified" : "Set to Verified"}
  //     </button>
  //     <div style={{ fontSize: "10px", marginTop: "5px", color: "red" }}>
  //       Remove in production!
  //     </div>
  //   </div>
  // );
};

export default TestVerificationToggle;
