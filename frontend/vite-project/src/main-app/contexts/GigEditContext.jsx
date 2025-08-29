import React, { createContext, useContext, useReducer } from 'react';

// Initial state for gig editing
const initialState = {
  // Form data
  formData: {
    id: null,
    title: '',
    category: '',
    subcategory: [],
    searchTags: [],
    description: '',
    location: '',
    hourlyRate: '',
    pricing: {
      Basic: { name: "", details: "", deliveryTime: "", amount: "" },
      Standard: { name: "", details: "", deliveryTime: "", amount: "" },
      Premium: { name: "", details: "", deliveryTime: "", amount: "" },
    },
    video: "https://www.youtube.com/watch?v=RVFAyFWO4go",
    status: "",
    caregiverId: localStorage.getItem("userId") || "",
    image1: "",
    availability: {
      monday: { available: false, startTime: '', endTime: '' },
      tuesday: { available: false, startTime: '', endTime: '' },
      wednesday: { available: false, startTime: '', endTime: '' },
      thursday: { available: false, startTime: '', endTime: '' },
      friday: { available: false, startTime: '', endTime: '' },
      saturday: { available: false, startTime: '', endTime: '' },
      sunday: { available: false, startTime: '', endTime: '' }
    }
  },
  
  // UI states
  isEditMode: false,
  isLoading: false,
  isSaving: false,
  
  // Validation
  validationErrors: {},
  
  // Navigation
  currentStep: 0,
  totalSteps: 4
};

// Action types
const GIG_EDIT_ACTIONS = {
  SET_EDIT_MODE: 'SET_EDIT_MODE',
  SET_FORM_DATA: 'SET_FORM_DATA',
  UPDATE_FORM_FIELD: 'UPDATE_FORM_FIELD',
  SET_LOADING: 'SET_LOADING',
  SET_SAVING: 'SET_SAVING',
  SET_VALIDATION_ERRORS: 'SET_VALIDATION_ERRORS',
  SET_CURRENT_STEP: 'SET_CURRENT_STEP',
  RESET_FORM: 'RESET_FORM',
  POPULATE_FROM_GIG: 'POPULATE_FROM_GIG'
};

// Reducer function
function gigEditReducer(state, action) {
  // Debug: Log every action that comes through
  console.log('🔍 DEBUG - Reducer called with action type:', action.type);
  console.log('🔍 DEBUG - Available action types:', Object.values(GIG_EDIT_ACTIONS));
  
  switch (action.type) {
    case GIG_EDIT_ACTIONS.SET_EDIT_MODE:
      return {
        ...state,
        isEditMode: action.payload
      };

    case GIG_EDIT_ACTIONS.SET_FORM_DATA:
      return {
        ...state,
        formData: { ...state.formData, ...action.payload }
      };

    case GIG_EDIT_ACTIONS.UPDATE_FORM_FIELD:
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.payload.field]: action.payload.value
        }
      };

    case GIG_EDIT_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case GIG_EDIT_ACTIONS.SET_SAVING:
      return {
        ...state,
        isSaving: action.payload
      };

    case GIG_EDIT_ACTIONS.SET_VALIDATION_ERRORS:
      return {
        ...state,
        validationErrors: action.payload
      };

    case GIG_EDIT_ACTIONS.SET_CURRENT_STEP:
      return {
        ...state,
        currentStep: action.payload
      };

    case GIG_EDIT_ACTIONS.RESET_FORM:
      return {
        ...initialState
      };

    case GIG_EDIT_ACTIONS.POPULATE_FROM_GIG:
      const gig = action.payload;
      
      // Debug: Log what we receive
      console.log('🔍 DEBUG - PopulateFromGig received:', gig);
      console.log('🔍 DEBUG - Available keys:', Object.keys(gig));
      console.log('🔍 DEBUG - Reducer is processing POPULATE_FROM_GIG action');
      
      // Parse pricing data if it exists
      let pricingData = {
        Basic: { name: "", details: "", deliveryTime: "", amount: "" },
        Standard: { name: "", details: "", deliveryTime: "", amount: "" },
        Premium: { name: "", details: "", deliveryTime: "", amount: "" },
      };

      // Handle pricing data that might come from API
      if (gig.pricing || gig.Pricing) {
        try {
          const pricingSource = gig.pricing || gig.Pricing;
          pricingData = typeof pricingSource === 'string' 
            ? JSON.parse(pricingSource) 
            : pricingSource;
        } catch (error) {
          console.error('Error parsing pricing data:', error);
        }
      }
      // If no pricing data, try to construct from individual fields
      else if (gig.PackageName || gig.packageName || gig.PackageDetails || gig.packageDetails) {
        const packageName = gig.PackageName || gig.packageName || "";
        const packageDetails = gig.PackageDetails || gig.packageDetails || [];
        const deliveryTime = gig.DeliveryTime || gig.deliveryTime || "";
        const price = gig.Price || gig.price || "";
        
        // Basic pricing structure from API data
        pricingData.Basic = {
          name: packageName,
          details: Array.isArray(packageDetails) ? packageDetails.join('; ') : packageDetails,
          deliveryTime: deliveryTime,
          amount: price
        };
      }

      // Parse search tags if they exist
      let searchTagsArray = [];
      // API returns 'Tags' (capital T) as a string
      if (gig.tags || gig.Tags) {
        const tagsData = gig.tags || gig.Tags;
        searchTagsArray = typeof tagsData === 'string' 
          ? tagsData.split(', ') 
          : tagsData;
      }

      // Parse subcategory if it exists
      let subcategoryArray = [];
      // API returns 'SubCategory' (capital S) as a List<string>
      if (gig.subcategory || gig.SubCategory) {
        const subcategoryData = gig.subcategory || gig.SubCategory;
        subcategoryArray = Array.isArray(subcategoryData) 
          ? subcategoryData 
          : [subcategoryData];
      }

      // Debug: Log the parsed arrays
      console.log('🔍 DEBUG - Parsed searchTags:', searchTagsArray);
      console.log('🔍 DEBUG - Parsed subcategory:', subcategoryArray);
      console.log('🔍 DEBUG - About to create result object');

      const result = {
        ...state,
        formData: {
          ...state.formData,
          id: gig.id || gig.Id || null,
          title: gig.title || gig.Title || '',
          category: gig.category || gig.Category || '',
          subcategory: subcategoryArray,
          searchTags: searchTagsArray,
          description: gig.description || gig.Description || gig.title || gig.Title || '', // Fallback to title if no description
          location: gig.location || gig.Location || '',
          hourlyRate: gig.hourlyRate || gig.HourlyRate || gig.price || gig.Price || '', // Price might be hourly rate
          pricing: pricingData,
          video: gig.video || gig.Video || gig.VideoURL || "https://www.youtube.com/watch?v=RVFAyFWO4go",
          status: gig.status || gig.Status || "",
          caregiverId: gig.caregiverId || gig.CaregiverId || localStorage.getItem("userId") || "",
          image1: gig.image1 || gig.Image1 || "",
          availability: gig.availability || gig.Availability || state.formData.availability
        },
        isEditMode: true,
        currentStep: 0,
        validationErrors: {}
      };

      // Debug: Log the final result
      console.log('🔍 DEBUG - Final result being returned from reducer:', result);
      console.log('🔍 DEBUG - Result isEditMode:', result.isEditMode);
      console.log('🔍 DEBUG - Result formData.title:', result.formData.title);

      return result;

    default:
      return state;
  }
}

// Create context
const GigEditContext = createContext();

// Context provider component
export function GigEditProvider({ children }) {
  const [state, dispatch] = useReducer(gigEditReducer, initialState);

  // Action creators
  const actions = {
    setEditMode: (isEdit) => {
      dispatch({ type: GIG_EDIT_ACTIONS.SET_EDIT_MODE, payload: isEdit });
    },

    setFormData: (data) => {
      dispatch({ type: GIG_EDIT_ACTIONS.SET_FORM_DATA, payload: data });
    },

    updateFormField: (field, value) => {
      dispatch({ 
        type: GIG_EDIT_ACTIONS.UPDATE_FORM_FIELD, 
        payload: { field, value } 
      });
    },

    setLoading: (loading) => {
      dispatch({ type: GIG_EDIT_ACTIONS.SET_LOADING, payload: loading });
    },

    setSaving: (saving) => {
      dispatch({ type: GIG_EDIT_ACTIONS.SET_SAVING, payload: saving });
    },

    setValidationErrors: (errors) => {
      dispatch({ type: GIG_EDIT_ACTIONS.SET_VALIDATION_ERRORS, payload: errors });
    },

    setCurrentStep: (step) => {
      dispatch({ type: GIG_EDIT_ACTIONS.SET_CURRENT_STEP, payload: step });
    },

    resetForm: () => {
      dispatch({ type: GIG_EDIT_ACTIONS.RESET_FORM });
    },

    populateFromGig: (gig) => {
      console.log('🔍 DEBUG - populateFromGig called with:', gig);
      console.log('🔍 DEBUG - About to dispatch POPULATE_FROM_GIG action');
      console.log('🔍 DEBUG - Action type constant:', GIG_EDIT_ACTIONS.POPULATE_FROM_GIG);
      dispatch({ type: GIG_EDIT_ACTIONS.POPULATE_FROM_GIG, payload: gig });
      console.log('🔍 DEBUG - Dispatch completed');
    },

    // Convenience methods
    goToNextStep: () => {
      if (state.currentStep < state.totalSteps) {
        dispatch({ 
          type: GIG_EDIT_ACTIONS.SET_CURRENT_STEP, 
          payload: state.currentStep + 1 
        });
      }
    },

    goToPreviousStep: () => {
      if (state.currentStep > 1) {
        dispatch({ 
          type: GIG_EDIT_ACTIONS.SET_CURRENT_STEP, 
          payload: state.currentStep - 1 
        });
      }
    }
  };

  const value = {
    ...state,
    ...actions
  };

  // Debug: Log current state
  console.log('🔍 DEBUG - GigEditProvider current state:', {
    isEditMode: state.isEditMode,
    currentStep: state.currentStep,
    formDataTitle: state.formData?.title,
    formDataCategory: state.formData?.category,
    formDataSubcategory: state.formData?.subcategory,
    formDataSearchTags: state.formData?.searchTags
  });

  return (
    <GigEditContext.Provider value={value}>
      {children}
    </GigEditContext.Provider>
  );
}

// Custom hook to use the context
export function useGigEdit() {
  const context = useContext(GigEditContext);
  
  if (!context) {
    throw new Error('useGigEdit must be used within a GigEditProvider');
  }
  
  return context;
}

// Custom hook for form operations
export function useGigForm() {
  const context = useGigEdit();
  
  // Debug: Log what context we're getting
  console.log('🔍 DEBUG - useGigForm context:', {
    isEditMode: context?.isEditMode,
    currentStep: context?.currentStep,
    formDataKeys: context?.formData ? Object.keys(context.formData) : 'no formData',
    title: context?.formData?.title,
    category: context?.formData?.category
  });
  
  const updateField = (field, value) => {
    context.updateFormField(field, value);
    
    // Clear validation error for this field
    if (context.validationErrors[field]) {
      const newErrors = { ...context.validationErrors };
      delete newErrors[field];
      context.setValidationErrors(newErrors);
    }
  };

  const validateForm = () => {
    const errors = {};
    const { formData } = context;

    // Required field validations
    if (!formData.title?.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.category) {
      errors.category = 'Category is required';
    }

    if (!formData.subcategory?.length) {
      errors.subcategory = 'At least one subcategory is required';
    }

    if (!formData.searchTags?.length) {
      errors.searchTags = 'At least one tag is required';
    }

    if (!formData.description?.trim()) {
      errors.description = 'Description is required';
    }

    context.setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  return {
    ...context,
    updateField,
    validateForm
  };
}

export default GigEditContext;
