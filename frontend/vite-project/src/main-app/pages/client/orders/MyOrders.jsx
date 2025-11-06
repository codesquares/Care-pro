import{ useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import ClientReviewService from "../../../services/clientReviewService.js";
import ContractService from "../../../services/contractService.js";
import config from "../../../config"; // Centralized API configuration
import "./Orders.scss";

const statusColors = {
  "In Progress": "yellow",
  Completed: "cyan",
  Cancelled: "red",
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [ordersWithReviews, setOrdersWithReviews] = useState([]);
  const [filter, setFilter] = useState("All orders");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Contract-related state
  const [contractStates, setContractStates] = useState({}); // Store contract state for each order
  const [generatingContract, setGeneratingContract] = useState({}); // Track which orders are generating contracts
  
  const navigate = useNavigate();

  const handleOrderClick = (orderId) => {
    navigate(`/app/client/my-order/${orderId}`); // Navigate to details page
  };

  // Handle contract generation
  const handleGenerateContract = async (e, orderId) => {
    e.stopPropagation(); // Prevent navigation when clicking contract button
    
    setGeneratingContract(prev => ({ ...prev, [orderId]: true }));

    try {
      const result = await ContractService.generateContractFromOrder(orderId);
      
      if (result.success) {
        toast.success("Contract generated and sent to caregiver successfully!");
        
        // Update contract state for this order
        setContractStates(prev => ({
          ...prev,
          [orderId]: {
            hasContract: true,
            contract: result.data,
            error: null
          }
        }));
      } else {
        toast.error(result.error || "Failed to generate contract");
        
        // Update error state
        setContractStates(prev => ({
          ...prev,
          [orderId]: {
            ...prev[orderId],
            error: result.error
          }
        }));
      }
    } catch (error) {
      console.error("Contract generation error:", error);
      toast.error("Failed to generate contract. Please try again.");
      
      setContractStates(prev => ({
        ...prev,
        [orderId]: {
          ...prev[orderId],
          error: "Failed to generate contract"
        }
      }));
    } finally {
      setGeneratingContract(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // Check existing contracts for orders
  const checkContractsForOrders = async (ordersData) => {
    const contractChecks = ordersData.map(async (order) => {
      try {
        const result = await ContractService.checkExistingContract(order.id);
        return {
          orderId: order.id,
          hasContract: result.success && result.hasContract,
          contract: result.data,
          error: result.success ? null : result.error
        };
      } catch (error) {
        console.error(`Error checking contract for order ${order.id}:`, error);
        return {
          orderId: order.id,
          hasContract: false,
          contract: null,
          error: "Failed to check contract status"
        };
      }
    });

    const contractResults = await Promise.all(contractChecks);
    
    // Update contract states
    const newContractStates = {};
    contractResults.forEach(result => {
      newContractStates[result.orderId] = {
        hasContract: result.hasContract,
        contract: result.contract,
        error: result.error
      };
    });
    
    setContractStates(newContractStates);
  };

  // Retrieve user details from localStorage
  const userDetails = JSON.parse(localStorage.getItem("userDetails"));
  const clientUserId = userDetails?.id; // Ensure this matches your API user ID

  useEffect(() => {
    if (!clientUserId) {
      setError("User ID not found.");
      setLoading(false);
      return;
    }

    const fetchOrdersAndReviews = async () => {
      try {
        // First fetch all orders
        const response = await axios.get(
          `${config.BASE_URL}/ClientOrders/clientUserId?clientUserId=${clientUserId}` // Using centralized API config
        );
        const fetchedOrders = response.data;
        setOrders(fetchedOrders);

        // Then fetch reviews for each order to get actual ratings
        const ordersWithReviewData = await Promise.all(
          fetchedOrders.map(async (order) => {
            try {
              // Try different possible ID fields for the gig/order
              const orderId = order.gigId;
              
              const reviews = await ClientReviewService.getReviewsForOrder(orderId);
              
              // Calculate average rating from reviews
              let averageRating = 0;
              let totalReviews = 0;
              
              if (reviews && reviews.length > 0) {
                const totalRating = reviews.reduce((sum, review) => {
                  // Check multiple possible rating field names and handle different data types
                  const ratingValue = review.rating || review.Rating || review.score || review.Score || review.rate || review.Rate;
                  const numericRating = parseFloat(ratingValue);
                  
                  if (!isNaN(numericRating) && numericRating >= 1 && numericRating <= 5) {
                    totalReviews++;
                    return sum + numericRating;
                  }
                  return sum;
                }, 0);
                
                averageRating = totalReviews > 0 ? (totalRating / totalReviews) : 0;
              }
              
              return {
                ...order,
                reviews: reviews,
                calculatedRating: averageRating,
                reviewCount: totalReviews
              };
            } catch (reviewError) {
              console.error(`Error fetching reviews for order:`, reviewError);
              return {
                ...order,
                reviews: [],
                calculatedRating: 0,
                reviewCount: 0
              };
            }
          })
        );
        
        setOrdersWithReviews(ordersWithReviewData);
        
        // Check contracts for all orders
        await checkContractsForOrders(ordersWithReviewData);
        
      } catch (err) {
        setError("Failed to fetch orders.");
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrdersAndReviews();
  }, [clientUserId]);

  const filteredOrders =
    filter === "All orders"
      ? ordersWithReviews
      : ordersWithReviews.filter((order) => order.clientOrderStatus === filter);

  // Helper function to render star rating
  const renderStarRating = (rating, reviewCount) => {
    if (!rating || rating === 0) {
      return <span className="rating">No rating yet</span>;
    }
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} style={{ color: '#ffc107', fontSize: '16px' }} />);
    }
    
    // Add half star if needed
    if (hasHalfStar && fullStars < 5) {
      stars.push(<FaStarHalfAlt key="half" style={{ color: '#ffc107', fontSize: '16px' }} />);
    }
    
    // Add empty stars
    const emptyStarsCount = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStarsCount; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} style={{ color: '#e4e5e9', fontSize: '16px' }} />);
    }
    
    return (
      <span className="rating">
        <span className="stars">{stars}</span> {rating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
      </span>
    );
  };

  // Render contract status and button
  const renderContractSection = (order) => {
    const orderId = order.id;
    const contractState = contractStates[orderId];
    const isGenerating = generatingContract[orderId];
    
    // Check if order can generate contract
    const canGenerate = ContractService.canGenerateContract(order, contractState?.contract);
    
    if (contractState?.hasContract) {
      return (
        <div className="contract-status">
          <span className="contract-exists">
            ✅ Contract Generated
          </span>
        </div>
      );
    }
    
    if (canGenerate) {
      return (
        <div className="contract-actions">
          <button
            className={`generate-contract-btn ${isGenerating ? 'loading' : ''}`}
            onClick={(e) => handleGenerateContract(e, orderId)}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Contract'}
          </button>
        </div>
      );
    }
    
    // Show reason why contract can't be generated
    if (!order.transactionId && !order.paymentTransactionId) {
      return (
        <div className="contract-status">
          <span className="contract-unavailable">
            Payment required for contract
          </span>
        </div>
      );
    }
    
    if (order.clientOrderStatus === 'Cancelled') {
      return (
        <div className="contract-status">
          <span className="contract-unavailable">
            Cannot generate contract for cancelled order
          </span>
        </div>
      );
    }
    
    return null;
  };


  return (
    <div className="client-orders-page">
      <div className="client-orders-container">
        <h2 className="page-title">My Orders</h2>

        <div className="tabs">
          {["All orders", "In Progress", "Completed", "Cancelled"].map((tab) => (
            <button
              key={tab}
              className={`tab-button ${filter === tab ? "active" : ""}`}
              onClick={() => setFilter(tab)}
            >
              {tab} {filter === tab && <span className="underline"></span>}
            </button>
          ))}
        </div>

        {loading ? (
          <p>Loading orders...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : filteredOrders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          <div className="orders-list">
            {filteredOrders.map((order, index) => (
              <div key={index} className="client-order-card"
              onClick={() => handleOrderClick(order.id)}
              style={{ cursor: "pointer" }}
              >
                <img src={order.gigImage || "default-image.png"} alt="Order-info" className="client-order-image" />
                <div className="client-order-details">
                  <h3>{order.gigTitle}</h3>
                  <p>{order.caregiverName || "Unknown Client"}</p>
                  <div className="client-order-meta">
                    <span className={`status ${statusColors[order.status] || ""}`}>
                      {order.clientOrderStatus}
                    </span>
                    {renderStarRating(order.calculatedRating, order.reviewCount)}
                  </div>
                  {renderContractSection(order)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
