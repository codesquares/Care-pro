import { useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderCreated = useRef(false); // Prevent duplicate requests

  const status = searchParams.get("status");
  const transactionId = searchParams.get("transaction_id");
  const txRef = searchParams.get("tx_ref");

  const user = JSON.parse(localStorage.getItem("userDetails") || "{}");
  const gigId = localStorage.getItem("gigId");
  const amount = parseFloat(localStorage.getItem("amount") || "0");

  useEffect(() => {
    const createOrder = async () => {
      if (status === "successful" && transactionId && user?.id && gigId && !orderCreated.current) {
        orderCreated.current = true; // Mark as processed
        console.log("Payment Successful!", { transactionId, txRef });

        const orderPayload = {
          clientId: user.id,
          gigId: gigId,
          paymentOption: "Online Payment",
          amount: amount,
          transactionId: transactionId,
        };

        try {
          const response = await fetch(
            "https://carepro-api20241118153443.azurewebsites.net/api/ClientOrders",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(orderPayload),
            }
          );

          if (!response.ok) {
            throw new Error("Order creation failed");
          }

          const data = await response.json();
          console.log("Order Created Successfully:", data);

          setTimeout(() => {
            navigate("/app/client/my-orders");
          }, 2000);
        } catch (error) {
          console.error("Order creation error:", error);
        }
      }
    };

    createOrder();
  }, [status, transactionId, user, gigId, navigate]);

  return (
    <div className="container">
      <h1>Payment {status === "successful" ? "Successful" : "Failed"}</h1>
      {status === "successful" ? (
        <div>
          <p>Transaction ID: {transactionId}</p>
          <p>Reference: {txRef}</p>
          <button onClick={() => navigate("/app/client/my-order")}>Go to Order</button>
        </div>
      ) : (
        <div>
          <p>Something went wrong with your payment.</p>
          <button onClick={() => navigate("/app/client/home")}>Go to Home</button>
        </div>
        
        
      )}
    </div>
  );
};

export default PaymentSuccess;
