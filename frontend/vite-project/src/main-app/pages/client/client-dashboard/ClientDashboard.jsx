import React, { useState, useEffect } from "react";
import "./clientDashboard.css";
import Banner from "./Banner";
import ServiceCategory from "./ServiceCategory";

const ClientDashboard = () => {
  const [expertSupport, setExpertSupport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

      //get user data from local storage
      const user = JSON.parse(localStorage.getItem("userDetails"));

  useEffect(() => {


    const fetchExpertSupport = async () => {
      try {
        const response = await fetch("https://carepro-api20241118153443.azurewebsites.net/api/Gigs"); // Replace with your actual API URL
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const data = await response.json();
        setExpertSupport(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExpertSupport();
  }, []);

  return (
    <div className="dashboard">
      <Banner name={user.firstName + " " + user.lastName}  />
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && <ServiceCategory title="Expert Medical Support" services={expertSupport} />}
    </div>
  );
};

export default ClientDashboard;
