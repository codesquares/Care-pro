import { useState, useEffect, useCallback } from 'react';
import googleMapsService from '../services/googleMapsService';

/**
 * Custom hook for address validation and autocomplete
 * @param {Object} options - Configuration options
 * @returns {Object} - Address validation state and methods
 */
export const useAddressValidation = (options = {}) => {
  const {
    debounceMs = 300,
    minLength = 3,
    country = 'ng',
    enableAutocomplete = true
  } = options;

  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  // Debounced address input handler
  const [debouncedAddress, setDebouncedAddress] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAddress(address);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [address, debounceMs]);

  // Get address suggestions
  const getSuggestions = useCallback(async (input) => {
    if (!enableAutocomplete || !input || input.length < minLength) {
      setSuggestions([]);
      return;
    }

    try {
      setIsLoadingSuggestions(true);
      const suggestions = await googleMapsService.getAddressSuggestions(input, country);
      setSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error('Error getting address suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [enableAutocomplete, minLength, country]);

  // Validate address
  const validateAddress = useCallback(async (addressToValidate) => {
    if (!addressToValidate || addressToValidate.length < 5) {
      setValidationResult({
        isValid: false,
        error: 'Address is too short',
        validated: false
      });
      return;
    }

    try {
      setIsValidating(true);
      
      // Try Google Maps validation first
      try {
        const result = await googleMapsService.validateAddress(addressToValidate);
        setValidationResult({
          ...result,
          validated: true,
          error: null
        });
      } catch (apiError) {
        console.warn('Google Maps validation failed, using basic validation:', apiError);
        
        // Fallback to basic validation
        const basicResult = googleMapsService.basicAddressValidation(addressToValidate);
        setValidationResult({
          ...basicResult,
          validated: false,
          error: basicResult.errors.length > 0 ? basicResult.errors.join(', ') : null,
          formattedAddress: addressToValidate
        });
      }
    } catch (error) {
      console.error('Address validation error:', error);
      setValidationResult({
        isValid: false,
        error: 'Unable to validate address',
        validated: false
      });
    } finally {
      setIsValidating(false);
    }
  }, []);

  // Effect to get suggestions when debounced address changes
  useEffect(() => {
    if (debouncedAddress && !selectedSuggestion) {
      getSuggestions(debouncedAddress);
    }
  }, [debouncedAddress, selectedSuggestion]); // Remove getSuggestions from dependencies

  // Handle address input change
  const handleAddressChange = useCallback((newAddress) => {
    setAddress(newAddress);
    setSelectedSuggestion(null);
    setValidationResult(null);
    
    if (!newAddress) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(async (suggestion) => {
    setSelectedSuggestion(suggestion);
    setAddress(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);

    // Validate the selected address
    try {
      setIsValidating(true);
      const placeDetails = await googleMapsService.getPlaceDetails(suggestion.placeId);
      setValidationResult({
        ...placeDetails,
        validated: true,
        error: null
      });
    } catch (error) {
      console.error('Error getting place details:', error);
      // Fallback to basic validation
      await validateAddress(suggestion.description);
    } finally {
      setIsValidating(false);
    }
  }, [validateAddress]);

  // Manual validation trigger
  const triggerValidation = useCallback(() => {
    if (address && !selectedSuggestion) {
      validateAddress(address);
    }
  }, [address, selectedSuggestion, validateAddress]);

  // Clear all state
  const clearAddress = useCallback(() => {
    setAddress('');
    setSuggestions([]);
    setValidationResult(null);
    setShowSuggestions(false);
    setSelectedSuggestion(null);
  }, []);

  // Hide suggestions
  const hideSuggestions = useCallback(() => {
    setShowSuggestions(false);
  }, []);

  return {
    // State
    address,
    suggestions,
    validationResult,
    isValidating,
    isLoadingSuggestions,
    showSuggestions,
    selectedSuggestion,

    // Methods
    handleAddressChange,
    handleSuggestionSelect,
    triggerValidation,
    clearAddress,
    hideSuggestions,

    // Computed values
    isValid: validationResult?.isValid || false,
    hasError: validationResult?.error != null,
    errorMessage: validationResult?.error,
    isGoogleValidated: validationResult?.validated || false,
    formattedAddress: validationResult?.formattedAddress,
    addressComponents: validationResult?.components,
    coordinates: validationResult?.geometry
  };
};