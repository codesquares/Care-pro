import React from 'react';
import OrderSpecifications from '../../../components/cart/OrderSpecifications';
import OrderDetails from '../../../components/cart/OrderDetails';
import './Cart.css';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const Cart = () => {
   const { id } = useParams();
    const [service, setService] = useState(null);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
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

    // Task validation
    const validateTasks = () => {
      if (userTasks.length === 0) {
        setTaskValidationError('Please add at least one task for your caregiver');
        return false;
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
    // Handle frequency change from OrderSpecifications
    const handleFrequencyChange = (frequencyId, priceData) => {
      setSelectedFrequency(frequencyId);
      setFrequencyPriceData(priceData);
    };

    const handleHire = async () => {
      if (!service) return;
      
      // Validate tasks before proceeding to payment
      if (!validateTasks()) {
        return;
      }
      
      const user = JSON.parse(localStorage.getItem("userDetails"));
      
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
    
        const response = await fetch(
          "https://carepro-api20241118153443.azurewebsites.net/api/payments/initiate",
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
            const response = await fetch(
              `https://carepro-api20241118153443.azurewebsites.net/api/Gigs/gigId?gigId=${id}`
            );
            if (!response.ok) {
              throw new Error("Failed to fetch service details");
            }
            const data = await response.json();
            console.log("Service details:", data);
            setService(data);
          } catch (error) {
            setError(error.message);
          } finally {
            setLoading(false);
          }
        };
    
        fetchServiceDetails();
      }, [id]);
    
      if (loading) return <p>Loading...</p>;
      if (error) return <p className="error">{error}</p>;
    
      // // Extract service details
      // const { title, caregiverName, rating, packageDetails, image1, plan, price, features, videoURL } = service;
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