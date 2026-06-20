import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import config from "../../../config"; // Import centralized config for API URLs
import ContractService from "../../../services/contractService";
import NegotiationService from "../../../services/negotiationService";
import ContractGenerationModal from "../../../components/modals/ContractGenerationModal";
import TaskSheetTabs from "../../../components/task-sheets/TaskSheetTabs";
import ProposedTasksList from "../../../components/task-proposals/ProposedTasksList";
import NegotiationPanel from "../../../components/negotiations/NegotiationPanel";
import "../../../components/negotiations/NegotiationPanel.css";

import "react-toastify/dist/ReactToastify.css";
import "../../client/client-dashboard/marketplaceHero.css";
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
    const [contractFinalizing, setContractFinalizing] = useState(false);
    const [contractError, setContractError] = useState(null);
    const [contractActionLoading, setContractActionLoading] = useState(false);
    const [pdfDownloading, setPdfDownloading] = useState(false);
    
    // Contract generation modal state
    const [showContractGenerationModal, setShowContractGenerationModal] = useState(false);
    const [isRevisionMode, setIsRevisionMode] = useState(false);

    // Negotiation state
    const [negotiation, setNegotiation] = useState(null);
    const [negotiationLoading, setNegotiationLoading] = useState(false);

    // Re-fetch negotiation on any negotiation-related SignalR notification (real-time updates)
    const latestNotification = useSelector((state) => state.notifications.notifications[0]);
    useEffect(() => {
        if (!latestNotification || !negotiation) return;
        // Notifications use `type` (both SignalR real-time and REST API responses).
        // `notificationType` is kept as fallback for any legacy payloads.
        const t = (latestNotification.type || latestNotification.notificationType || "").toLowerCase().replace(/[\s-]+/g, "_");
        if (
            t.startsWith("negotiation_") &&
            // relatedEntityId may be the negotiation ID or the order ID depending on the backend
            (
                latestNotification.relatedEntityId === negotiation.id ||
                latestNotification.relatedEntityId === orderId ||
                latestNotification.orderId === orderId
            )
        ) {
            fetchNegotiationForOrder(orderId);
        }
    }, [latestNotification]); // eslint-disable-line react-hooks/exhaustive-deps

    // Re-fetch contract on any contract-related SignalR notification (real-time updates)
    useEffect(() => {
        if (!latestNotification) return;
        const t = (latestNotification.type || latestNotification.notificationType || "").toLowerCase().replace(/[\s-]+/g, "_");
        if (
            (t.startsWith("contract_") || t.startsWith("task_proposal_")) &&
            (
                latestNotification.relatedEntityId === contract?.id ||
                latestNotification.relatedEntityId === orderId ||
                latestNotification.orderId === orderId
            )
        ) {
            fetchContractForOrder(orderId);
        }
    }, [latestNotification]); // eslint-disable-line react-hooks/exhaustive-deps

    // Re-fetch order on status/dispute SignalR notifications (real-time updates)
    useEffect(() => {
        if (!latestNotification) return;
        const t = (latestNotification.type || latestNotification.notificationType || "").toLowerCase().replace(/[\s-]+/g, "_");
        if (
            (t === "order_cancelled" || t === "order_completed" || t === "order_disputed" || t === "dispute_raised" || t === "dispute_under_review") &&
            (latestNotification.relatedEntityId === orderId || latestNotification.orderId === orderId)
        ) {
            const token = localStorage.getItem("authToken");
            if (!token) return;
            axios.get(`${config.BASE_URL}/ClientOrders/orderId?orderId=${orderId}`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => setOrders([res.data]))
                .catch(err => console.error("Failed to refresh order status:", err));
        }
    }, [latestNotification]); // eslint-disable-line react-hooks/exhaustive-deps

    // Start-negotiation modal state
    const [showStartNegModal, setShowStartNegModal] = useState(false);
    const [negInitTasks, setNegInitTasks] = useState([]);
    const [negInitSchedule, setNegInitSchedule] = useState([]);
    const [negInitNotes, setNegInitNotes] = useState("");
    const [negInitNote, setNegInitNote] = useState("");
    const [negInitNewTask, setNegInitNewTask] = useState("");
    const [negInitSlotDay, setNegInitSlotDay] = useState("Monday");
    const [negInitSlotStart, setNegInitSlotStart] = useState("09:00");
    const [negInitSlotEnd, setNegInitSlotEnd] = useState("13:00");
    const [startNegLoading, setStartNegLoading] = useState(false);

    // Lock body scroll when any modal is open
    useEffect(() => {
        if (isModalOpen || showContractGenerationModal || showStartNegModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isModalOpen, showContractGenerationModal, showStartNegModal]);

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
                
                // Fetch contract and negotiation for this order
                await fetchContractForOrder(orderId);
                await fetchNegotiationForOrder(orderId);
                
            } catch (err) {
                setError("Failed to fetch order details.");
                console.error("Error fetching order details:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [orderId]);

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // Fetch contract for the order
    const fetchContractForOrder = async (orderId, { setLoadingState = true } = {}) => {
        try {
            if (setLoadingState) setContractLoading(true);
            setContractError(null);
            
            const result = await ContractService.checkExistingContract(orderId);
            
            if (result.success && result.hasContract) {
                setContract(result.data);
                return true;
            } else if (!result.success && result.statusCode !== 404) {
                // Only set error if it's not a 404 (no contract found)
                setContractError(result.error);
                return false;
            }
            return false;
        } catch (error) {
            console.error("Error fetching contract:", error);
            setContractError("Failed to load contract information");
            return false;
        } finally {
            if (setLoadingState) setContractLoading(false);
        }
    };

    const finalizeContractAfterConversion = async (orderId) => {
        setContractFinalizing(true);
        setNegotiation(null);

        const retryDelaysMs = [0, 400, 900, 1400, 2000];
        let foundContract = false;

        try {
            for (const delayMs of retryDelaysMs) {
                if (delayMs > 0) {
                    await sleep(delayMs);
                }

                foundContract = await fetchContractForOrder(orderId, { setLoadingState: false });
                if (foundContract) break;
            }
        } finally {
            setContractFinalizing(false);
        }

        return foundContract;
    };

    // Fetch negotiation for the order
    const fetchNegotiationForOrder = async (orderId) => {
        try {
            setNegotiationLoading(true);
            const result = await NegotiationService.getByOrderId(orderId);
            if (result.success) {
                const latestNegotiation = result.hasNegotiation ? result.data : null;
                if (latestNegotiation?.status === 'ConvertedToContract') {
                    setNegotiation(null);
                    await finalizeContractAfterConversion(orderId);
                    return;
                }
                setNegotiation(latestNegotiation);
            }
        } catch (err) {
            console.error("Error fetching negotiation:", err);
        } finally {
            setNegotiationLoading(false);
        }
    };

    // Start a new negotiation
    const handleStartNegotiation = async () => {
        const order = orders[0];
        if (!order) return;
        setStartNegLoading(true);
        const result = await NegotiationService.startNegotiation({
            orderId: order.id,
            caregiverId: userId,
            gigId: order.gigId || undefined,
            createdByRole: 'Caregiver',
            caregiverProposedTasks: negInitTasks,
            caregiverProposedSchedule: negInitSchedule,
            additionalNotes: negInitNotes || undefined,
            openingNote: negInitNote || undefined,
        });
        if (result.success) {
            setNegotiation(result.data);
            setShowStartNegModal(false);
            toast.success("Negotiation started! The client has been notified.");
        } else {
            toast.error(result.error || "Failed to start negotiation.");
        }
        setStartNegLoading(false);
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

    // ---- Flow B: Caregiver actions on client-initiated contracts ----
    const [caregiverReviewComments, setCaregiverReviewComments] = useState("");
    const [caregiverRejectReason, setCaregiverRejectReason] = useState("");

    const handleCaregiverApprove = async () => {
        if (!contract?.id) return;
        // Use existing schedule from contract or require caregiver to confirm it
        const schedule = contract.schedule || [];
        if (schedule.length === 0) {
            toast.error("Schedule is required. Please request changes if no schedule was provided.");
            return;
        }
        setContractActionLoading(true);
        const result = await ContractService.caregiverApproveContract(contract.id, { schedule });
        if (result.success) {
            setContract(result.data);
            toast.success("Contract approved! It is now active.");
        } else {
            toast.error(result.error || "Failed to approve contract.");
        }
        setContractActionLoading(false);
    };

    const handleCaregiverRequestReview = async () => {
        if (!contract?.id) return;
        if (!caregiverReviewComments.trim()) {
            toast.error("Please provide comments about what needs changing.");
            return;
        }
        setContractActionLoading(true);
        const result = await ContractService.caregiverRequestReview(contract.id, {
            reviewComments: caregiverReviewComments
        });
        if (result.success) {
            setContract(result.data);
            setCaregiverReviewComments("");
            setIsModalOpen(false);
            setModalType("");
            toast.success("Review request sent to client.");
        } else {
            toast.error(result.error || "Failed to request review.");
        }
        setContractActionLoading(false);
    };

    const handleCaregiverReject = async () => {
        if (!contract?.id) return;
        setContractActionLoading(true);
        const result = await ContractService.caregiverRejectContract(contract.id, caregiverRejectReason);
        if (result.success) {
            setContract(result.data);
            setCaregiverRejectReason("");
            setIsModalOpen(false);
            setModalType("");
            toast.success("Contract rejected.");
        } else {
            toast.error(result.error || "Failed to reject contract.");
        }
        setContractActionLoading(false);
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

    const handleDownloadContractPdf = async () => {
        if (!contract?.id) return;
        setPdfDownloading(true);
        try {
            const authToken = localStorage.getItem("authToken");
            const response = await fetch(`${config.BASE_URL}/contracts/${contract.id}/pdf`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            if (!response.ok) throw new Error("Failed to download PDF");
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `contract-${contract.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            toast.error("Failed to download contract PDF.");
        }
        setPdfDownloading(false);
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

    const order = orders.length > 0 ? orders[0] : null;
    const cStatus = contract?.status?.toLowerCase().replace(/\s+/g, '') || '';
    const isTasksReady = cStatus === 'approved' || cStatus === 'active' || cStatus === 'completed';

    const bannerTitle = (() => {
        if (isTasksReady) return 'Task Tracker';
        if (!contract && !negotiation) return 'Generate Contract';
        if (!contract && negotiation) return 'Negotiation In Progress';
        if (cStatus === 'pendingcaregiverapproval') return 'Generate Contract';
        if (cStatus === 'pendingclientapproval' || cStatus === 'revised') return 'Awaiting Client Approval';
        if (cStatus === 'clientreviewrequested') return 'Revision Requested';
        if (cStatus === 'caregiverreviewrequested') return 'Revision Pending';
        if (cStatus === 'clientrejected' || cStatus === 'caregiverrejected') return 'Contract Rejected';
        if (cStatus === 'terminated') return 'Contract Terminated';
        return 'Generate Contract';
    })();

    const bannerSubtitle = (() => {
        if (isTasksReady) return 'Track your progress and give your client real time updates.';
        if (!contract) return 'Provide all the necessary information that the caregiver needs';
        if (cStatus === 'pendingcaregiverapproval') return 'Provide all the necessary information that the caregiver needs';
        if (cStatus === 'pendingclientapproval' || cStatus === 'revised') return 'Your contract has been sent to the client for approval';
        if (cStatus === 'clientreviewrequested') return 'The client has requested changes to the contract';
        if (cStatus === 'caregiverreviewrequested') return 'Waiting for client to revise the contract';
        if (cStatus === 'clientrejected' || cStatus === 'caregiverrejected') return 'This contract has been rejected';
        if (cStatus === 'terminated') return 'This contract has been terminated';
        if (cStatus === 'completed') return 'This order has been completed';
        return 'Provide all the necessary information that the caregiver needs';
    })();

    if (loading) return <div className="cod-loading"><div className="cod-spinner" /><p>Loading order details...</p></div>;
    if (error) return <div className="cod-error-page"><p>{error}</p><button className="cod-retry-btn" onClick={() => window.location.reload()}>Retry</button></div>;

    return (
        <div className="cod-page">
            {/* ── Banner ── */}
            <div className="marketplace-banner cod-banner">
                <div className="marketplace-banner-content">
                    <button className="cod-back-btn" onClick={() => navigate(-1)}>Back</button>
                    <h1 className="marketplace-banner-title">{bannerTitle}</h1>
                </div>
                <p className="cod-banner-subtitle">{bannerSubtitle}</p>
            </div>

            <div className="cod-body">
                {/* ── Left column ── */}
                <div className="cod-left">
                    {isTasksReady ? (
                        /* Tasks view */
                        <div className="cod-tasks-panel">
                            {order ? <TaskSheetTabs order={order} /> : <p>No tasks available.</p>}
                        </div>
                    ) : (
                        /* Contract flow view */
                        <div className="cod-contract-panel">
                            {(contractLoading || contractFinalizing) ? (
                                <div className="cod-contract-state">
                                    <div className="cod-spinner" />
                                    <p>{contractFinalizing ? 'Finalizing contract...' : 'Loading contract information...'}</p>
                                </div>
                            ) : contract ? (() => {
                                const isClientInitiated = ContractService.isClientInitiated(contract);

                                if (cStatus === 'pendingcaregiverapproval') {
                                    const actions = ContractService.getCaregiverClientInitiatedActions(contract);
                                    return (
                                        <div className="cod-contract-state">
                                            <div className="cod-contract-icon">📩</div>
                                            <h2>Contract Received</h2>
                                            <p className="cod-contract-note">
                                                Review this contract and give your feedback.
                                            </p>
                                            <p className="cod-contract-disclaimer">
                                                Note: Approving this contract means you have gone through this contract and are satisfied with the details
                                                provided by the client. You are only allowed to make changes to the "Task List" and you can only Review
                                                this contract once, therefore if anything feels unclear in this contract, kindly message {order?.clientName || 'the client'} to clarify
                                                things further.
                                            </p>
                                            <div className="cod-contract-actions">
                                                <button className="cod-btn cod-btn--review" onClick={() => openModal("contract")}>
                                                    Review Contract
                                                </button>
                                                <button className="cod-btn cod-btn--approve" onClick={handleCaregiverApprove} disabled={contractActionLoading}>
                                                    {contractActionLoading ? 'Processing...' : 'Approve Contract'}
                                                </button>
                                            </div>
                                            {actions.canRequestReview && (
                                                <button className="cod-btn cod-btn--outline cod-btn--full" onClick={() => { setModalType("caregiverReview"); setIsModalOpen(true); }}>
                                                    Request Changes
                                                </button>
                                            )}
                                            {actions.canReject && (
                                                <button className="cod-btn cod-btn--danger cod-btn--full" onClick={() => { setModalType("caregiverReject"); setIsModalOpen(true); }}>
                                                    Reject Contract
                                                </button>
                                            )}
                                        </div>
                                    );
                                }

                                if (cStatus === 'pendingclientapproval' || cStatus === 'revised') {
                                    return (
                                        <div className="cod-contract-state">
                                            <div className="cod-contract-icon">⏳</div>
                                            <h2>Awaiting Client Approval</h2>
                                            <p className="cod-contract-note">Your contract has been sent. Waiting for the client to review and approve it.</p>
                                            <div className="cod-contract-actions">
                                                <button className="cod-btn cod-btn--outline" onClick={() => openModal("contract")}>View Contract Details</button>
                                            </div>
                                        </div>
                                    );
                                }

                                if (cStatus === 'clientreviewrequested') {
                                    return (
                                        <div className="cod-contract-state">
                                            <div className="cod-contract-icon">🔄</div>
                                            <h2>Client Requested Changes</h2>
                                            <p className="cod-contract-note">The client has requested revisions to the contract.</p>
                                            {contract.clientReviewComments && (
                                                <div className="cod-feedback-box">
                                                    <strong>Client&apos;s feedback:</strong>
                                                    <p>&ldquo;{contract.clientReviewComments}&rdquo;</p>
                                                </div>
                                            )}
                                            <div className="cod-contract-actions">
                                                <button className="cod-btn cod-btn--outline" onClick={() => openModal("contract")}>View Details</button>
                                                <button className="cod-btn cod-btn--review" onClick={() => openModal("revise")}>Revise Contract</button>
                                            </div>
                                        </div>
                                    );
                                }

                                if (cStatus === 'caregiverreviewrequested') {
                                    return (
                                        <div className="cod-contract-state">
                                            <div className="cod-contract-icon">🔄</div>
                                            <h2>Waiting for Client Revision</h2>
                                            <p className="cod-contract-note">You requested changes. The client is revising the contract.</p>
                                            <div className="cod-contract-actions">
                                                <button className="cod-btn cod-btn--outline" onClick={() => openModal("contract")}>View Contract</button>
                                            </div>
                                        </div>
                                    );
                                }

                                if (cStatus === 'clientrejected') {
                                    return (
                                        <div className="cod-contract-state">
                                            <div className="cod-contract-icon">❌</div>
                                            <h2>Contract Rejected</h2>
                                            <p className="cod-contract-note">The client has rejected this contract.</p>
                                            <div className="cod-contract-actions">
                                                <button className="cod-btn cod-btn--outline" onClick={() => openModal("contract")}>View Contract Details</button>
                                            </div>
                                        </div>
                                    );
                                }

                                if (cStatus === 'caregiverrejected') {
                                    return (
                                        <div className="cod-contract-state">
                                            <div className="cod-contract-icon">❌</div>
                                            <h2>Contract Rejected</h2>
                                            <p className="cod-contract-note">You rejected this contract.</p>
                                            <div className="cod-contract-actions">
                                                <button className="cod-btn cod-btn--outline" onClick={() => openModal("contract")}>View Contract Details</button>
                                            </div>
                                        </div>
                                    );
                                }

                                if (cStatus === 'terminated') {
                                    return (
                                        <div className="cod-contract-state">
                                            <div className="cod-contract-icon">🚫</div>
                                            <h2>Contract Terminated</h2>
                                            <p className="cod-contract-note">This contract has been terminated.</p>
                                            <div className="cod-contract-actions">
                                                <button className="cod-btn cod-btn--outline" onClick={() => openModal("contract")}>View Contract Details</button>
                                            </div>
                                        </div>
                                    );
                                }

                                // Fallback – any other contract state
                                return (
                                    <div className="cod-contract-state">
                                        <div className="cod-contract-icon">📋</div>
                                        <h2>Contract: {ContractService.getStatusDisplayInfo(contract.status).label}</h2>
                                        <p className="cod-contract-note">Contract is being processed.</p>
                                        <div className="cod-contract-actions">
                                            <button className="cod-btn cod-btn--outline" onClick={() => openModal("contract")}>View Contract Details</button>
                                        </div>
                                    </div>
                                );
                            })() : (
                                /* No contract yet – negotiation or start */
                                <div className="cod-contract-state">
                                    {negotiationLoading ? (
                                        <>
                                            <div className="cod-spinner" />
                                            <p>Loading negotiation...</p>
                                        </>
                                    ) : negotiation ? (
                                        <NegotiationPanel
                                            key={negotiation.id + "-" + negotiation.negotiationRound}
                                            negotiation={negotiation}
                                            role="caregiver"
                                            order={order}
                                            onNegotiationUpdate={(updated) => setNegotiation(updated)}
                                            onContractCreated={async () => {
                                                return await finalizeContractAfterConversion(orderId);
                                            }}
                                        />
                                    ) : (order?.transactionId || order?.paymentTransactionId) ? (
                                        <>
                                            <div className="cod-contract-icon">📋</div>
                                            <h2>No Contract Yet</h2>
                                            <p className="cod-contract-note">
                                                Agree on tasks, schedule, and service details with your client before generating the contract.
                                                Both parties must confirm agreement first.
                                            </p>
                                            <div className="cod-contract-actions">
                                                <button className="cod-btn cod-btn--review" onClick={() => setShowStartNegModal(true)}>
                                                    🤝 Start Negotiation
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="cod-contract-icon">⏳</div>
                                            <h2>Waiting for Payment</h2>
                                            <p className="cod-contract-note">Waiting for client payment before negotiation can begin.</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Right column: Order Details ── */}
                <div className="cod-right">
                    {order && (
                        <div className="cod-order-sidebar">
                            <h3 className="cod-sidebar-heading">Order Details</h3>
                            <div className="cod-sidebar-img-wrap">
                                <img src={order.gigImage || 'https://via.placeholder.com/300x180?text=No+Image'} alt={order.gigTitle} className="cod-sidebar-img" />
                            </div>
                            <h4 className="cod-sidebar-title">{order.gigTitle}</h4>

                            {/* Order Detail */}
                            <div className="cod-detail-section">
                                <h5 className="cod-detail-label">Order Detail</h5>
                                <div className="cod-detail-row">
                                    <span>Ordered from:</span>
                                    <span className="cod-detail-value">
                                        <span className="cod-client-avatar-sm">{order.clientName?.split(' ').map(n => n[0]).join('').slice(0,2)}</span>
                                        {order.clientName}
                                    </span>
                                </div>
                                <div className="cod-detail-row">
                                    <span>Order amount:</span>
                                    <span className="cod-detail-value"><strong>₦{Number(order.amount || 0).toLocaleString()}</strong></span>
                                </div>
                                <div className="cod-detail-row">
                                    <span>Order number:</span>
                                    <span className="cod-detail-value">#{order.id?.slice(-8)}</span>
                                </div>
                                {order.orderCreatedOn && (
                                    <>
                                        <div className="cod-detail-row">
                                            <span>Order Date:</span>
                                            <span className="cod-detail-value">{new Date(order.orderCreatedOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                        <div className="cod-detail-row">
                                            <span>Order Time:</span>
                                            <span className="cod-detail-value">{new Date(order.orderCreatedOn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Service Detail */}
                            <div className="cod-detail-section">
                                <h5 className="cod-detail-label">Service Detail</h5>
                                {order.serviceGroup && (
                                    <div className="cod-detail-row">
                                        <span>Service Group:</span>
                                        <span className="cod-detail-value">{order.serviceGroup}</span>
                                    </div>
                                )}
                                {order.serviceType && (
                                    <div className="cod-detail-row">
                                        <span>Service Type:</span>
                                        <span className="cod-detail-value">{order.serviceType}</span>
                                    </div>
                                )}
                                <div className="cod-detail-row">
                                    <span>Service Package Type:</span>
                                    <span className="cod-detail-value">{order.gigPackageType || 'Basic'}</span>
                                </div>
                                <div className="cod-detail-row">
                                    <span>Service Mode:</span>
                                    <span className="cod-detail-value">{order.paymentOption === 'monthly' ? 'Monthly' : 'One-time'}</span>
                                </div>
                                {order.billingCycleNumber > 0 && (
                                    <div className="cod-detail-row">
                                        <span>Billing Cycle:</span>
                                        <span className="cod-detail-value">Cycle {order.billingCycleNumber}</span>
                                    </div>
                                )}
                            </div>

                            {/* Schedule Details — from contract data when available */}
                            {contract && (cStatus === 'approved' || cStatus === 'active' || cStatus === 'completed') && (
                                <div className="cod-detail-section">
                                    <h5 className="cod-detail-label">Schedule Details</h5>
                                    {contract.selectedPackage?.priorityLevel && (
                                        <div className="cod-detail-row">
                                            <span>Priority:</span>
                                            <span className="cod-detail-value">{contract.selectedPackage.priorityLevel}</span>
                                        </div>
                                    )}
                                    {contract.contractStartDate && (
                                        <div className="cod-detail-row">
                                            <span>Delivery Date:</span>
                                            <span className="cod-detail-value">{new Date(contract.contractStartDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                    )}
                                    {contract.schedule && contract.schedule.length > 0 && (
                                        <div className="cod-detail-row">
                                            <span>Delivery Time:</span>
                                            <span className="cod-detail-value">
                                                {ContractService.formatTimeForDisplay(contract.schedule[0].startTime)} – {ContractService.formatTimeForDisplay(contract.schedule[0].endTime)}
                                            </span>
                                        </div>
                                    )}
                                    {contract.serviceAddress && (
                                        <div className="cod-detail-row">
                                            <span>Service Address:</span>
                                            <span className="cod-detail-value">{contract.serviceAddress}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Fund status for completed orders */}
                            {order.clientOrderStatus === 'Completed' && (() => {
                                const isReleased = order.isOrderStatusApproved;
                                const isDisputed = order.hasDispute;
                                return (
                                    <div className="cod-fund-status">
                                        {isDisputed ? (
                                            <span className="cod-fund-disputed">⚠️ Funds on hold — active dispute</span>
                                        ) : isReleased ? (
                                            <span className="cod-fund-released">✅ Order Approved</span>
                                        ) : (
                                            <span className="cod-fund-pending">⏳ Funds release per visit — approved visits credit your wallet</span>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Action buttons — hidden when order is completed and approved */}
                            {!(order.clientOrderStatus === 'Completed' && order.isOrderStatusApproved) && (
                                <div className="cod-sidebar-actions">
                                    <button className="cod-btn cod-btn--cancel" onClick={() => openModal("contact")}>
                                        Cancel Order
                                    </button>
                                    <button className="cod-btn cod-btn--report" onClick={() => {
                                        if (order.clientId) {
                                            toast.info("Report functionality coming soon.");
                                        }
                                    }}>
                                        ⚠ Report {order.clientName?.split(' ')[0] || 'Client'}
                                    </button>
                                </div>
                            )}

                            {/* Support */}
                            <div className="cod-support">
                                <h5 className="cod-detail-label">Support</h5>
                                <a href="https://wa.me/2348131952778" target="_blank" rel="noopener noreferrer" className="cod-support-item">
                                    <div className="cod-support-icon">📞</div>
                                    <div>
                                        <strong>Resolution Center</strong>
                                        <span>Resolve order issues</span>
                                    </div>
                                    <span className="cod-support-arrow">›</span>
                                </a>
                                <div className="cod-support-item" onClick={handlingFaq} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') handlingFaq(); }}>
                                    <div className="cod-support-icon">❓</div>
                                    <div>
                                        <strong>FAQs</strong>
                                        <span>Find needed answers</span>
                                    </div>
                                    <span className="cod-support-arrow">›</span>
                                </div>
                            </div>
                        </div>
                    )}
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
                                <div className="contract-modal-header">
                                    <h3>Contract Details</h3>
                                    <button className="contract-modal-close-btn" onClick={closeModal}>✕</button>
                                </div>
                                <div className="contract-modal-body">
                                <div className="contract-details-modal">
                                    <div className="contract-header">
                                        <p><strong>Contract ID:</strong> {contract.id}</p>
                                        <p><strong>Initiated By:</strong> {contract.initiatedByRole || 'Caregiver'}</p>
                                        <p><strong>Status:</strong> <span className={`status-${contract.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                                            {ContractService.getStatusDisplayInfo(contract.status).label}
                                        </span></p>
                                        <p><strong>Negotiation Round:</strong> {contract.negotiationRound || 1}</p>
                                    </div>
                                    
                                    {/* Schedule Section — contract.schedule for old flow, agreedSchedule for negotiation-generated contracts */}
                                    {(() => {
                                        const _slots = contract.schedule?.length > 0 ? contract.schedule : contract.agreedSchedule;
                                        return _slots?.length > 0 ? (
                                            <div className="contract-schedule">
                                                <h4>📅 Service Schedule</h4>
                                                <div className="schedule-display">
                                                    {_slots.map((visit, idx) => (
                                                        <div key={idx} className="schedule-visit">
                                                            <span className="schedule-day">{visit.dayOfWeek}</span>
                                                            <span className="schedule-time">{ContractService.formatTimeForDisplay(visit.startTime)} - {ContractService.formatTimeForDisplay(visit.endTime)}</span>
                                                            <span className="schedule-duration">{ContractService.calculateVisitDuration(visit.startTime, visit.endTime)}hrs</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null;
                                    })()}

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
                                        {!contract.caregiverAdditionalNotes && contract.additionalNotes && (
                                            <p><strong>Additional Notes:</strong> {contract.additionalNotes}</p>
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

                                    {/* Tasks — complex objects for old flow; agreedTasks strings for negotiation-generated contracts */}
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
                                    {!contract.tasks?.length && contract.agreedTasks?.length > 0 && (
                                        <div className="contract-tasks">
                                            <h4>📝 Agreed Tasks</h4>
                                            <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
                                                {contract.agreedTasks.map((task, idx) => (
                                                    <li key={idx} style={{ marginBottom: '4px' }}>{task}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* NEW — Proposed Tasks in contract modal */}
                                    {contract.proposedTasks && contract.proposedTasks.length > 0 && (
                                        <ProposedTasksList
                                            proposedTasks={contract.proposedTasks}
                                            userRole="Caregiver"
                                            showActions={false}
                                        />
                                    )}

                                    {contract.generatedTerms && (
                                        <div className="contract-terms">
                                            <iframe
                                                srcDoc={contract.generatedTerms}
                                                sandbox="allow-same-origin"
                                                style={{ width: '100%', minHeight: '600px', border: 'none', borderRadius: '6px' }}
                                                title="Contract Document"
                                            />
                                        </div>
                                    )}

                                    {/* PDF Download */}
                                    <div className="contract-pdf-download">
                                        <button
                                            className="contract-pdf-btn"
                                            onClick={handleDownloadContractPdf}
                                            disabled={pdfDownloading}
                                        >
                                            {pdfDownloading ? "Downloading..." : "⬇ Download Contract PDF"}
                                        </button>
                                    </div>
                                </div>
                                </div>
                            </>
                        )}

                        {modalType === "caregiverReview" && (
                            <>
                                <div className="contract-modal-header">
                                    <h3>Request Changes</h3>
                                    <button className="contract-modal-close-btn" onClick={closeModal}>✕</button>
                                </div>
                                <div className="contract-modal-body">
                                    <p style={{ marginBottom: '12px', color: '#555' }}>
                                        Let the client know what needs to change. They will revise and resubmit the contract.
                                    </p>
                                    <textarea
                                        placeholder="Describe what changes you'd like (e.g., schedule adjustments, task modifications)..."
                                        value={caregiverReviewComments}
                                        onChange={(e) => setCaregiverReviewComments(e.target.value)}
                                        rows="5"
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', resize: 'vertical' }}
                                    />
                                    <div className="modal-actions" style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                                        <button
                                            className="request-changes-btn"
                                            onClick={handleCaregiverRequestReview}
                                            disabled={contractActionLoading || !caregiverReviewComments.trim()}
                                        >
                                            {contractActionLoading ? 'Sending...' : 'Send Review Request'}
                                        </button>
                                        <button onClick={closeModal}>Cancel</button>
                                    </div>
                                </div>
                            </>
                        )}

                        {modalType === "caregiverReject" && (
                            <>
                                <div className="contract-modal-header">
                                    <h3>Reject Contract</h3>
                                    <button className="contract-modal-close-btn" onClick={closeModal}>✕</button>
                                </div>
                                <div className="contract-modal-body">
                                    <p style={{ marginBottom: '12px', color: '#d32f2f' }}>
                                        Are you sure you want to reject this contract? This action cannot be undone.
                                    </p>
                                    <textarea
                                        placeholder="Reason for rejection (optional)..."
                                        value={caregiverRejectReason}
                                        onChange={(e) => setCaregiverRejectReason(e.target.value)}
                                        rows="4"
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', resize: 'vertical' }}
                                    />
                                    <div className="modal-actions" style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                                        <button
                                            className="reject-contract-btn"
                                            onClick={handleCaregiverReject}
                                            disabled={contractActionLoading}
                                            style={{ background: '#d32f2f', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}
                                        >
                                            {contractActionLoading ? 'Rejecting...' : 'Reject Contract'}
                                        </button>
                                        <button onClick={closeModal}>Cancel</button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Start Negotiation Modal */}
            {showStartNegModal && (
                <div className="neg-start-modal-overlay">
                    <div className="neg-start-modal">
                        <div className="neg-start-modal-header">
                            <h3>🤝 Start Negotiation</h3>
                            <button className="neg-start-modal-close" onClick={() => setShowStartNegModal(false)}>✕</button>
                        </div>
                        <div className="neg-start-modal-body">
                            <p className="neg-instructions">
                                Propose your schedule and tasks for this service. The client will review, add their own proposals, and both of you will agree before the contract is generated.
                            </p>

                            {/* Initial tasks */}
                            <div className="neg-section">
                                <div className="neg-section-label">Proposed Tasks</div>
                                <ul className="neg-task-list">
                                    {negInitTasks.map((t, i) => (
                                        <li key={i} className="neg-task-item">
                                            <span>• {t}</span>
                                            <button className="neg-remove-btn" onClick={() => setNegInitTasks(prev => prev.filter((_,idx) => idx !== i))}>✕</button>
                                        </li>
                                    ))}
                                </ul>
                                <div className="neg-add-row">
                                    <input
                                        className="neg-input"
                                        type="text"
                                        placeholder="Add a task and press Enter…"
                                        value={negInitNewTask}
                                        onChange={e => setNegInitNewTask(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && negInitNewTask.trim()) {
                                                setNegInitTasks(prev => [...prev, negInitNewTask.trim()]);
                                                setNegInitNewTask('');
                                            }
                                        }}
                                    />
                                    <button className="neg-btn neg-btn--sm" onClick={() => {
                                        if (negInitNewTask.trim()) {
                                            setNegInitTasks(prev => [...prev, negInitNewTask.trim()]);
                                            setNegInitNewTask('');
                                        }
                                    }}>Add</button>
                                </div>
                            </div>

                            {/* Initial schedule */}
                            <div className="neg-section">
                                <div className="neg-section-label">Proposed Schedule</div>
                                {/* Schedule guide banner */}
                                {(() => {
                                    const payOpt = (order?.serviceType || order?.paymentOption || '').toLowerCase();
                                    const reqDays = payOpt !== 'monthly' ? 1
                                        : (order?.frequencyPerWeek || order?.visitsPerWeek || order?.selectedPackage?.visitsPerWeek || order?.packageDetails?.visitsPerWeek || 1);
                                    const uniqueDays = new Set(negInitSchedule.map(s => s.dayOfWeek)).size;
                                    const done = uniqueDays >= reqDays;
                                    return reqDays > 0 ? (
                                        <div className={`neg-schedule-guide ${done ? 'neg-schedule-guide--done' : ''}`}>
                                            <div className="neg-schedule-guide-text">
                                                <strong>\uD83D\uDCC5 {reqDays} {reqDays === 1 ? 'day' : 'days'} per week required</strong>
                                                <span>This contract is for {reqDays} visit{reqDays > 1 ? 's' : ''}/week. Add a time slot for each day.</span>
                                            </div>
                                            <span className={`neg-schedule-counter ${done ? 'neg-schedule-counter--done' : 'neg-schedule-counter--pending'}`}>
                                                {uniqueDays} / {reqDays}
                                            </span>
                                        </div>
                                    ) : null;
                                })()}
                                <div className="neg-schedule-list">
                                    {negInitSchedule.map((s, i) => (
                                        <div key={i} className="neg-schedule-slot">
                                            <span className="neg-slot-day">{s.dayOfWeek}</span>
                                            <span className="neg-slot-time">{s.startTime} – {s.endTime}</span>
                                            <button className="neg-remove-btn" onClick={() => setNegInitSchedule(prev => prev.filter((_,idx) => idx !== i))}>✕</button>
                                        </div>
                                    ))}
                                </div>
                                <div className="neg-add-slot-form" style={{ marginTop: '8px' }}>
                                    <select className="neg-select" value={negInitSlotDay} onChange={e => setNegInitSlotDay(e.target.value)}>
                                        {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d => <option key={d}>{d}</option>)}
                                    </select>
                                    <input className="neg-input neg-input--time" type="time" value={negInitSlotStart} onChange={e => setNegInitSlotStart(e.target.value)} />
                                    <span className="neg-time-sep">to</span>
                                    <input className="neg-input neg-input--time" type="time" value={negInitSlotEnd} onChange={e => setNegInitSlotEnd(e.target.value)} />
                                    <button className="neg-btn neg-btn--sm" onClick={() => {
                                        if (negInitSlotStart >= negInitSlotEnd) { toast.error('End time must be after start time.'); return; }
                                        const _payOpt = (order?.serviceType || order?.paymentOption || '').toLowerCase();
                                        const _reqDays = _payOpt !== 'monthly' ? 1 : (order?.frequencyPerWeek || order?.visitsPerWeek || order?.selectedPackage?.visitsPerWeek || order?.packageDetails?.visitsPerWeek || 1);
                                        if (negInitSchedule.length >= _reqDays) {
                                            toast.error(`You can only add ${_reqDays} day${_reqDays > 1 ? 's' : ''} for this contract. Remove a slot first to change it.`);
                                            return;
                                        }
                                        if (negInitSchedule.some(s => s.dayOfWeek === negInitSlotDay)) {
                                            toast.error(`You already have a slot for ${negInitSlotDay}. Remove it first to change the time.`);
                                            return;
                                        }
                                        setNegInitSchedule(prev => [...prev, { dayOfWeek: negInitSlotDay, startTime: negInitSlotStart, endTime: negInitSlotEnd }]);
                                    }}>Add</button>
                                </div>
                            </div>

                            {/* Note about service address */}
                            <div className="neg-section">
                                <p style={{ fontSize: '13px', color: '#888', fontStyle: 'italic', margin: '0 0 8px' }}>
                                    📍 The client will provide the service address and access instructions.
                                </p>
                                <label className="neg-label">Additional Notes</label>
                                <textarea className="neg-textarea" rows="2" value={negInitNotes} onChange={e => setNegInitNotes(e.target.value)} placeholder="Any other details for the client…" />
                                <label className="neg-label">Opening Message to Client (Optional)</label>
                                <textarea className="neg-textarea" rows="2" value={negInitNote} onChange={e => setNegInitNote(e.target.value)} placeholder={`e.g. "I'm available on these days and can cover all tasks in the gig package…"`} />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                                <button className="neg-btn neg-btn--submit" onClick={() => {
                                    const payOpt = (order?.serviceType || order?.paymentOption || '').toLowerCase();
                                    const reqDays = payOpt !== 'monthly' ? 1
                                        : (order?.frequencyPerWeek || order?.visitsPerWeek || order?.selectedPackage?.visitsPerWeek || order?.packageDetails?.visitsPerWeek || 1);
                                    const uniqueDays = new Set(negInitSchedule.map(s => s.dayOfWeek)).size;
                                    if (uniqueDays < reqDays) {
                                        toast.error(`Please add schedule slots for ${reqDays} day${reqDays > 1 ? 's' : ''} before starting. You have ${uniqueDays} of ${reqDays}.`);
                                        return;
                                    }
                                    handleStartNegotiation();
                                }} disabled={startNegLoading} style={{ flex: 1 }}>
                                    {startNegLoading ? 'Starting…' : '🤝 Start Negotiation'}
                                </button>
                                <button className="neg-btn neg-btn--ghost" onClick={() => setShowStartNegModal(false)}>Cancel</button>
                            </div>
                        </div>
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
