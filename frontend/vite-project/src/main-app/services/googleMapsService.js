// Google Maps API service for address validation and autocomplete
const GOOGLE_MAPS_API_KEY = 'AIzaSyAFOXMsHlKjKy1KfvGycISmst0hqQpxMho';

class GoogleMapsService {
  constructor() {
    this.isLoaded = false;
    this.autocompleteService = null;
    this.placesService = null;
    this.geocoder = null;
  }

  /**
   * Load Google Maps API if not already loaded
   */
  async loadGoogleMapsAPI() {
    if (this.isLoaded && window.google) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      if (window.google) {
        this.initializeServices();
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        this.initializeServices();
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Maps API'));
      };
      
      document.head.appendChild(script);
    });
  }

  /**
   * Initialize Google Maps services
   */
  initializeServices() {
    if (window.google && window.google.maps) {
      this.autocompleteService = new window.google.maps.places.AutocompleteService();
      this.geocoder = new window.google.maps.Geocoder();
      this.isLoaded = true;
      console.log('Google Maps services initialized');
    }
  }

  /**
   * Get address suggestions based on user input
   * @param {string} input - User input text
   * @param {string} country - Country code (default: 'ng' for Nigeria)
   * @returns {Promise<Array>} - Array of address suggestions
   */
  async getAddressSuggestions(input, country = 'ng') {
    if (!input || input.length < 3) {
      return [];
    }

    try {
      await this.loadGoogleMapsAPI();

      return new Promise((resolve, reject) => {
        if (!this.autocompleteService) {
          reject(new Error('Autocomplete service not available'));
          return;
        }

        const request = {
          input: input,
          types: ['address'],
          componentRestrictions: { country: country }
        };

        this.autocompleteService.getPlacePredictions(request, (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            const suggestions = predictions.map(prediction => ({
              placeId: prediction.place_id,
              description: prediction.description,
              mainText: prediction.structured_formatting.main_text,
              secondaryText: prediction.structured_formatting.secondary_text
            }));
            resolve(suggestions);
          } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            resolve([]);
          } else {
            console.warn('Address suggestions failed:', status);
            resolve([]);
          }
        });
      });
    } catch (error) {
      console.error('Error getting address suggestions:', error);
      return [];
    }
  }

  /**
   * Validate and get detailed information about an address
   * @param {string} address - Full address string
   * @returns {Promise<Object>} - Validated address information
   */
  async validateAddress(address) {
    if (!address || address.trim().length < 5) {
      throw new Error('Address is too short');
    }

    try {
      await this.loadGoogleMapsAPI();

      return new Promise((resolve, reject) => {
        if (!this.geocoder) {
          reject(new Error('Geocoder service not available'));
          return;
        }

        this.geocoder.geocode({ address: address }, (results, status) => {
          if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
            const result = results[0];
            const addressComponents = this.parseAddressComponents(result.address_components);
            
            const validatedAddress = {
              isValid: true,
              formattedAddress: result.formatted_address,
              geometry: {
                latitude: result.geometry.location.lat(),
                longitude: result.geometry.location.lng()
              },
              components: addressComponents,
              placeId: result.place_id
            };

            resolve(validatedAddress);
          } else {
            reject(new Error(this.getGeocoderErrorMessage(status)));
          }
        });
      });
    } catch (error) {
      console.error('Error validating address:', error);
      throw error;
    }
  }

  /**
   * Get detailed place information by place ID
   * @param {string} placeId - Google Places ID
   * @returns {Promise<Object>} - Detailed place information
   */
  async getPlaceDetails(placeId) {
    try {
      await this.loadGoogleMapsAPI();

      return new Promise((resolve, reject) => {
        // Create a temporary div for places service
        const tempDiv = document.createElement('div');
        const placesService = new window.google.maps.places.PlacesService(tempDiv);

        const request = {
          placeId: placeId,
          fields: ['address_components', 'formatted_address', 'geometry', 'place_id', 'name']
        };

        placesService.getDetails(request, (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            const addressComponents = this.parseAddressComponents(place.address_components);
            
            const placeDetails = {
              isValid: true,
              formattedAddress: place.formatted_address,
              geometry: {
                latitude: place.geometry.location.lat(),
                longitude: place.geometry.location.lng()
              },
              components: addressComponents,
              placeId: place.place_id,
              name: place.name
            };

            resolve(placeDetails);
          } else {
            reject(new Error('Failed to get place details'));
          }
        });
      });
    } catch (error) {
      console.error('Error getting place details:', error);
      throw error;
    }
  }

  /**
   * Parse Google Maps address components into a structured format
   * @param {Array} addressComponents - Google Maps address components
   * @returns {Object} - Parsed address components
   */
  parseAddressComponents(addressComponents) {
    const components = {
      streetNumber: '',
      streetName: '',
      city: '',
      state: '',
      stateCode: '',
      country: '',
      countryCode: '',
      postalCode: '',
      county: ''
    };

    addressComponents.forEach(component => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        components.streetNumber = component.long_name;
      }
      if (types.includes('route')) {
        components.streetName = component.long_name;
      }
      if (types.includes('locality')) {
        components.city = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        components.state = component.long_name;
        components.stateCode = component.short_name;
      }
      if (types.includes('country')) {
        components.country = component.long_name;
        components.countryCode = component.short_name;
      }
      if (types.includes('postal_code')) {
        components.postalCode = component.long_name;
      }
      if (types.includes('administrative_area_level_2')) {
        components.county = component.long_name;
      }
    });

    return components;
  }

  /**
   * Get user-friendly error message for geocoder status
   * @param {string} status - Geocoder status
   * @returns {string} - User-friendly error message
   */
  getGeocoderErrorMessage(status) {
    switch (status) {
      case window.google.maps.GeocoderStatus.ZERO_RESULTS:
        return 'No results found for this address. Please check your spelling.';
      case window.google.maps.GeocoderStatus.OVER_QUERY_LIMIT:
        return 'Too many requests. Please try again later.';
      case window.google.maps.GeocoderStatus.REQUEST_DENIED:
        return 'Address validation service is not available.';
      case window.google.maps.GeocoderStatus.INVALID_REQUEST:
        return 'Invalid address format.';
      default:
        return 'Unable to validate address. Please try again.';
    }
  }

  /**
   * Basic client-side address validation (fallback when API is not available)
   * @param {string} address - Address to validate
   * @returns {Object} - Basic validation result
   */
  basicAddressValidation(address) {
    const validation = {
      isValid: false,
      errors: [],
      warnings: []
    };

    // Minimum length check
    if (!address || address.trim().length < 5) {
      validation.errors.push('Address is too short');
      return validation;
    }

    const trimmedAddress = address.trim();

    // Check for street number
    if (!/^\d/.test(trimmedAddress)) {
      validation.warnings.push('Address should start with a street number');
    }

    // Check for basic components
    if (!/\d/.test(trimmedAddress)) {
      validation.errors.push('Address should contain a street number');
    }

    if (!/[a-zA-Z]/.test(trimmedAddress)) {
      validation.errors.push('Address should contain street name');
    }

    // Check for comma separation (city, state)
    const commaParts = trimmedAddress.split(',');
    if (commaParts.length < 2) {
      validation.warnings.push('Address should include city and state (e.g., "123 Main St, Los Angeles, CA")');
    }

    // US state code pattern
    const statePattern = /\b[A-Z]{2}\b/;
    if (!statePattern.test(trimmedAddress)) {
      validation.warnings.push('Address should include a state abbreviation (e.g., CA, NY, TX)');
    }

    // ZIP code pattern
    const zipPattern = /\b\d{5}(-\d{4})?\b/;
    if (!zipPattern.test(trimmedAddress)) {
      validation.warnings.push('Consider including a ZIP code for better accuracy');
    }

    validation.isValid = validation.errors.length === 0;
    return validation;
  }
}

// Create singleton instance
const googleMapsService = new GoogleMapsService();

export default googleMapsService;