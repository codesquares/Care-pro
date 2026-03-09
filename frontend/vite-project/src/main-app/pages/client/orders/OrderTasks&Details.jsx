import { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createNotification } from "../../../services/notificationService";
import ContractService from "../../../services/contractService";
import VisitCheckinService from "../../../services/visitCheckinService";
import OrderTasksService from "../../../services/orderTasksService";
import ClientOrderService from "../../../services/clientOrderService";
import CreateOrderTasksModal from "../../../components/modals/CreateOrderTasksModal";
import ClientVisitTabs from "../../../components/task-sheets/ClientVisitTabs";
import config from "../../../config"; // Centralized API configuration
import "./Order&Tasks.css";
import { useNavigate } from "react-router-dom";

const MyOrders = () => {
    const { orderId } = useParams(); // Get orderId from URL params
    const [selectedView, setSelectedView] = useState("Tasks");
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState("");
    const [reason, setReason] = useState(""); 
    const [rating, setRating] = useState(0);
    const [reviewComment, setReviewComment] = useState("");
    const [isReviewSubmitted, setIsReviewSubmitted] = useState(false);
    const [checkingReviewStatus, setCheckingReviewStatus] = useState(false);
    
    // Contract-related state (NEW FLOW - Client approves contracts from caregiver)
    const [contract, setContract] = useState(null);
    const [contractActionLoading, setContractActionLoading] = useState(false);
    const [contractError, setContractError] = useState(null);
    const [checkingContract, setCheckingContract] = useState(false);
    
    // Client contract action state
    const [reviewRequestComments, setReviewRequestComments] = useState("");
    const [reviewPreferredScheduleNotes, setReviewPreferredScheduleNotes] = useState("");
    const [rejectReason, setRejectReason] = useState("");
    const [showGpsPrompt, setShowGpsPrompt] = useState(false);
    const [capturingGps, setCapturingGps] = useState(false);
    
    // OrderTasks-related state
    const [orderTasks, setOrderTasks] = useState(null);
    const [hasOrderTasks, setHasOrderTasks] = useState(false);
    const [checkingOrderTasks, setCheckingOrderTasks] = useState(false);
    const [showCreateOrderTasksModal, setShowCreateOrderTasksModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fund release state
    const [releasingFunds, setReleasingFunds] = useState(false);
    const [fundsReleased, setFundsReleased] = useState(false);
    
    const userDetails = JSON.parse(localStorage.getItem("userDetails"));
    const userId = userDetails?.id;

    const navigate = useNavigate();


    const handlingFaq = () => {
        navigate("/app/client/faq");
    }

    // Handle releasing funds for a completed order
    const handleReleaseFunds = async () => {
        if (!orderId) return;
        setReleasingFunds(true);
        try {
            const result = await ClientOrderService.releaseFunds(orderId);
            if (result.success) {
                setFundsReleased(true);
                toast.success(result.data?.message || "Funds released successfully!");
                // Refresh the order data to reflect updated status
                try {
                    const token = localStorage.getItem('authToken');
                    const response = await axios.get(
                        `${config.BASE_URL}/ClientOrders/orderId?orderId=${orderId}`,
                        { headers: { 'Authorization': `Bearer ${token}` } }
                    );
                    setOrders([response.data]);
                } catch (refreshErr) {
                    console.error("Failed to refresh order data:", refreshErr);
                }
            } else {
                toast.error(result.error || "Failed to release funds.");
            }
        } catch (error) {
            console.error("Error releasing funds:", error);
            toast.error("Failed to release funds. Please try again.");
        } finally {
            setReleasingFunds(false);
        }
    };




    // Check if user has already submitted a review for this order
    const checkExistingReview = async (gigId, clientId) => {
        if (!gigId || !clientId) return false;
        
        try {
            setCheckingReviewStatus(true);
            const token = localStorage.getItem('authToken');
            const response = await axios.get(
                `${config.BASE_URL}/Reviews?gigId=${gigId}`, // Using centralized API config
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            if (response.status === 200 && response.data) {
                // Check if any review in the array was submitted by this client
                const existingReview = response.data.find(review => review.clientId === clientId);
                return !!existingReview; // Returns true if review exists
            }
            return false;
        } catch (error) {
            console.warn("Error checking existing review:", error);
            return false; // If we can't check, assume no review exists
        } finally {
            setCheckingReviewStatus(false);
        }
    };

    // Check if contract exists for this order
    const checkExistingContract = async (orderId) => {
        if (!orderId) return;
        
        try {
            setCheckingContract(true);
            const result = await ContractService.checkExistingContract(orderId);
            
            if (result.success && result.hasContract) {
                setContract(result.data);
            } else if (!result.success) {
                console.warn("Error checking existing contract:", result.error);
            }
        } catch (error) {
            console.error("Error checking existing contract:", error);
        } finally {
            setCheckingContract(false);
        }
    };

    // Check if OrderTasks exist for this order
    const checkExistingOrderTasks = async (orderId) => {
        if (!orderId) return;
        
        try {
            setCheckingOrderTasks(true);
            const result = await OrderTasksService.checkOrderTasks(orderId);
            
            if (result.success && result.hasOrderTasks) {
                setOrderTasks(result.data);
                setHasOrderTasks(true);
            } else {
                setHasOrderTasks(false);
                setOrderTasks(null);
            }
        } catch (error) {
            console.error("Error checking OrderTasks:", error);
            setHasOrderTasks(false);
        } finally {
            setCheckingOrderTasks(false);
        }
    };

    // Handle OrderTasks creation
    const handleOrderTasksCreated = (orderTasksData) => {
        setOrderTasks(orderTasksData);
        setHasOrderTasks(true);
        setShowCreateOrderTasksModal(false);
        toast.success("Task requirements created!");
    };

    // Check if order allows task creation
    const canCreateTasks = (order) => {
        if (!order) return false;
        return order.clientOrderStatus !== 'Completed' && order.clientOrderStatus !== 'Cancelled';
    };

    // ==========================================
    // NEW CLIENT CONTRACT ACTIONS
    // ==========================================

    // Client approves contract
    const handleApproveContract = async (coords) => {
        if (!contract?.id) return;
        
        setContractActionLoading(true);
        try {
            const approveOptions = coords?.latitude != null
                ? { serviceLatitude: coords.latitude, serviceLongitude: coords.longitude }
                : {};

            const result = await ContractService.clientApproveContract(contract.id, approveOptions);
            
            if (result.success) {
                setContract(result.data);
                toast.success("Contract approved! Your caregiver has been notified.");

                // Notify caregiver about approval
                try {
                    const order = orders[0];
                    if (order?.caregiverId && userId && orderId) {
                        await createNotification({
                            recipientId: order.caregiverId,
                            senderId: userId,
                            type: 'ContractApproved',
                            relatedEntityId: orderId,
                            title: '✅ Your contract has been approved',
                            content: `The client has approved your contract for "${order.gigTitle || 'the order'}". You can now begin providing services.`
                        });
                    }
                } catch (notifError) {
                    console.error("Failed to send contract approval notification:", notifError);
                }

                setIsModalOpen(false);
                setShowGpsPrompt(false);
            } else {
                toast.error(result.error || "Failed to approve contract");
            }
        } catch (error) {
            console.error("Error approving contract:", error);
            toast.error("Failed to approve contract. Please try again.");
        } finally {
            setContractActionLoading(false);
        }
    };

    // GPS prompt helpers
    const handleApproveWithGps = async () => {
        setCapturingGps(true);
        const gps = await VisitCheckinService.getCurrentPosition();
        setCapturingGps(false);
        if (gps.success) {
            await handleApproveContract(gps.coords);
        } else {
            toast.error(gps.error);
        }
    };

    const handleApproveWithoutGps = async () => {
        await handleApproveContract();
    };

    // Client requests review/changes (Round 1 only)
    const handleRequestReview = async () => {
        if (!contract?.id) return;
        if (!reviewRequestComments.trim()) {
            toast.error("Please provide comments about the changes you'd like");
            return;
        }
        
        setContractActionLoading(true);
        try {
            const result = await ContractService.clientRequestReview(contract.id, {
                comments: reviewRequestComments,
                preferredScheduleNotes: reviewPreferredScheduleNotes
            });
            
            if (result.success) {
                setContract(result.data);
                toast.success("Your feedback has been sent to the caregiver for revision.");

                // Notify caregiver about revision request
                try {
                    const order = orders[0];
                    if (order?.caregiverId && userId && orderId) {
                        await createNotification({
                            recipientId: order.caregiverId,
                            senderId: userId,
                            type: 'ContractRevisionRequested',
                            relatedEntityId: orderId,
                            title: '📝 Contract revision requested',
                            content: `The client has requested changes to your contract for "${order.gigTitle || 'the order'}". Please review and revise.`
                        });
                    }
                } catch (notifError) {
                    console.error("Failed to send revision request notification:", notifError);
                }

                setIsModalOpen(false);
                setReviewRequestComments("");
                setReviewPreferredScheduleNotes("");
            } else {
                toast.error(result.error || "Failed to request review");
            }
        } catch (error) {
            console.error("Error requesting review:", error);
            toast.error("Failed to request review. Please try again.");
        } finally {
            setContractActionLoading(false);
        }
    };

    // Client rejects contract (Round 2+ only)
    const handleRejectContract = async () => {
        if (!contract?.id) return;
        if (!rejectReason.trim()) {
            toast.error("Please provide a reason for rejection");
            return;
        }
        
        setContractActionLoading(true);
        try {
            const result = await ContractService.clientRejectContract(contract.id, rejectReason);
            
            if (result.success) {
                setContract(result.data);
                toast.success("Contract rejected. You may request a different caregiver.");

                // Notify caregiver about rejection
                try {
                    const order = orders[0];
                    if (order?.caregiverId && userId && orderId) {
                        await createNotification({
                            recipientId: order.caregiverId,
                            senderId: userId,
                            type: 'ContractRejected',
                            relatedEntityId: orderId,
                            title: '❌ Your contract has been rejected',
                            content: `The client has rejected your contract for "${order.gigTitle || 'the order'}". Reason: ${rejectReason}`
                        });
                    }
                } catch (notifError) {
                    console.error("Failed to send contract rejection notification:", notifError);
                }

                setIsModalOpen(false);
                setRejectReason("");
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

    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (!orderId) {
                setError("Order ID is missing.");
                setLoading(false);
                return;
            }

            try {
                const token = localStorage.getItem('authToken');
                const response = await axios.get(
                    `${config.BASE_URL}/ClientOrders/orderId?orderId=${orderId}`, // Using centralized API config
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
                const orderData = response.data;
                setOrders([orderData]); // API returns a single order, so wrap it in an array
                
                // Sync fund-release state with server
                if (orderData.isOrderStatusApproved) {
                    setFundsReleased(true);
                }

                // Check if user has already submitted a review for this order
                if (orderData.gigId && userId) {
                    const hasExistingReview = await checkExistingReview(orderData.gigId, userId);
                    setIsReviewSubmitted(hasExistingReview);
                }
                
                // Check if contract exists for this order
                await checkExistingContract(orderId);
                
                // Check if OrderTasks exist for this order
                await checkExistingOrderTasks(orderId);
            } catch (err) {
                setError("Failed to fetch order details.");
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [orderId]);

    const openModal = (type) => {
        setModalType(type);
        setReason("");
        if (type === "review") {
            setRating(0);
            setReviewComment("");
        }
        setIsModalOpen(true);
    };

    const handleSubmitStatus = async () => {
        if (!orderId || !userId) {
            toast.error("Unable to update order: missing order or user information. Please refresh and try again.");
            return;
        }
        if (modalType === "dispute" && !reason) {
            toast.error("Please provide a reason for the dispute.");
            return;
        }

        setIsSubmitting(true);

        const baseUrl = `${config.BASE_URL}/ClientOrders`; // Using centralized API config
        const endpoint =
            modalType === "complete"
                ? `${baseUrl}/UpdateClientOrderStatus/orderId?orderId=${orderId}`
                : `${baseUrl}/UpdateClientOrderStatusHasDispute/orderId?orderId=${orderId}`;

        const payload =
            modalType === "complete"
                ? {
                      clientOrderStatus: "Completed",
                      userId: userId,
                  }
                : {
                      clientOrderStatus: "Disputed",
                      disputeReason: reason,
                      userId: userId,
                  };

        try {
            const token = localStorage.getItem('authToken');
            await axios.put(endpoint, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            // Show success toast
            toast.success(`Order has been marked as ${modalType === "complete" ? "Completed" : "Disputed"}!`);
            setIsModalOpen(false);
            
            // Refresh the order data to reflect the new status
            try {
                const response = await axios.get(
                    `${config.BASE_URL}/ClientOrders/orderId?orderId=${orderId}`, // Using centralized API config
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
                setOrders([response.data]);
            } catch (refreshErr) {
                console.error("Failed to refresh order data:", refreshErr);
            }
        } catch (err) {
            console.error("Failed to update order status:", err);
            const errorMessage = err.response?.data?.message || err.response?.data || "Failed to update the order status. Please try again.";
            toast.error(typeof errorMessage === 'string' ? errorMessage : "Failed to update the order status. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!rating || rating < 1 || rating > 5) {
            toast.error("Please provide a rating between 1 and 5 stars.");
            return;
        }

        if (!reviewComment.trim()) {
            toast.error("Please provide a review comment.");
            return;
        }

        const order = orders[0];
        if (!order.gigId) {
            toast.error("Cannot submit review: Gig ID is missing.");
            return;
        }

        const reviewPayload = {
            clientId: userId,
            caregiverId: order.caregiverId,
            gigId: order.gigId,
            message: reviewComment.trim(),
            rating: rating
        };

        try {
            // Submit the review
            const token = localStorage.getItem('authToken');
            await axios.post(
                `${config.BASE_URL}/Reviews`, // Using centralized API config
                reviewPayload,
                {
                    headers: {
                        'accept': '*/*',
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            // Create notification for the caregiver
            try {
                await createNotification({
                    recipientId: order.caregiverId,
                    senderId: userId,
                    type: "SystemNotice",
                    title: "New Review Received",
                    content: `A client has submitted a ${rating}-star review for your service: ${order.gigTitle || 'your gig'}`,
                    relatedEntityId: order.id
                });
                console.log("Review notification sent successfully to caregiver");
            } catch (notificationError) {
                console.error("Failed to send notification to caregiver:", notificationError);
                // Don't fail the review submission if notification fails
            }
            
            toast.success("Review submitted successfully!");
            setIsReviewSubmitted(true);
            setIsModalOpen(false);
        } catch (err) {
            console.error("Error submitting review:", err);
            toast.error("Failed to submit review. Please try again.");
        }
    };

    if (loading) return <p>Loading order details...</p>;
    if (error) return <p className="error">{error}</p>;

    return (
        <div className="my-orders-container">
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
                            {orders.length > 0 && (
                                <ClientVisitTabs order={orders[0]} />
                            )}

                            {/* Original service task list */}
                            {orders.length > 0 && orders[0].gigPackageDetails && (
                                <div className="cv-service-tasks">
                                    <h3 className="cv-service-tasks-heading">Service Tasks (Agreed at Booking)</h3>
                                    {orders[0].gigPackageDetails.map((taskText, index) => (
                                        <div key={index} className="task">
                                            ☐ {taskText}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="details-section">
                            {orders.length > 0 && (
                                <>
                                    <div className="offer-header">
                                        <img
                                            src={orders[0].gigImage}
                                            alt={orders[0].provider}
                                            className="provider-avatar"
                                        />
                                        <h2>Offer from {orders[0].caregiverName}</h2>
                                        <div className="provider-info">
                                            Available ★ {orders[0].providerRating} • {orders[0].providerLocation}
                                        </div>
                                    </div>
                                    <div className="offer-content">
                                        <p>Tasks</p>
                                        {orders[0].gigPackageDetails && orders[0].gigPackageDetails.length > 0 ? (
                                            orders[0].gigPackageDetails.map((taskText, index) => (
                                                <div key={index} className="task">
                                                    ☐ {taskText}
                                                </div>
                                            ))
                                        ) : (
                                            <p>No tasks available.</p>
                                        )}

                                        <p>Pricing</p>
                                        <input type="text" className="offer-pricing" placeholder={orders[0].amount} />
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
                                    <img src="https://via.placeholder.com/100" alt="Order activity" className="order-image" />
                                    <p>{orders[0].gigPackageDetails}</p>
                                    <div className="order-status-badge">* {orders[0].clientOrderStatus}</div>
                                    <div className="order-meta">
                                        <p>Ordered from: {orders[0].caregiverName}</p>
                                        <p>Total price: {orders[0].amount}</p>
                                        <p>Order number: #{orders[0].id}</p>
                                    </div>
                                    
                                    {/* Contract Section - NEW CLIENT APPROVAL FLOW */}
                                    <div className="contract-section">
                                        {checkingContract || checkingOrderTasks ? (
                                            <div className="contract-checking">
                                                <p>Checking contract status...</p>
                                            </div>
                                        ) : contract ? (
                                            <div className="contract-exists">
                                                <h4>📋 Contract from Caregiver</h4>
                                                <div className="contract-details">
                                                    <p><strong>Status:</strong> <span className={`contract-status-badge ${contract.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                                                        {ContractService.getStatusDisplayInfo(contract.status).label}
                                                    </span></p>
                                                    <p><strong>Negotiation Round:</strong> {contract.negotiationRound || 1}</p>
                                                    <p><strong>Total Amount:</strong> ₦{contract.totalAmount?.toLocaleString() || 'N/A'}</p>
                                                    {contract.submittedAt && (
                                                        <p><strong>Submitted:</strong> {new Date(contract.submittedAt).toLocaleString()}</p>
                                                    )}
                                                    
                                                    {/* Schedule Display */}
                                                    {contract.schedule && contract.schedule.length > 0 && (
                                                        <div className="contract-schedule-section">
                                                            <p><strong>Proposed Schedule:</strong></p>
                                                            <div className="schedule-display">
                                                                {contract.schedule.map((visit, idx) => (
                                                                    <div key={idx} className="schedule-visit">
                                                                        <span className="schedule-day">{visit.dayOfWeek}</span>
                                                                        <span className="schedule-time">
                                                                            {ContractService.formatTimeForDisplay(visit.startTime)} - {ContractService.formatTimeForDisplay(visit.endTime)}
                                                                        </span>
                                                                        <span className="schedule-duration">
                                                                            {ContractService.calculateVisitDuration(visit.startTime, visit.endTime)}hrs
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Service Details */}
                                                    {contract.serviceAddress && (
                                                        <p><strong>Service Address:</strong> {contract.serviceAddress}</p>
                                                    )}
                                                    {contract.specialClientRequirements && (
                                                        <p><strong>Special Requirements:</strong> {contract.specialClientRequirements}</p>
                                                    )}
                                                    
                                                    {contract.contractStartDate && contract.contractEndDate && (
                                                        <p><strong>Duration:</strong> {new Date(contract.contractStartDate).toLocaleDateString()} - {new Date(contract.contractEndDate).toLocaleDateString()}</p>
                                                    )}
                                                </div>
                                                
                                                {/* Contract Action Buttons - Based on Status */}
                                                {(() => {
                                                    const actions = ContractService.getClientContractActions(contract);
                                                    const status = contract.status?.toLowerCase().replace(/\s+/g, '');
                                                    
                                                    if (status === 'approved') {
                                                        return (
                                                            <div className="contract-approved-message">
                                                                <p>✅ You have approved this contract</p>
                                                                {contract.clientApprovedAt && (
                                                                    <p className="approved-date">Approved on: {new Date(contract.clientApprovedAt).toLocaleString()}</p>
                                                                )}
                                                                <button 
                                                                    className="view-contract-btn"
                                                                    onClick={() => openModal("viewContract")}
                                                                >
                                                                    View Full Contract
                                                                </button>
                                                            </div>
                                                        );
                                                    } else if (status === 'clientrejected') {
                                                        return (
                                                            <div className="contract-rejected-message">
                                                                <p>❌ You have rejected this contract</p>
                                                                <button 
                                                                    className="view-contract-btn"
                                                                    onClick={() => openModal("viewContract")}
                                                                >
                                                                    View Contract Details
                                                                </button>
                                                            </div>
                                                        );
                                                    } else if (status === 'clientreviewrequested') {
                                                        return (
                                                            <div className="contract-review-pending">
                                                                <p>🔄 Waiting for caregiver to revise the contract</p>
                                                                {contract.clientReviewComments && (
                                                                    <p className="your-feedback">Your feedback: "{contract.clientReviewComments}"</p>
                                                                )}
                                                                <button 
                                                                    className="view-contract-btn"
                                                                    onClick={() => openModal("viewContract")}
                                                                >
                                                                    View Contract
                                                                </button>
                                                            </div>
                                                        );
                                                    } else if (actions.canApprove) {
                                                        // Contract is pending approval (PendingClientApproval or Revised)
                                                        const isRevised = status === 'revised';
                                                        return (
                                                            <div className="contract-action-required">
                                                                <p className="action-prompt">
                                                                    {isRevised 
                                                                        ? "⚠️ Caregiver has revised the contract. Please review and respond."
                                                                        : "⏳ Please review and approve this contract"}
                                                                </p>
                                                                <div className="contract-action-buttons">
                                                                    <button 
                                                                        className="view-contract-btn"
                                                                        onClick={() => openModal("viewContract")}
                                                                    >
                                                                        View Full Contract
                                                                    </button>
                                                                    <button 
                                                                        className="approve-contract-btn"
                                                                        onClick={() => setShowGpsPrompt(true)}
                                                                        disabled={contractActionLoading}
                                                                    >
                                                                        {contractActionLoading ? 'Processing...' : '✓ Approve Contract'}
                                                                    </button>
                                                                    {actions.canRequestReview && (
                                                                        <button 
                                                                            className="request-changes-btn"
                                                                            onClick={() => openModal("requestReview")}
                                                                        >
                                                                            Request Changes
                                                                        </button>
                                                                    )}
                                                                    {actions.canReject && (
                                                                        <button 
                                                                            className="reject-contract-btn"
                                                                            onClick={() => openModal("rejectContract")}
                                                                        >
                                                                            Reject Contract
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                {actions.canRequestReview && (
                                                                    <p className="round-hint">Round 1: You can request changes to the schedule</p>
                                                                )}
                                                                {actions.canReject && (
                                                                    <p className="round-hint">Round 2: Approve or reject (request new caregiver)</p>
                                                                )}
                                                            </div>
                                                        );
                                                    } else {
                                                        return (
                                                            <div className="contract-status-message">
                                                                <button 
                                                                    className="view-contract-btn"
                                                                    onClick={() => openModal("viewContract")}
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
                                                <p>📝 No contract generated yet.</p>
                                                <p className="contract-info">Your caregiver will generate a contract after you discuss and agree on a schedule together.</p>
                                                {hasOrderTasks && (
                                                    <p className="tasks-ready">✅ Task requirements are ready</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Fund Release Section */}
                                    {orders[0].clientOrderStatus === "Completed" && (() => {
                                        const order = orders[0];
                                        const showRelease = ClientOrderService.shouldShowReleaseFunds(order, userId) && !fundsReleased;
                                        const fundInfo = ClientOrderService.getFundStatusInfo(order);
                                        const isAutoReleased = order.paymentOption === 'monthly' && order.billingCycleNumber > 1;
                                        const alreadyReleased = order.isOrderStatusApproved || fundsReleased;

                                        return (
                                            <div className="fund-release-section" style={{ margin: '12px 0', padding: '10px', borderRadius: '8px', background: '#f8f9fa' }}>
                                                {alreadyReleased ? (
                                                    <div style={{ color: '#27ae60', fontWeight: 600 }}>
                                                        ✅ Funds Released
                                                    </div>
                                                ) : isAutoReleased ? (
                                                    <div style={{ color: '#2980b9', fontWeight: 600 }}>
                                                        ✅ Funds Auto-Released (Cycle {order.billingCycleNumber})
                                                    </div>
                                                ) : showRelease ? (
                                                    <>
                                                        <p style={{ fontSize: '13px', color: '#555', marginBottom: '8px' }}>
                                                            💰 Funds are pending release. Confirm service delivery to release payment to your caregiver.
                                                            {' '}Funds auto-release after 7 days.
                                                        </p>
                                                        <button
                                                            className="mark-completed-btn"
                                                            style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                                                            onClick={handleReleaseFunds}
                                                            disabled={releasingFunds}
                                                        >
                                                            {releasingFunds ? 'Releasing...' : '💸 Release Funds'}
                                                        </button>
                                                    </>
                                                ) : order.hasDispute ? (
                                                    <div style={{ color: '#e74c3c', fontWeight: 600 }}>
                                                        ⚠️ Order has an active dispute — funds are on hold
                                                    </div>
                                                ) : null}

                                                {order.billingCycleNumber > 0 && (
                                                    <p style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
                                                        {order.paymentOption === 'monthly' ? `Monthly Subscription — Cycle ${order.billingCycleNumber}` : 'One-Time Order'}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    {orders[0].clientOrderStatus === "Completed" ? (
                                        isReviewSubmitted ? (
                                            <div className="review-submitted">
                                                <p>✓ Review Already Submitted</p>
                                                <p>Thank you for your feedback!</p>
                                            </div>
                                        ) : checkingReviewStatus ? (
                                            <button className="submit-review-btn disabled" disabled>
                                                Checking Review Status...
                                            </button>
                                        ) : (
                                            <button 
                                                className="submit-review-btn" 
                                                onClick={() => openModal("review")}
                                            >
                                                Submit Review
                                            </button>
                                        )
                                    ) : (
                                        <>
                                            <button className="mark-completed-btn" onClick={() => openModal("complete")}>
                                                Mark as Completed
                                            </button>
                                            <button className="report-issue-btn" onClick={() => openModal("dispute")}>
                                                Dispute Order
                                            </button>
                                        </>
                                    )}
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
                    <div className={`modal-content ${modalType === 'viewContract' ? 'contract-modal-large' : ''}`}>
                        {modalType === "review" ? (
                            <>
                                <h3>Submit Review</h3>
                                <div className="review-form">
                                    <div className="rating-section">
                                        <label>Rating:</label>
                                        <div className="star-rating">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <span
                                                    key={star}
                                                    className={`star ${rating >= star ? 'active' : ''}`}
                                                    onClick={() => setRating(star)}
                                                    style={{ 
                                                        cursor: 'pointer', 
                                                        fontSize: '24px', 
                                                        color: rating >= star ? '#ffd700' : '#ccc',
                                                        marginRight: '5px'
                                                    }}
                                                >
                                                    ★
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="comment-section">
                                        <label>Your Review:</label>
                                        <textarea
                                            placeholder="Share your experience with this caregiver..."
                                            value={reviewComment}
                                            onChange={(e) => setReviewComment(e.target.value)}
                                            rows="4"
                                            style={{ width: '100%', marginTop: '8px', padding: '8px' }}
                                        />
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button onClick={handleSubmitReview}>Submit Review</button>
                                    <button onClick={() => setIsModalOpen(false)}>Cancel</button>
                                </div>
                            </>
                        ) : modalType === "viewContract" && contract ? (
                            <>
                                <div className="contract-modal-header">
                                    <h3>📋 Contract Details</h3>
                                    <button className="contract-modal-close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
                                </div>
                                <div className="contract-modal-body">
                                <div className="contract-details-modal">
                                    <div className="contract-header-info">
                                        <p><strong>Contract ID:</strong> {contract.id}</p>
                                        <p><strong>Status:</strong> <span className={`status-badge ${contract.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                                            {ContractService.getStatusDisplayInfo(contract.status).label}
                                        </span></p>
                                        <p><strong>Negotiation Round:</strong> {contract.negotiationRound || 1}</p>
                                    </div>
                                    
                                    {/* Schedule Section */}
                                    {contract.schedule && contract.schedule.length > 0 && (
                                        <div className="contract-schedule-modal">
                                            <h4>📅 Service Schedule</h4>
                                            <div className="schedule-display">
                                                {contract.schedule.map((visit, idx) => (
                                                    <div key={idx} className="schedule-visit">
                                                        <span className="schedule-day">{visit.dayOfWeek}</span>
                                                        <span className="schedule-time">
                                                            {ContractService.formatTimeForDisplay(visit.startTime)} - {ContractService.formatTimeForDisplay(visit.endTime)}
                                                        </span>
                                                        <span className="schedule-duration">
                                                            {ContractService.calculateVisitDuration(visit.startTime, visit.endTime)}hrs
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Service Details */}
                                    <div className="contract-service-details">
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
                                            <p><strong>Caregiver Notes:</strong> {contract.caregiverAdditionalNotes}</p>
                                        )}
                                        {contract.contractStartDate && contract.contractEndDate && (
                                            <p><strong>Contract Period:</strong> {new Date(contract.contractStartDate).toLocaleDateString()} - {new Date(contract.contractEndDate).toLocaleDateString()}</p>
                                        )}
                                    </div>

                                    {/* Package Details */}
                                    {contract.selectedPackage && (
                                        <div className="contract-package-details">
                                            <h4>📦 Package Information</h4>
                                            <p><strong>Type:</strong> {contract.selectedPackage.packageType}</p>
                                            <p><strong>Visits per Week:</strong> {contract.selectedPackage.visitsPerWeek}</p>
                                            <p><strong>Price per Visit:</strong> ₦{contract.selectedPackage.pricePerVisit?.toLocaleString()}</p>
                                            <p><strong>Duration:</strong> {contract.selectedPackage.durationWeeks} weeks</p>
                                        </div>
                                    )}

                                    {/* Tasks */}
                                    {contract.tasks && contract.tasks.length > 0 && (
                                        <div className="contract-tasks-section">
                                            <h4>📝 Tasks & Requirements</h4>
                                            {contract.tasks.map((task, index) => (
                                                <div key={index} className="task-item">
                                                    <h5>{task.title}</h5>
                                                    <p>{task.description}</p>
                                                    <p><strong>Category:</strong> {task.category} | <strong>Priority:</strong> {task.priority}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Terms */}
                                    {contract.generatedTerms && (
                                        <div className="contract-terms-section">
                                            <h4>📜 Contract Terms</h4>
                                            <div className="terms-content">
                                                {contract.generatedTerms}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                </div>
                            </>
                        ) : modalType === "requestReview" ? (
                            <>
                                <h3>Request Schedule Changes</h3>
                                <p>Let your caregiver know what changes you'd like to the proposed schedule:</p>
                                <div className="review-request-form">
                                    <div className="form-group">
                                        <label>What changes would you like?</label>
                                        <textarea
                                            placeholder="E.g., I prefer morning visits instead of afternoon..."
                                            value={reviewRequestComments}
                                            onChange={(e) => setReviewRequestComments(e.target.value)}
                                            rows="4"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Preferred Schedule Notes (optional)</label>
                                        <textarea
                                            placeholder="E.g., Monday and Wednesday mornings work best..."
                                            value={reviewPreferredScheduleNotes}
                                            onChange={(e) => setReviewPreferredScheduleNotes(e.target.value)}
                                            rows="2"
                                        />
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button 
                                        onClick={handleRequestReview}
                                        disabled={contractActionLoading || !reviewRequestComments.trim()}
                                    >
                                        {contractActionLoading ? 'Sending...' : 'Send Feedback to Caregiver'}
                                    </button>
                                    <button onClick={() => setIsModalOpen(false)}>Cancel</button>
                                </div>
                            </>
                        ) : modalType === "rejectContract" ? (
                            <>
                                <h3>Reject Contract</h3>
                                <p className="reject-warning">⚠️ By rejecting this contract, you are indicating that you and the caregiver cannot reach an agreement. You may need to request a different caregiver.</p>
                                <div className="form-group">
                                    <label>Reason for rejection:</label>
                                    <textarea
                                        placeholder="Please explain why you're rejecting this contract..."
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        rows="4"
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button 
                                        className="reject-btn"
                                        onClick={handleRejectContract}
                                        disabled={contractActionLoading || !rejectReason.trim()}
                                    >
                                        {contractActionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                                    </button>
                                    <button onClick={() => setIsModalOpen(false)}>Cancel</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h3>{modalType === "complete" ? "Mark as Completed" : "Dispute Order"}</h3>
                                {modalType === "dispute" && (
                                    <textarea
                                        placeholder="Enter reason..."
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                    />
                                )}
                                <div className="modal-actions">
                                    <button onClick={handleSubmitStatus} disabled={isSubmitting}>
                                        {isSubmitting ? 'Submitting...' : 'Submit'}
                                    </button>
                                    <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* OrderTasks Creation Modal */}
            {showCreateOrderTasksModal && (
                <CreateOrderTasksModal
                    isOpen={showCreateOrderTasksModal}
                    onClose={() => setShowCreateOrderTasksModal(false)}
                    orderData={orders[0]}
                    onOrderTasksCreated={handleOrderTasksCreated}
                />
            )}

            {/* GPS Prompt Modal for Contract Approval */}
            {showGpsPrompt && (
                <div className="modal-overlay gps-prompt-overlay" onClick={() => !capturingGps && !contractActionLoading && setShowGpsPrompt(false)}>
                    <div className="gps-prompt-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>📍 Confirm Your Location</h3>
                        <p>Are you currently at the service address? Sharing your location helps ensure accurate check-in verification for your caregiver.</p>
                        <div className="gps-prompt-actions">
                            <button
                                className="gps-prompt-yes"
                                onClick={handleApproveWithGps}
                                disabled={capturingGps || contractActionLoading}
                            >
                                {capturingGps ? 'Capturing location...' : contractActionLoading ? 'Approving...' : "Yes, I'm here"}
                            </button>
                            <button
                                className="gps-prompt-skip"
                                onClick={handleApproveWithoutGps}
                                disabled={capturingGps || contractActionLoading}
                            >
                                {contractActionLoading ? 'Approving...' : 'No / Skip'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
        </div>
    );
};

export default MyOrders;
