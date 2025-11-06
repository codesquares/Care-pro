import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import config from "../../../config"; // Import centralized config for API URLs
import ContractService from "../../../services/contractService";

import "react-toastify/dist/ReactToastify.css";
import "./CaregiverOrderDetails.css";


const CaregiverOrderDetails = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [selectedView, setSelectedView] = useState("Tasks");
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState(""); // "update", "contract", "reject", "review"
    const [notes, setNotes] = useState("");
    const [isContactLoading, setIsContactLoading] = useState(false);

    // Contract-related state
    const [contract, setContract] = useState(null);
    const [contractLoading, setContractLoading] = useState(false);
    const [contractError, setContractError] = useState(null);
    const [contractActionLoading, setContractActionLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [reviewComments, setReviewComments] = useState("");

    // Get user details from localStorage
    const userDetails = JSON.parse(localStorage.getItem("userDetails"));
    const userId = userDetails?.id;

    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (!orderId) {
                setError("Order ID is missing.");
                setLoading(false);
                return;
            }

            try {
                // FIXED: Use centralized config instead of hardcoded Azure staging API URL
                const response = await axios.get(
                    `${config.BASE_URL}/ClientOrders/orderId?orderId=${orderId}`
                );
                setOrders([response.data]); // API returns a single order, so wrap it in an array
                
                // Fetch contract for this order
                await fetchContractForOrder(orderId);
                
            } catch (err) {
                setError("Failed to fetch order details.");
                console.error("Error fetching order details:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [orderId]);

    // Fetch contract for the order
    const fetchContractForOrder = async (orderId) => {
        try {
            setContractLoading(true);
            setContractError(null);
            
            const result = await ContractService.checkExistingContract(orderId);
            
            if (result.success && result.hasContract) {
                setContract(result.data);
            } else if (!result.success && result.statusCode !== 404) {
                // Only set error if it's not a 404 (no contract found)
                setContractError(result.error);
            }
        } catch (error) {
            console.error("Error fetching contract:", error);
            setContractError("Failed to load contract information");
        } finally {
            setContractLoading(false);
        }
    };

    // Contract action handlers
    const handleAcceptContract = async () => {
        if (!contract?.id) return;
        
        setContractActionLoading(true);
        try {
            const result = await ContractService.acceptContract(contract.id);
            
            if (result.success) {
                setContract(result.data);
                toast.success("Contract accepted successfully!");
                closeModal();
            } else {
                toast.error(result.error || "Failed to accept contract");
            }
        } catch (error) {
            console.error("Error accepting contract:", error);
            toast.error("Failed to accept contract. Please try again.");
        } finally {
            setContractActionLoading(false);
        }
    };

    const handleRejectContract = async () => {
        if (!contract?.id) return;
        
        setContractActionLoading(true);
        try {
            const result = await ContractService.rejectContract(contract.id, rejectionReason);
            
            if (result.success) {
                setContract(result.data);
                toast.success("Contract rejected successfully!");
                closeModal();
                setRejectionReason("");
            } else {
                toast.error(result.error || "Failed to reject contract");
            }
        } catch (error) {
            console.error("Error rejecting contract:", error);
            toast.error("Failed to reject contract. Please try again.");
        } finally {
            setContractActionLoading(false);
        }
    };

    const handleRequestReview = async () => {
        if (!contract?.id || !reviewComments.trim()) {
            toast.error("Please provide comments for the review request");
            return;
        }
        
        setContractActionLoading(true);
        try {
            const result = await ContractService.requestContractReview(contract.id, reviewComments);
            
            if (result.success) {
                setContract(result.data);
                toast.success("Review request sent successfully!");
                closeModal();
                setReviewComments("");
            } else {
                toast.error(result.error || "Failed to request contract review");
            }
        } catch (error) {
            console.error("Error requesting contract review:", error);
            toast.error("Failed to request contract review. Please try again.");
        } finally {
            setContractActionLoading(false);
        }
    };

    // Function to check if conversation exists between caregiver and client
    const checkConversationExists = async (caregiverId, clientId) => {
        try {
            // FIXED: Use centralized config instead of hardcoded Azure staging API URL for message conversations
            const conversationResponse = await axios.get(
                `${config.BASE_URL}/Messages/conversations/${caregiverId}`
            );
            
            // Check if any conversation includes the specific client
            const conversations = response.data || [];
            return conversations.some(conv => 
                conv.participants && conv.participants.some(p => p.id === clientId)
            );
        } catch (error) {
            console.error("Error checking conversation:", error);
            return false;
        }
    };

    const handlingFaq = () => {
        navigate("/app/caregiver/faq");
    }
    // Function to create a new conversation between caregiver and client
    const createConversation = async (caregiverId, clientId) => {
        try {
            // FIXED: Use centralized config instead of hardcoded Azure staging API URL for creating conversations
            const response = await axios.post(
                `${config.BASE_URL}/Messages/conversations`,
                {
                    participants: [
                        {
                            id: caregiverId,
                            role: 'Caregiver'
                        },
                        {
                            id: clientId,
                            role: 'Client'
                        }
                    ],
                    createdBy: caregiverId,
                    createdAt: new Date().toISOString()
                }
            );
            
            return response.data;
        } catch (error) {
            console.error("Error creating conversation:", error);
            throw error;
        }
    };

    // Function to handle contacting client with conversation management
    const handleContactClient = async (clientId) => {
        setIsContactLoading(true);
        
        try {
            // Check if conversation already exists
            const conversationExists = await checkConversationExists(userId, clientId);
            
            if (!conversationExists) {
                // Create conversation if it doesn't exist
                toast.info("Setting up conversation...");
                await createConversation(userId, clientId);
                toast.success("Conversation ready!");
            }
            
            // Navigate to direct message
            navigate(`/app/caregiver/message/${clientId}`);
            
        } catch (error) {
            console.error("Error setting up conversation:", error);
            toast.error("Failed to set up conversation. Please try again.");
        } finally {
            setIsContactLoading(false);
        }
    };

    const openModal = (type) => {
        if (type === "contact") {
            // Handle contact with conversation management
            if (orders.length > 0 && orders[0].clientId) {
                handleContactClient(orders[0].clientId);
            } else {
                toast.error("Client information not available.");
            }
        } else {
            // Handle all modal types: update, contract, reject, review
            setModalType(type);
            setIsModalOpen(true);
            
            // Reset form data based on modal type
            if (type === "update") {
                setNotes("");
            } else if (type === "reject") {
                setRejectionReason("");
            } else if (type === "review") {
                setReviewComments("");
            }
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalType("");
        setNotes("");
        setRejectionReason("");
        setReviewComments("");
    };

    const handleSubmitAction = async () => {
        if (!orderId || !userId) return;

        // Notes are optional for marking as completed
        try {
            // For now, we'll just show a success message
            // In a real implementation, you'd call an API to update the order status to "Completed"
            if (modalType === "update") {
                toast.success("Order marked as completed!");
            }
            setIsModalOpen(false);
            setNotes("");
        } catch (err) {
            console.error(err);
            toast.error("Failed to update order status. Please try again.");
        }
    };

    if (loading) return <div className="loading-container"><p>Loading order details...</p></div>;
    if (error) return <div className="error-container"><p className="error">{error}</p></div>;

    return (
        <div className="caregiver-orders-container">
            <div className="tab-navigation">
                {["Tasks", "Details"].map((tab) => (
                    <button
                        key={tab}
                        className={`tab-button ${selectedView === tab ? "active" : ""}`}
                        onClick={() => setSelectedView(tab)}
                    >
                        {tab}
                        {selectedView === tab && <span className="underline"></span>}
                    </button>
                ))}
            </div>

            <div className="order-tasks-wrapper">
                <div className="content-wrapper">
                    {selectedView === "Tasks" ? (
                        <div className="tasks-section">
                            <h2>Tasks</h2>
                            {orders.length > 0 && orders[0].gigPackageDetails ? (
                                orders[0].gigPackageDetails.map((taskText, index) => (
                                    <div key={index} className="task">
                                        ☐ {taskText}
                                    </div>
                                ))
                            ) : (
                                <p>No tasks available.</p>
                            )}
                        </div>
                    ) : (
                        <div className="details-section">
                            {orders.length > 0 && (
                                <>
                                    <div className="offer-header">
                                        <img
                                            src={orders[0].gigImage || "https://via.placeholder.com/100"}
                                            alt={orders[0].clientName}
                                            className="provider-avatar"
                                        />
                                        <h2>Order from {orders[0].clientName}</h2>
                                        <div className="provider-info">
                                            Status: {orders[0].clientOrderStatus} • Amount: ₦{orders[0].amount}
                                        </div>
                                    </div>
                                    <div className="offer-content">
                                        <p><strong>Service:</strong> {orders[0].gigTitle}</p>
                                        <p><strong>Tasks:</strong></p>
                                        {orders[0].gigPackageDetails && orders[0].gigPackageDetails.length > 0 ? (
                                            orders[0].gigPackageDetails.map((taskText, index) => (
                                                <div key={index} className="task">
                                                    ☐ {taskText}
                                                </div>
                                            ))
                                        ) : (
                                            <p>No tasks available.</p>
                                        )}

                                        <p><strong>Payment:</strong></p>
                                        <div className="pricing-info">
                                            <span>Total Amount: ₦{orders[0].amount}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <div className="right-section">
                        <div className="order-details-section">
                            <h2>Order Details</h2>
                            {orders.length > 0 && (
                                <div className="order-card">
                                    <img 
                                        src={orders[0].gigImage || "https://via.placeholder.com/100"} 
                                        alt="Order activity" 
                                        className="order-image" 
                                    />
                                    <p><strong>{orders[0].gigTitle}</strong></p>
                                    <div className="order-status-badge">
                                        Status: {orders[0].clientOrderStatus}
                                    </div>
                                    <div className="order-meta">
                                        <p>Client: {orders[0].clientName}</p>
                                        <p>Total price: ₦{orders[0].amount}</p>
                                        <p>Order number: #{orders[0].id}</p>
                                        <p>Payment method: {orders[0].paymentOption}</p>
                                        {orders[0].orderCreatedOn && (
                                            <p>Order date: {new Date(orders[0].orderCreatedOn).toLocaleDateString()}</p>
                                        )}
                                    </div>
                                    
                                    {/* Contract Section */}
                                    <div className="contract-section">
                                        {contractLoading ? (
                                            <div className="contract-loading">
                                                <p>Loading contract information...</p>
                                            </div>
                                        ) : contractError ? (
                                            <div className="contract-error">
                                                <h4>Contract</h4>
                                                <p>⚠️ {contractError}</p>
                                            </div>
                                        ) : contract ? (
                                            <div className="contract-available">
                                                <h4>📋 Contract Available</h4>
                                                <div className="contract-status">
                                                    <p><strong>Status:</strong> <span className={`status-${contract.status?.toLowerCase().replace(' ', '-')}`}>
                                                        {contract.status}
                                                    </span></p>
                                                    <p><strong>Total Amount:</strong> ₦{contract.totalAmount?.toLocaleString()}</p>
                                                    {contract.sentAt && (
                                                        <p><strong>Received:</strong> {new Date(contract.sentAt).toLocaleString()}</p>
                                                    )}
                                                </div>
                                                
                                                {(() => {
                                                    const actions = ContractService.getCaregiverContractActions(contract);
                                                    const status = contract.status?.toLowerCase();
                                                    
                                                    if (status === 'accepted') {
                                                        return (
                                                            <div className="contract-accepted">
                                                                <p>✅ You have accepted this contract</p>
                                                                <button 
                                                                    className="view-contract-btn"
                                                                    onClick={() => openModal("contract")}
                                                                >
                                                                    View Contract Details
                                                                </button>
                                                            </div>
                                                        );
                                                    } else if (status === 'rejected') {
                                                        return (
                                                            <div className="contract-rejected">
                                                                <p>❌ You have rejected this contract</p>
                                                                <button 
                                                                    className="view-contract-btn"
                                                                    onClick={() => openModal("contract")}
                                                                >
                                                                    View Contract Details
                                                                </button>
                                                            </div>
                                                        );
                                                    } else if (status === 'review requested') {
                                                        return (
                                                            <div className="contract-review-requested">
                                                                <p>🔄 Review requested - awaiting client response</p>
                                                                <button 
                                                                    className="view-contract-btn"
                                                                    onClick={() => openModal("contract")}
                                                                >
                                                                    View Contract Details
                                                                </button>
                                                            </div>
                                                        );
                                                    } else if (actions.canAccept || actions.canReject) {
                                                        return (
                                                            <div className="contract-actions">
                                                                <p>⏳ Please review and respond to this contract</p>
                                                                <div className="contract-buttons">
                                                                    <button 
                                                                        className="view-contract-btn"
                                                                        onClick={() => openModal("contract")}
                                                                    >
                                                                        Read Full Contract
                                                                    </button>
                                                                    <button 
                                                                        className="accept-contract-btn"
                                                                        onClick={handleAcceptContract}
                                                                        disabled={contractActionLoading}
                                                                    >
                                                                        {contractActionLoading ? 'Processing...' : 'Accept'}
                                                                    </button>
                                                                    <button 
                                                                        className="reject-contract-btn"
                                                                        onClick={() => openModal("reject")}
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                    <button 
                                                                        className="review-contract-btn"
                                                                        onClick={() => openModal("review")}
                                                                    >
                                                                        Request Review
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    } else {
                                                        return (
                                                            <div className="contract-no-action">
                                                                <button 
                                                                    className="view-contract-btn"
                                                                    onClick={() => openModal("contract")}
                                                                >
                                                                    View Contract Details
                                                                </button>
                                                            </div>
                                                        );
                                                    }
                                                })()}
                                            </div>
                                        ) : (
                                            <div className="contract-not-available">
                                                <h4>Contract</h4>
                                                <p>No contract has been generated for this order yet.</p>
                                            </div>
                                        )}
                                    </div>
                                    {/* Only show Mark as Completed button if status is not already Completed */}
                                    {orders[0].clientOrderStatus && orders[0].clientOrderStatus.toLowerCase() !== "completed" && (
                                        <button 
                                            className="update-status-btn" 
                                            onClick={() => openModal("update")}
                                        >
                                            Mark Order as Completed
                                        </button>
                                    )}
                                    {/* <button 
                                        className="contact-client-btn" 
                                        onClick={() => openModal("contact")}
                                        disabled={isContactLoading}
                                    >
                                        {isContactLoading ? "Setting up..." : "Contact Client"}
                                    </button> */}
                                </div>
                            )}
                        </div>

                        <div className="support-section">
                            <h3>Support</h3>
                            <div className="support-item" onClick={handlingFaq}>
                                <span>📋 FAQs</span>
                                <span>Find needed answers</span>
                            </div>
                            <div className="support-item">
                                <a
                                    href="https://wa.me/2348131952778"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="support-link"
                                >
                                <span>📞 Resolution Center</span>
                                <span>Resolve order issues</span>
                                </a>
                            </div>
                           
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        {modalType === "update" && (
                            <>
                                <h3>Mark Order as Completed</h3>
                                <textarea
                                    placeholder="Enter completion notes (optional)..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows="4"
                                />
                                <div className="modal-actions">
                                    <button onClick={handleSubmitAction}>
                                        Mark as Completed
                                    </button>
                                    <button onClick={closeModal}>Cancel</button>
                                </div>
                            </>
                        )}

                        {modalType === "contract" && contract && (
                            <>
                                <h3>Contract Details</h3>
                                <div className="contract-details-modal">
                                    <div className="contract-header">
                                        <p><strong>Contract ID:</strong> {contract.id}</p>
                                        <p><strong>Status:</strong> <span className={`status-${contract.status?.toLowerCase().replace(' ', '-')}`}>
                                            {contract.status}
                                        </span></p>
                                    </div>
                                    
                                    <div className="contract-summary">
                                        <h4>Service Details</h4>
                                        <p><strong>Total Amount:</strong> ₦{contract.totalAmount?.toLocaleString()}</p>
                                        {contract.contractStartDate && contract.contractEndDate && (
                                            <p><strong>Duration:</strong> {new Date(contract.contractStartDate).toLocaleDateString()} - {new Date(contract.contractEndDate).toLocaleDateString()}</p>
                                        )}
                                        {contract.selectedPackage && (
                                            <div className="package-details">
                                                <h5>Package Information</h5>
                                                <p><strong>Type:</strong> {contract.selectedPackage.packageType}</p>
                                                <p><strong>Visits per Week:</strong> {contract.selectedPackage.visitsPerWeek}</p>
                                                <p><strong>Price per Visit:</strong> ₦{contract.selectedPackage.pricePerVisit?.toLocaleString()}</p>
                                                <p><strong>Duration:</strong> {contract.selectedPackage.durationWeeks} weeks</p>
                                            </div>
                                        )}
                                    </div>

                                    {contract.tasks && contract.tasks.length > 0 && (
                                        <div className="contract-tasks">
                                            <h4>Tasks & Requirements</h4>
                                            {contract.tasks.map((task, index) => (
                                                <div key={index} className="task-item">
                                                    <h5>{task.title}</h5>
                                                    <p>{task.description}</p>
                                                    <p><strong>Category:</strong> {task.category}</p>
                                                    <p><strong>Priority:</strong> {task.priority}</p>
                                                    {task.specialRequirements && task.specialRequirements.length > 0 && (
                                                        <p><strong>Special Requirements:</strong> {task.specialRequirements.join(', ')}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {contract.generatedTerms && (
                                        <div className="contract-terms">
                                            <h4>Contract Terms</h4>
                                            <div className="terms-content">
                                                {contract.generatedTerms}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-actions">
                                    <button onClick={closeModal}>Close</button>
                                </div>
                            </>
                        )}

                        {modalType === "reject" && (
                            <>
                                <h3>Reject Contract</h3>
                                <p>Please provide a reason for rejecting this contract:</p>
                                <textarea
                                    placeholder="Enter reason for rejection..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows="4"
                                />
                                <div className="modal-actions">
                                    <button 
                                        onClick={handleRejectContract}
                                        disabled={contractActionLoading || !rejectionReason.trim()}
                                    >
                                        {contractActionLoading ? 'Rejecting...' : 'Reject Contract'}
                                    </button>
                                    <button onClick={closeModal}>Cancel</button>
                                </div>
                            </>
                        )}

                        {modalType === "review" && (
                            <>
                                <h3>Request Contract Review</h3>
                                <p>Please provide comments about what you'd like to review or change:</p>
                                <textarea
                                    placeholder="Enter your review comments and requests for changes..."
                                    value={reviewComments}
                                    onChange={(e) => setReviewComments(e.target.value)}
                                    rows="4"
                                />
                                <div className="modal-actions">
                                    <button 
                                        onClick={handleRequestReview}
                                        disabled={contractActionLoading || !reviewComments.trim()}
                                    >
                                        {contractActionLoading ? 'Sending...' : 'Request Review'}
                                    </button>
                                    <button onClick={closeModal}>Cancel</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ToastContainer for React Toastify */}
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
        </div>
    );
};

export default CaregiverOrderDetails;
