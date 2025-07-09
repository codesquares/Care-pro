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
    const navigate = useNavigate();
    const basePath = "/app/client"; // Base path for your routes
  
  
    const handleHire = async () => {
      if (!service) return;
      const user = JSON.parse(localStorage.getItem("userDetails"));
      //set the gig id to the local storage
      localStorage.setItem("gigId", id);
      //set the amount to the local storage
      localStorage.setItem("amount", service.price);
      localStorage.setItem("providerId", service.caregiverId);
  
      console.log(user);
    
      try {
        const payload = {
          amount: service.price,
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
        <OrderSpecifications service={service} />
        <OrderDetails service={service} />
      </div>
    </div>
  );
};

export default Cart;