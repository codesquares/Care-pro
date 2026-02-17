/**
 * Unified Pricing Templates for Gig Creation
 *
 * Consolidated from the former pricingTemplates.js and packageTemplates.js into
 * a single source of truth.  Every gig category has three pricing tiers
 * (budget / standard / premium), each containing Basic, Standard, and Premium
 * packages with name, amount, delivery cadence, details string, and a tasks
 * array used as auto-fill suggestions.
 *
 * The `tier` field ("general" | "specialized") mirrors serviceClassification.js
 * so the pricing UI can show lock indicators for specialized categories.
 */

import { SERVICE_TIERS } from './serviceClassification';

// ─── Templates ───────────────────────────────────────────────────────────────

export const pricingTemplates = {

  /* ╔══════════════════════════════════════════════════════════════════╗
     ║  GENERAL CATEGORIES                                            ║
     ╚══════════════════════════════════════════════════════════════════╝ */

  "Adult Care": {
    tier: SERVICE_TIERS.GENERAL,
    icon: "👴",
    budget: {
      name: "Budget Adult Care",
      description: "Affordable basic elderly care services",
      tasks: [
        "Companionship and conversation",
        "Meal preparation and assistance",
        "Medication reminders",
        "Light housekeeping",
      ],
      packages: {
        Basic: {
          name: "Essential Adult Care",
          amount: "10000",
          deliveryTime: "1 Day Per Week",
          details: "Companionship; Meal preparation; Medication reminders; Light housekeeping",
        },
        Standard: {
          name: "Standard Adult Care",
          amount: "15000",
          deliveryTime: "2 Days Per Week",
          details: "Essential care plus; Bathing and grooming; Mobility assistance; Personal hygiene support",
        },
        Premium: {
          name: "Enhanced Adult Care",
          amount: "20000",
          deliveryTime: "3 Days Per Week",
          details: "Standard care plus; Overnight supervision; Emergency response; Dressing assistance",
        },
      },
    },
    standard: {
      name: "Standard Adult Care",
      description: "Comprehensive elderly care services",
      tasks: [
        "Personal care assistance",
        "Medication management reminders",
        "Mobility support",
        "Companionship",
        "Bathing and grooming",
        "Dressing assistance",
        "Meal planning",
      ],
      packages: {
        Basic: {
          name: "Daily Adult Support",
          amount: "20000",
          deliveryTime: "1 Day Per Week",
          details: "Personal care assistance; Medication reminders; Mobility support; Companionship",
        },
        Standard: {
          name: "Weekly Adult Care",
          amount: "30000",
          deliveryTime: "3 Days Per Week",
          details: "Daily support plus; Bathing and grooming; Dressing assistance; Meal planning",
        },
        Premium: {
          name: "Comprehensive Adult Care",
          amount: "40000",
          deliveryTime: "5 Days Per Week",
          details: "Weekly care plus; Toileting and hygiene support; Overnight supervision; Family coordination",
        },
      },
    },
    premium: {
      name: "Premium Adult Care",
      description: "High-end comprehensive elderly care",
      tasks: [
        "Personalized care plans",
        "Advanced medication reminders",
        "Therapeutic activities",
        "Nutritional support",
        "Private support",
        "Wellness monitoring",
        "Transportation services",
        "24/7 availability",
      ],
      packages: {
        Basic: {
          name: "Premium Daily Adult Care",
          amount: "30000",
          deliveryTime: "1 Day Per Week",
          details: "Personalized care plans; Advanced medication reminders; Therapeutic activities; Nutritional support",
        },
        Standard: {
          name: "Premium Weekly Adult Care",
          amount: "40000",
          deliveryTime: "4 Days Per Week",
          details: "Premium daily care plus; Wellness monitoring; Transportation services; Companionship",
        },
        Premium: {
          name: "VIP Adult Care Package",
          amount: "50000",
          deliveryTime: "6 Days Per Week",
          details: "Premium weekly care plus; Live-in caregiver option; 24/7 monitoring; Family caregiver relief",
        },
      },
    },
  },

  "Child Care": {
    tier: SERVICE_TIERS.GENERAL,
    icon: "👶",
    budget: {
      name: "Budget Child Care",
      description: "Affordable basic child care services",
      tasks: [
        "Babysitting",
        "Meal preparation and feeding",
        "Homework assistance",
        "Basic supervision",
      ],
      packages: {
        Basic: {
          name: "Essential Child Care",
          amount: "10000",
          deliveryTime: "1 Day Per Week",
          details: "Babysitting; Meal preparation; Homework assistance; Basic supervision",
        },
        Standard: {
          name: "Standard Child Care",
          amount: "15000",
          deliveryTime: "2 Days Per Week",
          details: "Essential care plus; Recreational activities; Educational support; Emotional check-ins",
        },
        Premium: {
          name: "Enhanced Child Care",
          amount: "20000",
          deliveryTime: "3 Days Per Week",
          details: "Standard care plus; Tutoring support; Creative activities; Respite care",
        },
      },
    },
    standard: {
      name: "Standard Child Care",
      description: "Comprehensive child care services",
      tasks: [
        "Babysitting",
        "Meal preparation",
        "Homework help",
        "Play activities",
        "Educational activities",
        "Recreational outings",
        "Emotional support",
      ],
      packages: {
        Basic: {
          name: "Daily Child Support",
          amount: "20000",
          deliveryTime: "1 Day Per Week",
          details: "Babysitting; Meal preparation; Homework help; Play activities",
        },
        Standard: {
          name: "Weekly Child Care",
          amount: "30000",
          deliveryTime: "3 Days Per Week",
          details: "Daily support plus; Educational activities; Recreational outings; Emotional support",
        },
        Premium: {
          name: "Comprehensive Child Care",
          amount: "40000",
          deliveryTime: "5 Days Per Week",
          details: "Weekly care plus; Tutoring; Creative projects; Social skills development",
        },
      },
    },
    premium: {
      name: "Premium Child Care",
      description: "High-end comprehensive child care",
      tasks: [
        "Personalized learning plans",
        "Educational enrichment",
        "Creative activities",
        "Nutritious meals",
        "Professional tutoring",
        "Extracurricular support",
        "Development tracking",
      ],
      packages: {
        Basic: {
          name: "Premium Daily Child Care",
          amount: "30000",
          deliveryTime: "1 Day Per Week",
          details: "Personalized learning plans; Educational enrichment; Creative activities; Nutritious meals",
        },
        Standard: {
          name: "Premium Weekly Child Care",
          amount: "40000",
          deliveryTime: "4 Days Per Week",
          details: "Premium daily care plus; Professional tutoring; Extracurricular support; Development tracking",
        },
        Premium: {
          name: "VIP Child Care Package",
          amount: "50000",
          deliveryTime: "6 Days Per Week",
          details: "Premium weekly care plus; Dedicated nanny; Educational programs; Activity coordination",
        },
      },
    },
  },

  "Home Care": {
    tier: SERVICE_TIERS.GENERAL,
    icon: "🏠",
    budget: {
      name: "Budget Home Care",
      description: "Affordable home maintenance services",
      tasks: [
        "Light housekeeping",
        "Cleaning",
        "Laundry",
        "Basic tidying",
      ],
      packages: {
        Basic: {
          name: "Essential Home Care",
          amount: "10000",
          deliveryTime: "1 Day Per Week",
          details: "Light housekeeping; Cleaning; Laundry; Basic tidying",
        },
        Standard: {
          name: "Standard Home Care",
          amount: "15000",
          deliveryTime: "2 Days Per Week",
          details: "Essential care plus; Cooking; Errands and shopping; Home organization",
        },
        Premium: {
          name: "Enhanced Home Care",
          amount: "20000",
          deliveryTime: "3 Days Per Week",
          details: "Standard care plus; Deep cleaning; Home safety assessment; Transportation services",
        },
      },
    },
    standard: {
      name: "Standard Home Care",
      description: "Comprehensive home support services",
      tasks: [
        "Housekeeping",
        "Cooking",
        "Errands",
        "Basic maintenance",
        "Deep cleaning",
        "Shopping",
        "Home organization",
      ],
      packages: {
        Basic: {
          name: "Daily Home Support",
          amount: "20000",
          deliveryTime: "1 Day Per Week",
          details: "Housekeeping; Cooking; Errands; Basic maintenance",
        },
        Standard: {
          name: "Weekly Home Care",
          amount: "30000",
          deliveryTime: "3 Days Per Week",
          details: "Daily support plus; Deep cleaning; Shopping; Home organization",
        },
        Premium: {
          name: "Comprehensive Home Care",
          amount: "40000",
          deliveryTime: "5 Days Per Week",
          details: "Weekly care plus; Full home management; Meal planning; Transportation",
        },
      },
    },
    premium: {
      name: "Premium Home Care",
      description: "High-end home management services",
      tasks: [
        "Professional housekeeping",
        "Gourmet meal prep",
        "Concierge errands",
        "Home organization",
        "Full home management",
        "Personal shopping",
        "Maintenance coordination",
      ],
      packages: {
        Basic: {
          name: "Premium Home Care",
          amount: "30000",
          deliveryTime: "1 Day Per Week",
          details: "Professional housekeeping; Gourmet meal prep; Concierge errands; Home organization",
        },
        Standard: {
          name: "Premium Weekly Home Care",
          amount: "40000",
          deliveryTime: "4 Days Per Week",
          details: "Premium daily care plus; Full home management; Personal shopping; Maintenance coordination",
        },
        Premium: {
          name: "VIP Home Care Package",
          amount: "50000",
          deliveryTime: "6 Days Per Week",
          details: "Premium weekly care plus; Estate management; 24/7 concierge; Complete home services",
        },
      },
    },
  },

  "Pet Care": {
    tier: SERVICE_TIERS.GENERAL,
    icon: "🐕",
    budget: {
      name: "Budget Pet Care",
      description: "Affordable pet care services",
      tasks: [
        "Feeding",
        "Dog walking",
        "Basic grooming",
        "Companionship",
      ],
      packages: {
        Basic: {
          name: "Essential Pet Care",
          amount: "10000",
          deliveryTime: "1 Day Per Week",
          details: "Feeding; Dog walking; Basic grooming; Companionship",
        },
        Standard: {
          name: "Standard Pet Care",
          amount: "15000",
          deliveryTime: "2 Days Per Week",
          details: "Essential care plus; Extended walks; Play time; Basic training",
        },
        Premium: {
          name: "Enhanced Pet Care",
          amount: "20000",
          deliveryTime: "3 Days Per Week",
          details: "Standard care plus; Pet sitting; Health observation; Vet visit support",
        },
      },
    },
    standard: {
      name: "Standard Pet Care",
      description: "Comprehensive pet care services",
      tasks: [
        "Feeding",
        "Dog walking",
        "Grooming",
        "Play activities",
        "Extended care",
        "Training",
        "Socialization",
      ],
      packages: {
        Basic: {
          name: "Daily Pet Support",
          amount: "20000",
          deliveryTime: "1 Day Per Week",
          details: "Feeding; Dog walking; Grooming; Play activities",
        },
        Standard: {
          name: "Weekly Pet Care",
          amount: "30000",
          deliveryTime: "3 Days Per Week",
          details: "Daily support plus; Extended care; Training; Socialization",
        },
        Premium: {
          name: "Comprehensive Pet Care",
          amount: "40000",
          deliveryTime: "5 Days Per Week",
          details: "Weekly care plus; Pet sitting; Health monitoring; Vet coordination",
        },
      },
    },
    premium: {
      name: "Premium Pet Care",
      description: "High-end pet care services",
      tasks: [
        "Professional grooming",
        "Specialized feeding",
        "Training",
        "Wellness checks",
        "Luxury grooming",
        "Professional training",
        "Vet coordination",
      ],
      packages: {
        Basic: {
          name: "Premium Pet Care",
          amount: "30000",
          deliveryTime: "1 Day Per Week",
          details: "Professional grooming; Specialized feeding; Training; Wellness checks",
        },
        Standard: {
          name: "Premium Weekly Pet Care",
          amount: "40000",
          deliveryTime: "4 Days Per Week",
          details: "Premium daily care plus; Luxury grooming; Professional training; Vet coordination",
        },
        Premium: {
          name: "VIP Pet Care Package",
          amount: "50000",
          deliveryTime: "6 Days Per Week",
          details: "Premium weekly care plus; Live-in pet care; 24/7 monitoring; Spa services",
        },
      },
    },
  },

  "Mobility Support": {
    tier: SERVICE_TIERS.GENERAL,
    icon: "🦽",
    budget: {
      name: "Budget Mobility Support",
      description: "Affordable mobility assistance services",
      tasks: [
        "Mobility assistance",
        "Fall prevention monitoring",
        "Light exercise support",
        "Transportation to appointments",
      ],
      packages: {
        Basic: {
          name: "Essential Mobility Support",
          amount: "10000",
          deliveryTime: "1 Day Per Week",
          details: "Mobility assistance; Fall prevention monitoring; Light exercise support; Transportation",
        },
        Standard: {
          name: "Standard Mobility Support",
          amount: "15000",
          deliveryTime: "2 Days Per Week",
          details: "Essential support plus; Exercise routines; Walking assistance; Safety assessments",
        },
        Premium: {
          name: "Enhanced Mobility Support",
          amount: "20000",
          deliveryTime: "3 Days Per Week",
          details: "Standard support plus; Fitness programs; Outdoor activities; Progress tracking",
        },
      },
    },
    standard: {
      name: "Standard Mobility Support",
      description: "Comprehensive mobility assistance",
      tasks: [
        "Mobility assistance",
        "Fall prevention monitoring",
        "Exercise and fitness support",
        "Transportation to appointments",
        "Walking assistance",
        "Strength training support",
      ],
      packages: {
        Basic: {
          name: "Daily Mobility Support",
          amount: "20000",
          deliveryTime: "1 Day Per Week",
          details: "Mobility assistance; Fall prevention; Exercise support; Walking assistance",
        },
        Standard: {
          name: "Weekly Mobility Care",
          amount: "30000",
          deliveryTime: "3 Days Per Week",
          details: "Daily support plus; Strength training; Outdoor mobility; Safety reviews",
        },
        Premium: {
          name: "Comprehensive Mobility Care",
          amount: "40000",
          deliveryTime: "5 Days Per Week",
          details: "Weekly care plus; Full fitness program; Progress tracking; Family coordination",
        },
      },
    },
    premium: {
      name: "Premium Mobility Support",
      description: "High-end mobility and fitness care",
      tasks: [
        "Personalized mobility plans",
        "Advanced fall prevention",
        "Professional fitness support",
        "Full transportation services",
        "Progress tracking and reporting",
      ],
      packages: {
        Basic: {
          name: "Premium Mobility Care",
          amount: "30000",
          deliveryTime: "1 Day Per Week",
          details: "Personalized mobility plans; Advanced fall prevention; Professional fitness; Transportation",
        },
        Standard: {
          name: "Premium Weekly Mobility",
          amount: "40000",
          deliveryTime: "4 Days Per Week",
          details: "Premium daily care plus; Dedicated support; Equipment guidance; Goal tracking",
        },
        Premium: {
          name: "VIP Mobility Package",
          amount: "50000",
          deliveryTime: "6 Days Per Week",
          details: "Premium weekly care plus; Full-time mobility assistant; 24/7 support; Complete coordination",
        },
      },
    },
  },

  /* ╔══════════════════════════════════════════════════════════════════╗
     ║  SPECIALIZED CATEGORIES                                        ║
     ╚══════════════════════════════════════════════════════════════════╝ */

  "Medical Support": {
    tier: SERVICE_TIERS.SPECIALIZED,
    icon: "💊",
    budget: {
      name: "Budget Medical Support",
      description: "Affordable home medical support services",
      tasks: [
        "Nursing care",
        "Medication administration",
        "Medical appointment coordination",
        "Vital signs monitoring",
      ],
      packages: {
        Basic: {
          name: "Essential Medical Support",
          amount: "15000",
          deliveryTime: "1 Day Per Week",
          details: "Nursing care; Medication administration; Vital signs checks; Appointment coordination",
        },
        Standard: {
          name: "Standard Medical Support",
          amount: "25000",
          deliveryTime: "2 Days Per Week",
          details: "Essential care plus; Wound care; Health monitoring; Medical report documentation",
        },
        Premium: {
          name: "Enhanced Medical Support",
          amount: "35000",
          deliveryTime: "3 Days Per Week",
          details: "Standard care plus; Chronic illness management; Specialist coordination; Emergency protocols",
        },
      },
    },
    standard: {
      name: "Standard Medical Support",
      description: "Comprehensive home medical care",
      tasks: [
        "Nursing care",
        "Medication administration",
        "Wound care and dressing",
        "Vital signs monitoring",
        "Medical appointment coordination",
        "Health documentation",
        "Specialist coordination",
      ],
      packages: {
        Basic: {
          name: "Daily Medical Support",
          amount: "25000",
          deliveryTime: "1 Day Per Week",
          details: "Nursing care; Medication administration; Vital signs; Wound care",
        },
        Standard: {
          name: "Weekly Medical Support",
          amount: "40000",
          deliveryTime: "3 Days Per Week",
          details: "Daily support plus; Health monitoring; Medical reports; Appointment management",
        },
        Premium: {
          name: "Comprehensive Medical Support",
          amount: "55000",
          deliveryTime: "5 Days Per Week",
          details: "Weekly care plus; Chronic illness management; Specialist coordination; Emergency response",
        },
      },
    },
    premium: {
      name: "Premium Medical Support",
      description: "High-end professional medical care",
      tasks: [
        "Advanced nursing care",
        "Complex medication management",
        "Post-operative monitoring",
        "Chronic disease management",
        "24/7 medical support",
        "Specialist coordination",
        "Family medical briefings",
      ],
      packages: {
        Basic: {
          name: "Premium Medical Care",
          amount: "40000",
          deliveryTime: "1 Day Per Week",
          details: "Advanced nursing care; Complex medication management; Post-op monitoring; Health assessments",
        },
        Standard: {
          name: "Premium Weekly Medical",
          amount: "60000",
          deliveryTime: "4 Days Per Week",
          details: "Premium daily plus; Chronic disease management; Specialist coordination; Detailed reporting",
        },
        Premium: {
          name: "VIP Medical Support Package",
          amount: "80000",
          deliveryTime: "6 Days Per Week",
          details: "Premium weekly plus; 24/7 medical support; Live-in nursing; Family medical briefings",
        },
      },
    },
  },

  "Post Surgery Care": {
    tier: SERVICE_TIERS.SPECIALIZED,
    icon: "🏥",
    budget: {
      name: "Budget Post-Surgery Care",
      description: "Affordable post-operative recovery support",
      tasks: [
        "Wound care",
        "Medication management",
        "Mobility assistance",
        "Basic hygiene support",
      ],
      packages: {
        Basic: {
          name: "Essential Recovery Care",
          amount: "10000",
          deliveryTime: "1 Day Per Week",
          details: "Wound care; Medication management; Mobility assistance; Basic hygiene support",
        },
        Standard: {
          name: "Standard Recovery Care",
          amount: "15000",
          deliveryTime: "2 Days Per Week",
          details: "Essential care plus; Post-surgery monitoring; Feeding assistance; Home safety checks",
        },
        Premium: {
          name: "Enhanced Recovery Care",
          amount: "20000",
          deliveryTime: "3 Days Per Week",
          details: "Standard care plus; Specialized wound care; Physical therapy support; Emergency response",
        },
      },
    },
    standard: {
      name: "Standard Post-Surgery Care",
      description: "Comprehensive post-operative care",
      tasks: [
        "Wound care and dressing",
        "Medication management",
        "Mobility assistance",
        "Pain management support",
        "Post-surgery monitoring",
        "Feeding assistance",
        "Exercise support",
      ],
      packages: {
        Basic: {
          name: "Daily Recovery Support",
          amount: "20000",
          deliveryTime: "1 Day Per Week",
          details: "Wound care; Medication management; Mobility assistance; Pain management support",
        },
        Standard: {
          name: "Weekly Recovery Care",
          amount: "30000",
          deliveryTime: "3 Days Per Week",
          details: "Daily support plus; Post-surgery monitoring; Feeding assistance; Exercise support",
        },
        Premium: {
          name: "Comprehensive Recovery Care",
          amount: "40000",
          deliveryTime: "5 Days Per Week",
          details: "Weekly care plus; Specialized nursing; Physical therapy coordination; 24/7 support",
        },
      },
    },
    premium: {
      name: "Premium Post-Surgery Care",
      description: "High-end post-operative recovery",
      tasks: [
        "Advanced wound care",
        "Specialized medication management",
        "Rehabilitation support",
        "Nutritional guidance",
        "Private nursing",
        "Physical therapy",
        "Medical coordination",
      ],
      packages: {
        Basic: {
          name: "Premium Recovery Care",
          amount: "30000",
          deliveryTime: "1 Day Per Week",
          details: "Advanced wound care; Specialized medication management; Rehabilitation support; Nutritional guidance",
        },
        Standard: {
          name: "Premium Weekly Recovery",
          amount: "40000",
          deliveryTime: "4 Days Per Week",
          details: "Premium daily care plus; Private nursing; Physical therapy; Medical coordination",
        },
        Premium: {
          name: "VIP Recovery Package",
          amount: "50000",
          deliveryTime: "6 Days Per Week",
          details: "Premium weekly care plus; Live-in medical support; 24/7 nursing; Specialist coordination",
        },
      },
    },
  },

  "Special Needs Care": {
    tier: SERVICE_TIERS.SPECIALIZED,
    icon: "💙",
    budget: {
      name: "Budget Special Needs Care",
      description: "Affordable specialized disability support",
      tasks: [
        "Disability support",
        "Behavioral support",
        "Communication assistance",
        "Daily living skills",
      ],
      packages: {
        Basic: {
          name: "Essential Special Needs Care",
          amount: "10000",
          deliveryTime: "1 Day Per Week",
          details: "Disability support; Behavioral support; Communication assistance; Daily living skills",
        },
        Standard: {
          name: "Standard Special Needs Care",
          amount: "15000",
          deliveryTime: "2 Days Per Week",
          details: "Essential care plus; Autism support; Assistive device training; Social skills development",
        },
        Premium: {
          name: "Enhanced Special Needs Care",
          amount: "20000",
          deliveryTime: "3 Days Per Week",
          details: "Standard care plus; Dementia care; Language support; Cognitive stimulation",
        },
      },
    },
    standard: {
      name: "Standard Special Needs Care",
      description: "Comprehensive specialized disability care",
      tasks: [
        "Disability support services",
        "Behavioral support",
        "Communication assistance",
        "Personal care",
        "Autism support",
        "Dementia care",
        "Skills training",
      ],
      packages: {
        Basic: {
          name: "Daily Special Needs Support",
          amount: "20000",
          deliveryTime: "1 Day Per Week",
          details: "Disability support services; Behavioral support; Communication assistance; Personal care",
        },
        Standard: {
          name: "Weekly Special Needs Care",
          amount: "30000",
          deliveryTime: "3 Days Per Week",
          details: "Daily support plus; Autism support; Dementia care; Skills training",
        },
        Premium: {
          name: "Comprehensive Special Needs",
          amount: "40000",
          deliveryTime: "5 Days Per Week",
          details: "Weekly care plus; Specialized therapy; Cognitive programs; Family support",
        },
      },
    },
    premium: {
      name: "Premium Special Needs Care",
      description: "High-end specialized disability support",
      tasks: [
        "Personalized care plans",
        "Advanced behavioral support",
        "Specialized therapy",
        "Skills development",
        "Professional therapists",
        "Cognitive programs",
        "Family coordination",
      ],
      packages: {
        Basic: {
          name: "Premium Special Needs Care",
          amount: "30000",
          deliveryTime: "1 Day Per Week",
          details: "Personalized care plans; Advanced behavioral support; Specialized therapy; Skills development",
        },
        Standard: {
          name: "Premium Weekly Special Needs",
          amount: "40000",
          deliveryTime: "4 Days Per Week",
          details: "Premium daily care plus; Professional therapists; Cognitive programs; Family coordination",
        },
        Premium: {
          name: "VIP Special Needs Package",
          amount: "50000",
          deliveryTime: "6 Days Per Week",
          details: "Premium weekly care plus; Dedicated specialist; 24/7 support; Multidisciplinary team",
        },
      },
    },
  },

  "Palliative": {
    tier: SERVICE_TIERS.SPECIALIZED,
    icon: "🕊️",
    budget: {
      name: "Budget Palliative Care",
      description: "Affordable palliative and comfort care",
      tasks: [
        "Palliative care support",
        "Emotional support and check-ins",
        "Comfort measures",
        "Companionship",
      ],
      packages: {
        Basic: {
          name: "Essential Palliative Care",
          amount: "15000",
          deliveryTime: "1 Day Per Week",
          details: "Palliative care support; Emotional support; Comfort measures; Companionship",
        },
        Standard: {
          name: "Standard Palliative Care",
          amount: "25000",
          deliveryTime: "2 Days Per Week",
          details: "Essential care plus; Pain management support; Family coordination; Overnight supervision",
        },
        Premium: {
          name: "Enhanced Palliative Care",
          amount: "35000",
          deliveryTime: "3 Days Per Week",
          details: "Standard care plus; Symptom management; Spiritual support; Home safety assessment",
        },
      },
    },
    standard: {
      name: "Standard Palliative Care",
      description: "Comprehensive palliative support",
      tasks: [
        "Palliative care support",
        "Pain management support",
        "Emotional support for client and family",
        "Comfort measures",
        "Symptom management",
        "Spiritual support",
        "Home safety assessment",
      ],
      packages: {
        Basic: {
          name: "Daily Palliative Support",
          amount: "25000",
          deliveryTime: "1 Day Per Week",
          details: "Palliative care support; Pain management; Emotional support; Comfort measures",
        },
        Standard: {
          name: "Weekly Palliative Care",
          amount: "40000",
          deliveryTime: "3 Days Per Week",
          details: "Daily support plus; Symptom management; Family coordination; Overnight supervision",
        },
        Premium: {
          name: "Comprehensive Palliative Care",
          amount: "55000",
          deliveryTime: "5 Days Per Week",
          details: "Weekly care plus; Hospice coordination; Spiritual support; 24/7 comfort care",
        },
      },
    },
    premium: {
      name: "Premium Palliative Care",
      description: "High-end end-of-life and comfort care",
      tasks: [
        "Advanced palliative care",
        "Comprehensive pain management",
        "End-of-life coordination",
        "Family grief support",
        "Hospice liaison",
        "24/7 comfort care",
        "Dignified care planning",
      ],
      packages: {
        Basic: {
          name: "Premium Palliative Care",
          amount: "40000",
          deliveryTime: "1 Day Per Week",
          details: "Advanced palliative care; Comprehensive pain management; End-of-life coordination; Family support",
        },
        Standard: {
          name: "Premium Weekly Palliative",
          amount: "60000",
          deliveryTime: "4 Days Per Week",
          details: "Premium daily plus; Hospice liaison; Spiritual support; Complete family guidance",
        },
        Premium: {
          name: "VIP Palliative Care Package",
          amount: "80000",
          deliveryTime: "6 Days Per Week",
          details: "Premium weekly plus; Live-in comfort care; 24/7 support; Dignified end-of-life planning",
        },
      },
    },
  },

  "Therapy & Wellness": {
    tier: SERVICE_TIERS.SPECIALIZED,
    icon: "🧘",
    budget: {
      name: "Budget Therapy & Wellness",
      description: "Affordable therapy and wellness support",
      tasks: [
        "Physical therapy support",
        "Cognitive stimulation activities",
        "Emotional support and check-ins",
        "Recreational activities assistance",
      ],
      packages: {
        Basic: {
          name: "Essential Therapy Support",
          amount: "15000",
          deliveryTime: "1 Day Per Week",
          details: "Physical therapy support; Cognitive stimulation; Emotional support; Recreational activities",
        },
        Standard: {
          name: "Standard Therapy Support",
          amount: "25000",
          deliveryTime: "2 Days Per Week",
          details: "Essential support plus; Exercise programs; Mental wellness checks; Progress tracking",
        },
        Premium: {
          name: "Enhanced Therapy Support",
          amount: "35000",
          deliveryTime: "3 Days Per Week",
          details: "Standard support plus; Rehabilitation exercises; Occupational therapy aid; Goal setting",
        },
      },
    },
    standard: {
      name: "Standard Therapy & Wellness",
      description: "Comprehensive therapy and wellness care",
      tasks: [
        "Physical therapy support",
        "Cognitive stimulation activities",
        "Emotional support and check-ins",
        "Recreational activities assistance",
        "Exercise programs",
        "Mental wellness monitoring",
        "Progress tracking",
      ],
      packages: {
        Basic: {
          name: "Daily Therapy Support",
          amount: "25000",
          deliveryTime: "1 Day Per Week",
          details: "Physical therapy support; Cognitive stimulation; Emotional support; Exercise programs",
        },
        Standard: {
          name: "Weekly Therapy & Wellness",
          amount: "40000",
          deliveryTime: "3 Days Per Week",
          details: "Daily support plus; Mental wellness monitoring; Rehabilitation exercises; Goal tracking",
        },
        Premium: {
          name: "Comprehensive Therapy Care",
          amount: "55000",
          deliveryTime: "5 Days Per Week",
          details: "Weekly care plus; Occupational therapy aid; Full progress reporting; Family coordination",
        },
      },
    },
    premium: {
      name: "Premium Therapy & Wellness",
      description: "High-end therapy and rehabilitation support",
      tasks: [
        "Advanced physical therapy support",
        "Specialized rehabilitation",
        "Comprehensive mental wellness",
        "Professional therapy coordination",
        "Detailed progress reporting",
        "Family wellness briefings",
      ],
      packages: {
        Basic: {
          name: "Premium Therapy Care",
          amount: "40000",
          deliveryTime: "1 Day Per Week",
          details: "Advanced physical therapy; Specialized rehabilitation; Mental wellness; Progress assessments",
        },
        Standard: {
          name: "Premium Weekly Therapy",
          amount: "60000",
          deliveryTime: "4 Days Per Week",
          details: "Premium daily plus; Professional therapy coordination; Detailed reporting; Wellness programs",
        },
        Premium: {
          name: "VIP Therapy & Wellness",
          amount: "80000",
          deliveryTime: "6 Days Per Week",
          details: "Premium weekly plus; Dedicated therapist support; 24/7 wellness; Family briefings",
        },
      },
    },
  },
};

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Get pricing tier options (budget/standard/premium) for a category.
 * Falls back to Adult Care if the category has no templates.
 */
export const getTemplateOptions = (category = null) => {
  const categoryTemplates = pricingTemplates[category] || pricingTemplates["Adult Care"];

  return Object.entries(categoryTemplates)
    .filter(([key]) => key !== 'tier' && key !== 'icon')
    .map(([key, template]) => ({
      value: key,
      label: template.name,
      description: template.description,
      tasks: template.tasks || [],
    }));
};

/**
 * Get the full pricing packages for a category + pricing tier.
 */
export const getPricingFromTemplate = (category, templateKey) => {
  const categoryTemplates = pricingTemplates[category] || pricingTemplates["Adult Care"];
  const template = categoryTemplates[templateKey];
  return template ? template.packages : null;
};

/**
 * Get tasks list for a category + pricing tier (for auto-fill suggestions).
 */
export const getTasksFromTemplate = (category, templateKey) => {
  const categoryTemplates = pricingTemplates[category] || pricingTemplates["Adult Care"];
  const template = categoryTemplates[templateKey];
  return template?.tasks || [];
};

/**
 * Get the tier classification for a category's templates.
 */
export const getCategoryTemplateTier = (category) => {
  const categoryTemplates = pricingTemplates[category];
  return categoryTemplates?.tier || SERVICE_TIERS.GENERAL;
};

/**
 * Get the icon for a category.
 */
export const getCategoryIcon = (category) => {
  const categoryTemplates = pricingTemplates[category];
  return categoryTemplates?.icon || '📋';
};
