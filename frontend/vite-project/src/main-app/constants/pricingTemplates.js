// Predefined pricing templates for gig creation - organized by category
export const pricingTemplates = {
  "Adult Care": {
    budget: {
      name: "Budget Adult Care",
      description: "Affordable basic elderly care services",
      packages: {
        Basic: {
          name: "Essential Adult Care",
          amount: "10000",
          deliveryTime: "1 Day Per Week",
          details: "Companionship; Meal preparation; Medication reminders; Light housekeeping"
        },
        Standard: {
          name: "Standard Adult Care",
          amount: "15000",
          deliveryTime: "2 Days Per Week",
          details: "Essential care plus; Bathing and grooming; Mobility assistance; Personal hygiene support"
        },
        Premium: {
          name: "Enhanced Adult Care",
          amount: "20000",
          deliveryTime: "3 Days Per Week",
          details: "Standard care plus; Chronic illness management; Overnight supervision; Emergency response"
        }
      }
    },
    standard: {
      name: "Standard Adult Care",
      description: "Comprehensive elderly care services",
      packages: {
        Basic: {
          name: "Daily Adult Support",
          amount: "20000",
          deliveryTime: "1 Day Per Week",
          details: "Personal care assistance; Medication management; Mobility support; Companionship"
        },
        Standard: {
          name: "Weekly Adult Care",
          amount: "30000",
          deliveryTime: "3 Days Per Week",
          details: "Daily support plus; Bathing and grooming; Dressing assistance; Meal planning"
        },
        Premium: {
          name: "Comprehensive Adult Care",
          amount: "40000",
          deliveryTime: "5 Days Per Week",
          details: "Weekly care plus; Incontinence care; Chronic illness management; Family coordination"
        }
      }
    },
    premium: {
      name: "Premium Adult Care",
      description: "High-end comprehensive elderly care",
      packages: {
        Basic: {
          name: "Premium Daily Adult Care",
          amount: "30000",
          deliveryTime: "1 Day Per Week",
          details: "Personalized care plans; Advanced medication management; Therapeutic activities; Nutritional support"
        },
        Standard: {
          name: "Premium Weekly Adult Care",
          amount: "40000",
          deliveryTime: "4 Days Per Week",
          details: "Premium daily care plus; Private nursing support; Wellness monitoring; Transportation services"
        },
        Premium: {
          name: "VIP Adult Care Package",
          amount: "50000",
          deliveryTime: "6 Days Per Week",
          details: "Premium weekly care plus; Live-in caregiver option; 24/7 medical monitoring; Family caregiver relief"
        }
      }
    }
  },

  "Child Care": {
    budget: {
      name: "Budget Child Care",
      description: "Affordable basic child care services",
      packages: {
        Basic: {
          name: "Essential Child Care",
          amount: "10000",
          deliveryTime: "1 Day Per Week",
          details: "Babysitting; Meal preparation; Homework assistance; Basic supervision"
        },
        Standard: {
          name: "Standard Child Care",
          amount: "15000",
          deliveryTime: "2 Days Per Week",
          details: "Essential care plus; Recreational activities; Educational support; Emotional check-ins"
        },
        Premium: {
          name: "Enhanced Child Care",
          amount: "20000",
          deliveryTime: "3 Days Per Week",
          details: "Standard care plus; Tutoring support; Creative activities; Respite care"
        }
      }
    },
    standard: {
      name: "Standard Child Care",
      description: "Comprehensive child care services",
      packages: {
        Basic: {
          name: "Daily Child Support",
          amount: "20000",
          deliveryTime: "1 Day Per Week",
          details: "Babysitting; Meal preparation; Homework help; Play activities"
        },
        Standard: {
          name: "Weekly Child Care",
          amount: "30000",
          deliveryTime: "3 Days Per Week",
          details: "Daily support plus; Educational activities; Recreational outings; Emotional support"
        },
        Premium: {
          name: "Comprehensive Child Care",
          amount: "40000",
          deliveryTime: "5 Days Per Week",
          details: "Weekly care plus; Tutoring; Creative projects; Social skills development"
        }
      }
    },
    premium: {
      name: "Premium Child Care",
      description: "High-end comprehensive child care",
      packages: {
        Basic: {
          name: "Premium Daily Child Care",
          amount: "30000",
          deliveryTime: "1 Day Per Week",
          details: "Personalized learning plans; Educational enrichment; Creative activities; Nutritious meals"
        },
        Standard: {
          name: "Premium Weekly Child Care",
          amount: "40000",
          deliveryTime: "4 Days Per Week",
          details: "Premium daily care plus; Professional tutoring; Extracurricular support; Development tracking"
        },
        Premium: {
          name: "VIP Child Care Package",
          amount: "50000",
          deliveryTime: "6 Days Per Week",
          details: "Premium weekly care plus; Dedicated nanny; Educational programs; Activity coordination"
        }
      }
    }
  },

  "Post Surgery Care": {
    budget: {
      name: "Budget Post-Surgery Care",
      description: "Affordable post-operative recovery support",
      packages: {
        Basic: {
          name: "Essential Recovery Care",
          amount: "10000",
          deliveryTime: "1 Day Per Week",
          details: "Wound care; Medication management; Mobility assistance; Basic hygiene support"
        },
        Standard: {
          name: "Standard Recovery Care",
          amount: "15000",
          deliveryTime: "2 Days Per Week",
          details: "Essential care plus; Post-surgery monitoring; Feeding assistance; Home safety checks"
        },
        Premium: {
          name: "Enhanced Recovery Care",
          amount: "20000",
          deliveryTime: "3 Days Per Week",
          details: "Standard care plus; Specialized wound care; Physical therapy support; Emergency response"
        }
      }
    },
    standard: {
      name: "Standard Post-Surgery Care",
      description: "Comprehensive post-operative care",
      packages: {
        Basic: {
          name: "Daily Recovery Support",
          amount: "20000",
          deliveryTime: "1 Day Per Week",
          details: "Wound care; Medication management; Mobility assistance; Pain management support"
        },
        Standard: {
          name: "Weekly Recovery Care",
          amount: "30000",
          deliveryTime: "3 Days Per Week",
          details: "Daily support plus; Post-surgery monitoring; Feeding assistance; Exercise support"
        },
        Premium: {
          name: "Comprehensive Recovery Care",
          amount: "40000",
          deliveryTime: "5 Days Per Week",
          details: "Weekly care plus; Specialized nursing; Physical therapy coordination; 24/7 support"
        }
      }
    },
    premium: {
      name: "Premium Post-Surgery Care",
      description: "High-end post-operative recovery",
      packages: {
        Basic: {
          name: "Premium Recovery Care",
          amount: "30000",
          deliveryTime: "1 Day Per Week",
          details: "Advanced wound care; Specialized medication management; Rehabilitation support; Nutritional guidance"
        },
        Standard: {
          name: "Premium Weekly Recovery",
          amount: "40000",
          deliveryTime: "4 Days Per Week",
          details: "Premium daily care plus; Private nursing; Physical therapy; Medical coordination"
        },
        Premium: {
          name: "VIP Recovery Package",
          amount: "50000",
          deliveryTime: "6 Days Per Week",
          details: "Premium weekly care plus; Live-in medical support; 24/7 nursing; Specialist coordination"
        }
      }
    }
  },

  "Special Needs Care": {
    budget: {
      name: "Budget Special Needs Care",
      description: "Affordable specialized disability support",
      packages: {
        Basic: {
          name: "Essential Special Needs Care",
          amount: "10000",
          deliveryTime: "1 Day Per Week",
          details: "Disability support; Behavioral support; Communication assistance; Daily living skills"
        },
        Standard: {
          name: "Standard Special Needs Care",
          amount: "15000",
          deliveryTime: "2 Days Per Week",
          details: "Essential care plus; Autism support; Assistive device training; Social skills development"
        },
        Premium: {
          name: "Enhanced Special Needs Care",
          amount: "20000",
          deliveryTime: "3 Days Per Week",
          details: "Standard care plus; Dementia care; Language support; Cognitive stimulation"
        }
      }
    },
    standard: {
      name: "Standard Special Needs Care",
      description: "Comprehensive specialized disability care",
      packages: {
        Basic: {
          name: "Daily Special Needs Support",
          amount: "20000",
          deliveryTime: "1 Day Per Week",
          details: "Disability support services; Behavioral support; Communication assistance; Personal care"
        },
        Standard: {
          name: "Weekly Special Needs Care",
          amount: "30000",
          deliveryTime: "3 Days Per Week",
          details: "Daily support plus; Autism support; Dementia care; Skills training"
        },
        Premium: {
          name: "Comprehensive Special Needs",
          amount: "40000",
          deliveryTime: "5 Days Per Week",
          details: "Weekly care plus; Specialized therapy; Cognitive programs; Family support"
        }
      }
    },
    premium: {
      name: "Premium Special Needs Care",
      description: "High-end specialized disability support",
      packages: {
        Basic: {
          name: "Premium Special Needs Care",
          amount: "30000",
          deliveryTime: "1 Day Per Week",
          details: "Personalized care plans; Advanced behavioral support; Specialized therapy; Skills development"
        },
        Standard: {
          name: "Premium Weekly Special Needs",
          amount: "40000",
          deliveryTime: "4 Days Per Week",
          details: "Premium daily care plus; Professional therapists; Cognitive programs; Family coordination"
        },
        Premium: {
          name: "VIP Special Needs Package",
          amount: "50000",
          deliveryTime: "6 Days Per Week",
          details: "Premium weekly care plus; Dedicated specialist; 24/7 support; Multidisciplinary team"
        }
      }
    }
  },

  "Home Care": {
    budget: {
      name: "Budget Home Care",
      description: "Affordable home maintenance services",
      packages: {
        Basic: {
          name: "Essential Home Care",
          amount: "10000",
          deliveryTime: "1 Day Per Week",
          details: "Light housekeeping; Cleaning; Laundry; Basic tidying"
        },
        Standard: {
          name: "Standard Home Care",
          amount: "15000",
          deliveryTime: "2 Days Per Week",
          details: "Essential care plus; Cooking; Errands and shopping; Home organization"
        },
        Premium: {
          name: "Enhanced Home Care",
          amount: "20000",
          deliveryTime: "3 Days Per Week",
          details: "Standard care plus; Deep cleaning; Home safety assessment; Transportation services"
        }
      }
    },
    standard: {
      name: "Standard Home Care",
      description: "Comprehensive home support services",
      packages: {
        Basic: {
          name: "Daily Home Support",
          amount: "20000",
          deliveryTime: "1 Day Per Week",
          details: "Housekeeping; Cooking; Errands; Basic maintenance"
        },
        Standard: {
          name: "Weekly Home Care",
          amount: "30000",
          deliveryTime: "3 Days Per Week",
          details: "Daily support plus; Deep cleaning; Shopping; Home organization"
        },
        Premium: {
          name: "Comprehensive Home Care",
          amount: "40000",
          deliveryTime: "5 Days Per Week",
          details: "Weekly care plus; Full home management; Meal planning; Transportation"
        }
      }
    },
    premium: {
      name: "Premium Home Care",
      description: "High-end home management services",
      packages: {
        Basic: {
          name: "Premium Home Care",
          amount: "30000",
          deliveryTime: "1 Day Per Week",
          details: "Professional housekeeping; Gourmet meal prep; Concierge errands; Home organization"
        },
        Standard: {
          name: "Premium Weekly Home Care",
          amount: "40000",
          deliveryTime: "4 Days Per Week",
          details: "Premium daily care plus; Full home management; Personal shopping; Maintenance coordination"
        },
        Premium: {
          name: "VIP Home Care Package",
          amount: "50000",
          deliveryTime: "6 Days Per Week",
          details: "Premium weekly care plus; Estate management; 24/7 concierge; Luxury services"
        }
      }
    }
  },

  "Pet Care": {
    budget: {
      name: "Budget Pet Care",
      description: "Affordable pet care services",
      packages: {
        Basic: {
          name: "Essential Pet Care",
          amount: "10000",
          deliveryTime: "1 Day Per Week",
          details: "Feeding; Dog walking; Basic grooming; Companionship"
        },
        Standard: {
          name: "Standard Pet Care",
          amount: "15000",
          deliveryTime: "2 Days Per Week",
          details: "Essential care plus; Extended walks; Play time; Basic training"
        },
        Premium: {
          name: "Enhanced Pet Care",
          amount: "20000",
          deliveryTime: "3 Days Per Week",
          details: "Standard care plus; Pet sitting; Medication administration; Vet visits"
        }
      }
    },
    standard: {
      name: "Standard Pet Care",
      description: "Comprehensive pet care services",
      packages: {
        Basic: {
          name: "Daily Pet Support",
          amount: "20000",
          deliveryTime: "1 Day Per Week",
          details: "Feeding; Dog walking; Grooming; Play activities"
        },
        Standard: {
          name: "Weekly Pet Care",
          amount: "30000",
          deliveryTime: "3 Days Per Week",
          details: "Daily support plus; Extended care; Training; Socialization"
        },
        Premium: {
          name: "Comprehensive Pet Care",
          amount: "40000",
          deliveryTime: "5 Days Per Week",
          details: "Weekly care plus; Pet sitting; Medication; Health monitoring"
        }
      }
    },
    premium: {
      name: "Premium Pet Care",
      description: "High-end pet care services",
      packages: {
        Basic: {
          name: "Premium Pet Care",
          amount: "30000",
          deliveryTime: "1 Day Per Week",
          details: "Professional grooming; Specialized feeding; Training; Wellness checks"
        },
        Standard: {
          name: "Premium Weekly Pet Care",
          amount: "40000",
          deliveryTime: "4 Days Per Week",
          details: "Premium daily care plus; Luxury grooming; Professional training; Vet coordination"
        },
        Premium: {
          name: "VIP Pet Care Package",
          amount: "50000",
          deliveryTime: "6 Days Per Week",
          details: "Premium weekly care plus; Live-in pet care; 24/7 monitoring; Spa services"
        }
      }
    }
  },

  // Default template for categories not specified above
  "Default": {
    name: "Budget Care",
    description: "Affordable basic care services",
    packages: {
      Basic: {
        name: "Essential Care",
        amount: "15000",
        deliveryTime: "1 Day Per Week",
        details: "Basic daily assistance; Light housekeeping; Meal preparation; Companionship"
      },
      Standard: {
        name: "Standard Care",
        amount: "25000",
        deliveryTime: "2 Days Per Week",
        details: "Essential care plus; Medication reminders; Transportation assistance; Personal care support"
      },
      Premium: {
        name: "Enhanced Care",
        amount: "35000",
        deliveryTime: "3 Days Per Week",
        details: "Standard care plus; Specialized medical care; 24/7 availability; Emergency response"
      }
    }
  },
  standard: {
    name: "Standard Care",
    description: "Comprehensive care with balanced pricing",
    packages: {
      Basic: {
        name: "Daily Support",
        amount: "25000",
        deliveryTime: "1 Day Per Week",
        details: "Personal care assistance; Medication management; Light exercise support; Nutritional guidance"
      },
      Standard: {
        name: "Weekly Care",
        amount: "40000",
        deliveryTime: "3 Days Per Week",
        details: "Daily support plus; Housekeeping services; Meal planning and preparation; Transportation to appointments"
      },
      Premium: {
        name: "Comprehensive Care",
        amount: "60000",
        deliveryTime: "5 Days Per Week",
        details: "Weekly care plus; Specialized therapy; 24/7 emergency support; Family coordination"
      }
    }
  },
  premium: {
    name: "Premium Care",
    description: "High-end comprehensive care services",
    packages: {
      Basic: {
        name: "Premium Daily Care",
        amount: "45000",
        deliveryTime: "1 Day Per Week",
        details: "Personalized care plans; Advanced medication management; Therapeutic activities; Gourmet meal service"
      },
      Standard: {
        name: "Premium Weekly Care",
        amount: "75000",
        deliveryTime: "4 Days Per Week",
        details: "Premium daily care plus; Private nursing support; Wellness monitoring; Luxury transportation"
      },
      Premium: {
        name: "VIP Care Package",
        amount: "120000",
        deliveryTime: "6 Days Per Week",
        details: "Premium weekly care plus; Live-in caregiver option; 24/7 concierge service; Family caregiver relief"
      }
    }
  },

  // Default template for categories not specified above
  "Default": {
    budget: {
      name: "Budget Care",
      description: "Affordable basic care services",
      packages: {
        Basic: {
          name: "Essential Care",
          amount: "10000",
          deliveryTime: "1 Day Per Week",
          details: "Basic daily assistance; Light support; Companionship; Meal preparation"
        },
        Standard: {
          name: "Standard Care",
          amount: "15000",
          deliveryTime: "2 Days Per Week",
          details: "Essential care plus; Extended support; Personal assistance; Basic health monitoring"
        },
        Premium: {
          name: "Enhanced Care",
          amount: "20000",
          deliveryTime: "3 Days Per Week",
          details: "Standard care plus; Specialized care; 24/7 availability; Emergency response"
        }
      }
    },
    standard: {
      name: "Standard Care",
      description: "Comprehensive care with balanced pricing",
      packages: {
        Basic: {
          name: "Daily Support",
          amount: "20000",
          deliveryTime: "1 Day Per Week",
          details: "Personal care assistance; Health monitoring; Light activities; Nutritional guidance"
        },
        Standard: {
          name: "Weekly Care",
          amount: "30000",
          deliveryTime: "3 Days Per Week",
          details: "Daily support plus; Extended services; Activity support; Family coordination"
        },
        Premium: {
          name: "Comprehensive Care",
          amount: "40000",
          deliveryTime: "5 Days Per Week",
          details: "Weekly care plus; Specialized support; 24/7 emergency; Complete coordination"
        }
      }
    },
    premium: {
      name: "Premium Care",
      description: "High-end comprehensive care services",
      packages: {
        Basic: {
          name: "Premium Daily Care",
          amount: "30000",
          deliveryTime: "1 Day Per Week",
          details: "Personalized care plans; Advanced support; Professional services; Premium amenities"
        },
        Standard: {
          name: "Premium Weekly Care",
          amount: "40000",
          deliveryTime: "4 Days Per Week",
          details: "Premium daily care plus; Professional team; Wellness programs; Luxury services"
        },
        Premium: {
          name: "VIP Care Package",
          amount: "50000",
          deliveryTime: "6 Days Per Week",
          details: "Premium weekly care plus; Dedicated specialist; 24/7 concierge; Complete care"
        }
      }
    }
  }
};

// Helper function to get template options for dropdown based on category
export const getTemplateOptions = (category = null) => {
  // Get templates for the specific category or default
  const categoryTemplates = pricingTemplates[category] || pricingTemplates["Default"];
  
  return Object.entries(categoryTemplates).map(([key, template]) => ({
    value: key,
    label: template.name,
    description: template.description
  }));
};

// Helper function to get pricing data from template based on category
export const getPricingFromTemplate = (category, templateKey) => {
  const categoryTemplates = pricingTemplates[category] || pricingTemplates["Default"];
  const template = categoryTemplates[templateKey];
  return template ? template.packages : null;
};