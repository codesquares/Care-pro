/**
 * Comprehensive Preferences Service
 * Combines basic client preferences with detailed care needs for complete matching
 */
import ClientPreferenceService from './clientPreferenceService';
import ClientCareNeedsService from './clientCareNeedsService';

class ComprehensivePreferencesService {
  /**
   * Get combined preferences and care needs for a client
   * @param {string} clientId - The client's ID
   * @returns {Promise<Object>} Combined preferences object
   */
  static async getComprehensivePreferences(clientId) {
    try {
      // Fetch both basic preferences and detailed care needs in parallel
      const [basicPreferences, careNeeds] = await Promise.all([
        ClientPreferenceService.getPreferences(clientId).catch(() => this.getDefaultBasicPreferences()),
        ClientCareNeedsService.getCareNeeds().catch(() => this.getDefaultCareNeeds())
      ]);

      // Combine both into a comprehensive preference object
      return {
        clientId,
        
        // Basic preferences (logistics and general matching)
        basic: {
          serviceType: basicPreferences.serviceType || '',
          location: basicPreferences.location || '',
          schedule: basicPreferences.schedule || '',
          needs: basicPreferences.needs || '',
          serviceFrequency: basicPreferences.serviceFrequency || 'as-needed',
          budget: basicPreferences.budget || { min: '', max: '' },
          specialRequirements: basicPreferences.specialRequirements || '',
          caregiverPreferences: basicPreferences.caregiverPreferences || {
            gender: '',
            ageRange: '',
            experience: '',
            languages: []
          }
        },
        
        // Detailed care needs (medical, service-specific, caregiver requirements)
        detailed: {
          // Medical needs
          medical: {
            primaryCondition: careNeeds.primaryCondition || '',
            additionalConditions: careNeeds.additionalConditions || [],
            mobilityLevel: careNeeds.mobilityLevel || '',
            assistanceLevel: careNeeds.assistanceLevel || '',
            dietaryRestrictions: careNeeds.dietaryRestrictions || [],
            medicationManagement: careNeeds.medicationManagement || false,
            frequentMonitoring: careNeeds.frequentMonitoring || false,
            specialEquipment: careNeeds.specialEquipment || [],
            additionalNotes: careNeeds.additionalNotes || ''
          },
          
          // Service categories and specific services
          services: {
            categories: careNeeds.serviceCategories || [],
            specificServices: careNeeds.specificServices || {}
          },
          
          // Detailed caregiver requirements
          caregiverRequirements: careNeeds.caregiverRequirements || {
            certifications: [],
            experienceLevel: '',
            languages: [],
            personalityTraits: [],
            availability: [],
            specialSkills: []
          }
        },
        
        // Combined metadata
        lastUpdated: new Date().toISOString(),
        completeness: this.calculateCompleteness(basicPreferences, careNeeds)
      };
    } catch (error) {
      console.error('Error fetching comprehensive preferences:', error);
      throw error;
    }
  }

  /**
   * Save comprehensive preferences (updates both basic preferences and care needs)
   * @param {string} clientId - The client's ID
   * @param {Object} comprehensivePreferences - The complete preferences object
   * @returns {Promise<Object>} Updated comprehensive preferences
   */
  static async saveComprehensivePreferences(clientId, comprehensivePreferences) {
    try {
      // Extract basic preferences and care needs from comprehensive object
      const basicPreferences = {
        serviceType: comprehensivePreferences.basic?.serviceType || '',
        location: comprehensivePreferences.basic?.location || '',
        schedule: comprehensivePreferences.basic?.schedule || '',
        needs: comprehensivePreferences.basic?.needs || '',
        serviceFrequency: comprehensivePreferences.basic?.serviceFrequency || 'as-needed',
        budget: comprehensivePreferences.basic?.budget || { min: '', max: '' },
        specialRequirements: comprehensivePreferences.basic?.specialRequirements || '',
        caregiverPreferences: comprehensivePreferences.basic?.caregiverPreferences || {
          gender: '',
          ageRange: '',
          experience: '',
          languages: []
        }
      };

      const careNeeds = {
        // Medical needs
        primaryCondition: comprehensivePreferences.detailed?.medical?.primaryCondition || '',
        additionalConditions: comprehensivePreferences.detailed?.medical?.additionalConditions || [],
        mobilityLevel: comprehensivePreferences.detailed?.medical?.mobilityLevel || '',
        assistanceLevel: comprehensivePreferences.detailed?.medical?.assistanceLevel || '',
        dietaryRestrictions: comprehensivePreferences.detailed?.medical?.dietaryRestrictions || [],
        medicationManagement: comprehensivePreferences.detailed?.medical?.medicationManagement || false,
        frequentMonitoring: comprehensivePreferences.detailed?.medical?.frequentMonitoring || false,
        specialEquipment: comprehensivePreferences.detailed?.medical?.specialEquipment || [],
        additionalNotes: comprehensivePreferences.detailed?.medical?.additionalNotes || '',
        
        // Service categories
        serviceCategories: comprehensivePreferences.detailed?.services?.categories || [],
        specificServices: comprehensivePreferences.detailed?.services?.specificServices || {},
        
        // Caregiver requirements
        caregiverRequirements: comprehensivePreferences.detailed?.caregiverRequirements || {
          certifications: [],
          experienceLevel: '',
          languages: [],
          personalityTraits: [],
          availability: [],
          specialSkills: []
        }
      };

      // Save both in parallel
      const [updatedBasicPreferences, updatedCareNeeds] = await Promise.all([
        ClientPreferenceService.savePreferences(clientId, basicPreferences),
        ClientCareNeedsService.saveCareNeeds(careNeeds)
      ]);

      // Return updated comprehensive preferences
      return this.getComprehensivePreferences(clientId);
    } catch (error) {
      console.error('Error saving comprehensive preferences:', error);
      throw error;
    }
  }

  /**
   * Calculate completeness percentage of preferences
   * @param {Object} basicPreferences - Basic preferences object
   * @param {Object} careNeeds - Care needs object
   * @returns {number} Completeness percentage (0-100)
   */
  static calculateCompleteness(basicPreferences, careNeeds) {
    let totalFields = 0;
    let filledFields = 0;

    // Check basic preferences
    const basicFields = [
      'serviceType', 'location', 'schedule', 'needs', 'serviceFrequency'
    ];
    
    basicFields.forEach(field => {
      totalFields++;
      if (basicPreferences[field] && basicPreferences[field] !== '') {
        filledFields++;
      }
    });

    // Check budget
    totalFields += 2;
    if (basicPreferences.budget?.min && basicPreferences.budget.min !== '') filledFields++;
    if (basicPreferences.budget?.max && basicPreferences.budget.max !== '') filledFields++;

    // Check caregiver preferences
    totalFields += 3;
    if (basicPreferences.caregiverPreferences?.gender && basicPreferences.caregiverPreferences.gender !== '') filledFields++;
    if (basicPreferences.caregiverPreferences?.ageRange && basicPreferences.caregiverPreferences.ageRange !== '') filledFields++;
    if (basicPreferences.caregiverPreferences?.experience && basicPreferences.caregiverPreferences.experience !== '') filledFields++;

    // Check care needs
    const careFields = ['primaryCondition', 'mobilityLevel', 'assistanceLevel'];
    careFields.forEach(field => {
      totalFields++;
      if (careNeeds[field] && careNeeds[field] !== '') {
        filledFields++;
      }
    });

    // Check service categories
    totalFields++;
    if (careNeeds.serviceCategories && careNeeds.serviceCategories.length > 0) {
      filledFields++;
    }

    // Check caregiver requirements
    totalFields++;
    if (careNeeds.caregiverRequirements?.experienceLevel && careNeeds.caregiverRequirements.experienceLevel !== '') {
      filledFields++;
    }

    return Math.round((filledFields / totalFields) * 100);
  }

  /**
   * Get default basic preferences structure
   * @returns {Object} Default basic preferences
   */
  static getDefaultBasicPreferences() {
    return {
      serviceType: '',
      location: '',
      schedule: '',
      needs: '',
      caregiverPreferences: {
        gender: '',
        ageRange: '',
        experience: '',
        languages: []
      },
      serviceFrequency: 'as-needed',
      budget: {
        min: '',
        max: ''
      },
      specialRequirements: ''
    };
  }

  /**
   * Get default care needs structure
   * @returns {Object} Default care needs
   */
  static getDefaultCareNeeds() {
    return {
      primaryCondition: '',
      additionalConditions: [],
      mobilityLevel: '',
      assistanceLevel: '',
      dietaryRestrictions: [],
      medicationManagement: false,
      frequentMonitoring: false,
      specialEquipment: [],
      additionalNotes: '',
      serviceCategories: [],
      specificServices: {},
      caregiverRequirements: {
        certifications: [],
        experienceLevel: '',
        languages: [],
        personalityTraits: [],
        availability: [],
        specialSkills: []
      }
    };
  }

  /**
   * Get matching criteria for caregiver search
   * @param {string} clientId - The client's ID
   * @returns {Promise<Object>} Matching criteria object
   */
  static async getMatchingCriteria(clientId) {
    try {
      const comprehensivePreferences = await this.getComprehensivePreferences(clientId);
      
      return {
        // Location and scheduling
        location: comprehensivePreferences.basic.location,
        schedule: comprehensivePreferences.basic.schedule,
        serviceFrequency: comprehensivePreferences.basic.serviceFrequency,
        
        // Budget constraints
        budget: comprehensivePreferences.basic.budget,
        
        // Service requirements
        serviceCategories: comprehensivePreferences.detailed.services.categories,
        specificServices: comprehensivePreferences.detailed.services.specificServices,
        
        // Medical considerations
        medicalNeeds: {
          primaryCondition: comprehensivePreferences.detailed.medical.primaryCondition,
          assistanceLevel: comprehensivePreferences.detailed.medical.assistanceLevel,
          specialEquipment: comprehensivePreferences.detailed.medical.specialEquipment,
          medicationManagement: comprehensivePreferences.detailed.medical.medicationManagement
        },
        
        // Caregiver requirements
        caregiverRequirements: {
          ...comprehensivePreferences.detailed.caregiverRequirements,
          // Merge basic and detailed caregiver preferences
          gender: comprehensivePreferences.basic.caregiverPreferences.gender,
          preferredLanguages: [
            ...comprehensivePreferences.basic.caregiverPreferences.languages,
            ...comprehensivePreferences.detailed.caregiverRequirements.languages
          ].filter((lang, index, arr) => arr.indexOf(lang) === index) // Remove duplicates
        }
      };
    } catch (error) {
      console.error('Error getting matching criteria:', error);
      throw error;
    }
  }
}

export default ComprehensivePreferencesService;