import React, { useRef, useEffect, useCallback } from 'react';
import { useAddressValidation } from '../hooks/useAddressValidation';
import './AddressInput.css';

/**
 * Address input component with Google Maps autocomplete and validation
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Address input component
 */
const AddressInput = ({
  value = '',
  onChange,
  onValidation,
  placeholder = 'Enter full address (e.g., 123 Main St, Los Angeles, CA 90210)',
  disabled = false,
  required = false,
  className = '',
  showValidationIcon = true,
  autoValidate = true,
  country = 'ng'
}) => {
  const inputRef = useRef(null);
  const suggestionRefs = useRef([]);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = React.useState(-1);

  const {
    address,
    suggestions,
    validationResult,
    isValidating,
    isLoadingSuggestions,
    showSuggestions,
    handleAddressChange,
    handleSuggestionSelect,
    triggerValidation,
    hideSuggestions,
    isValid,
    hasError,
    errorMessage,
    isGoogleValidated,
    formattedAddress,
    addressComponents,
    coordinates
  } = useAddressValidation({
    enableAutocomplete: true,
    country
  });

  // Sync external value with internal state (only when external value changes)
  useEffect(() => {
    if (value !== address && typeof value === 'string') {
      handleAddressChange(value);
    }
  }, [value]);

  // Notify parent of changes (with debouncing to prevent loops)
  const [lastNotifiedAddress, setLastNotifiedAddress] = React.useState('');
  useEffect(() => {
    if (onChange && address !== lastNotifiedAddress) {
      onChange(address);
      setLastNotifiedAddress(address);
    }
  }, [address, onChange]);

  // Notify parent of validation results (prevent loops with ref)
  const lastValidationRef = useRef(null);
  useEffect(() => {
    if (onValidation && validationResult && validationResult !== lastValidationRef.current) {
      lastValidationRef.current = validationResult;
      onValidation({
        isValid,
        hasError,
        errorMessage,
        isGoogleValidated,
        formattedAddress,
        addressComponents,
        coordinates
      });
    }
  }, [onValidation, validationResult, isValid, hasError, errorMessage, isGoogleValidated, formattedAddress, addressComponents, coordinates]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter' && autoValidate) {
        e.preventDefault();
        triggerValidation();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedSuggestionIndex >= 0 && focusedSuggestionIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[focusedSuggestionIndex]);
        } else if (autoValidate) {
          triggerValidation();
        }
        setFocusedSuggestionIndex(-1);
        break;
      case 'Escape':
        hideSuggestions();
        setFocusedSuggestionIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle input focus
  const handleFocus = useCallback(() => {
    if (suggestions.length > 0) {
      // Show suggestions again if available
      setTimeout(() => {
        if (suggestions.length > 0) {
          // Trigger suggestions if we have some
        }
      }, 100);
    }
  }, []); // Empty dependencies

  // Handle input blur
  const handleBlur = useCallback((e) => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      if (e.currentTarget && document.activeElement && !e.currentTarget.contains(document.activeElement)) {
        hideSuggestions();
        setFocusedSuggestionIndex(-1);
        
        // Auto-validate on blur if enabled
        if (autoValidate && address && !validationResult) {
          triggerValidation();
        }
      }
    }, 150);
  }, []); // Empty dependencies to prevent recreation

  // Handle suggestion click
  const handleSuggestionClick = (suggestion, index) => {
    handleSuggestionSelect(suggestion);
    setFocusedSuggestionIndex(-1);
    inputRef.current?.focus();
  };

  // Get input class names based on validation state
  const getInputClassName = () => {
    let classes = ['address-input'];
    
    if (className) {
      classes.push(className);
    }
    
    if (validationResult) {
      if (isValid) {
        classes.push('address-input--valid');
      } else if (hasError) {
        classes.push('address-input--error');
      }
    }
    
    if (isValidating) {
      classes.push('address-input--validating');
    }
    
    return classes.join(' ');
  };

  // Get validation icon
  const getValidationIcon = () => {
    if (!showValidationIcon) return null;
    
    if (isValidating) {
      return <span className="address-input__icon address-input__icon--loading">⟳</span>;
    }
    
    if (validationResult) {
      if (isValid) {
        if (isGoogleValidated) {
          return <span className="address-input__icon address-input__icon--success">✓</span>;
        } else {
          return <span className="address-input__icon address-input__icon--warning">⚠</span>;
        }
      } else if (hasError) {
        return <span className="address-input__icon address-input__icon--error">✗</span>;
      }
    }
    
    return null;
  };

  return (
    <div className="address-input-container" onBlur={handleBlur}>
      <div className="address-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={address}
          onChange={useCallback((e) => handleAddressChange(e.target.value), [handleAddressChange])}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={getInputClassName()}
          autoComplete="street-address"
          spellCheck="false"
        />
        {getValidationIcon()}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="address-suggestions">
          {isLoadingSuggestions && (
            <div className="address-suggestion address-suggestion--loading">
              <span className="address-suggestion__icon">⟳</span>
              <span>Loading suggestions...</span>
            </div>
          )}
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.placeId}
              ref={el => suggestionRefs.current[index] = el}
              className={`address-suggestion ${
                index === focusedSuggestionIndex ? 'address-suggestion--focused' : ''
              }`}
              onClick={() => handleSuggestionClick(suggestion, index)}
              onMouseEnter={() => setFocusedSuggestionIndex(index)}
            >
              <div className="address-suggestion__main">{suggestion.mainText}</div>
              <div className="address-suggestion__secondary">{suggestion.secondaryText}</div>
            </div>
          ))}
        </div>
      )}

      {/* Validation message */}
      {hasError && (
        <div className="address-input__error">
          {errorMessage}
        </div>
      )}

      {/* Validation info */}
      {isValid && validationResult && (
        <div className="address-input__info">
          {isGoogleValidated ? (
            <span className="address-input__info--success">
              ✓ Address validated by Google Maps
            </span>
          ) : (
            <span className="address-input__info--warning">
              ⚠ Basic validation only - consider selecting from suggestions for better accuracy
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressInput;