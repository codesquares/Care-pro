import React from 'react';
import './GuidelinesCard.scss';

const GuidelinesCard = ({ currentPage, activeField, onClose }) => {
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
    'pricing-basic-name': {
      heading: "Basic Package Name",
      content: "Give your basic package a clear, appealing name that describes the core service.",
      tips: ["Keep it simple and clear", "Focus on the main benefit", "Use action words"]
    },
    'pricing-basic-details': {
      heading: "Basic Package Details",
      content: "Describe exactly what's included in your basic package. Be specific about what clients can expect.",
      tips: ["List specific deliverables", "Be clear about limitations", "Use bullet points for clarity"]
    },
    'pricing-basic-delivery': {
      heading: "Basic Package Delivery Time",
      content: "Set a realistic timeframe for completing the basic service. Consider your availability and workload.",
      tips: ["Be conservative with timing", "Account for potential delays", "Consider your other commitments"]
    },
    'pricing-basic-amount': {
      heading: "Basic Package Pricing",
      content: "Set a competitive price for your basic service. This should be your most affordable option.",
      tips: ["Research competitor pricing", "Don't undervalue your service", "Consider all your costs"]
    },
    'pricing-standard-name': {
      heading: "Standard Package Name",
      content: "Your standard package should offer more value than basic. Name it to reflect the enhanced service.",
      tips: ["Highlight the added value", "Make it sound appealing", "Show progression from basic"]
    },
    'pricing-standard-details': {
      heading: "Standard Package Details",
      content: "Describe the additional services or enhanced features included in your standard package.",
      tips: ["Clearly show what's extra vs basic", "Add meaningful value", "Make it your most popular option"]
    },
    'pricing-standard-delivery': {
      heading: "Standard Package Delivery Time",
      content: "Standard delivery time can be similar to basic or slightly longer if you're providing more comprehensive service.",
      tips: ["Balance speed with quality", "Consider the extra work involved", "Make it attractive to clients"]
    },
    'pricing-standard-amount': {
      heading: "Standard Package Pricing",
      content: "Price your standard package to reflect the additional value. This is often the most popular choice.",
      tips: ["Show clear value over basic", "Make it compelling", "Price for profitability"]
    },
    'pricing-premium-name': {
      heading: "Premium Package Name",
      content: "Your premium package should be the complete, full-service option. Name it to convey luxury and completeness.",
      tips: ["Emphasize exclusivity", "Use premium language", "Convey comprehensive service"]
    },
    'pricing-premium-details': {
      heading: "Premium Package Details",
      content: "Include everything from standard plus additional premium features. This should be your most comprehensive offering.",
      tips: ["Include everything possible", "Add exclusive bonuses", "Make it irresistible for those who want the best"]
    },
    'pricing-premium-delivery': {
      heading: "Premium Package Delivery Time",
      content: "Premium delivery can be faster (priority) or allow more time for comprehensive service, depending on your offering.",
      tips: ["Consider offering priority service", "Allow time for quality", "Make it feel exclusive"]
    },
    'pricing-premium-amount': {
      heading: "Premium Package Pricing",
      content: "Price your premium package significantly higher to reflect the comprehensive service and exclusivity.",
      tips: ["Price for value, not just cost", "Make the upgrade worthwhile", "Don't be afraid to price appropriately"]
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
      content: "Click on any pricing field to see specific guidance. Create three tiers to give clients options that fit their needs and budget.",
      tips: ["Basic: Essential service only", "Standard: Most popular option", "Premium: Full-service experience"]
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

  return (
    <>
      {activeField && (
        <div className="guidelines-backdrop" onClick={handleCloseGuidelines} />
      )}
      <div className={`guidelines-card ${activeField ? 'field-focused' : 'default-view'}`}>
        <div className="guidelines-header">
          <div className="header-content">
            <h3>{activeGuideline ? displayContent.heading : displayContent.title}</h3>
            <p>{activeField ? "Field-specific guidance" : "Follow these guidelines to create an effective gig"}</p>
          </div>
          {activeField && (
            <button className="close-guidelines" onClick={handleCloseGuidelines}>
              ✕
            </button>
          )}
        </div>
        
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
      </div>
    </>
  );
};

export default GuidelinesCard;
