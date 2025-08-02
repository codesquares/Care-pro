import React from 'react';
import './GuidelinesCard.scss';

const GuidelinesCard = ({ currentPage }) => {
  const guidelines = {
    0: { // Overview page
      title: "Overview Guidelines",
      sections: [
        {
          heading: "Title",
          content: "Create a clear, descriptive title that explains exactly what service you're offering. Be specific and professional.",
          tips: ["Keep it under 80 characters", "Include your main service", "Avoid generic terms"]
        },
        {
          heading: "Category & Subcategory",
          content: "Select the most relevant category for your service. You can choose multiple subcategories that apply.",
          tips: ["Choose the primary category first", "Select all relevant subcategories", "This helps clients find your gig"]
        },
        {
          heading: "Search Tags",
          content: "Add relevant keywords that clients might search for when looking for your services.",
          tips: ["Use 5-10 relevant tags", "Include location-specific terms", "Think like your clients"]
        }
      ]
    },
    1: { // Pricing page
      title: "Pricing Guidelines",
      sections: [
        {
          heading: "Package Structure",
          content: "Create three tiers (Basic, Standard, Premium) to give clients options that fit their needs and budget.",
          tips: ["Basic: Essential service only", "Standard: Most popular option", "Premium: Full-service experience"]
        },
        {
          heading: "Package Details",
          content: "Clearly describe what's included in each package. Be specific about deliverables.",
          tips: ["List exactly what's included", "Mention any limitations", "Use bullet points for clarity"]
        },
        {
          heading: "Delivery Time",
          content: "Set realistic timeframes for service completion. Consider your availability and workload.",
          tips: ["Be conservative with timing", "Account for potential delays", "Faster delivery can justify higher prices"]
        },
        {
          heading: "Pricing Strategy",
          content: "Price competitively but don't undervalue your services. Research similar gigs in your area.",
          tips: ["Start with market research", "Factor in all your costs", "Leave room for negotiation"]
        }
      ]
    },
    2: { // Gallery page
      title: "Gallery Guidelines",
      sections: [
        {
          heading: "Image Requirements",
          content: "Upload high-quality images that showcase your work, certifications, or relevant experience.",
          tips: ["Use high-resolution images", "Ensure good lighting", "Show your work environment", "Include certification photos"]
        },
        {
          heading: "Professional Presentation",
          content: "Your images should look professional and trustworthy. This is often the first impression clients get.",
          tips: ["Dress professionally in photos", "Use clean, organized backgrounds", "Show your tools/equipment", "Avoid personal/casual photos"]
        },
        {
          heading: "Video Content",
          content: "Consider adding a brief introduction video to build trust and showcase your personality.",
          tips: ["Keep videos under 2 minutes", "Speak clearly and confidently", "Mention your experience", "Show your workspace if relevant"]
        }
      ]
    },
    3: { // Publish page
      title: "Publishing Guidelines",
      sections: [
        {
          heading: "Final Review",
          content: "Review all your information carefully before publishing. Make sure everything is accurate and professional.",
          tips: ["Double-check all spelling", "Verify pricing is correct", "Ensure images load properly", "Review contact information"]
        },
        {
          heading: "Save as Draft",
          content: "Use this option if you need to make changes later or want to get feedback before going live.",
          tips: ["Drafts don't appear to clients", "You can edit anytime", "Get feedback from friends/family"]
        },
        {
          heading: "Publish Your Gig",
          content: "Once published, your gig will be visible to clients. You can still edit it later if needed.",
          tips: ["Monitor initial response", "Be ready to respond to inquiries", "Update regularly based on feedback"]
        }
      ]
    }
  };

  const currentGuidelines = guidelines[currentPage];

  if (!currentGuidelines) return null;

  return (
    <div className="guidelines-card">
      <div className="guidelines-header">
        <h3>{currentGuidelines.title}</h3>
        <p>Follow these guidelines to create an effective gig</p>
      </div>
      
      <div className="guidelines-content">
        {currentGuidelines.sections.map((section, index) => (
          <div key={index} className="guideline-section">
            <h4>{section.heading}</h4>
            <p>{section.content}</p>
            {section.tips && (
              <div className="tips">
                <strong>Tips:</strong>
                <ul>
                  {section.tips.map((tip, tipIndex) => (
                    <li key={tipIndex}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="guidelines-footer">
        <div className="help-note">
          <strong>💡 Need Help?</strong>
          <p>Contact our support team if you have questions about creating your gig.</p>
        </div>
      </div>
    </div>
  );
};

export default GuidelinesCard;
