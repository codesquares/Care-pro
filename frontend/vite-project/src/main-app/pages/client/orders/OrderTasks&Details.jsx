import { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createNotification } from "../../../services/notificationService";
import ContractService from "../../../services/contractService";
import OrderTasksService from "../../../services/orderTasksService";
import CreateOrderTasksModal from "../../../components/modals/CreateOrderTasksModal";
import config from "../../../config"; // Centralized API configuration
import "./Order&Tasks.scss";
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
    
    // Contract-related state
    const [contract, setContract] = useState(null);
    const [isGeneratingContract, setIsGeneratingContract] = useState(false);
    const [contractError, setContractError] = useState(null);
    const [checkingContract, setCheckingContract] = useState(false);
    
    // OrderTasks-related state
    const [orderTasks, setOrderTasks] = useState(null);
    const [hasOrderTasks, setHasOrderTasks] = useState(false);
    const [checkingOrderTasks, setCheckingOrderTasks] = useState(false);
    const [showCreateOrderTasksModal, setShowCreateOrderTasksModal] = useState(false);
    
    const userDetails = JSON.parse(localStorage.getItem("userDetails"));
    const userId = userDetails?.id;

    const navigate = useNavigate();


    const handlingFaq = () => {
        navigate("/app/client/faq");
    }




    // Check if user has already submitted a review for this order
    const checkExistingReview = async (gigId, clientId) => {
        if (!gigId || !clientId) return false;
        
        try {
            setCheckingReviewStatus(true);
            const response = await axios.get(
                `${config.BASE_URL}/Reviews?gigId=${gigId}` // Using centralized API config
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
        toast.success("Task requirements created! You can now generate a contract.");
    };

    // Check if order allows task creation
    const canCreateTasks = (order) => {
        if (!order) return false;
        return order.clientOrderStatus !== 'Completed' && order.clientOrderStatus !== 'Cancelled';
    };

    // Handle contract generation
    const handleGenerateContract = async () => {
        if (!orderId) {
            toast.error("Order ID is missing");
            return;
        }

        setIsGeneratingContract(true);
        setContractError(null);

        try {
            const result = await ContractService.generateContractFromOrder(orderId);
            
            if (result.success) {
                setContract(result.data);
                toast.success("Contract generated and sent to caregiver successfully!");
                
                // Optional: Create notification for caregiver if needed
                if (orders.length > 0 && orders[0].caregiverId) {
                    try {
                        await createNotification({
                            recipientId: orders[0].caregiverId,
                            senderId: userId,
                            type: "SystemNotice",
                            title: "New Contract Generated",
                            content: `A contract has been generated for order: ${orders[0].gigTitle || 'your service'}`,
                            relatedEntityId: orderId
                        });
                    } catch (notificationError) {
                        console.error("Failed to send contract notification:", notificationError);
                        // Don't fail contract generation if notification fails
                    }
                }
            } else {
                setContractError(result.error);
                toast.error(result.error || "Failed to generate contract");
            }
        } catch (error) {
            const errorMessage = "Failed to generate contract. Please try again.";
            setContractError(errorMessage);
            toast.error(errorMessage);
            console.error("Contract generation error:", error);
        } finally {
            setIsGeneratingContract(false);
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
                const response = await axios.get(
                    `${config.BASE_URL}/ClientOrders/orderId?orderId=${orderId}` // Using centralized API config
                );
                const orderData = response.data;
                setOrders([orderData]); // API returns a single order, so wrap it in an array
                
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
        if (!orderId || !userId || (modalType === "dispute" && !reason)) return;

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
            await axios.put(endpoint, payload);
            // Show success toast
            toast.success(`Order has been marked as ${modalType === "complete" ? "Completed" : "Disputed"}!`);
            setIsModalOpen(false);
            
            // Refresh the order data to reflect the new status
            const response = await axios.get(
                `${config.BASE_URL}/ClientOrders/orderId?orderId=${orderId}` // Using centralized API config
            );
            setOrders([response.data]);
        } catch (err) {
            console.error(err);
            // Show error toast
            toast.error("Failed to update the order status.");
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
            await axios.post(
                `${config.BASE_URL}/Reviews`, // Using centralized API config
                reviewPayload,
                {
                    headers: {
                        'accept': '*/*',
                        'Content-Type': 'application/json'
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
                                    
                                    {/* Contract and OrderTasks Section */}
                                    <div className="contract-section">
                                        {checkingContract || checkingOrderTasks ? (
                                            <div className="contract-checking">
                                                <p>Checking contract and task status...</p>
                                            </div>
                                        ) : contract ? (
                                            <div className="contract-exists">
                                                <h4>✅ Contract Generated</h4>
                                                <div className="contract-details">
                                                    <p><strong>Contract ID:</strong> {contract.id}</p>
                                                    <p><strong>Status:</strong> {contract.status}</p>
                                                    <p><strong>Total Amount:</strong> ₦{contract.totalAmount?.toLocaleString() || 'N/A'}</p>
                                                    {contract.sentAt && (
                                                        <p><strong>Sent to caregiver:</strong> {new Date(contract.sentAt).toLocaleString()}</p>
                                                    )}
                                                    {contract.contractStartDate && contract.contractEndDate && (
                                                        <p><strong>Duration:</strong> {new Date(contract.contractStartDate).toLocaleDateString()} - {new Date(contract.contractEndDate).toLocaleDateString()}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ) : hasOrderTasks ? (
                                            ContractService.canGenerateContract(orders[0], contract, hasOrderTasks) ? (
                                                <div className="contract-generation">
                                                    <h4>Contract</h4>
                                                    <div className="order-tasks-status">
                                                        <p>✅ Task requirements created ({orderTasks?.careTasks?.length || 0} tasks)</p>
                                                    </div>
                                                    <p>Generate a formal contract for this order that will be sent to your caregiver.</p>
                                                    {contractError && (
                                                        <div className="contract-error">
                                                            <p>❌ {contractError}</p>
                                                        </div>
                                                    )}
                                                    <button 
                                                        className={`generate-contract-btn ${isGeneratingContract ? 'loading' : ''}`}
                                                        onClick={handleGenerateContract}
                                                        disabled={isGeneratingContract}
                                                    >
                                                        {isGeneratingContract ? 'Generating Contract...' : 'Generate Contract'}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="contract-unavailable">
                                                    <h4>Contract</h4>
                                                    <div className="order-tasks-status">
                                                        <p>✅ Task requirements created</p>
                                                    </div>
                                                    {!orders[0].transactionId && !orders[0].paymentTransactionId ? (
                                                        <p>Contract generation requires payment completion.</p>
                                                    ) : orders[0].clientOrderStatus === 'Cancelled' ? (
                                                        <p>Contract cannot be generated for cancelled orders.</p>
                                                    ) : (
                                                        <p>Contract generation not available for this order.</p>
                                                    )}
                                                </div>
                                            )
                                        ) : (
                                            <div className="order-tasks-required">
                                                <h4>Contract Generation Unavailable</h4>
                                                <div className="alert alert-info">
                                                    <p>📋 To generate a contract for this order, you must first create detailed task requirements.</p>
                                                </div>
                                                {canCreateTasks(orders[0]) ? (
                                                    <button 
                                                        className="create-tasks-btn"
                                                        onClick={() => setShowCreateOrderTasksModal(true)}
                                                    >
                                                        Create Task Requirements
                                                    </button>
                                                ) : (
                                                    <p className="tasks-unavailable">Task creation is not available for {orders[0].clientOrderStatus.toLowerCase()} orders.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
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
                    <div className="modal-content">
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
                                    <button onClick={handleSubmitStatus}>Submit</button>
                                    <button onClick={() => setIsModalOpen(false)}>Cancel</button>
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

            {/* Remove duplicate ToastContainer - main app already has one */}
            {/* <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} /> */}
        </div>
    );
};

export default MyOrders;
