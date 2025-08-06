import React, { useState } from 'react';
import './GuidelinesCard.scss';

const GuidelinesCard = ({ currentPage, activeField, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const fieldGuidelines = {
    // Overview Page Fields
    'title': {
      heading: "Title Guidelines",
      content: "Create a clear, descriptive title that explains exactly what service you're offering. Be specific and professional.",
      tips: ["Keep it under 80 characters", "Include your main service", "Avoid generic terms", "Use keywords clients search for"]
    },
    'category': {
      heading: "Category Selection",
      content: "Select the most relevant category for your service. This is the primary classification that helps clients find your gig.",
      tips: ["Choose the main category that best fits", "Think from a client's perspective", "This affects how your gig appears in search"]
    },
    'subcategory': {
      heading: "Subcategory Selection",
      content: "Select all subcategories that apply to your service. You can choose multiple options to increase your visibility.",
      tips: ["Select all relevant options", "More subcategories = better discoverability", "Choose specific services you can actually provide"]
    },
    'searchTags': {
      heading: "Search Tags",
      content: "Add relevant keywords that clients might search for. These help your gig appear in search results.",
      tips: ["Use 5-10 relevant tags", "Include location-specific terms", "Think like your clients", "Add skill-related keywords"]
    },

    // Pricing Page Fields
    'basic-name': {
      heading: "Package Name",
      content: "Give your package a clear, appealing name that describes the core service.",
      tips: ["Keep it simple and clear", "Focus on the main benefit", "Use action words"]
    },
    'basic-details': {
      heading: "Package Details",
      content: "Describe exactly what's included in your package. Be specific about what clients can expect.",
      tips: ["List specific deliverables", "Be clear about limitations", "Use bullet points for clarity", "Separate with semicolons"]
    },
    'basic-delivery': {
      heading: "Service Frequency",
      content: "Set how often you'll provide this service. Choose the frequency that works best for your availability.",
      tips: ["Consider your schedule", "Be realistic about commitments", "Match client needs", "Account for travel time"]
    },
    'basic-amount': {
      heading: "Package Pricing",
      content: "Set a competitive price for your service. Consider your skills, experience, and local market rates.",
      tips: ["Research competitor pricing", "Don't undervalue your service", "Consider all your costs", "Factor in travel expenses"]
    },

    // Gallery Page Fields
    'gallery-upload': {
      heading: "Image Upload Guidelines",
      content: "Upload high-quality images that showcase your work, certifications, or relevant experience. First impressions matter.",
      tips: ["Use high-resolution images", "Ensure good lighting", "Show your work environment", "Include certification photos", "Avoid personal/casual photos"]
    },

    // Publish Page Fields
    'publish-review': {
      heading: "Final Review",
      content: "Review all your information carefully before publishing. Make sure everything is accurate and professional.",
      tips: ["Double-check all spelling", "Verify pricing is correct", "Ensure images load properly", "Review contact information"]
    },
    'publish-save-draft': {
      heading: "Save as Draft",
      content: "Use this option if you need to make changes later or want to get feedback before going live.",
      tips: ["Drafts don't appear to clients", "You can edit anytime", "Get feedback from friends/family"]
    },
    'publish-gig': {
      heading: "Publish Your Gig",
      content: "Once published, your gig will be visible to clients. You can still edit it later if needed.",
      tips: ["Monitor initial response", "Be ready to respond to inquiries", "Update regularly based on feedback"]
    }
  };

  const defaultPageGuidelines = {
    0: { // Overview page
      title: "Overview Guidelines",
      content: "Click on any field below to see specific guidance for that section. This page helps you set up the basic information about your gig.",
      tips: ["Fill out all required fields", "Be specific and professional", "Think from a client's perspective"]
    },
    1: { // Pricing page
      title: "Pricing Guidelines", 
      content: "Click on any pricing field to see specific guidance. Set up your service package with clear pricing and frequency options.",
      tips: ["Be clear about what's included", "Set competitive but fair pricing", "Choose realistic service frequency"]
    },
    2: { // Gallery page
      title: "Gallery Guidelines",
      content: "Click on the upload area to see specific guidance for images. Visual content is crucial for building trust with potential clients.",
      tips: ["High-quality images only", "Show your professionalism", "Include relevant certifications"]
    },
    3: { // Publish page
      title: "Publishing Guidelines",
      content: "Hover over the buttons below to see specific guidance. Review everything carefully before making your gig live.",
      tips: ["Review all information", "Test your images", "Double-check pricing"]
    }
  };

  // Determine what to show
  const activeGuideline = activeField ? fieldGuidelines[activeField] : null;
  const defaultGuideline = defaultPageGuidelines[currentPage];

  const displayContent = activeGuideline || defaultGuideline;

  if (!displayContent) return null;

  const handleCloseGuidelines = () => {
    if (onClose) onClose();
  };

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <>
      {activeField && (
        <div className="guidelines-backdrop" onClick={handleCloseGuidelines} />
      )}
      <div className={`guidelines-card ${activeField ? 'field-focused' : 'default-view'} ${isMinimized ? 'minimized' : ''}`}>
        <div className="guidelines-header">
          <div className="header-content">
            <h3>{activeGuideline ? displayContent.heading : displayContent.title}</h3>
            {!isMinimized && (
              <p>{activeField ? "Field-specific guidance" : "Follow these guidelines to create an effective gig"}</p>
            )}
          </div>
          <div className="header-controls">
            {/* Minimize/Maximize button for mobile */}
            <button className="minimize-guidelines mobile-only" onClick={handleToggleMinimize}>
              {isMinimized ? '▲' : '▼'}
            </button>
            {activeField && (
              <button className="close-guidelines" onClick={handleCloseGuidelines}>
                ✕
              </button>
            )}
          </div>
        </div>
        
        {!isMinimized && (
          <>
            <div className="guidelines-content">
              <div className="guideline-section">
                <p>{displayContent.content}</p>
                {displayContent.tips && (
                  <div className="tips">
                    <strong>💡 Tips:</strong>
                    <ul>
                      {displayContent.tips.map((tip, tipIndex) => (
                        <li key={tipIndex}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="guidelines-footer">
              <div className="help-note">
                <strong>{activeField ? "📝 Context Help" : "💡 Need Help?"}</strong>
                <p>
                  {activeField 
                    ? "This guidance is specific to the field you're currently working on."
                    : "Click on any form field to see specific guidance for that section."
                  }
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default GuidelinesCard;
