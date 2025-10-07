import { useState, useEffect } from 'react';
import './CaregiverRecommendations.css';
import ClientCareNeedsService from '../../../services/clientCareNeedsService';

/**
 * CaregiverRecommendations component shows recommended caregivers based on client's care needs
 * This is displayed at the bottom of the CareNeedsSettings page
 */
const CaregiverRecommendations = ({ careNeeds, visible }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch recommendations when care needs change
  useEffect(() => {
    const fetchRecommendations = async () => {
      // Only fetch if we have some care needs set and component is visible
      if (!visible || !careNeeds || !careNeeds.primaryCondition) {
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        // Get matching caregivers from service
        const matchingCaregivers = await ClientCareNeedsService.getMatchingCaregivers(careNeeds);
        setRecommendations(matchingCaregivers);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Unable to load caregiver recommendations');
        setLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [careNeeds, visible]);

  if (!visible) {
    return null;
  }

  return (
    <div className="caregiver-recommendations">
      <h2>Recommended Caregivers</h2>
      <p className="recommendations-description">
        Based on your care needs, these caregivers might be a good match for you.
      </p>
      
      {loading && (
        <div className="loading-container">
          <div className="loader"></div>
          <p>Finding the best caregivers for you...</p>
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      {!loading && !error && recommendations.length === 0 && (
        <div className="no-results">
          <p>No matching caregivers found. Try updating your care needs preferences.</p>
        </div>
      )}
      
      {!loading && !error && recommendations.length > 0 && (
        <div className="recommendation-cards">
          {recommendations.map(caregiver => (
            <div key={caregiver.id} className="caregiver-card">
              <div className="match-score">
                <span className="score-value">{caregiver.matchScore}%</span>
                <span className="score-label">Match</span>
              </div>
              <h3>{caregiver.name}</h3>
              <div className="rating">
                <span className="stars">{'★'.repeat(Math.floor(caregiver.rating))}</span>
                <span className="rating-value">{caregiver.rating}</span>
              </div>
              <div className="specialties">
                <strong>Specialties:</strong> {caregiver.specialties.join(', ')}
              </div>
              <div className="experience">
                <strong>Experience:</strong> {caregiver.yearsExperience} years
              </div>
              <div className="rate">
                <strong>Rate:</strong> ${caregiver.hourlyRate}/hour
              </div>
              <button 
                className="view-profile-btn"
                onClick={() => window.location.href = `/app/caregivers/${caregiver.id}`}
              >
                View Profile
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CaregiverRecommendations;
