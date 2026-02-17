// Page-specific validation functions
export const validateOverviewPage = (formData) => {
  const errors = {};
  
  // Title validation
  if (!formData.title || formData.title.trim().length === 0) {
    errors.title = "Gig title is required";
  } else if (formData.title.length < 10) {
    errors.title = "Title must be at least 10 characters long";
  } else if (formData.title.length > 80) {
    errors.title = "Title must not exceed 80 characters";
  }
  
  // Category validation
  if (!formData.category) {
    errors.category = "Please select a category";
  }
  
  // Subcategory validation
  if (!formData.subcategory || formData.subcategory.length === 0) {
    errors.subcategory = "Please select at least one subcategory";
  } else if (formData.subcategory.length > 5) {
    errors.subcategory = "You can select maximum 5 subcategories";
  }
  
  // Search tags validation
  if (!formData.searchTags || formData.searchTags.length === 0) {
    errors.searchTags = "Please add at least one search tag";
  } else if (formData.searchTags.length > 5) {
    errors.searchTags = "You can add maximum 5 search tags";
  } else {
    // Check individual tag length
    const invalidTags = formData.searchTags.filter(tag => 
      !tag.trim() || tag.trim().length < 2 || tag.trim().length > 20
    );
    if (invalidTags.length > 0) {
      errors.searchTags = "Each tag must be between 2-20 characters";
    }
  }
  
  return { isValid: Object.keys(errors).length === 0, errors };
};

export const validatePricingPage = (pricing) => {
  const errors = {};
  const packageData = pricing.Basic || {};
  const packageErrors = {};

  // All fields are required for the single package
  if (!packageData.name || packageData.name.trim().length === 0) {
    packageErrors.name = "Package name is required";
  } else if (packageData.name.length < 3) {
    packageErrors.name = "Package name must be at least 3 characters";
  } else if (packageData.name.length > 50) {
    packageErrors.name = "Package name must not exceed 50 characters";
  }

  if (!packageData.details || packageData.details.trim().length === 0) {
    packageErrors.details = "Package details are required";
  } else {
    const tasks = packageData.details.split(';').filter(task => task.trim());
    if (tasks.length === 0) {
      packageErrors.details = "At least 1 task is required";
    } else if (tasks.length > 8) {
      packageErrors.details = "Maximum 8 tasks allowed";
    } else {
      const invalidTasks = tasks.filter(task => {
        const words = task.trim().split(/\s+/).filter(word => word.length > 0);
        return words.length > 50;
      });
      if (invalidTasks.length > 0) {
        packageErrors.details = "Each task cannot exceed 50 words";
      }
    }
  }

  if (!packageData.amount || packageData.amount <= 0) {
    packageErrors.amount = "Package amount must be greater than 0";
  } else if (packageData.amount < 10000) {
    packageErrors.amount = "Minimum amount is ₦10,000";
  } else if (packageData.amount > 1000000) {
    packageErrors.amount = "Maximum amount is ₦1,000,000";
  }

  if (Object.keys(packageErrors).length > 0) {
    errors.basic = packageErrors;
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateGalleryPage = (formData, selectedFile, imagePreview) => {
  const errors = {};
  
  // Image validation - at least one image is required (either new file or existing preview)
  if (!selectedFile && !imagePreview) {
    errors.image1 = "Please upload at least one image to showcase your service";
  }
  
  return { isValid: Object.keys(errors).length === 0, errors };
};

export const validatePublishPage = (formData, selectedFile, imagePreview) => {
  // Run all validations for final check
  const overviewValidation = validateOverviewPage(formData);
  const pricingValidation = validatePricingPage(formData.pricing);
  const galleryValidation = validateGalleryPage(formData, selectedFile, imagePreview);
  
  const allErrors = {
    ...overviewValidation.errors,
    ...pricingValidation.errors,
    ...galleryValidation.errors
  };
  
  return { 
    isValid: overviewValidation.isValid && pricingValidation.isValid && galleryValidation.isValid, 
    errors: allErrors 
  };
};

// Main validation function for form submission
const validateFormData = (dataToSubmit) => {
  // Define required fields for `addGigRequest`
  const requiredFields = [
    "Title",
    "Category",
    "SubCategory",
    "Tags",
    "PackageType",
    "PackageName",
    "PackageDetails",
    "DeliveryTime",
    "Price",
    "Image1",
    "Status",
    "CaregiverId",
  ];

  // Extract `addGigRequest` from `dataToSubmit`
  const addGigRequest = dataToSubmit.addGigRequest;

  // Find missing fields
  const missingFields = requiredFields.filter(
    (field) => !addGigRequest[field] || addGigRequest[field].length === 0
  );

  if (missingFields.length > 0) {
    console.error("Missing required fields in addGigRequest:", missingFields);
    return false;
  }

  return true;
};

export default validateFormData;
