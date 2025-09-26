import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { FaClipboardList, FaPhoneAlt } from "react-icons/fa";
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
    const [modalType, setModalType] = useState(""); // Only "update" now
    const [notes, setNotes] = useState("");
    const [isContactLoading, setIsContactLoading] = useState(false);

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
                const response = await axios.get(
                    `https://carepro-api20241118153443.azurewebsites.net/api/ClientOrders/orderId?orderId=${orderId}`
                );
                setOrders([response.data]); // API returns a single order, so wrap it in an array
            } catch (err) {
                setError("Failed to fetch order details.");
                console.error("Error fetching order details:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [orderId]);

    // Function to check if conversation exists between caregiver and client
    const checkConversationExists = async (caregiverId, clientId) => {
        try {
            const response = await axios.get(
                `https://carepro-api20241118153443.azurewebsites.net/api/Messages/conversations/${caregiverId}`
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
            const response = await axios.post(
                'https://carepro-api20241118153443.azurewebsites.net/api/Messages/conversations',
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
            // Handle update modal
            setModalType(type);
            setNotes("");
            setIsModalOpen(true);
        }
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
                            <button onClick={() => setIsModalOpen(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ToastContainer for React Toastify */}
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
        </div>
    );
};

export default CaregiverOrderDetails;
