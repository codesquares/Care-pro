/**
 * Matching Service
 * Handles advanced matching between clients and caregivers/gigs
 * based on client preferences and needs
 */
import ClientPreferenceService from './clientPreferenceService';
import ClientCareNeedsService from './clientCareNeedsService';
import ComprehensivePreferencesService from './comprehensivePreferencesService';
import config from "../config"; // Centralized API configuration

class MatchingService {
  /**
   * Get recommended caregivers for a client based on their comprehensive preferences
   * @param {string} clientId - The client's ID
   * @returns {Promise<Array>} Array of matched caregivers with match scores
   */
  static async getRecommendedCaregivers(clientId) {
    try {
      // 1. Fetch comprehensive client preferences (combines basic prefs + detailed care needs)
      const matchingCriteria = await ComprehensivePreferencesService.getMatchingCriteria(clientId);
      
      // 2. Fetch all available caregivers
      const caregivers = await this.fetchAvailableCaregivers();
      
      // 3. Generate matches with enhanced scoring based on comprehensive criteria
      return this.matchCaregiversWithComprehensiveCriteria(caregivers, matchingCriteria);
    } catch (error) {
      console.error('Error in getRecommendedCaregivers:', error);
      
      // Fallback to legacy method if comprehensive preferences fail
      try {
        console.log('Falling back to legacy matching method');
        const clientPreferences = await ClientPreferenceService.getPreferences(clientId);
        const careNeeds = await ClientCareNeedsService.getCareNeeds();
        const caregivers = await this.fetchAvailableCaregivers();
        return this.matchCaregivers(caregivers, clientPreferences, careNeeds);
      } catch (fallbackError) {
        console.error('Fallback matching also failed:', fallbackError);
        throw fallbackError;
      }
    }
  }
  
  /**
   * Get recommended gigs for a client based on their preferences and needs
   * @param {string} clientId - The client's ID
   * @returns {Promise<Array>} Array of matched gigs with match scores
   */
  static async getRecommendedGigs(clientId) {
    try {
      // 1. Fetch client preferences
      const clientPreferences = await ClientPreferenceService.getPreferences(clientId);
      
      // 2. Fetch client care needs
      const careNeeds = await ClientCareNeedsService.getCareNeeds();
      
      // 3. Fetch all available gigs (in a real app, this would call an API endpoint)
      const gigs = await this.fetchAvailableGigs();
      
      // 4. Generate matches with scores
      return this.matchGigs(gigs, clientPreferences, careNeeds);
    } catch (error) {
      console.error('Error in getRecommendedGigs:', error);
      throw error;
    }
  }
  
  /**
   * Match caregivers to client preferences and needs
   * @param {Array} caregivers - Available caregivers
   * @param {Object} preferences - Client preferences
   * @param {Object} careNeeds - Client care needs
   * @returns {Array} Matched caregivers with scores
   */
  static matchCaregivers(caregivers, preferences, careNeeds) {
    return caregivers.map(caregiver => {
      // Initialize score
      let matchScore = 0;
      let maxPossibleScore = 0;
      const matchDetails = [];
      
      // Match service type
      if (preferences.serviceType && caregiver.specialties && 
          caregiver.specialties.includes(preferences.serviceType)) {
        matchScore += 20;
        matchDetails.push(`Specializes in ${preferences.serviceType}`);
      }
      maxPossibleScore += 20;
      
      // Match location
      if (preferences.location && caregiver.location === preferences.location) {
        matchScore += 15;
        matchDetails.push(`Located in ${preferences.location}`);
      }
      maxPossibleScore += 15;
      
      // Match gender preference
      if (preferences.caregiverPreferences && 
          preferences.caregiverPreferences.gender &&
          caregiver.gender === preferences.caregiverPreferences.gender) {
        matchScore += 10;
        matchDetails.push(`Matches gender preference: ${caregiver.gender}`);
      }
      maxPossibleScore += 10;
      
      // Match experience level
      if (preferences.caregiverPreferences && 
          preferences.caregiverPreferences.experience &&
          this.matchesExperienceLevel(caregiver.yearsExperience, preferences.caregiverPreferences.experience)) {
        matchScore += 10;
        matchDetails.push(`Has ${caregiver.yearsExperience}+ years experience`);
      }
      maxPossibleScore += 10;
      
      // Match language preferences
      if (preferences.caregiverPreferences && 
          preferences.caregiverPreferences.languages && 
          preferences.caregiverPreferences.languages.length > 0 &&
          caregiver.languages) {
        
        const preferredLanguages = preferences.caregiverPreferences.languages;
        const matchedLanguages = preferredLanguages.filter(lang => 
          caregiver.languages.includes(lang));
        
        if (matchedLanguages.length > 0) {
          const langScore = Math.min(10, matchedLanguages.length * 5);
          matchScore += langScore;
          matchDetails.push(`Speaks ${matchedLanguages.join(', ')}`);
        }
      }
      maxPossibleScore += 10;
      
      // Match primary condition expertise
      if (careNeeds.primaryCondition && 
          caregiver.specialties && 
          caregiver.specialties.includes(careNeeds.primaryCondition)) {
        matchScore += 20;
        matchDetails.push(`Expert in ${careNeeds.primaryCondition}`);
      }
      maxPossibleScore += 20;
      
      // Match budget range
      if (preferences.budget && preferences.budget.min && preferences.budget.max) {
        if (caregiver.hourlyRate >= preferences.budget.min && 
            caregiver.hourlyRate <= preferences.budget.max) {
          matchScore += 15;
          matchDetails.push(`Rate ($${caregiver.hourlyRate}/hr) within budget`);
        }
      }
      maxPossibleScore += 15;
      
      // Calculate percentage match
      const percentageMatch = maxPossibleScore > 0 ? 
        Math.round((matchScore / maxPossibleScore) * 100) : 0;
      
      return {
        ...caregiver,
        matchScore: percentageMatch,
        matchDetails: matchDetails
      };
    })
    .filter(caregiver => caregiver.matchScore > 50) // Filter to show only good matches
    .sort((a, b) => b.matchScore - a.matchScore); // Sort by match score (highest first)
  }
  
  /**
   * Enhanced matching using comprehensive client criteria
   * @param {Array} caregivers - Available caregivers
   * @param {Object} matchingCriteria - Comprehensive matching criteria
   * @returns {Array} Matched caregivers with enhanced scores
   */
  static matchCaregiversWithComprehensiveCriteria(caregivers, matchingCriteria) {
    return caregivers.map(caregiver => {
      let matchScore = 0;
      let maxPossibleScore = 0;
      const matchDetails = [];

      // 1. Location matching (25 points)
      maxPossibleScore += 25;
      if (matchingCriteria.location && caregiver.location) {
        if (caregiver.location.toLowerCase().includes(matchingCriteria.location.toLowerCase())) {
          matchScore += 25;
          matchDetails.push('Location match');
        }
      }

      // 2. Service category matching (30 points)
      maxPossibleScore += 30;
      if (matchingCriteria.serviceCategories && matchingCriteria.serviceCategories.length > 0) {
        const matchedCategories = matchingCriteria.serviceCategories.filter(category => 
          caregiver.specialties?.some(specialty => 
            specialty.toLowerCase().includes(category.toLowerCase()) ||
            category.toLowerCase().includes(specialty.toLowerCase())
          )
        );
        
        if (matchedCategories.length > 0) {
          const categoryScore = Math.min(30, (matchedCategories.length / matchingCriteria.serviceCategories.length) * 30);
          matchScore += categoryScore;
          matchDetails.push(`Service categories: ${matchedCategories.join(', ')}`);
        }
      }

      // 3. Experience level matching (20 points)
      maxPossibleScore += 20;
      if (matchingCriteria.caregiverRequirements?.experienceLevel) {
        const requiredYears = this.extractYearsFromExperienceLevel(matchingCriteria.caregiverRequirements.experienceLevel);
        if (caregiver.yearsExperience >= requiredYears) {
          matchScore += 20;
          matchDetails.push(`Experience: ${caregiver.yearsExperience}+ years`);
        } else if (caregiver.yearsExperience >= requiredYears * 0.7) {
          matchScore += 10; // Partial match
          matchDetails.push(`Partial experience match`);
        }
      }

      // 4. Certification matching (15 points)
      maxPossibleScore += 15;
      if (matchingCriteria.caregiverRequirements?.certifications?.length > 0) {
        const matchedCerts = matchingCriteria.caregiverRequirements.certifications.filter(cert =>
          caregiver.certifications?.some(caregiverCert =>
            caregiverCert.toLowerCase().includes(cert.toLowerCase()) ||
            cert.toLowerCase().includes(caregiverCert.toLowerCase())
          )
        );
        
        if (matchedCerts.length > 0) {
          const certScore = Math.min(15, (matchedCerts.length / matchingCriteria.caregiverRequirements.certifications.length) * 15);
          matchScore += certScore;
          matchDetails.push(`Certifications: ${matchedCerts.length} matched`);
        }
      }

      // 5. Language matching (10 points)
      maxPossibleScore += 10;
      if (matchingCriteria.caregiverRequirements?.preferredLanguages?.length > 0) {
        const matchedLanguages = matchingCriteria.caregiverRequirements.preferredLanguages.filter(lang =>
          caregiver.languages?.some(caregiverLang =>
            caregiverLang.toLowerCase().includes(lang.toLowerCase())
          )
        );
        
        if (matchedLanguages.length > 0) {
          matchScore += 10;
          matchDetails.push(`Languages: ${matchedLanguages.join(', ')}`);
        }
      }

      // 6. Medical needs compatibility (20 points)
      maxPossibleScore += 20;
      if (matchingCriteria.medicalNeeds?.primaryCondition) {
        const conditionCompatible = caregiver.specialties?.some(specialty =>
          specialty.toLowerCase().includes('medical') ||
          specialty.toLowerCase().includes('nursing') ||
          specialty.toLowerCase().includes('elder') ||
          specialty.toLowerCase().includes('health')
        );
        
        if (conditionCompatible) {
          matchScore += 20;
          matchDetails.push('Medical care experience');
        }
      }

      // 7. Gender preference (5 points)
      maxPossibleScore += 5;
      if (matchingCriteria.caregiverRequirements?.gender) {
        if (caregiver.gender?.toLowerCase() === matchingCriteria.caregiverRequirements.gender.toLowerCase()) {
          matchScore += 5;
          matchDetails.push('Gender preference match');
        }
      }

      // 8. Budget compatibility (10 points)
      maxPossibleScore += 10;
      if (matchingCriteria.budget?.max) {
        const maxBudget = parseFloat(matchingCriteria.budget.max);
        if (caregiver.hourlyRate <= maxBudget) {
          matchScore += 10;
          matchDetails.push('Within budget');
        } else if (caregiver.hourlyRate <= maxBudget * 1.1) {
          matchScore += 5; // Slightly over budget
          matchDetails.push('Close to budget');
        }
      }

      // 9. Specific services matching (15 points)
      maxPossibleScore += 15;
      if (matchingCriteria.specificServices && Object.keys(matchingCriteria.specificServices).length > 0) {
        let specificServiceMatches = 0;
        let totalSpecificServices = 0;
        
        Object.values(matchingCriteria.specificServices).forEach(services => {
          totalSpecificServices += services.length;
          services.forEach(service => {
            if (caregiver.specialties?.some(specialty =>
              specialty.toLowerCase().includes(service.toLowerCase()) ||
              service.toLowerCase().includes(specialty.toLowerCase())
            )) {
              specificServiceMatches++;
            }
          });
        });
        
        if (specificServiceMatches > 0 && totalSpecificServices > 0) {
          const serviceScore = Math.min(15, (specificServiceMatches / totalSpecificServices) * 15);
          matchScore += serviceScore;
          matchDetails.push(`Specific services: ${specificServiceMatches}/${totalSpecificServices} matched`);
        }
      }

      // Calculate final match percentage
      const matchPercentage = maxPossibleScore > 0 ? Math.round((matchScore / maxPossibleScore) * 100) : 0;

      return {
        ...caregiver,
        matchScore: matchPercentage,
        matchDetails,
        rawScore: matchScore,
        maxPossibleScore,
        comprehensiveMatch: true // Flag to indicate this used comprehensive matching
      };
    })
    .filter(caregiver => caregiver.matchScore > 0) // Only return caregivers with some match
    .sort((a, b) => b.matchScore - a.matchScore); // Sort by match score descending
  }

  /**
   * Extract years from experience level string
   * @param {string} experienceLevel - Experience level string
   * @returns {number} Minimum years of experience
   */
  static extractYearsFromExperienceLevel(experienceLevel) {
    if (!experienceLevel) return 0;
    
    const levelMap = {
      'Entry Level (0-1 years)': 0,
      'Some Experience (1-3 years)': 1,
      'Experienced (3-5 years)': 3,
      'Very Experienced (5-10 years)': 5,
      'Expert (10+ years)': 10
    };
    
    return levelMap[experienceLevel] || 0;
  }

  /**
   * Match gigs to client preferences and needs
   * @param {Array} gigs - Available gigs
   * @param {Object} preferences - Client preferences
   * @param {Object} careNeeds - Client care needs
   * @returns {Array} Matched gigs with scores
   */
  static matchGigs(gigs, preferences, careNeeds) {
    return gigs.map(gig => {
      // Initialize score
      let matchScore = 0;
      let maxPossibleScore = 0;
      const matchDetails = [];
      
      // Match service type
      if (preferences.serviceType && gig.serviceType === preferences.serviceType) {
        matchScore += 25;
        matchDetails.push(`Matches needed service: ${gig.serviceType}`);
      }
      maxPossibleScore += 25;
      
      // Match location
      if (preferences.location && gig.location === preferences.location) {
        matchScore += 20;
        matchDetails.push(`Located in ${gig.location}`);
      }
      maxPossibleScore += 20;
      
      // Match schedule
      if (preferences.schedule && gig.schedule && 
          this.schedulesOverlap(preferences.schedule, gig.schedule)) {
        matchScore += 15;
        matchDetails.push('Matches your preferred schedule');
      }
      maxPossibleScore += 15;
      
      // Match service frequency
      if (preferences.serviceFrequency && gig.frequency === preferences.serviceFrequency) {
        matchScore += 10;
        matchDetails.push(`${gig.frequency} service`);
      }
      maxPossibleScore += 10;
      
      // Match to care needs
      if (careNeeds.primaryCondition && 
          gig.requiredSkills && 
          gig.requiredSkills.includes(careNeeds.primaryCondition)) {
        matchScore += 20;
        matchDetails.push(`Suitable for ${careNeeds.primaryCondition}`);
      }
      maxPossibleScore += 20;
      
      // Match budget range
      if (preferences.budget && preferences.budget.min && preferences.budget.max) {
        const gigRate = gig.payRate || gig.rate || 0;
        if (gigRate >= preferences.budget.min && 
            gigRate <= preferences.budget.max) {
          matchScore += 10;
          matchDetails.push(`Rate ($${gigRate}/hr) within budget`);
        }
      }
      maxPossibleScore += 10;
      
      // Calculate percentage match
      const percentageMatch = maxPossibleScore > 0 ? 
        Math.round((matchScore / maxPossibleScore) * 100) : 0;
      
      return {
        ...gig,
        matchScore: percentageMatch,
        matchDetails: matchDetails
      };
    })
    .filter(gig => gig.matchScore > 50) // Filter to show only good matches
    .sort((a, b) => b.matchScore - a.matchScore); // Sort by match score (highest first)
  }
  
  /**
   * Check if caregiver's experience matches the preferred experience level
   * @param {number} yearsExperience - Caregiver's years of experience
   * @param {string} preferredExperience - Preferred experience level
   * @returns {boolean} Whether experience matches
   */
  static matchesExperienceLevel(yearsExperience, preferredExperience) {
    switch(preferredExperience) {
      case 'beginner':
        return yearsExperience >= 0; // Any experience is fine
      case 'intermediate':
        return yearsExperience >= 2;
      case 'advanced':
        return yearsExperience >= 5;
      case 'expert':
        return yearsExperience >= 10;
      default:
        return true;
    }
  }
  
  /**
   * Check if two schedules overlap
   * @param {string|Object} preferredSchedule - Client's preferred schedule
   * @param {string|Object} gigSchedule - Gig's schedule
   * @returns {boolean} Whether schedules overlap
   */
  static schedulesOverlap(preferredSchedule, gigSchedule) {
    // Simple implementation - in a real app, this would be more sophisticated
    // to handle complex scheduling scenarios
    return preferredSchedule === gigSchedule || 
           gigSchedule === 'flexible' || 
           preferredSchedule === 'flexible';
  }
  
  /**
   * Fetch available caregivers from the API
   * @returns {Promise<Array>} Array of caregiver data
   */
  static async fetchAvailableCaregivers() {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('No authentication token found for API calls');
        return this.getMockCaregivers();
      }
      
      const API_URL = `${config.BASE_URL}/Caregivers`; // Using centralized API config
      
      // Use timeout for better UX
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000); // 7 second timeout
      
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('Caregivers endpoint not available, using mock data');
        } else {
          console.warn(`API returned ${response.status} when fetching caregivers`);
        }
        return this.getMockCaregivers();
      }
      
      const data = await response.json();
      
      if (!data || !Array.isArray(data)) {
        console.warn('Invalid data format received from API');
        return this.getMockCaregivers();
      }
      
      // Map the API response to our expected format
      return data.map(caregiver => ({
        id: caregiver.id,
        name: `${caregiver.firstName} ${caregiver.lastName}`,
        gender: this.inferGender(caregiver.firstName, caregiver.gender),
        rating: caregiver.rating || 4.5,
        specialties: caregiver.categories || caregiver.specialties || ['General Care'],
        yearsExperience: caregiver.yearsOfExperience || 1,
        hourlyRate: caregiver.hourlyRate || 25,
        location: caregiver.city || caregiver.location || 'Unknown',
        languages: caregiver.languages ? 
          caregiver.languages.split(',').map(l => l.trim()) : 
          ['English']
      }));
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Caregivers API request timed out, using mock data');
      } else if (error.message.includes('fetch')) {
        console.log('Caregivers API not available, using mock data');
      } else {
        console.error('Error fetching caregivers:', error);
      }
      return this.getMockCaregivers();
    }
  }
  
  /**
   * Infer gender from name or use provided gender
   * @param {string} name - First name
   * @param {string} providedGender - Gender if provided by API
   * @returns {string} Inferred gender
   */
  static inferGender(name, providedGender) {
    if (providedGender) {
      return providedGender.toLowerCase();
    }
    
    // Simple gender inference based on common names
    // This is just for demonstration - in production, we would use the actual gender from the API
    const femaleNames = ['sarah', 'mary', 'aisha', 'fatima', 'elizabeth', 'linda', 'susan', 'patricia'];
    if (name && femaleNames.includes(name.toLowerCase())) {
      return 'female';
    }
    return 'male';
  }
  
  /**
   * Get mock caregivers as fallback
   * @returns {Array} Mock caregivers
   */
  static getMockCaregivers() {
    return [
      {
        id: 'cg-1',
        name: 'Sarah Johnson',
        gender: 'female',
        rating: 4.9,
        specialties: ['Elder Care', 'Medication Management', 'Dementia Care'],
        yearsExperience: 5,
        hourlyRate: 25,
        location: 'Lagos',
        languages: ['English', 'Yoruba']
      },
      {
        id: 'cg-2',
        name: 'Michael Chen',
        gender: 'male',
        rating: 4.7,
        specialties: ['Post-Surgery Care', 'Physical Therapy', 'Rehabilitation'],
        yearsExperience: 3,
        hourlyRate: 30,
        location: 'Abuja',
        languages: ['English', 'Mandarin']
      },
      {
        id: 'cg-3',
        name: 'Aisha Williams',
        gender: 'female',
        rating: 4.8,
        specialties: ['Special Needs Care', 'Pediatric Care', 'Autism Support'],
        yearsExperience: 7,
        hourlyRate: 28,
        location: 'Lagos',
        languages: ['English', 'Hausa', 'French']
      }
    ];
  }
  
  /**
   * Fetch available gigs from the API
   * @returns {Promise<Array>} Array of gig data
   */
  // static async fetchAvailableGigs() {
  //   try {
  //     // Get token from localStorage
  //     const token = localStorage.getItem('authToken');
  //     if (!token) {
  //       console.warn('No authentication token found for API calls');
  //       return this.getMockGigs();
  //     }
      
  //     const API_URL = 'https://carepro-api20241118153443.azurewebsites.net/api/Gigs';
      
  //     // Use timeout for better UX
  //     const controller = new AbortController();
  //     const timeoutId = setTimeout(() => controller.abort(), 7000); // 7 second timeout
      
  //     const response = await fetch(API_URL, {
  //       method: 'GET',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json'
  //       },
  //       signal: controller.signal
  //     });
      
  //     clearTimeout(timeoutId);
      
  //     if (!response.ok) {
  //       console.warn(`API returned ${response.status} when fetching gigs`);
  //       return this.getMockGigs();
  //     }
      
  //     const data = await response.json();
      
  //     if (!data || !Array.isArray(data)) {
  //       console.warn('Invalid data format received from API');
  //       return this.getMockGigs();
  //     }
      
  //     // Map the API response to our expected format
  //     return data.filter(gig => gig.status === 'published').map(gig => {
  //       // Extract required skills from requirements or categories
  //       const requiredSkills = [];
  //       if (gig.requirements && Array.isArray(gig.requirements)) {
  //         requiredSkills.push(...gig.requirements);
  //       } else if (gig.subCategory) {
  //         requiredSkills.push(gig.subCategory);
  //       }
        
  //       // Determine frequency
  //       let frequency = 'as-needed';
  //       if (gig.title) {
  //         if (gig.title.toLowerCase().includes('daily')) frequency = 'daily';
  //         else if (gig.title.toLowerCase().includes('weekly')) frequency = 'weekly';
  //         else if (gig.title.toLowerCase().includes('monthly')) frequency = 'monthly';
  //       }
        
  //       return {
  //         id: gig.id,
  //         title: gig.title,
  //         description: gig.description,
  //         serviceType: gig.category || gig.subCategory || 'General Care',
  //         location: gig.location || 'Unknown',
  //         schedule: gig.availabilitySchedule || 'flexible',
  //         frequency: frequency,
  //         payRate: gig.price || 0,
  //         duration: gig.duration || 'varies',
  //         requiredSkills: requiredSkills
  //       };
  //     });
  //   } catch (error) {
  //     console.error('Error fetching gigs:', error);
  //     return this.getMockGigs();
  //   }
  // }
  
  /**
   * Get mock gigs as fallback
   * @returns {Array} Mock gigs
   */
  // static getMockGigs() {
  //   return [
  //     {
  //       id: 'gig-1',
  //       title: 'Elder Care Assistance',
  //       description: 'Looking for compassionate caregiver for elderly father with mild dementia',
  //       serviceType: 'Elder Care',
  //       location: 'Lagos',
  //       schedule: 'weekday-mornings',
  //       frequency: 'weekly',
  //       payRate: 28,
  //       duration: '4 hours',
  //       requiredSkills: ['Dementia Care', 'Medication Management']
  //     },
  //     {
  //       id: 'gig-2',
  //       title: 'Special Needs Child Support',
  //       description: 'Seeking experienced caregiver for 8-year-old with autism',
  //       serviceType: 'Special Needs Care',
  //       location: 'Abuja',
  //       schedule: 'afternoons',
  //       frequency: 'daily',
  //       payRate: 32,
  //       duration: '3 hours',
  //       requiredSkills: ['Autism Support', 'Behavioral Management']
  //     },
  //     {
  //       id: 'gig-3',
  //       title: 'Post-Surgery Recovery Help',
  //       description: 'Need assistance with recovery after knee surgery',
  //       serviceType: 'Post-Surgery Care',
  //       location: 'Lagos',
  //       schedule: 'flexible',
  //       frequency: 'as-needed',
  //       payRate: 30,
  //       duration: 'varies',
  //       requiredSkills: ['Physical Therapy', 'Mobility Assistance']
  //     }
  //   ];
  // }
}

export default MatchingService;
