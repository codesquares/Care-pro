
import OrderSpecifications from '../../../components/cart/OrderSpecifications';
import OrderDetails from '../../../components/cart/OrderDetails';
import ServiceProvider from '../../../components/cart/ServiceProvider';
import ServiceFrequency from '../../../components/cart/ServiceFrequency';
import TaskList from '../../../components/cart/TaskList';
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
    const [selectedFrequency, setSelectedFrequency] = useState('weekly');
    const [frequencyPriceData, setFrequencyPriceData] = useState(null);
    
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
    const handleFrequencyChange = (frequencyId, priceData) => {
      setSelectedFrequency(frequencyId);
      setFrequencyPriceData(priceData);
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
      // const id = user?.id;
      
      // Calculate total amount (order fee + service fee)
      const orderFee = frequencyPriceData ? frequencyPriceData.calculatedPrice : service.price;
      const serviceFee = orderFee * 0.05;
      const totalAmount = orderFee + serviceFee;
      
      // Store all order data for payment success page
      const orderData = {
        gigId: id,
        serviceId: id,
        providerId: service.caregiverId,
        selectedFrequency,
        priceData: frequencyPriceData,
        tasks: userTasks.map(task => task.text), // Only user tasks, as text array
        userDetails: user,
        timestamp: new Date().toISOString(),
        totalAmount: totalAmount // Store calculated total
      };
      
      localStorage.setItem("orderData", JSON.stringify(orderData));
      localStorage.setItem("gigId", id);
      
      // Store total amount (not just order fee) for payment
      localStorage.setItem("amount", totalAmount);
      localStorage.setItem("providerId", service.caregiverId);

      console.log("Order data prepared:", orderData);
      console.log("Payment amount (total):", totalAmount);
    
      try {
        const payload = {
          amount: totalAmount, // Send total amount (order fee + service fee)
          email: user?.email,
          currency: "NIGN",
          redirectUrl: `${window.location.origin}/app/client/payment-success`,
        };
    
        // FIXED: Use centralized config instead of hardcoded Azure staging API URL for payment initiation
        const response = await fetch(
          `${config.BASE_URL}/payments/initiate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );
    
        if (!response.ok) {
          throw new Error("Payment initiation failed");
        }
    
        const data = await response.json();
        console.log("Payment Response:", data);
    
        if (data.status === "success" && data.data?.link) {
          window.location.href = data.data.link; // Redirect to payment gateway
        } else {
          throw new Error("Failed to get payment link");
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
            
            // Calculate default weekly frequency price data
            const weeklyMultiplier = 4; // Assuming weekly means 4 times per month
            const defaultWeeklyPrice = foundGig.price * weeklyMultiplier;
            const defaultPriceData = {
              frequency: 'weekly',
              multiplier: weeklyMultiplier,
              basePrice: foundGig.price,
              calculatedPrice: defaultWeeklyPrice
            };
            
            // Set default frequency price data
            setFrequencyPriceData(defaultPriceData);
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
                <ServiceProvider service={service} />
              </div>
              
              {/* Order details */}
              <OrderDetails 
                service={service} 
                selectedFrequency={selectedFrequency}
                priceData={frequencyPriceData}
                onPayment={handleHire}
              />
              
              {/* Service frequency */}
              <div className="order-specifications">
                <ServiceFrequency
                  selectedFrequency={selectedFrequency}
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
              onFrequencyChange={handleFrequencyChange}
              tasks={tasks}
              onAddTask={handleAddTask}
              onRemoveTask={handleRemoveTask}
              taskValidationError={taskValidationError}
              userTasksCount={userTasks.length}
              validateTasks={validateTasks}
            />
            <OrderDetails 
              service={service} 
              selectedFrequency={selectedFrequency}
              priceData={frequencyPriceData}
              onPayment={handleHire}
            />
          </div>
        </div>
      );
};

export default Cart;