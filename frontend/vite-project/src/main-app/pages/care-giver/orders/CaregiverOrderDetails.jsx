import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import config from "../../../config"; // Import centralized config for API URLs
import ContractService from "../../../services/contractService";
import ContractGenerationModal from "../../../components/modals/ContractGenerationModal";

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
    const [modalType, setModalType] = useState(""); // "update", "contract", "generate", "revise"
    const [notes, setNotes] = useState("");
    const [isContactLoading, setIsContactLoading] = useState(false);

    // Contract-related state
    const [contract, setContract] = useState(null);
    const [contractLoading, setContractLoading] = useState(false);
    const [contractError, setContractError] = useState(null);
    const [contractActionLoading, setContractActionLoading] = useState(false);
    
    // Contract generation modal state
    const [showContractGenerationModal, setShowContractGenerationModal] = useState(false);
    const [isRevisionMode, setIsRevisionMode] = useState(false);

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

            const token = localStorage.getItem("authToken");
            if (!token) {
                setError("Please log in to view order details.");
                setLoading(false);
                return;
            }

            try {
                // FIXED: Use centralized config instead of hardcoded Azure staging API URL
                const response = await axios.get(
                    `${config.BASE_URL}/ClientOrders/orderId?orderId=${orderId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
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

    // Contract action handlers - NEW FLOW
    // Caregiver now GENERATES contracts, not accepts/rejects them
    
    const handleOpenGenerateContract = () => {
        setIsRevisionMode(false);
        setShowContractGenerationModal(true);
    };

    const handleOpenReviseContract = () => {
        setIsRevisionMode(true);
        setShowContractGenerationModal(true);
    };

    const handleContractGenerated = (contractData) => {
        setContract(contractData);
        setShowContractGenerationModal(false);
    };

    // Function to check if conversation exists between caregiver and client
    const checkConversationExists = async (caregiverId, clientId) => {
        const token = localStorage.getItem("authToken");
        try {
            // FIXED: Use centralized config instead of hardcoded Azure staging API URL for message conversations
            const conversationResponse = await axios.get(
                `${config.BASE_URL}/Messages/conversations/${caregiverId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
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
        const token = localStorage.getItem("authToken");
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
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
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
        } else if (type === "generate") {
            handleOpenGenerateContract();
        } else if (type === "revise") {
            handleOpenReviseContract();
        } else {
            // Handle all modal types: update, contract
            setModalType(type);
            setIsModalOpen(true);
            
            // Reset form data based on modal type
            if (type === "update") {
                setNotes("");
            }
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalType("");
        setNotes("");
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
                                    
                                    {/* Contract Section - NEW CAREGIVER-INITIATED FLOW */}
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
                                                <h4>📋 Contract</h4>
                                                <div className="contract-status">
                                                    <p><strong>Status:</strong> <span className={`status-${contract.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                                                        {ContractService.getStatusDisplayInfo(contract.status).label}
                                                    </span></p>
                                                    <p><strong>Round:</strong> {contract.negotiationRound || 1}</p>
                                                    <p><strong>Total Amount:</strong> ₦{contract.totalAmount?.toLocaleString()}</p>
                                                    {contract.submittedAt && (
                                                        <p><strong>Submitted:</strong> {new Date(contract.submittedAt).toLocaleString()}</p>
                                                    )}
                                                </div>
                                                
                                                {/* Schedule Display */}
                                                {contract.schedule && contract.schedule.length > 0 && (
                                                    <div className="contract-schedule-preview">
                                                        <p><strong>Schedule:</strong></p>
                                                        <div className="schedule-display">
                                                            {contract.schedule.map((visit, idx) => (
                                                                <div key={idx} className="schedule-visit">
                                                                    <span className="schedule-day">{visit.dayOfWeek}</span>
                                                                    <span className="schedule-time">{ContractService.formatTimeForDisplay(visit.startTime)} - {ContractService.formatTimeForDisplay(visit.endTime)}</span>
                                                                    <span className="schedule-duration">{ContractService.calculateVisitDuration(visit.startTime, visit.endTime)}hrs</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {(() => {
                                                    const status = contract.status?.toLowerCase().replace(/\s+/g, '');
                                                    
                                                    if (status === 'approved') {
                                                        return (
                                                            <div className="contract-accepted">
                                                                <p>✅ Client has approved this contract</p>
                                                                <button 
                                                                    className="view-contract-btn"
                                                                    onClick={() => openModal("contract")}
                                                                >
                                                                    View Contract Details
                                                                </button>
                                                            </div>
                                                        );
                                                    } else if (status === 'clientrejected') {
                                                        return (
                                                            <div className="contract-rejected">
                                                                <p>❌ Client has rejected this contract</p>
                                                                <button 
                                                                    className="view-contract-btn"
                                                                    onClick={() => openModal("contract")}
                                                                >
                                                                    View Contract Details
                                                                </button>
                                                            </div>
                                                        );
                                                    } else if (status === 'clientreviewrequested') {
                                                        return (
                                                            <div className="contract-review-requested">
                                                                <p>🔄 Client requested changes</p>
                                                                {contract.clientReviewComments && (
                                                                    <div className="client-feedback-inline">
                                                                        <p><strong>Client's feedback:</strong></p>
                                                                        <p className="feedback-text">"{contract.clientReviewComments}"</p>
                                                                    </div>
                                                                )}
                                                                <div className="contract-buttons">
                                                                    <button 
                                                                        className="view-contract-btn"
                                                                        onClick={() => openModal("contract")}
                                                                    >
                                                                        View Details
                                                                    </button>
                                                                    <button 
                                                                        className="revise-contract-btn"
                                                                        onClick={() => openModal("revise")}
                                                                    >
                                                                        Revise Contract
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    } else if (status === 'pendingclientapproval' || status === 'revised') {
                                                        return (
                                                            <div className="contract-pending-approval">
                                                                <p>⏳ Waiting for client approval</p>
                                                                <button 
                                                                    className="view-contract-btn"
                                                                    onClick={() => openModal("contract")}
                                                                >
                                                                    View Contract Details
                                                                </button>
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
                                                {ContractService.canCaregiverGenerateContract(orders[0], contract) ? (
                                                    <>
                                                        <p>📝 Ready to create a contract for this order.</p>
                                                        <p className="contract-hint">After discussing the schedule with your client, generate a contract for their approval.</p>
                                                        <button 
                                                            className="generate-contract-btn"
                                                            onClick={() => openModal("generate")}
                                                        >
                                                            Generate Contract
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p>Contract cannot be generated yet.</p>
                                                        {!orders[0].transactionId && !orders[0].paymentTransactionId && (
                                                            <p className="requirement-note">⏳ Waiting for client payment</p>
                                                        )}
                                                    </>
                                                )}
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
                    <div className={`modal-content ${modalType === 'contract' ? 'contract-modal-large' : ''}`}>
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
                                        <p><strong>Status:</strong> <span className={`status-${contract.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                                            {ContractService.getStatusDisplayInfo(contract.status).label}
                                        </span></p>
                                        <p><strong>Negotiation Round:</strong> {contract.negotiationRound || 1}</p>
                                    </div>
                                    
                                    {/* Schedule Section */}
                                    {contract.schedule && contract.schedule.length > 0 && (
                                        <div className="contract-schedule">
                                            <h4>📅 Service Schedule</h4>
                                            <div className="schedule-display">
                                                {contract.schedule.map((visit, idx) => (
                                                    <div key={idx} className="schedule-visit">
                                                        <span className="schedule-day">{visit.dayOfWeek}</span>
                                                        <span className="schedule-time">{ContractService.formatTimeForDisplay(visit.startTime)} - {ContractService.formatTimeForDisplay(visit.endTime)}</span>
                                                        <span className="schedule-duration">{ContractService.calculateVisitDuration(visit.startTime, visit.endTime)}hrs</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Service Details */}
                                    <div className="contract-summary">
                                        <h4>📍 Service Details</h4>
                                        <p><strong>Total Amount:</strong> ₦{contract.totalAmount?.toLocaleString()}</p>
                                        {contract.serviceAddress && (
                                            <p><strong>Service Address:</strong> {contract.serviceAddress}</p>
                                        )}
                                        {contract.specialClientRequirements && (
                                            <p><strong>Special Requirements:</strong> {contract.specialClientRequirements}</p>
                                        )}
                                        {contract.accessInstructions && (
                                            <p><strong>Access Instructions:</strong> {contract.accessInstructions}</p>
                                        )}
                                        {contract.caregiverAdditionalNotes && (
                                            <p><strong>Additional Notes:</strong> {contract.caregiverAdditionalNotes}</p>
                                        )}
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

                                    {/* Client Review Comments */}
                                    {contract.clientReviewComments && (
                                        <div className="client-review-section">
                                            <h4>⚠️ Client Feedback</h4>
                                            <div className="client-feedback-box">
                                                <p>{contract.clientReviewComments}</p>
                                            </div>
                                        </div>
                                    )}

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
                    </div>
                </div>
            )}

            {/* Contract Generation/Revision Modal */}
            <ContractGenerationModal
                isOpen={showContractGenerationModal}
                onClose={() => setShowContractGenerationModal(false)}
                orderData={orders[0]}
                onContractGenerated={handleContractGenerated}
                isRevision={isRevisionMode}
                existingContract={contract}
            />

            {/* ToastContainer for React Toastify */}
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
        </div>
    );
};

export default CaregiverOrderDetails;
