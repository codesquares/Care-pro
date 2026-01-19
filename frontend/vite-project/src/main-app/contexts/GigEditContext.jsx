import { createContext, useContext, useReducer } from 'react';

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
        Basic: { name: "", details: "", deliveryTime: "1 Day Per Week", amount: "" },
        Standard: { name: "", details: "", deliveryTime: "1 Day Per Week", amount: "" },
        Premium: { name: "", details: "", deliveryTime: "1 Day Per Week", amount: "" },
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
          deliveryTime: "1 Day Per Week", // Auto-set to default frequency
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
      dispatch({ type: GIG_EDIT_ACTIONS.POPULATE_FROM_GIG, payload: gig });
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
