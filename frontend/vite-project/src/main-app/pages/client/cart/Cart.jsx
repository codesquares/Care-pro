
import OrderSpecifications from '../../../components/cart/OrderSpecifications';
import OrderDetails from '../../../components/cart/OrderDetails';
import ServiceProvider from '../../../components/cart/ServiceProvider';
import ServiceFrequency from '../../../components/cart/ServiceFrequency';
import TaskList from '../../../components/cart/TaskList';
import ReviewsModal from '../../../components/ReviewsModal/ReviewsModal';
import GigReviewService from '../../../services/gigReviewService';
import './Cart.css';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ClientGigService from '../../../services/clientGigService';
import config from '../../../config'; // Import centralized config for API URLs

const Cart = () => {
   const { id } = useParams();
    const [service, setService] = useState(null);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Responsive state for mobile detection
    const [isMobile, setIsMobile] = useState(false);
    
    // Frequency and price data state
    const [selectedFrequency, setSelectedFrequency] = useState('one-time');
    const [frequencyPerWeek, setFrequencyPerWeek] = useState(1);
    
    // Reviews modal state
    const [showReviewsModal, setShowReviewsModal] = useState(false);
    const [gigReviews, setGigReviews] = useState([]);
    const [reviewStats, setReviewStats] = useState(null);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    
    // Task management state
    const [tasks, setTasks] = useState([
      {
        id: 1,
        text: 'Help with physical therapy exercises or encourage light exercise like walking',
        isExplanatory: true,
        deletable: false
      },
      {
        id: 2,
        text: 'Walk my dogs and feed my cat for a month',
        isExplanatory: true,
        deletable: false
      },
      {
        id: 3,
        text: 'Catering and cooking international dishes for a month',
        isExplanatory: true,
        deletable: false
      }
    ]);
    const [taskValidationError, setTaskValidationError] = useState('');
    
    const navigate = useNavigate();
    const basePath = "/app/client"; // Base path for your routes
    
    // Get user tasks (non-explanatory)
    const userTasks = tasks.filter(task => !task.isExplanatory);

    // Task validation - now optional but informational
    const validateTasks = () => {
      if (userTasks.length === 0) {
        setTaskValidationError('💡 Tip: Adding specific tasks helps caregivers provide better personalized service');
        return true; // Allow payment to proceed
      }
      setTaskValidationError('');
      return true;
    };

    // Handle task management
    const handleAddTask = (newTaskText) => {
      if (!newTaskText.trim()) return;
      
      const newTask = {
        id: Date.now(),
        text: newTaskText.trim(),
        isExplanatory: false,
        deletable: true
      };
      
      setTasks([...tasks, newTask]);
      setTaskValidationError('');
    };

    const handleRemoveTask = (taskId) => {
      const taskToRemove = tasks.find(task => task.id === taskId);
      if (taskToRemove && taskToRemove.deletable) {
        setTasks(tasks.filter(task => task.id !== taskId));
      }
    };  
    // Handle frequency change from ServiceFrequency
    const handleFrequencyChange = (serviceType, freqPerWeek) => {
      setSelectedFrequency(serviceType);
      setFrequencyPerWeek(freqPerWeek);
    };

    // Handle opening reviews modal
    const handleOpenReviews = async () => {
      setShowReviewsModal(true);
      setReviewsLoading(true);
      
      try {
        const { reviews, stats } = await GigReviewService.getReviewsWithStats(id);
        setGigReviews(reviews);
        setReviewStats(stats);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setGigReviews([]);
        setReviewStats(null);
      } finally {
        setReviewsLoading(false);
      }
    };

    // Mobile detection effect
    useEffect(() => {
      const checkIsMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      
      checkIsMobile();
      window.addEventListener('resize', checkIsMobile);
      
      return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    const handleHire = async () => {
      if (!service) return;
      
      // Show informational message about tasks (non-blocking)
      validateTasks();
      
      const user = JSON.parse(localStorage.getItem("userDetails"));
      
      // Store task data for later use (tasks will be saved after order creation)
      const taskData = {
        gigId: id,
        providerId: service.caregiverId,
        tasks: userTasks.map(task => task.text),
        timestamp: new Date().toISOString()
      };
      localStorage.setItem("pendingTaskData", JSON.stringify(taskData));
    
      try {
        // NEW SECURE API: Only send identifiers, backend calculates all amounts
        const payload = {
          gigId: id,
          serviceType: selectedFrequency, // "one-time", "weekly", or "monthly"
          frequencyPerWeek: frequencyPerWeek, // 1-7
          email: user?.email,
          redirectUrl: `${window.location.origin}/app/client/payment-success`,
        };
    
        const token = localStorage.getItem('authToken');
        const response = await fetch(
          `${config.BASE_URL}/payments/initiate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload),
          }
        );
    
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Payment initiation failed");
        }
    
        const data = await response.json();
        console.log("Payment Response:", data);
    
        if (data.success && data.paymentLink) {
          // Store transaction reference for status check after redirect
          localStorage.setItem("transactionReference", data.transactionReference);
          
          // Optionally store breakdown for display purposes
          if (data.breakdown) {
            localStorage.setItem("paymentBreakdown", JSON.stringify(data.breakdown));
          }
          
          // Redirect to Flutterwave payment gateway
          window.location.href = data.paymentLink;
        } else {
          throw new Error(data.message || "Failed to get payment link");
        }
      } catch (error) {
        console.error("Payment error:", error);
        setError(error.message);
      }
    };

    useEffect(() => {
    
        //get user details from local storage
     
        const fetchServiceDetails = async () => {
          try {
            setLoading(true);
            setError(null);
            
            // Use the enhanced ClientGigService to get all enriched gigs
            const allGigs = await ClientGigService.getAllGigs();
            
            // Find the specific gig by ID
            const foundGig = allGigs.find(gig => gig.id === id);
            
            if (!foundGig) {
              throw new Error("Service not found or no longer available");
            }
            
            console.log("Service details:", foundGig);
            setService(foundGig);
            
            // Default to one-time service with frequency 1
            setSelectedFrequency('one-time');
            setFrequencyPerWeek(1);
          } catch (error) {
            console.error("Error fetching service details:", error);
            setError(error.message);
          } finally {
            setLoading(false);
          }
        };
    
        fetchServiceDetails();
      }, [id]);
    
      if (loading) return <p>Loading...</p>;
      if (error) return <p className="error">{error}</p>;
    
      // Mobile layout: Order specifications header -> Order details -> Service frequency -> Task list
      // Desktop layout: Order specifications (all components) -> Order details
      if (isMobile) {
        return (
          <div className="cart-page">
            <div className="cart-container">
              {/* Order specifications header and service info */}
              <div className="order-specifications">
                <h2 className="order-specifications__title">Order Specifications</h2>
                <div className="order-specifications__service-description">
                  {service?.title || 'Service Title Not Available'}
                </div>
                <ServiceProvider service={service} onRatingClick={handleOpenReviews} />
              </div>
              
              {/* Order details */}
              <OrderDetails 
                service={service} 
                selectedFrequency={selectedFrequency}
                frequencyPerWeek={frequencyPerWeek}
                onPayment={handleHire}
              />
              
              {/* Service frequency */}
              <div className="order-specifications">
                <ServiceFrequency
                  selectedFrequency={selectedFrequency}
                  frequencyPerWeek={frequencyPerWeek}
                  onFrequencyChange={handleFrequencyChange}
                  service={service}
                />
                
                {/* Task validation error */}
                {taskValidationError && (
                  <div className="order-specifications__error">
                    {taskValidationError}
                  </div>
                )}
                
                {/* Task list */}
                <TaskList 
                  tasks={tasks}
                  onAddTask={handleAddTask}
                  onRemoveTask={handleRemoveTask}
                  service={service}
                  userTasksCount={userTasks.length}
                  validateTasks={validateTasks}
                />
              </div>
            </div>
            
            {/* Reviews Modal */}
            <ReviewsModal
              isOpen={showReviewsModal}
              onClose={() => setShowReviewsModal(false)}
              reviews={gigReviews}
              stats={reviewStats}
              loading={reviewsLoading}
              gigTitle={service?.title}
            />
          </div>
        );
      }
      
      // Desktop layout (original)
      return (
        <div className="cart-page">
          <div className="cart-container">
            <OrderSpecifications 
              service={service} 
              selectedFrequency={selectedFrequency}
              frequencyPerWeek={frequencyPerWeek}
              onFrequencyChange={handleFrequencyChange}
              tasks={tasks}
              onAddTask={handleAddTask}
              onRemoveTask={handleRemoveTask}
              taskValidationError={taskValidationError}
              userTasksCount={userTasks.length}
              validateTasks={validateTasks}
              onRatingClick={handleOpenReviews}
            />
            <OrderDetails 
              service={service} 
              selectedFrequency={selectedFrequency}
              frequencyPerWeek={frequencyPerWeek}
              onPayment={handleHire}
            />
          </div>
          
          {/* Reviews Modal */}
          <ReviewsModal
            isOpen={showReviewsModal}
            onClose={() => setShowReviewsModal(false)}
            reviews={gigReviews}
            stats={reviewStats}
            loading={reviewsLoading}
            gigTitle={service?.title}
          />
        </div>
      );
};

export default Cart;