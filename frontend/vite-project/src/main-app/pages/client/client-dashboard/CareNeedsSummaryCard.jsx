import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientCareNeedsService from '../../../services/clientCareNeedsService';
import './careNeedsSummaryCard.css';

/**
 * CareNeedsSummaryCard - Displays a summary of the client's care needs
 * Styled to match the action cards design pattern
 */
const CareNeedsSummaryCard = () => {
  const navigate = useNavigate();
  const [careNeeds, setCareNeeds] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNeeds, setHasNeeds] = useState(false);

  // Service category icons mapping
  const categoryIcons = {
    'Adult Care': '👴',
    'Child Care': '👶',
    'Pet Care': '🐕',
    'Home Care': '🏠',
    'Post Surgery Care': '🏥',
    'Special Needs Care': '♿',
    'Medical Support': '⚕️',
    'Mobility Support': '🦽',
    'Therapy & Wellness': '🧘',
    'Palliative': '🕊️'
  };

  useEffect(() => {
    const fetchCareNeeds = async () => {
      try {
        setIsLoading(true);
        const needs = await ClientCareNeedsService.getCareNeeds();
        setCareNeeds(needs);
        
        const hasServiceCategories = needs?.serviceCategories && needs.serviceCategories.length > 0;
        setHasNeeds(hasServiceCategories);
      } catch (error) {
        console.error('Error fetching care needs:', error);
        setHasNeeds(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCareNeeds();
  }, []);

  const handleEditCareNeeds = () => {
    navigate('/app/client/care-needs?returnTo=/app/client/dashboard');
  };

  const handleFindMatches = () => {
    if (careNeeds?.serviceCategories && careNeeds.serviceCategories.length > 0) {
      const categorySlug = careNeeds.serviceCategories[0]
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace('&', '');
      navigate(`/marketplace?category=${categorySlug}&matched=true`);
    } else {
      navigate('/marketplace?matched=true');
    }
  };

  const handleSetupCareNeeds = () => {
    navigate('/app/client/care-needs?returnTo=/app/client/dashboard');
  };

  if (isLoading) {
    return (
      <div className="care-needs-card-wrapper">
        <div className="care-needs-card loading">
          <div className="loading-spinner-small"></div>
        </div>
      </div>
    );
  }

  // Show setup prompt if no care needs set
  if (!hasNeeds) {
    return (
      <div className="care-needs-card-wrapper">
        <div className="care-needs-card setup-card" onClick={handleSetupCareNeeds}>
          <div className="cn-card-icon setup-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
          <div className="cn-card-content">
            <span className="cn-card-label">SET YOUR CARE PREFERENCES</span>
            <span className="cn-card-title">Get matched with the best caregivers</span>
            <span className="cn-card-subtitle">Tell us what you need for personalized results</span>
          </div>
          <div className="cn-card-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // Get caregiver requirements summary
  const requirements = careNeeds?.caregiverRequirements || {};
  const certifications = requirements.certifications || [];
  const experienceLevel = requirements.experienceLevel || '';
  const languages = requirements.languages || [];
  const primaryCategory = careNeeds.serviceCategories[0];

  return (
    <div className="care-needs-card-wrapper">
      {/* Main Summary Card */}
      <div className="care-needs-card has-needs" onClick={handleEditCareNeeds}>
        <div className="cn-card-icon active-icon">
          <span className="check-icon">✓</span>
        </div>
        <div className="cn-card-content">
          <span className="cn-card-label success">CARE PREFERENCES SET</span>
          <span className="cn-card-title">
            {categoryIcons[primaryCategory] || '📋'} {primaryCategory}
            {careNeeds.serviceCategories.length > 1 && (
              <span className="more-categories">+{careNeeds.serviceCategories.length - 1} more</span>
            )}
          </span>
          <div className="cn-card-stats">
            {experienceLevel && <span className="stat">📊 {experienceLevel.split(' ')[0]}</span>}
            {certifications.length > 0 && <span className="stat">🏅 {certifications.length} certs</span>}
            {languages.length > 0 && <span className="stat">🗣️ {languages.length} langs</span>}
          </div>
        </div>
        <div className="cn-card-action">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </div>
      </div>

      {/* Find Matches Card */}
      <div className="care-needs-card match-card" onClick={handleFindMatches}>
        <div className="cn-card-icon match-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <div className="cn-card-content">
          <span className="cn-card-label match">FIND YOUR MATCHES</span>
          <span className="cn-card-title">View caregivers that match your needs</span>
        </div>
        <div className="cn-card-arrow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default CareNeedsSummaryCard;
