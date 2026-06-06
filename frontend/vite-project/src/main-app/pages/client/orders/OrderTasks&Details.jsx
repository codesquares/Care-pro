import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createNotification } from "../../../services/notificationService";
import ContractService from "../../../services/contractService";
import NegotiationService from "../../../services/negotiationService";
import NegotiationPanel from "../../../components/negotiations/NegotiationPanel";
import "../../../components/negotiations/NegotiationPanel.css";
import VisitCheckinService from "../../../services/visitCheckinService";
import OrderTasksService from "../../../services/orderTasksService";
import ClientOrderService from "../../../services/clientOrderService";
import DisputeService from "../../../services/disputeService";
import TaskSheetService from "../../../services/taskSheetService";
import CreateOrderTasksModal from "../../../components/modals/CreateOrderTasksModal";
import ClientVisitTabs from "../../../components/task-sheets/ClientVisitTabs";
import AddressInput from "../../../components/AddressInput";
import ProposedTasksList from "../../../components/task-proposals/ProposedTasksList";
import TaskProposalForm from "../../../components/task-proposals/TaskProposalForm";
import config from "../../../config"; // Centralized API configuration
import "../client-dashboard/marketplaceHero.css";
import "../../care-giver/orders/CaregiverOrderDetails.css";
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
    const [disputeCategory, setDisputeCategory] = useState("");
    const [orderDisputes, setOrderDisputes] = useState([]);
    const [rating, setRating] = useState(0);
    const [reviewComment, setReviewComment] = useState("");
    const [isReviewSubmitted, setIsReviewSubmitted] = useState(false);
    const [checkingReviewStatus, setCheckingReviewStatus] = useState(false);
    
    // Contract-related state (NEW FLOW - Client approves contracts from caregiver)
    const [contract, setContract] = useState(null);
    const [contractActionLoading, setContractActionLoading] = useState(false);
    const [contractError, setContractError] = useState(null);
    const [pdfDownloading, setPdfDownloading] = useState(false);

    const [checkingContract, setCheckingContract] = useState(false);

    // Negotiation state
    const [negotiation, setNegotiation] = useState(null);
    const [negotiationLoading, setNegotiationLoading] = useState(false);

    // Re-fetch negotiation when the caregiver submits their proposals (SignalR notification)
    const latestNotification = useSelector((state) => state.notifications.notifications[0]);
    useEffect(() => {
        if (!latestNotification || !negotiation) return;
        // Notifications use `type` (both SignalR real-time and REST API responses).
        // `notificationType` is kept as fallback for any legacy payloads.
        const t = (latestNotification.type || latestNotification.notificationType || "").toLowerCase().replace(/[\s-]+/g, "_");
        if (
            (t === "negotiation_client_submitted" || t === "negotiation_caregiver_submitted") &&
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

    // Start-negotiation modal state
    const [showStartNegModal, setShowStartNegModal] = useState(false);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isModalOpen || showStartNegModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isModalOpen, showStartNegModal]);
    const [negInitTasks, setNegInitTasks] = useState([]);
    const [negInitSchedule, setNegInitSchedule] = useState([]);
    const [negInitAddress, setNegInitAddress] = useState("");
    const [negInitAccessInstructions, setNegInitAccessInstructions] = useState("");
    const [negInitGeoCoords, setNegInitGeoCoords] = useState(null);
    const [negInitRequirements, setNegInitRequirements] = useState("");
    const [negInitNotes, setNegInitNotes] = useState("");
    const [negInitNote, setNegInitNote] = useState("");
    const [negInitStartDate, setNegInitStartDate] = useState("");
    const [negInitNewTask, setNegInitNewTask] = useState("");
    const [negInitSlotDay, setNegInitSlotDay] = useState("Monday");
    const [negInitSlotStart, setNegInitSlotStart] = useState("09:00");
    const [negInitSlotEnd, setNegInitSlotEnd] = useState("13:00");
    const [startNegLoading, setStartNegLoading] = useState(false);
    
    // Client contract action state
    const [reviewRequestComments, setReviewRequestComments] = useState("");
    const [reviewPreferredScheduleNotes, setReviewPreferredScheduleNotes] = useState("");
    const [rejectReason, setRejectReason] = useState("");
    const [showGpsPrompt, setShowGpsPrompt] = useState(false);
    const [capturingGps, setCapturingGps] = useState(false);

    // Post-approval GPS follow-up prompt
    const [showPostApprovalGpsPrompt, setShowPostApprovalGpsPrompt] = useState(false);
    const [postApprovalGpsCapturing, setPostApprovalGpsCapturing] = useState(false);

    // NEW — proposed tasks for contract review request
    const [reviewProposedTasks, setReviewProposedTasks] = useState([]);
    
    // Service address confirmation state (approval flow)
    const [approvalStep, setApprovalStep] = useState('address'); // 'address' | 'location'
    const [editedServiceAddress, setEditedServiceAddress] = useState('');
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [addressValidation, setAddressValidation] = useState(null);
    
    // OrderTasks-related state
    const [orderTasks, setOrderTasks] = useState(null);
    const [hasOrderTasks, setHasOrderTasks] = useState(false);
    const [checkingOrderTasks, setCheckingOrderTasks] = useState(false);
    const [showCreateOrderTasksModal, setShowCreateOrderTasksModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fund release state
    const [releasingFunds, setReleasingFunds] = useState(false);
    const [fundsReleased, setFundsReleased] = useState(false);

    // Task sheet completion tracking
    const [allTaskSheetsApproved, setAllTaskSheetsApproved] = useState(false);
    const [checkingTaskSheets, setCheckingTaskSheets] = useState(false);
    
    const userDetails = JSON.parse(localStorage.getItem("userDetails"));
    const userId = userDetails?.id;

    const navigate = useNavigate();

    // ---- Flow B: Client-initiated contract generation state ----
    const [showClientGenerateModal, setShowClientGenerateModal] = useState(false);
    const [clientGenServiceAddress, setClientGenServiceAddress] = useState('');
    const [clientGenAccessInstructions, setClientGenAccessInstructions] = useState('');
    const [clientGenSchedule, setClientGenSchedule] = useState([]);
    const [clientGenTasks, setClientGenTasks] = useState([]);
    const [clientGenRequirements, setClientGenRequirements] = useState('');
    const [clientGenNotes, setClientGenNotes] = useState('');
    const [clientGenLoading, setClientGenLoading] = useState(false);
    const [clientGenAddressCoords, setClientGenAddressCoords] = useState(null);

    // Flow B: Client revision state
    const [showClientReviseModal, setShowClientReviseModal] = useState(false);
    const [clientReviseAddress, setClientReviseAddress] = useState('');
    const [clientReviseGeoCoords, setClientReviseGeoCoords] = useState(null);
    const [clientReviseSchedule, setClientReviseSchedule] = useState([]);
    const [clientReviseTasks, setClientReviseTasks] = useState([]);
    const [clientReviseRequirements, setClientReviseRequirements] = useState('');
    const [clientReviseNotes, setClientReviseNotes] = useState('');
    const [clientReviseLoading, setClientReviseLoading] = useState(false);

    const handlingFaq = () => {
        navigate("/app/client/faq");
    }

    // ---- Flow B: Client generates contract ----
    const handleClientGenerateContract = async () => {
        const order = orders[0];
        if (!order) return;
        if (!clientGenServiceAddress.trim()) {
            toast.error("Service address is required.");
            return;
        }

        setClientGenLoading(true);
        const contractData = {
            orderId: order.id,
            caregiverId: order.caregiverId,
            gigId: order.gigId,
            serviceAddress: clientGenServiceAddress,
            accessInstructions: clientGenAccessInstructions,
            ...(clientGenAddressCoords && {
                serviceLatitude: clientGenAddressCoords.lat,
                serviceLongitude: clientGenAddressCoords.lng,
            }),
            ...(clientGenSchedule.length > 0 && { schedule: clientGenSchedule }),
            ...(clientGenTasks.length > 0 && { tasks: clientGenTasks }),
            specialClientRequirements: clientGenRequirements,
            additionalNotes: clientGenNotes,
        };

        const result = await ContractService.generateContractAsClient(contractData);
        if (result.success) {
            setContract(result.data);
            setShowClientGenerateModal(false);
            toast.success("Contract sent to caregiver for approval!");
            // Notify caregiver
            try {
                if (order.caregiverId && userId) {
                    await createNotification({
                        recipientId: order.caregiverId,
                        senderId: userId,
                        type: 'ContractPendingApproval',
                        relatedEntityId: order.id,
                        title: '📩 New contract to review',
                        content: `A client has sent you a contract for "${order.gigTitle || 'a service'}". Please review and respond.`
                    });
                }
            } catch (notifErr) {
                console.error("Failed to send contract notification:", notifErr);
            }
        } else {
            toast.error(result.error || "Failed to generate contract.");
        }
        setClientGenLoading(false);
    };

    // ---- Flow B: Client revises contract after caregiver review request ----
    const handleClientReviseContract = async () => {
        if (!contract?.id) return;
        setClientReviseLoading(true);

        const revisionData = {
            contractId: contract.id,
            ...(clientReviseAddress.trim() && { serviceAddress: clientReviseAddress }),
            ...(clientReviseGeoCoords && {
                serviceLatitude: clientReviseGeoCoords.lat,
                serviceLongitude: clientReviseGeoCoords.lng,
            }),
            ...(clientReviseSchedule.length > 0 && { schedule: clientReviseSchedule }),
            ...(clientReviseTasks.length > 0 && { tasks: clientReviseTasks }),
            specialClientRequirements: clientReviseRequirements,
            additionalNotes: clientReviseNotes,
        };

        const result = await ContractService.clientReviseContract(revisionData);
        if (result.success) {
            setContract(result.data);
            setShowClientReviseModal(false);
            toast.success("Revised contract sent to caregiver!");
            // Notify caregiver
            try {
                const order = orders[0];
                if (order?.caregiverId && userId) {
                    await createNotification({
                        recipientId: order.caregiverId,
                        senderId: userId,
                        type: 'ContractPendingApproval',
                        relatedEntityId: order.id,
                        title: '📩 Revised contract to review',
                        content: `The client has revised their contract for "${order.gigTitle || 'a service'}". Please review and respond.`
                    });
                }
            } catch (notifErr) {
                console.error("Failed to send revision notification:", notifErr);
            }
        } else {
            toast.error(result.error || "Failed to revise contract.");
        }
        setClientReviseLoading(false);
    };

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
        if (!orderId) return false;
        
        try {
            setCheckingContract(true);
            const result = await ContractService.checkExistingContract(orderId);
            
            if (result.success && result.hasContract) {
                setContract(result.data);
                return true;
            } else if (!result.success) {
                console.warn("Error checking existing contract:", result.error);
            }
        } catch (error) {
            console.error("Error checking existing contract:", error);
        } finally {
            setCheckingContract(false);
        }
        return false;
    };

    // Fetch negotiation for this order
    const fetchNegotiationForOrder = async (orderId) => {
        try {
            setNegotiationLoading(true);
            const result = await NegotiationService.getByOrderId(orderId);
            if (result.success) {
                setNegotiation(result.hasNegotiation ? result.data : null);
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
        const payload = {
            orderId: order.id,
            caregiverId: order.caregiverId,
            gigId: order.gigId || undefined,
            createdByRole: 'Client',
            clientProposedTasks: negInitTasks,
            clientProposedSchedule: negInitSchedule,
            serviceAddress: negInitAddress,
            accessInstructions: negInitAccessInstructions || undefined,
            specialClientRequirements: negInitRequirements || undefined,
            additionalNotes: negInitNotes || undefined,
            openingNote: negInitNote || undefined,
            agreedStartDate: negInitStartDate ? `${negInitStartDate}T00:00:00Z` : undefined,
            // Geocoded coordinates from Google Maps — used for caregiver check-in validation
            ...(negInitGeoCoords && {
                serviceLatitude: negInitGeoCoords.lat,
                serviceLongitude: negInitGeoCoords.lng,
            }),
        };
        const result = await NegotiationService.startNegotiation(payload);
        if (result.success) {
            setNegotiation(result.data);
            setShowStartNegModal(false);
            toast.success("Negotiation started! Your caregiver has been notified.");
        } else {
            toast.error(result.error || "Failed to start negotiation.");
        }
        setStartNegLoading(false);
    };

    // Check if all task sheets are generated and approved
    const checkAllTaskSheetsApproved = async (orderData) => {
        if (!orderData?.id) return;
        setCheckingTaskSheets(true);
        try {
            const result = await TaskSheetService.getSheetsByOrderId(orderData.id);
            if (result.success) {
                const sheets = result.sheets || [];
                const maxSheets = result.maxSheets ?? TaskSheetService.computeMaxSheets(orderData);
                const allApproved = sheets.length >= maxSheets
                    && maxSheets > 0
                    && sheets.every(s => s.clientReviewStatus === 'Approved');
                setAllTaskSheetsApproved(allApproved);
            } else {
                setAllTaskSheetsApproved(false);
            }
        } catch (err) {
            console.error('Error checking task sheet approval status:', err);
            setAllTaskSheetsApproved(false);
        } finally {
            setCheckingTaskSheets(false);
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

    // Download contract as PDF
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

    // Client approves contract
    const handleApproveContract = async (coords, confirmedAtAddress = false) => {
        if (!contract?.id) return;
        
        setContractActionLoading(true);
        try {
            const approveOptions = {};
            if (coords?.latitude != null) {
                approveOptions.serviceLatitude = coords.latitude;
                approveOptions.serviceLongitude = coords.longitude;
            }
            // Send the (possibly edited) service address
            const finalAddress = editedServiceAddress || contract.serviceAddress;
            if (finalAddress) {
                approveOptions.serviceAddress = finalAddress;
            }
            if (confirmedAtAddress) {
                approveOptions.confirmAtServiceAddress = true;
            }

            const result = await ContractService.clientApproveContract(contract.id, approveOptions);
            
            if (result.success) {
                setContract(result.data);
                toast.success("Contract approved! Your caregiver has been notified.");
                // Backend sends the caregiver notification internally on approval

                setIsModalOpen(false);
                setShowGpsPrompt(false);

                // If GPS was not stamped at approval time, prompt the client to set it now
                if (result.data?.serviceLocationSetByClient !== true) {
                    setShowPostApprovalGpsPrompt(true);
                }

                // Re-fetch order data to reflect any backend state changes after approval
                // This ensures the UI shows the correct order status
                try {
                    const token = localStorage.getItem('authToken');
                    const orderResponse = await axios.get(
                        `${config.BASE_URL}/ClientOrders/orderId?orderId=${orderId}`,
                        { headers: { 'Authorization': `Bearer ${token}` } }
                    );
                    const refreshedOrder = orderResponse.data;
                    setOrders([refreshedOrder]);

                    // Warn if the backend unexpectedly set the order to Completed
                    if (refreshedOrder.clientOrderStatus === 'Completed') {
                        console.warn(
                            '[BUG TRACE] Order status became "Completed" immediately after contract approval.',
                            'Contract ID:', contract.id,
                            'Order ID:', orderId,
                            'Order data:', refreshedOrder
                        );
                    }
                } catch (refreshErr) {
                    console.error("Failed to refresh order data after contract approval:", refreshErr);
                }
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
            await handleApproveContract(gps.coords, true);
        } else {
            toast.error(gps.error);
        }
    };

    const handleApproveWithoutGps = async () => {
        await handleApproveContract(null, false);
    };

    // Start the approval flow — initialize address state and show prompt
    const startApprovalFlow = () => {
        setEditedServiceAddress(contract?.serviceAddress || '');
        setIsEditingAddress(false);
        setApprovalStep('address');
        setShowGpsPrompt(true);
    };

    // Post-approval: client confirms they are at the service address and stamps GPS
    const handleSetPostApprovalGps = async () => {
        setPostApprovalGpsCapturing(true);
        const gps = await VisitCheckinService.getCurrentPosition();
        setPostApprovalGpsCapturing(false);

        if (!gps.success) {
            toast.error(gps.error);
            return;
        }
        if (gps.coords.accuracy > 200) {
            toast.error('GPS signal too weak. Move outdoors and try again.');
            return;
        }

        const result = await ContractService.setServiceLocation(contract.id, {
            latitude: gps.coords.latitude,
            longitude: gps.coords.longitude,
            accuracy: gps.coords.accuracy,
        });

        if (result.success) {
            setContract(prev => ({
                ...prev,
                serviceLocationSetByClient: true,
                serviceLocationSetAt: result.data?.setAt || new Date().toISOString(),
            }));
            setShowPostApprovalGpsPrompt(false);
            toast.success('Service location saved! Your caregiver will check in within 1500m of your location.');
        } else {
            toast.error(result.error || 'Failed to save location. Please try again.');
        }
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
                preferredScheduleNotes: reviewPreferredScheduleNotes,
                // NEW — include proposed tasks if any
                ...(reviewProposedTasks.length > 0 && {
                    proposedTasks: reviewProposedTasks
                })
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
                setReviewProposedTasks([]);
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
                
                // Check if contract exists for this order.
                // Only fetch the negotiation when no contract is present —
                // once a negotiation converts to a contract the backend returns
                // 404 for by-order negotiation lookups (expected, not an error).
                const contractFound = await checkExistingContract(orderId);
                if (!contractFound) {
                    await fetchNegotiationForOrder(orderId);
                }
                
                // Check if OrderTasks exist for this order
                await checkExistingOrderTasks(orderId);

                // Check if all task sheets are approved
                await checkAllTaskSheetsApproved(orderData);

                // Fetch disputes for this order
                await fetchOrderDisputes(orderId);
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

        if (modalType === "complete") {
            // Mark as completed — keep using old endpoint
            setIsSubmitting(true);
            try {
                const token = localStorage.getItem('authToken');
                await axios.put(
                    `${config.BASE_URL}/ClientOrders/UpdateClientOrderStatus/${orderId}`,
                    { clientOrderStatus: "Completed", userId },
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                toast.success("Order has been marked as Completed!");
                setIsModalOpen(false);
                try {
                    const response = await axios.get(
                        `${config.BASE_URL}/ClientOrders/orderId?orderId=${orderId}`,
                        { headers: { 'Authorization': `Bearer ${token}` } }
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
            return;
        }

        // Dispute — use new typed dispute API
        if (!reason?.trim()) {
            toast.error("Please provide a reason for the dispute.");
            return;
        }
        if (!disputeCategory) {
            toast.error("Please select a dispute category.");
            return;
        }

        setIsSubmitting(true);
        const result = await DisputeService.raiseDispute({
            orderId,
            taskSheetId: null,
            disputeType: "Order",
            category: disputeCategory,
            reason,
        });

        if (result.success) {
            toast.success("Dispute submitted! Our team will review it shortly.");
            setIsModalOpen(false);
            setReason("");
            setDisputeCategory("");
            // Refresh disputes and order data
            fetchOrderDisputes(orderId);
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
        } else if (result.conflict) {
            toast.warn(result.error);
        } else {
            toast.error(result.error || "Failed to submit dispute.");
        }
        setIsSubmitting(false);
    };

    // Fetch disputes for this order
    const fetchOrderDisputes = async (oid) => {
        if (!oid) return;
        const result = await DisputeService.getByOrder(oid);
        if (result.success && Array.isArray(result.data)) {
            setOrderDisputes(result.data);
        }
    };

    // Callback for visit-level dispute/approve coming from ClientVisitTabs
    const handleVisitReviewed = () => {
        fetchOrderDisputes(orderId);
        // Re-check task sheet approval status (client may have just approved the last visit)
        if (orders[0]) {
            checkAllTaskSheetsApproved(orders[0]);
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

    if (loading) return <div className="cod-loading"><div className="cod-spinner" /><p>Loading order details...</p></div>;
    if (error) return <div className="cod-error-page"><p>{error}</p><button className="cod-retry-btn" onClick={() => window.location.reload()}>Retry</button></div>;

    const order = orders.length > 0 ? orders[0] : null;
    const cStatus = contract?.status?.toLowerCase().replace(/\s+/g, '') || '';
    const isTasksReady = cStatus === 'approved' || cStatus === 'active' || cStatus === 'completed';

    const isOrderCancelled = order?.clientOrderStatus === 'Cancelled';

    const bannerTitle = (() => {
        if (isOrderCancelled) return 'Order Cancelled';
        if (isTasksReady) return 'Task Tracker';
        if (!contract && !negotiation) return 'Generate Contract';
        if (!contract && negotiation) return 'Negotiation In Progress';
        if (cStatus === 'pendingclientapproval' || cStatus === 'revised') return 'Generate Contract';
        if (cStatus === 'pendingcaregiverapproval') return 'Awaiting Caregiver Approval';
        if (cStatus === 'caregiverreviewrequested') return 'Revision Requested';
        if (cStatus === 'clientreviewrequested') return 'Revision Pending';
        if (cStatus === 'clientrejected' || cStatus === 'caregiverrejected') return 'Contract Rejected';
        if (cStatus === 'terminated') return 'Contract Terminated';
        return 'Generate Contract';
    })();

    const bannerSubtitle = (() => {
        if (isOrderCancelled) return 'This order has been cancelled and is no longer active.';
        if (isTasksReady) return 'Track your progress and give your client real time updates.';
        if (!contract) return 'Provide all the necessary information that the caregiver needs';
        if (cStatus === 'pendingclientapproval' || cStatus === 'revised') return 'Provide all the necessary information that the caregiver needs';
        if (cStatus === 'pendingcaregiverapproval') return 'Your contract has been sent to the caregiver for approval';
        if (cStatus === 'caregiverreviewrequested') return 'The caregiver has requested changes to the contract';
        if (cStatus === 'clientreviewrequested') return 'Waiting for caregiver to revise the contract';
        if (cStatus === 'clientrejected' || cStatus === 'caregiverrejected') return 'This contract has been rejected';
        if (cStatus === 'terminated') return 'This contract has been terminated';
        return 'Provide all the necessary information that the caregiver needs';
    })();

    return (
        <div className="cod-page">
            {/* ── Banner ── */}
            <div className="marketplace-banner cod-banner">
                <div className="marketplace-banner-content">
                    <button className="cod-back-btn" onClick={() => navigate(-1)}>Back</button>
                    <h1 className="marketplace-banner-title">{bannerTitle}</h1>
                    {contract && (
                        <button
                            className="cod-btn"
                            style={{ marginLeft: 'auto', whiteSpace: 'nowrap', background: '#fff', color: '#0066cc', border: '2px solid #fff', fontWeight: 600, padding: '8px 18px', borderRadius: '8px' }}
                            onClick={() => navigate(`/app/client/my-order/${orderId}/contract`)}
                        >
                            📋 View Contract
                        </button>
                    )}
                </div>
                <p className="cod-banner-subtitle">{bannerSubtitle}</p>
            </div>

            <div className="cod-body">
                {/* ── Left column ── */}
                <div className="cod-left">
                    {isOrderCancelled ? (
                        <div className="cod-contract-panel">
                            <div className="cod-contract-state">
                                <div className="cod-contract-icon">🚫</div>
                                <h2>Order Cancelled</h2>
                                <p className="cod-contract-note">This order has been cancelled. No further actions can be taken.</p>
                                <div className="cod-contract-actions">
                                    <button className="cod-btn cod-btn--outline" onClick={() => navigate(-1)}>Go Back</button>
                                </div>
                            </div>
                        </div>
                    ) : isTasksReady ? (
                        <div className="cod-tasks-panel">
                            {order ? <ClientVisitTabs order={order} onVisitReviewed={handleVisitReviewed} /> : <p>No tasks available.</p>}
                        </div>
                    ) : (
                        <div className="cod-contract-panel">
                            {checkingContract ? (
                                <div className="cod-contract-state">
                                    <div className="cod-spinner" />
                                    <p>Loading contract information...</p>
                                </div>
                            ) : contract ? (() => {
                                const isClientInitiated = ContractService.isClientInitiated(contract);
                                const actions = ContractService.getClientContractActions(contract);

                                if (cStatus === 'pendingclientapproval' || (cStatus === 'revised' && actions.canApprove)) {
                                    const isRevised = cStatus === 'revised';
                                    return (
                                        <div className="cod-contract-state">
                                            <div className="cod-contract-icon">📩</div>
                                            <h2>{isRevised ? 'Revised Contract Received' : 'Contract Received'}</h2>
                                            <p className="cod-contract-note">
                                                {isRevised
                                                    ? 'The caregiver has revised the contract. Please review and respond.'
                                                    : 'Review this contract and give your feedback.'}
                                            </p>
                                            <p className="cod-contract-disclaimer">
                                                Note: Approving this contract means you have reviewed all details and are satisfied.
                                                You can request changes once before a final decision is required.
                                            </p>
                                            <div className="cod-contract-actions">
                                                <button className="cod-btn cod-btn--review" onClick={() => navigate(`/app/client/my-order/${orderId}/contract`)}>
                                                    Review Contract
                                                </button>
                                                <button className="cod-btn cod-btn--approve" onClick={startApprovalFlow} disabled={contractActionLoading}>
                                                    {contractActionLoading ? 'Processing...' : 'Approve Contract'}
                                                </button>
                                            </div>
                                            {actions.canRequestReview && (
                                                <button className="cod-btn cod-btn--outline cod-btn--full" style={{marginTop:'8px'}} onClick={() => openModal("requestReview")}>
                                                    Request Changes
                                                </button>
                                            )}
                                            {actions.canReject && (
                                                <button className="cod-btn cod-btn--danger cod-btn--full" style={{marginTop:'8px'}} onClick={() => openModal("rejectContract")}>
                                                    Reject Contract
                                                </button>
                                            )}
                                            {actions.canRequestReview && (
                                                <p className="cod-contract-disclaimer" style={{marginTop:'10px'}}>Round 1: You can request changes to the schedule</p>
                                            )}
                                            {actions.canReject && (
                                                <p className="cod-contract-disclaimer" style={{marginTop:'10px'}}>Round 2: Approve or reject (request new caregiver)</p>
                                            )}
                                        </div>
                                    );
                                }

                                if (cStatus === 'approved' || cStatus === 'active') {
                                    return (
                                        <div className="cod-contract-state">
                                            <div className="cod-contract-icon">✅</div>
                                            <h2>Contract Active</h2>
                                            <p className="cod-contract-note">Contract is active. Task sheets are available.</p>
                                            <div className="cod-contract-actions">
                                                <button className="cod-btn cod-btn--outline" onClick={() => navigate(`/app/client/my-order/${orderId}/contract`)}>View Full Contract</button>
                                            </div>
                                        </div>
                                    );
                                }

                                if (cStatus === 'pendingcaregiverapproval') {
                                    return (
                                        <div className="cod-contract-state">
                                            <div className="cod-contract-icon">⏳</div>
                                            <h2>Awaiting Caregiver Approval</h2>
                                            <p className="cod-contract-note">Your contract has been sent. Waiting for the caregiver to review and approve it.</p>
                                            <div className="cod-contract-actions">
                                                <button className="cod-btn cod-btn--outline" onClick={() => navigate(`/app/client/my-order/${orderId}/contract`)}>View Contract Details</button>
                                            </div>
                                        </div>
                                    );
                                }

                                if (cStatus === 'caregiverreviewrequested') {
                                    return (
                                        <div className="cod-contract-state">
                                            <div className="cod-contract-icon">🔄</div>
                                            <h2>Caregiver Requested Changes</h2>
                                            <p className="cod-contract-note">The caregiver has requested revisions to your contract.</p>
                                            {contract.caregiverReviewComments && (
                                                <div className="cod-feedback-box">
                                                    <strong>Caregiver&apos;s feedback:</strong>
                                                    <p>&ldquo;{contract.caregiverReviewComments}&rdquo;</p>
                                                </div>
                                            )}
                                            <div className="cod-contract-actions">
                                                <button className="cod-btn cod-btn--outline" onClick={() => navigate(`/app/client/my-order/${orderId}/contract`)}>View Details</button>
                                                <button className="cod-btn cod-btn--review" onClick={() => {
                                                    setClientReviseAddress(contract.serviceAddress || '');
                                                    setClientReviseRequirements(contract.specialClientRequirements || '');
                                                    setShowClientReviseModal(true);
                                                }}>Revise & Resubmit</button>
                                            </div>
                                        </div>
                                    );
                                }

                                if (cStatus === 'clientreviewrequested') {
                                    return (
                                        <div className="cod-contract-state">
                                            <div className="cod-contract-icon">🔄</div>
                                            <h2>Waiting for Caregiver Revision</h2>
                                            <p className="cod-contract-note">You requested changes. The caregiver is revising the contract.</p>
                                            {contract.clientReviewComments && (
                                                <div className="cod-feedback-box">
                                                    <strong>Your feedback:</strong>
                                                    <p>&ldquo;{contract.clientReviewComments}&rdquo;</p>
                                                </div>
                                            )}
                                            <div className="cod-contract-actions">
                                                <button className="cod-btn cod-btn--outline" onClick={() => navigate(`/app/client/my-order/${orderId}/contract`)}>View Contract</button>
                                            </div>
                                        </div>
                                    );
                                }

                                if (cStatus === 'clientrejected') {
                                    return (
                                        <div className="cod-contract-state">
                                            <div className="cod-contract-icon">❌</div>
                                            <h2>Contract Rejected</h2>
                                            <p className="cod-contract-note">You have rejected this contract.</p>
                                            <div className="cod-contract-actions">
                                                <button className="cod-btn cod-btn--outline" onClick={() => navigate(`/app/client/my-order/${orderId}/contract`)}>View Contract Details</button>
                                            </div>
                                        </div>
                                    );
                                }

                                if (cStatus === 'caregiverrejected') {
                                    return (
                                        <div className="cod-contract-state">
                                            <div className="cod-contract-icon">❌</div>
                                            <h2>Contract Rejected</h2>
                                            <p className="cod-contract-note">The caregiver has rejected this contract.</p>
                                            <div className="cod-contract-actions">
                                                <button className="cod-btn cod-btn--outline" onClick={() => navigate(`/app/client/my-order/${orderId}/contract`)}>View Contract Details</button>
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
                                                <button className="cod-btn cod-btn--outline" onClick={() => navigate(`/app/client/my-order/${orderId}/contract`)}>View Contract Details</button>
                                            </div>
                                        </div>
                                    );
                                }

                                // Fallback
                                return (
                                    <div className="cod-contract-state">
                                        <div className="cod-contract-icon">📋</div>
                                        <h2>Contract: {ContractService.getStatusDisplayInfo(contract.status).label}</h2>
                                        <p className="cod-contract-note">Contract is being processed.</p>
                                        <div className="cod-contract-actions">
                                            <button className="cod-btn cod-btn--outline" onClick={() => navigate(`/app/client/my-order/${orderId}/contract`)}>View Contract Details</button>
                                        </div>
                                    </div>
                                );
                            })() : (
                                /* No contract yet */
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
                                            role="client"
                                            order={order}
                                            onNegotiationUpdate={(updated) => setNegotiation(updated)}
                                            onContractCreated={(contractData) => {
                                                setContract(contractData);
                                                setNegotiation(null);
                                            }}
                                        />
                                    ) : order?.transactionId ? (
                                        <>
                                            <div className="cod-contract-icon">📋</div>
                                            <h2>No Contract Yet</h2>
                                            <p className="cod-contract-note">
                                                Discuss tasks, schedule and terms with your caregiver before generating a contract.
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
                                            <p className="cod-contract-note">Complete payment to unlock contract negotiation with your caregiver.</p>
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
                                        <span className="cod-client-avatar-sm">{order.caregiverName?.split(' ').map(n => n[0]).join('').slice(0,2)}</span>
                                        {order.caregiverName}
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
                            {contract && isTasksReady && (
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
                                const alreadyReleased = order.isOrderStatusApproved || fundsReleased;
                                const showRelease = ClientOrderService.shouldShowReleaseFunds(order, userId) && !fundsReleased;
                                return (
                                    <div className="cod-fund-status">
                                        {order.hasDispute ? (
                                            <span className="cod-fund-disputed">⚠️ Funds on hold — active dispute</span>
                                        ) : alreadyReleased ? (
                                            <span className="cod-fund-released">✅ Order Approved</span>
                                        ) : showRelease ? (
                                            <div>
                                                <span className="cod-fund-pending">⏳ Funds release per visit — approved visits credit the caregiver</span>
                                                <button className="cod-btn cod-btn--approve" style={{marginTop:'8px',width:'100%'}} onClick={handleReleaseFunds} disabled={releasingFunds}>
                                                    {releasingFunds ? 'Processing...' : '✅ Approve Order'}
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="cod-fund-pending">⏳ Awaiting review</span>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Dispute History */}
                            {orderDisputes.length > 0 && (
                                <div className="cod-detail-section">
                                    <h5 className="cod-detail-label">⚠️ Disputes ({orderDisputes.length})</h5>
                                    {orderDisputes.map((d) => (
                                        <div key={d.id} style={{padding:'8px 0',borderBottom:'1px solid #f1f0eb',fontSize:'0.82rem'}}>
                                            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
                                                <span style={{fontWeight:600}}>{d.disputeType}</span>
                                                <span style={{color: DisputeService.STATUS_COLORS[d.status] || '#666'}}>{d.status}</span>
                                            </div>
                                            <p style={{margin:'2px 0',color:'#475569'}}>{d.reason}</p>
                                            {d.resolutionSummary && <p style={{margin:'2px 0',color:'#64748b',fontSize:'0.78rem'}}>📋 {d.resolutionSummary}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Review / Completion actions — hidden for cancelled orders */}
                            {isOrderCancelled ? (
                                <div style={{padding:'10px 0',color:'#e74c3c',fontWeight:600,fontSize:'0.85rem'}}>🚫 This order has been cancelled</div>
                            ) : order.clientOrderStatus === 'Completed' ? (
                                isReviewSubmitted ? (
                                    <div style={{padding:'10px 0',color:'#27ae60',fontWeight:600,fontSize:'0.85rem'}}>✓ Review Submitted — Thank you!</div>
                                ) : checkingReviewStatus ? (
                                    <p style={{fontSize:'0.82rem',color:'#888'}}>Checking review status...</p>
                                ) : (
                                    <button className="cod-btn cod-btn--review" style={{width:'100%',marginTop:'8px'}} onClick={() => openModal("review")}>
                                        Submit Review
                                    </button>
                                )
                            ) : (
                                <>
                                    {contract && cStatus === 'approved' && allTaskSheetsApproved ? (
                                        <button className="cod-btn cod-btn--approve" style={{width:'100%',marginTop:'8px'}} onClick={() => openModal("complete")}>
                                            Mark as Completed
                                        </button>
                                    ) : (
                                        <p style={{fontSize:'0.82rem',color:'#94a3b8',fontStyle:'italic',margin:'8px 0'}}>
                                            {cStatus !== 'approved'
                                                ? 'Order can be marked as completed after the contract is approved.'
                                                : checkingTaskSheets
                                                    ? 'Checking visit completion status...'
                                                    : 'All visits must be recorded and reviewed before completing.'}
                                        </p>
                                    )}
                                </>
                            )}

                            {/* Action buttons — hidden when order is completed/approved or cancelled */}
                            {!(order.clientOrderStatus === 'Completed' && order.isOrderStatusApproved) && !isOrderCancelled && (
                                <div className="cod-sidebar-actions">
                                    <button className="cod-btn cod-btn--cancel" onClick={() => openModal("cancel")}>
                                        Cancel Order
                                    </button>
                                    <button className="cod-btn cod-btn--report" onClick={() => openModal("dispute")}>
                                        ⚠ Report {order.caregiverName?.split(' ')[0] || 'Caregiver'}
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
                        ) : modalType === "viewContract" ? (
                            <>
                                <div className="contract-modal-header">
                                    <h3>📋 Contract Details</h3>
                                    <button className="contract-modal-close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
                                </div>
                                {!contract ? (
                                    <div className="contract-modal-body" style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                                        {checkingContract ? "Loading contract…" : "No contract is available for this order yet."}
                                    </div>
                                ) : (
                                <div className="contract-modal-body">
                                <div className="contract-details-modal">
                                    <div className="contract-header-info">
                                        <p><strong>Contract ID:</strong> {contract.id}</p>
                                        <p><strong>Initiated By:</strong> {contract.initiatedByRole || 'Caregiver'}</p>
                                        <p><strong>Status:</strong> <span className={`status-badge ${contract.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                                            {ContractService.getStatusDisplayInfo(contract.status).label}
                                        </span></p>
                                        <p><strong>Negotiation Round:</strong> {contract.negotiationRound || 1}</p>
                                    </div>
                                    
                                    {/* Schedule Section — contract.schedule for old flow, agreedSchedule for negotiation-generated contracts */}
                                    {(() => {
                                        const _slots = contract.schedule?.length > 0 ? contract.schedule : contract.agreedSchedule;
                                        return _slots?.length > 0 ? (
                                            <div className="contract-schedule-modal">
                                                <h4>📅 Service Schedule</h4>
                                                <div className="schedule-display">
                                                    {_slots.map((visit, idx) => (
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
                                        ) : null;
                                    })()}

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
                                        {!contract.caregiverAdditionalNotes && contract.additionalNotes && (
                                            <p><strong>Caregiver Notes:</strong> {contract.additionalNotes}</p>
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

                                    {/* Tasks — complex objects for old flow; agreedTasks strings for negotiation-generated contracts */}
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
                                    {!contract.tasks?.length && contract.agreedTasks?.length > 0 && (
                                        <div className="contract-tasks-section">
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
                                            userRole="Client"
                                            showActions={false}
                                        />
                                    )}

                                    {/* Terms */}
                                    {contract.generatedTerms && (
                                        <div className="contract-terms-section">
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
                                )}
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

                                    {/* NEW — Propose tasks along with review request */}
                                    <TaskProposalForm
                                        tasks={reviewProposedTasks}
                                        onTasksChange={setReviewProposedTasks}
                                        label="Propose Tasks (Optional)"
                                        placeholder="E.g., Light meal preparation..."
                                        showCategoryAndPriority={true}
                                        maxTasks={5}
                                    />
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
                        ) : modalType === "dispute" ? (
                            <>
                                <h3>⚠️ Dispute Order</h3>
                                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '12px' }}>
                                    Select a category and describe the issue. Our support team will review your dispute.
                                </p>
                                <div className="form-group">
                                    <label>Category <span style={{ color: '#e74c3c' }}>*</span></label>
                                    <select
                                        value={disputeCategory}
                                        onChange={(e) => setDisputeCategory(e.target.value)}
                                        className="dispute-category-select"
                                    >
                                        <option value="">Select a category...</option>
                                        {Object.entries(DisputeService.ORDER_CATEGORIES).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Reason <span style={{ color: '#e74c3c' }}>*</span></label>
                                    <textarea
                                        placeholder="Describe what happened in detail..."
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        rows="4"
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button
                                        className="reject-btn"
                                        onClick={handleSubmitStatus}
                                        disabled={isSubmitting || !reason.trim() || !disputeCategory}
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
                                    </button>
                                    <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</button>
                                </div>
                            </>
                        ) : modalType === "cancel" ? (
                            <>
                                <h3>Cancel Order</h3>
                                <p style={{ fontSize: '0.9rem', color: '#d32f2f', marginBottom: '8px' }}>
                                    Are you sure you want to cancel this order? This action cannot be undone.
                                </p>
                                <p style={{ fontSize: '0.82rem', color: '#666', marginBottom: '12px' }}>
                                    Your booking commitment fee will be invalidated and you'll need to pay it again to re-engage this caregiver. Any undelivered visit amount will be credited to your wallet.
                                </p>
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                                        Reason for cancellation (optional):
                                    </label>
                                    <textarea
                                        placeholder="Tell us why you're cancelling this order..."
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        rows="3"
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button
                                        className="reject-btn"
                                        onClick={async () => {
                                            setIsSubmitting(true);
                                            try {
                                                const result = await ClientOrderService.cancelOrder(orderId, reason.trim() || undefined);
                                                if (result.success) {
                                                    toast.success(result.message || "Order cancelled successfully.");
                                                    setIsModalOpen(false);
                                                    setReason("");
                                                    // Refresh order data
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
                                                    toast.error(result.error || "Failed to cancel order. Please try again.");
                                                }
                                            } catch (err) {
                                                console.error("Failed to cancel order:", err);
                                                toast.error("Failed to cancel order. Please try again.");
                                            } finally {
                                                setIsSubmitting(false);
                                            }
                                        }}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
                                    </button>
                                    <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Go Back</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h3>Mark as Completed</h3>
                                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '12px' }}>
                                    Please confirm that all care services for this order have been fully delivered. The order will be marked as completed.
                                </p>
                                <div className="modal-actions">
                                    <button onClick={handleSubmitStatus} disabled={isSubmitting}>
                                        {isSubmitting ? 'Submitting...' : 'Confirm Completion'}
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

            {/* Post-approval GPS follow-up prompt */}
            {showPostApprovalGpsPrompt && (
                <div className="modal-overlay gps-prompt-overlay" onClick={() => !postApprovalGpsCapturing && setShowPostApprovalGpsPrompt(false)}>
                    <div className="gps-prompt-modal" onClick={e => e.stopPropagation()}>
                        <h3>📍 Set Your Service Location</h3>
                        <p>Your contract is approved. Are you currently at the service address?</p>
                        {contract?.serviceAddress && (
                            <p className="confirmed-address-preview">{contract.serviceAddress}</p>
                        )}
                        <p className="gps-explanation">
                            Setting your GPS location means your caregiver will need to be within 1500m to check in.
                            If you skip, check-in will be unrestricted until you set it from the contract page.
                        </p>
                        <div className="gps-prompt-actions">
                            <button
                                className="gps-prompt-yes"
                                onClick={handleSetPostApprovalGps}
                                disabled={postApprovalGpsCapturing}
                            >
                                {postApprovalGpsCapturing ? 'Capturing location...' : "Yes, I'm here — set my location"}
                            </button>
                            <button
                                className="gps-prompt-skip"
                                onClick={() => setShowPostApprovalGpsPrompt(false)}
                                disabled={postApprovalGpsCapturing}
                            >
                                Skip for now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Service Address Confirmation & GPS Prompt Modal for Contract Approval */}
            {showGpsPrompt && (
                <div className="modal-overlay gps-prompt-overlay" onClick={() => !capturingGps && !contractActionLoading && setShowGpsPrompt(false)}>
                    <div className="gps-prompt-modal" onClick={(e) => e.stopPropagation()}>
                        {approvalStep === 'address' ? (
                            <>
                                <h3>📍 Confirm Service Address</h3>
                                <p className="address-confirm-label">Is this the correct service address?</p>
                                
                                {!isEditingAddress ? (
                                    <div className="address-display-box">
                                        <p className="current-address">{editedServiceAddress || 'No address provided'}</p>
                                        <button 
                                            className="edit-address-btn"
                                            onClick={() => setIsEditingAddress(true)}
                                        >
                                            ✏️ Edit Address
                                        </button>
                                    </div>
                                ) : (
                                    <div className="address-edit-box">
                                        <AddressInput
                                            value={editedServiceAddress}
                                            onChange={(addr) => setEditedServiceAddress(addr)}
                                            onValidation={(result) => setAddressValidation(result)}
                                            placeholder="Enter the correct service address"
                                            required
                                        />
                                        <button 
                                            className="done-editing-btn"
                                            onClick={() => setIsEditingAddress(false)}
                                            disabled={!editedServiceAddress.trim()}
                                        >
                                            Done
                                        </button>
                                    </div>
                                )}

                                <div className="gps-prompt-actions">
                                    <button
                                        className="gps-prompt-yes"
                                        onClick={() => setApprovalStep('location')}
                                        disabled={!editedServiceAddress?.trim()}
                                    >
                                        Yes, this is correct
                                    </button>
                                    <button
                                        className="gps-prompt-skip"
                                        onClick={() => !capturingGps && !contractActionLoading && setShowGpsPrompt(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h3>📍 Confirm Your Location</h3>
                                <p>Are you currently at this service address?</p>
                                <p className="confirmed-address-preview">{editedServiceAddress}</p>
                                <p className="gps-explanation">Sharing your location helps ensure accurate check-in verification for your caregiver.</p>
                                <div className="gps-prompt-actions">
                                    <button
                                        className="gps-prompt-yes"
                                        onClick={handleApproveWithGps}
                                        disabled={capturingGps || contractActionLoading}
                                    >
                                        {capturingGps ? 'Capturing location...' : contractActionLoading ? 'Approving...' : "Yes, I'm here — Approve"}
                                    </button>
                                    <button
                                        className="gps-prompt-skip"
                                        onClick={handleApproveWithoutGps}
                                        disabled={capturingGps || contractActionLoading}
                                    >
                                        {contractActionLoading ? 'Approving...' : "No, I'm not there — Approve anyway"}
                                    </button>
                                    <button
                                        className="gps-prompt-back"
                                        onClick={() => setApprovalStep('address')}
                                        disabled={capturingGps || contractActionLoading}
                                    >
                                        ← Back
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Client Contract Generation Modal (Flow B) */}
            {showClientGenerateModal && (
                <div className="modal-overlay">
                    <div className="modal-content contract-modal-large">
                        <div className="contract-modal-header">
                            <h3>Generate Contract</h3>
                            <button className="contract-modal-close-btn" onClick={() => setShowClientGenerateModal(false)}>✕</button>
                        </div>
                        <div className="contract-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <p style={{ color: '#555', marginBottom: '16px' }}>
                                Provide service details and the caregiver will review your contract.
                            </p>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Service Address *</label>
                                <AddressInput
                                    value={clientGenServiceAddress}
                                    onChange={(addr) => setClientGenServiceAddress(addr)}
                                    onValidated={(validation) => {
                                        if (validation?.latitude && validation?.longitude) {
                                            setClientGenAddressCoords({ lat: validation.latitude, lng: validation.longitude });
                                        }
                                    }}
                                    placeholder="Enter the service address"
                                />
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Access Instructions</label>
                                <textarea
                                    value={clientGenAccessInstructions}
                                    onChange={(e) => setClientGenAccessInstructions(e.target.value)}
                                    placeholder="Gate code, building entry, parking instructions..."
                                    rows="2"
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Special Requirements</label>
                                <textarea
                                    value={clientGenRequirements}
                                    onChange={(e) => setClientGenRequirements(e.target.value)}
                                    placeholder="Any special care requirements..."
                                    rows="2"
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Additional Notes</label>
                                <textarea
                                    value={clientGenNotes}
                                    onChange={(e) => setClientGenNotes(e.target.value)}
                                    placeholder="Anything else the caregiver should know..."
                                    rows="2"
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
                                />
                            </div>

                            <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                                <button
                                    className="generate-contract-btn"
                                    onClick={handleClientGenerateContract}
                                    disabled={clientGenLoading || !clientGenServiceAddress.trim()}
                                    style={{ padding: '10px 24px', borderRadius: '6px', border: 'none', background: '#27ae60', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    {clientGenLoading ? 'Generating...' : 'Send Contract to Caregiver'}
                                </button>
                                <button onClick={() => setShowClientGenerateModal(false)} style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Client Contract Revision Modal (Flow B) */}
            {showClientReviseModal && (
                <div className="modal-overlay">
                    <div className="modal-content contract-modal-large">
                        <div className="contract-modal-header">
                            <h3>Revise Contract</h3>
                            <button className="contract-modal-close-btn" onClick={() => setShowClientReviseModal(false)}>✕</button>
                        </div>
                        <div className="contract-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            {contract?.caregiverReviewComments && (
                                <div style={{ padding: '10px', background: '#fff3e0', borderRadius: '6px', marginBottom: '16px' }}>
                                    <p style={{ fontWeight: 600, margin: '0 0 4px' }}>Caregiver's Feedback:</p>
                                    <p style={{ margin: 0 }}>"{contract.caregiverReviewComments}"</p>
                                </div>
                            )}

                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Service Address</label>
                                <p style={{ fontSize: '12px', color: '#666', margin: '0 0 6px' }}>
                                    The address where care will take place. Only Nigerian addresses are supported.
                                </p>
                                <AddressInput
                                    value={clientReviseAddress}
                                    onChange={(addr) => setClientReviseAddress(addr)}
                                    onValidation={(result) => {
                                        if (result?.coordinates?.latitude && result?.coordinates?.longitude) {
                                            setClientReviseGeoCoords({ lat: result.coordinates.latitude, lng: result.coordinates.longitude });
                                        }
                                    }}
                                    placeholder="Update service address if needed"
                                    country="ng"
                                    autoValidate={false}
                                />
                                {clientReviseGeoCoords && (
                                    <p style={{ fontSize: '12px', color: '#4caf50', margin: '4px 0 8px' }}>
                                        📍 Location pinned — caregivers must be at this address to check in.
                                    </p>
                                )}
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Special Requirements</label>
                                <textarea
                                    value={clientReviseRequirements}
                                    onChange={(e) => setClientReviseRequirements(e.target.value)}
                                    placeholder="Updated requirements..."
                                    rows="2"
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Additional Notes</label>
                                <textarea
                                    value={clientReviseNotes}
                                    onChange={(e) => setClientReviseNotes(e.target.value)}
                                    placeholder="Notes about what you changed..."
                                    rows="2"
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
                                />
                            </div>

                            <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                                <button
                                    className="generate-contract-btn"
                                    onClick={handleClientReviseContract}
                                    disabled={clientReviseLoading}
                                    style={{ padding: '10px 24px', borderRadius: '6px', border: 'none', background: '#2196f3', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    {clientReviseLoading ? 'Submitting...' : 'Resubmit Contract'}
                                </button>
                                <button onClick={() => setShowClientReviseModal(false)} style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />

            {/* Start Negotiation Modal */}
            {showStartNegModal && (
                <div className="neg-start-modal-overlay" onClick={() => setShowStartNegModal(false)}>
                    <div className="neg-start-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="neg-start-modal-header">
                            <h3>Start Negotiation</h3>
                            <button className="neg-start-modal-close" onClick={() => setShowStartNegModal(false)}>✕</button>
                        </div>
                        <div className="neg-start-modal-body">
                        <p style={{ fontSize: '13px', color: '#555', marginBottom: '14px' }}>
                            Share your initial task and schedule proposals. Your caregiver will review and respond.
                        </p>

                        <label className="neg-start-label">Proposed Tasks</label>
                        <div className="neg-task-list">
                            {negInitTasks.map((task, i) => (
                                <div key={i} className="neg-task-row">
                                    <span>{task}</span>
                                    <button onClick={() => setNegInitTasks(prev => prev.filter((_, idx) => idx !== i))}>✕</button>
                                </div>
                            ))}
                            <div className="neg-add-task-row">
                                <input
                                    type="text"
                                    placeholder="Add a task…"
                                    value={negInitNewTask}
                                    onChange={(e) => setNegInitNewTask(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && negInitNewTask.trim()) {
                                            setNegInitTasks(prev => [...prev, negInitNewTask.trim()]);
                                            setNegInitNewTask('');
                                        }
                                    }}
                                />
                                <button onClick={() => {
                                    if (negInitNewTask.trim()) {
                                        setNegInitTasks(prev => [...prev, negInitNewTask.trim()]);
                                        setNegInitNewTask('');
                                    }
                                }}>Add</button>
                            </div>
                        </div>

                        <label className="neg-start-label">Proposed Schedule</label>
                        {/* Schedule guide banner */}
                        {(() => {
                            const payOpt = (order?.paymentOption || order?.serviceType || '').toLowerCase();
                            const reqDays = payOpt === 'one-time' ? 1
                                : (order?.frequencyPerWeek || order?.visitsPerWeek || order?.selectedPackage?.visitsPerWeek || order?.packageDetails?.visitsPerWeek || 1);
                            const uniqueDays = new Set(negInitSchedule.map(s => s.dayOfWeek)).size;
                            const done = uniqueDays >= reqDays;
                            return reqDays > 0 ? (
                                <div className={`neg-schedule-guide ${done ? 'neg-schedule-guide--done' : ''}`}>
                                    <div className="neg-schedule-guide-text">
                                        <strong>📅 {reqDays} {reqDays === 1 ? 'day' : 'days'} per week required</strong>
                                        <span>Your contract is for {reqDays} visit{reqDays > 1 ? 's' : ''}/week. Add a time slot for each day.</span>
                                    </div>
                                    <span className={`neg-schedule-counter ${done ? 'neg-schedule-counter--done' : 'neg-schedule-counter--pending'}`}>
                                        {uniqueDays} / {reqDays}
                                    </span>
                                </div>
                            ) : null;
                        })()}
                        <div className="neg-slot-row">
                            <select value={negInitSlotDay} onChange={(e) => setNegInitSlotDay(e.target.value)}>
                                {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                            <input type="time" value={negInitSlotStart} onChange={(e) => setNegInitSlotStart(e.target.value)} />
                            <input type="time" value={negInitSlotEnd} onChange={(e) => setNegInitSlotEnd(e.target.value)} />
                            <button onClick={() => {
                                if (negInitSlotStart >= negInitSlotEnd) {
                                    toast.error('End time must be after start time.');
                                    return;
                                }
                                const payOpt = (order?.paymentOption || order?.serviceType || '').toLowerCase();
                                const reqDays = payOpt === 'one-time' ? 1
                                    : (order?.frequencyPerWeek || order?.visitsPerWeek || order?.selectedPackage?.visitsPerWeek || order?.packageDetails?.visitsPerWeek || 1);
                                if (negInitSchedule.length >= reqDays) {
                                    toast.error(`You can only add ${reqDays} day${reqDays > 1 ? 's' : ''} for this contract. Remove a slot first to change it.`);
                                    return;
                                }
                                if (negInitSchedule.some(s => s.dayOfWeek === negInitSlotDay)) {
                                    toast.error(`You already have a slot for ${negInitSlotDay}. Remove it first to change the time.`);
                                    return;
                                }
                                setNegInitSchedule(prev => [...prev, { dayOfWeek: negInitSlotDay, startTime: negInitSlotStart, endTime: negInitSlotEnd }]);
                            }}>Add</button>
                        </div>
                        {negInitSchedule.length > 0 && (
                            <div className="neg-schedule-list" style={{ marginBottom: '10px' }}>
                                {negInitSchedule.map((slot, i) => (
                                    <div key={i} className="neg-schedule-slot">
                                        <span className="neg-slot-day">{slot.dayOfWeek}</span>
                                        <span className="neg-slot-time">{slot.startTime} – {slot.endTime}</span>
                                        <button className="neg-remove-btn" onClick={() => setNegInitSchedule(prev => prev.filter((_, idx) => idx !== i))}>✕</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <label className="neg-start-label">Service Address</label>
                        <p style={{ fontSize: '12px', color: '#666', margin: '0 0 6px' }}>
                            The address where care will take place (e.g. your home). Only Nigerian addresses are supported.
                        </p>
                        <AddressInput
                            value={negInitAddress}
                            onChange={(addr) => setNegInitAddress(addr)}
                            onValidation={(result) => {
                                if (result?.coordinates?.latitude && result?.coordinates?.longitude) {
                                    setNegInitGeoCoords({ lat: result.coordinates.latitude, lng: result.coordinates.longitude });
                                }
                            }}
                            placeholder="e.g. 12 Adeola Odeku, Victoria Island, Lagos"
                            country="ng"
                            autoValidate={false}
                        />
                        {negInitGeoCoords && (
                            <p style={{ fontSize: '12px', color: '#4caf50', margin: '4px 0 8px' }}>
                                📍 Location pinned — caregivers must be at this address to check in.
                            </p>
                        )}

                        <label className="neg-start-label">Access Instructions</label>
                        <input
                            className="neg-start-input"
                            type="text"
                            placeholder="e.g. Ring bell at Gate B, floor 3 (optional)"
                            value={negInitAccessInstructions}
                            onChange={(e) => setNegInitAccessInstructions(e.target.value)}
                        />

                        <label className="neg-start-label">Special Requirements</label>
                        <input
                            className="neg-start-input"
                            type="text"
                            placeholder="Any special requirements (optional)"
                            value={negInitRequirements}
                            onChange={(e) => setNegInitRequirements(e.target.value)}
                        />

                        <label className="neg-start-label">Proposed Start Date</label>
                        <input
                            className="neg-start-input"
                            type="date"
                            value={negInitStartDate}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setNegInitStartDate(e.target.value)}
                        />

                        <label className="neg-start-label">Note to Caregiver</label>
                        <textarea
                            className="neg-start-input"
                            rows={2}
                            placeholder="Optional note to your caregiver…"
                            value={negInitNote}
                            onChange={(e) => setNegInitNote(e.target.value)}
                        />

                        <div className="neg-start-modal-actions">
                            <button
                                className="neg-btn--submit"
                                onClick={() => {
                                    const payOpt = (order?.paymentOption || order?.serviceType || '').toLowerCase();
                                    const reqDays = payOpt === 'one-time' ? 1
                                        : (order?.frequencyPerWeek || order?.visitsPerWeek || order?.selectedPackage?.visitsPerWeek || order?.packageDetails?.visitsPerWeek || 1);
                                    const uniqueDays = new Set(negInitSchedule.map(s => s.dayOfWeek)).size;
                                    if (uniqueDays < reqDays) {
                                        toast.error(`Please add schedule slots for ${reqDays} day${reqDays > 1 ? 's' : ''} before starting. You have ${uniqueDays} of ${reqDays}.`);
                                        return;
                                    }
                                    handleStartNegotiation();
                                }}
                                disabled={startNegLoading}
                            >
                                {startNegLoading ? 'Starting…' : '🤝 Start Negotiation'}
                            </button>
                            <button className="neg-start-modal-cancel" onClick={() => setShowStartNegModal(false)}>Cancel</button>
                        </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyOrders;
