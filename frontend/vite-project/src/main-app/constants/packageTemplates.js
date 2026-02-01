// Predefined package templates for gig creation
export const packageTemplates = {
  elderlyCare: {
    name: "Elderly Care",
    icon: "👴",
    description: "Comprehensive care for seniors",
    templates: {
      basic: {
        name: "Essential Daily Care",
        tasks: [
          "Medication management and reminders",
          "Light housekeeping and laundry",
          "Meal preparation and assistance",
          "Companionship and conversation",
          "Mobility assistance within home"
        ],
        suggestedPrice: "15000-25000"
      },
      comprehensive: {
        name: "Full Support Care",
        tasks: [
          "24/7 medication management",
          "Complete housekeeping services",
          "Nutritious meal planning and preparation",
          "Personal care and hygiene assistance",
          "Transportation to medical appointments",
          "Exercise and mobility support",
          "Emergency response coordination"
        ],
        suggestedPrice: "35000-55000"
      },
      specialized: {
        name: "Medical Care Support",
        tasks: [
          "Post-surgery care and wound dressing",
          "Vital signs monitoring (blood pressure, temperature)",
          "Physical therapy assistance",
          "Diabetes management support",
          "Oxygen therapy assistance",
          "Medical equipment management"
        ],
        suggestedPrice: "45000-75000"
      }
    }
  },
  childCare: {
    name: "Child Care",
    icon: "👶",
    description: "Professional childcare services",
    templates: {
      basic: {
        name: "Standard Childcare",
        tasks: [
          "Age-appropriate activities and play",
          "Meal preparation and feeding",
          "Diaper changing and toilet training",
          "Nap time supervision",
          "Basic homework help",
          "Transportation to/from school"
        ],
        suggestedPrice: "20000-35000"
      },
      educational: {
        name: "Educational Support",
        tasks: [
          "Homework assistance and tutoring",
          "Reading and literacy development",
          "Educational games and activities",
          "STEM and creative projects",
          "Language learning support",
          "Test preparation help"
        ],
        suggestedPrice: "30000-50000"
      },
      specialNeeds: {
        name: "Special Needs Care",
        tasks: [
          "Individualized care planning",
          "Behavioral support and management",
          "Therapeutic activities",
          "Communication assistance",
          "Sensory integration activities",
          "Medical care coordination"
        ],
        suggestedPrice: "40000-70000"
      }
    }
  },
  medicalCare: {
    name: "Medical Care",
    icon: "🏥",
    description: "Professional medical and healthcare services",
    templates: {
      basic: {
        name: "General Health Support",
        tasks: [
          "Vital signs monitoring",
          "Medication administration",
          "Wound care and dressing changes",
          "Basic first aid",
          "Health education and counseling",
          "Appointment coordination"
        ],
        suggestedPrice: "30000-50000"
      },
      chronic: {
        name: "Chronic Condition Management",
        tasks: [
          "Disease-specific care (diabetes, hypertension, etc.)",
          "Symptom monitoring and management",
          "Medication regimen management",
          "Dietary and lifestyle counseling",
          "Regular health assessments",
          "Care coordination with healthcare providers"
        ],
        suggestedPrice: "40000-65000"
      },
      rehabilitation: {
        name: "Rehabilitation Support",
        tasks: [
          "Physical therapy assistance",
          "Occupational therapy support",
          "Mobility training and exercises",
          "Adaptive equipment training",
          "Pain management techniques",
          "Progress tracking and reporting"
        ],
        suggestedPrice: "45000-75000"
      }
    }
  },
  companionCare: {
    name: "Companion Care",
    icon: "🤝",
    description: "Social and emotional support services",
    templates: {
      basic: {
        name: "Social Companionship",
        tasks: [
          "Conversation and social interaction",
          "Light household tasks",
          "Errand running and shopping",
          "Letter writing and correspondence",
          "Hobby and interest activities",
          "Community outing assistance"
        ],
        suggestedPrice: "15000-30000"
      },
      premium: {
        name: "Premium Companionship",
        tasks: [
          "Personalized activity planning",
          "Cultural and entertainment outings",
          "Social event coordination",
          "Family communication support",
          "Memory care and reminiscence",
          "Advanced conversation therapy"
        ],
        suggestedPrice: "35000-60000"
      },
      overnight: {
        name: "Overnight Care",
        tasks: [
          "24-hour availability and monitoring",
          "Night-time care and assistance",
          "Sleep support and comfort",
          "Emergency response during night",
          "Morning routine assistance",
          "Sleep pattern monitoring"
        ],
        suggestedPrice: "50000-90000"
      }
    }
  },
  homeSupport: {
    name: "Home Support",
    icon: "🏠",
    description: "Household management and maintenance",
    templates: {
      basic: {
        name: "Light Housekeeping",
        tasks: [
          "General cleaning and tidying",
          "Laundry and ironing",
          "Dishwashing and kitchen cleanup",
          "Bathroom cleaning and maintenance",
          "Trash removal and recycling",
          "Basic organization assistance"
        ],
        suggestedPrice: "15000-25000"
      },
      comprehensive: {
        name: "Complete Home Management",
        tasks: [
          "Deep cleaning and sanitization",
          "Laundry and wardrobe management",
          "Meal planning and grocery shopping",
          "Home maintenance and repairs",
          "Bill paying and financial management",
          "Appointment and schedule coordination"
        ],
        suggestedPrice: "35000-55000"
      },
      specialized: {
        name: "Specialized Home Care",
        tasks: [
          "Post-hospitalization home recovery",
          "Terminal illness comfort care",
          "Hospice care support",
          "Palliative care assistance",
          "End-of-life care coordination",
          "Grief support and counseling"
        ],
        suggestedPrice: "40000-70000"
      }
    }
  }
};

// Helper function to get template categories
export const getTemplateCategories = () => {
  return Object.entries(packageTemplates).map(([key, category]) => ({
    value: key,
    label: category.name,
    icon: category.icon,
    description: category.description
  }));
};

// Helper function to get templates for a category
export const getTemplatesForCategory = (categoryKey) => {
  const category = packageTemplates[categoryKey];
  return category ? Object.entries(category.templates).map(([key, template]) => ({
    value: key,
    label: template.name,
    tasks: template.tasks,
    suggestedPrice: template.suggestedPrice
  })) : [];
};

// Helper function to get template data
export const getTemplateData = (categoryKey, templateKey) => {
  const category = packageTemplates[categoryKey];
  return category?.templates[templateKey] || null;
};