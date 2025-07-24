import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmptyState from "../../../../components/EmptyState"; 
import clock from "../../../../assets/main-app/clock.png"; // Ensure you have an empty gigs image in your assets
import "./gigs-section.css";

const GigsSection = () => {
  const [gigs, setGigs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const basePath = "/app/caregiver";

  const handleNavigateToCreateGig = () => {
    navigate(`${basePath}/create-gigs`);
  };

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        const userDetails = JSON.parse(localStorage.getItem("userDetails"));
        if (!userDetails?.id) {
          throw new Error("Caregiver ID not found in local storage.");
        }

        const response = await fetch(
          `https://carepro-api20241118153443.azurewebsites.net/api/Gigs/caregiver/caregiverId?caregiverId=${userDetails.id}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch gigs data.");
        }

        const data = await response.json();
        setGigs(data);
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchGigs();
  }, []);

  if (isLoading) {
    return (
      <div className="spinner-container">
        <div className="spinner" />
        <p>Loading gigs...</p>
      </div>
    );
  }

  if (error) return <p>Error: {error}</p>;

  return (
    <div className="gigs-section">
      <h3>Active Gigs</h3>
      {gigs.length === 0 ? (
        <EmptyState
          logo={<img src={clock} alt="No Gigs" style={{ width: 80 }} />}
          title="No Gigs Yet"
          description="You haven’t created any gigs. Get started by creating one."
          action={
            <button className="create-gig-btn" onClick={handleNavigateToCreateGig}>
              Create Gig
            </button>
          }
        />
      ) : (
        <div className="gigs-grid">
          {gigs.map((gig) => (
            <div key={gig.id} className="gig-card">
              <img
                src={gig.image1 || "https://via.placeholder.com/150"}
                alt={gig.title}
                className="gig-image"
              />
              <h4 className="gig-title">{gig.title}</h4>
            </div>
          ))}
          <div className="gig-card create-new" onClick={handleNavigateToCreateGig}>
            <div className="create-icon">+</div>
            <p>Create a new Gig</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GigsSection;
