import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Order&Tasks.scss";

const MyOrders = () => {
    const { orderId } = useParams(); // Get orderId from URL params
    const [selectedView, setSelectedView] = useState("Tasks");
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState("");
    const [reason, setReason] = useState(""); 
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
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [orderId]);

    const openModal = (type) => {
        setModalType(type);
        setReason("");
        setIsModalOpen(true);
    };

    const handleSubmitStatus = async () => {
        if (!orderId || !userId || (modalType === "dispute" && !reason)) return;

        const baseUrl = "https://carepro-api20241118153443.azurewebsites.net/api/ClientOrders";
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
        } catch (err) {
            console.error(err);
            // Show error toast
            toast.error("Failed to update the order status.");
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
                                    <button className="mark-completed-btn" onClick={() => openModal("complete")}>
                                        Mark as Completed
                                    </button>
                                    <button className="report-issue-btn" onClick={() => openModal("dispute")}>
                                        Dispute Order
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="support-section">
                            <h3>Support</h3>
                            <div className="support-item">
                                <span>📋 FAQs</span>
                                <span>Find needed answers</span>
                            </div>
                            <div className="support-item">
                                <span>📞 Resolution Center</span>
                                <span>Resolve order issues</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
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
                    </div>
                </div>
            )}

            {/* ToastContainer for React Toastify */}
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
        </div>
    );
};

export default MyOrders;
