// ============================================================================
// RETIRED — Client "Care Needs" setup wizard (service layer (GET/POST /ClientPreferences care-needs format)).
//
// The wizard promised caregiver matching and recommendations that no longer
// exist: caregivers are now assigned internally by CarePro from a care
// package (see the Assignment Console), and a client never picks or is
// matched to a caregiver themselves. Its saved data was read by nothing
// meaningful, and its save swallowed server errors and reported success. The
// /app/client/care-needs route now shows a FeatureMovedNotice
// (see client-route.jsx); the dashboard, profile and settings entry points
// were repointed at care packages and the free care assessment.
//
// The entire file below is commented out on purpose, not deleted, so it can be
// referenced later. To restore: uncomment the wizard files + their services,
// and restore the import + <Route> in client-route.jsx. If it is ever rebuilt,
// do NOT reuse the old save (it hid failures) or the old matching promises.
// ============================================================================

// /**
//  * Client Care Needs Service
//  * Handles all API calls related to client care needs
//  */
// import config from "../config"; // Centralized API configuration
//
// class ClientCareNeedsService {
//   /**
//    * Get care needs for the current user
//    * @returns {Promise<Object>} Care needs data
//    */
//   static async getCareNeeds() {
//     try {
//       // For demo purposes, get from localStorage
//       // const storedNeeds = localStorage.getItem('careNeeds');
//
//       // if (storedNeeds) {
//       //   return JSON.parse(storedNeeds);
//       // }
//
//       // Get the current client ID
//       const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
//       const clientId = userDetails.id;
//
//       if (clientId) {
//         // Try to fetch from API first
//         try {
//           const token = localStorage.getItem('authToken');
//           const API_URL = `${config.BASE_URL}/ClientPreferences/clientId?clientId=${clientId}`; // Using centralized API config
//
//           const response = await fetch(API_URL, {
//             method: 'GET',
//             headers: {
//               'Authorization': `Bearer ${token}`,
//               'Content-Type': 'application/json',
//             }
//           });
//
//           if (response.ok) {
//             const data = await response.json();
//
//             // Convert the API format (array of strings) to object format
//             if (data && data.data && Array.isArray(data.data)) {
//               const careNeeds = this.convertApiDataToCareNeeds(data.data);
//               return careNeeds;
//             }
//           } else if (response.status === 404) {
//             // 404 is expected when user hasn't set preferences yet
//             console.log('No preferences found for user, using defaults');
//           } else {
//             console.warn(`API returned ${response.status}, using default care needs`);
//           }
//         } catch (apiError) {
//           console.warn('API call failed, using default care needs:', apiError);
//         }
//       }
//
//       // Default care needs if none found
//       return {
//         // Service categories (always required first)
//         serviceCategories: [],
//         specificServices: {},
//         specificServicesOthers: {}, // For custom specific services
//
//         // Medical needs (only for medical-related categories)
//         medicalNeeds: {
//           primaryCondition: '',
//           additionalConditions: [],
//           additionalConditionsOther: '',
//           mobilityLevel: '',
//           assistanceLevel: '',
//           dietaryRestrictions: [],
//           dietaryRestrictionsOther: '',
//           medicationManagement: false,
//           frequentMonitoring: false,
//           specialEquipment: [],
//           specialEquipmentOther: '',
//           additionalNotes: ''
//         },
//
//         // Child care specific needs
//         childCareNeeds: {
//           ageRanges: [],
//           ageRangesOther: '',
//           numberOfChildren: '',
//           specialNeeds: [],
//           specialNeedsOther: '',
//           activitiesPreferences: [],
//           activitiesPreferencesOther: '',
//           supervisionLevel: '',
//           emergencyContacts: '',
//           additionalNotes: ''
//         },
//
//         // Pet care specific needs
//         petCareNeeds: {
//           petTypes: [],
//           petTypesOther: '',
//           numberOfPets: '',
//           petSizes: [],
//           petSizesOther: '',
//           specialCareRequirements: [],
//           specialCareRequirementsOther: '',
//           exerciseNeeds: [],
//           exerciseNeedsOther: '',
//           dietaryRequirements: [],
//           dietaryRequirementsOther: '',
//           behavioralNotes: '',
//           additionalNotes: ''
//         },
//
//         // Home care specific needs
//         homeCareNeeds: {
//           homeSize: '',
//           focusAreas: [],
//           focusAreasOther: '',
//           serviceFrequency: '',
//           specialEquipment: [],
//           specialEquipmentOther: '',
//           accessibilityNeeds: [],
//           accessibilityNeedsOther: '',
//           additionalNotes: ''
//         },
//
//         // Therapy & wellness specific needs
//         therapyNeeds: {
//           therapyTypes: [],
//           therapyTypesOther: '',
//           currentLimitations: [],
//           currentLimitationsOther: '',
//           therapyGoals: [],
//           therapyGoalsOther: '',
//           equipmentAvailable: [],
//           equipmentAvailableOther: '',
//           previousExperience: '',
//           additionalNotes: ''
//         },
//
//         // Caregiver requirements (always visible)
//         caregiverRequirements: {
//           certifications: [],
//           certificationsOther: '',
//           experienceLevel: '',
//           languages: [],
//           languagesOther: '',
//           personalityTraits: [],
//           personalityTraitsOther: '',
//           availability: [],
//           availabilityOther: '',
//           specialSkills: [],
//           specialSkillsOther: ''
//         }
//       };
//     } catch (error) {
//       console.error('Error in getCareNeeds:', error);
//       throw error;
//     }
//   }
//
//   /**
//    * Save care needs for the current user
//    * @param {Object} careNeeds - Care needs data to save
//    * @returns {Promise<Object>} Updated care needs data
//    */
//   static async saveCareNeeds(careNeeds) {
//     try {
//       console.log('=== CLIENT CARE NEEDS SERVICE DEBUG ===');
//       console.log('4. saveCareNeeds called with:', JSON.stringify(careNeeds, null, 2));
//
//       // For demo purposes, save to localStorage
//       localStorage.setItem('careNeeds', JSON.stringify(careNeeds));
//
//       // Get the current client ID
//       const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
//       const clientId = userDetails.id;
//
//       console.log('5. Client ID:', clientId);
//
//       if (clientId) {
//         // Try to save to API
//         try {
//           const token = localStorage.getItem('authToken');
//           const API_URL = `${config.BASE_URL}/ClientPreferences`; // Using centralized API config
//
//           // Convert careNeeds object to the format expected by the API
//           const preferencesData = this.convertCareNeedsToApiData(careNeeds);
//
//           console.log('6. Converted preferences data:', preferencesData);
//
//           const payload = {
//             clientId: clientId,
//             data: preferencesData
//           };
//
//           console.log('7. Final payload being sent to API:', JSON.stringify(payload, null, 2));
//
//           const response = await fetch(API_URL, {
//             method: 'POST',
//             headers: {
//               'Authorization': `Bearer ${token}`,
//               'Content-Type': 'application/json',
//             },
//             body: JSON.stringify(payload)
//           });
//
//           console.log('14. API Response status:', response.status);
//
//           if (!response.ok) {
//             console.warn(`API returned ${response.status} when saving care needs`);
//             const responseText = await response.text();
//             console.log('15. API Error response:', responseText);
//           } else {
//             console.log('Care needs saved to API successfully');
//             const responseData = await response.json();
//             console.log('16. API Success response:', responseData);
//             return careNeeds;
//           }
//         } catch (apiError) {
//           console.warn('API call failed, care needs saved locally only:', apiError);
//         }
//       }
//
//       return careNeeds;
//     } catch (error) {
//       console.error('Error in saveCareNeeds:', error);
//       throw error;
//     }
//   }
//
//   /**
//    * Convert care needs object to API data format
//    * @param {Object} careNeeds - Care needs object
//    * @returns {Array} Array of serialized data strings for API
//    */
//   static convertCareNeedsToApiData(careNeeds) {
//     console.log('=== CONVERSION DEBUG ===');
//     console.log('8. convertCareNeedsToApiData input:', JSON.stringify(careNeeds, null, 2));
//
//     const dataArray = [];
//
//     // Process each property in the care needs object
//     Object.entries(careNeeds).forEach(([key, value]) => {
//       console.log(`9. Processing key: ${key}, value:`, value, `(type: ${typeof value})`);
//
//       if (typeof value === 'object' && value !== null) {
//         if (Array.isArray(value)) {
//           const serialized = `${key}:${JSON.stringify(value)}`;
//           console.log(`10. Array - adding: ${serialized}`);
//           dataArray.push(serialized);
//         } else {
//           // For nested objects
//           Object.entries(value).forEach(([nestedKey, nestedValue]) => {
//             const serialized = `${key}.${nestedKey}:${JSON.stringify(nestedValue)}`;
//             console.log(`11. Nested object - adding: ${serialized}`);
//             dataArray.push(serialized);
//           });
//         }
//       } else {
//         // For simple key-value pairs
//         const serialized = `${key}:${JSON.stringify(value)}`;
//         console.log(`12. Simple value - adding: ${serialized}`);
//         dataArray.push(serialized);
//       }
//     });
//
//     console.log('13. Final converted dataArray:', dataArray);
//     return dataArray;
//   }
//
//   /**
//    * Convert API data format to care needs object
//    * @param {Array} dataArray - Array of serialized data strings from API
//    * @returns {Object} Care needs object
//    */
//   static convertApiDataToCareNeeds(dataArray) {
//     const careNeeds = {
//       // Service categories (always required first)
//       serviceCategories: [],
//       specificServices: {},
//       specificServicesOthers: {}, // For custom specific services
//
//       // Medical needs (only for medical-related categories)
//       medicalNeeds: {
//         primaryCondition: '',
//         additionalConditions: [],
//         additionalConditionsOther: '',
//         mobilityLevel: '',
//         assistanceLevel: '',
//         dietaryRestrictions: [],
//         dietaryRestrictionsOther: '',
//         medicationManagement: false,
//         frequentMonitoring: false,
//         specialEquipment: [],
//         specialEquipmentOther: '',
//         additionalNotes: ''
//       },
//
//       // Child care specific needs
//       childCareNeeds: {
//         ageRanges: [],
//         ageRangesOther: '',
//         numberOfChildren: '',
//         specialNeeds: [],
//         specialNeedsOther: '',
//         activitiesPreferences: [],
//         activitiesPreferencesOther: '',
//         supervisionLevel: '',
//         emergencyContacts: '',
//         additionalNotes: ''
//       },
//
//       // Pet care specific needs
//       petCareNeeds: {
//         petTypes: [],
//         petTypesOther: '',
//         numberOfPets: '',
//         petSizes: [],
//         petSizesOther: '',
//         specialCareRequirements: [],
//         specialCareRequirementsOther: '',
//         exerciseNeeds: [],
//         exerciseNeedsOther: '',
//         dietaryRequirements: [],
//         dietaryRequirementsOther: '',
//         behavioralNotes: '',
//         additionalNotes: ''
//       },
//
//       // Home care specific needs
//       homeCareNeeds: {
//         homeSize: '',
//         focusAreas: [],
//         focusAreasOther: '',
//         serviceFrequency: '',
//         specialEquipment: [],
//         specialEquipmentOther: '',
//         accessibilityNeeds: [],
//         accessibilityNeedsOther: '',
//         additionalNotes: ''
//       },
//
//       // Therapy & wellness specific needs
//       therapyNeeds: {
//         therapyTypes: [],
//         therapyTypesOther: '',
//         currentLimitations: [],
//         currentLimitationsOther: '',
//         therapyGoals: [],
//         therapyGoalsOther: '',
//         equipmentAvailable: [],
//         equipmentAvailableOther: '',
//         previousExperience: '',
//         additionalNotes: ''
//       },
//
//       // Caregiver requirements (always visible)
//       caregiverRequirements: {
//         certifications: [],
//         certificationsOther: '',
//         experienceLevel: '',
//         languages: [],
//         languagesOther: '',
//         personalityTraits: [],
//         personalityTraitsOther: '',
//         availability: [],
//         availabilityOther: '',
//         specialSkills: [],
//         specialSkillsOther: ''
//       }
//     };
//
//     dataArray.forEach(item => {
//       const colonIndex = item.indexOf(':');
//       if (colonIndex > -1) {
//         const key = item.substring(0, colonIndex);
//         let value = item.substring(colonIndex + 1);
//
//         try {
//           value = JSON.parse(value);
//         } catch (e) {
//           // If not valid JSON, use as is
//         }
//
//         if (key.includes('.')) {
//           // Handle nested properties
//           const [parentKey, childKey] = key.split('.');
//           if (!careNeeds[parentKey]) {
//             careNeeds[parentKey] = {};
//           }
//           careNeeds[parentKey][childKey] = value;
//         } else {
//           careNeeds[key] = value;
//         }
//       }
//     });
//
//     return careNeeds;
//   }
//
//   /**
//    * Get caregiver matching recommendations based on care needs
//    * @param {Object} careNeeds - Care needs to match against
//    * @returns {Promise<Array>} List of recommended caregivers
//    */
//   static async getMatchingCaregivers(careNeeds) {
//     try {
//       if (!careNeeds || !careNeeds.primaryCondition) {
//         return [];
//       }
//
//       // Get the current client ID
//       const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
//       const clientId = userDetails.id;
//
//       if (!clientId) {
//         return [];
//       }
//
//       // Dynamically import MatchingService to avoid circular dependencies
//       const { default: MatchingService } = await import('./matchingService');
//       return await MatchingService.getRecommendedCaregivers(clientId);
//     } catch (error) {
//       console.error('Error in getMatchingCaregivers:', error);
//       throw error;
//     }
//   }
// }
//
// export default ClientCareNeedsService;
