import Button from "../button/Button";
import GigsCard from "./GigsCard";
import PageBar from "./PageBar";
import PricingTable from "./Pricing";
import GalleryUploads from "./Gallery";
import GuidelinesCard from "./GuidelinesCard_fixed";
import "./gigs.scss";
import "./Pricing.scss";
import "./galleryUploads.scss";
import { useState, useEffect } from "react";
import PublishGig from "./Publish";
import config from "../../config"; // Import centralized config for API URLs
import axios from "axios";
import validateFormData, { 
  validateOverviewPage, 
  validatePricingPage, 
  validateGalleryPage, 
  validatePublishPage 
} from "../../Vadlidations/GigCreationValidation";
import { toast } from "react-toastify";
import Modal from "../../components/modal/Modal";
import { useNavigate, useLocation } from "react-router-dom";
import { createNotification } from "../../services/notificationService";
import { useGigForm } from "../../contexts/GigEditContext";

const GigsForm = () => {
  const pages = ["Overview", "Pricing", "Gallery", "Publish"];
  const [activeField, setActiveField] = useState(null);
  const [blurTimeout, setBlurTimeout] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [buttonText, setButtonText] = useState("okay");
  const [buttonBgColor, setButtonBgColor] = useState("#34A853");
  const [serverMessage, setServerMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(null);
  const [pageValidationStatus, setPageValidationStatus] = useState({
    0: false, // Overview
    1: false, // Pricing
    2: false, // Gallery
    3: false  // Publish
  });
  const [activeGigsCount, setActiveGigsCount] = useState(0);
  const [isLoadingGigs, setIsLoadingGigs] = useState(true);
  const navigate = useNavigate();
  
  // Use context for form state and current step
  const { 
    formData, 
    currentStep, 
    setCurrentStep, 
    isEditMode, 
    validateForm,
    updateField,
    isLoading,
    isSaving,
    setSaving,
    validationErrors,
    setValidationErrors
  } = useGigForm();
  
  // Check if we can publish (considering 2-gig limit)
  const canPublish = isEditMode || activeGigsCount < 2;
  
  // Debug logging for publish logic
  console.log('🔍 Publish Logic Debug:', {
    isEditMode,
    activeGigsCount,
    canPublish,
    formDataStatus: formData.status
  });
  
  // Check if we're editing a published gig
  const isEditingPublishedGig = isEditMode && (formData.status === "Published" || formData.status === "Active");

  const goToNextPage = () => {
    const currentPageValidation = validateCurrentPage();
    
    if (!currentPageValidation.isValid) {
      setValidationErrors(currentPageValidation.errors);
      toast.error("Please fix the validation errors before proceeding");
      return;
    }
    
    if (currentStep < pages.length - 1) {
      setValidationErrors({});
      setPageValidationStatus(prev => ({ ...prev, [currentStep]: true }));
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentStep > 0) {
      setValidationErrors({});
      setCurrentStep(currentStep - 1);
    }
  };

  const validateCurrentPage = () => {
    switch (currentStep) {
      case 0:
        return validateOverviewPage(formData);
      case 1:
        return validatePricingPage(formData.pricing);
      case 2:
        return validateGalleryPage(formData, selectedFile, imagePreview);
      case 3:
        return validatePublishPage(formData, selectedFile, imagePreview);
      default:
        return { isValid: true, errors: {} };
    }
  };

  const clearValidationErrors = () => {
    setValidationErrors({});
  };

  const handleFieldFocus = (fieldName) => {
    // Clear any pending blur timeout
    if (blurTimeout) {
      clearTimeout(blurTimeout);
      setBlurTimeout(null);
    }
    setActiveField(fieldName);
  };

  const handleFieldBlur = () => {
    // Set a longer delay to prevent flashing and allow for quick refocus
    const timeoutId = setTimeout(() => {
      setActiveField(null);
      setBlurTimeout(null);
    }, 800);
    setBlurTimeout(timeoutId);
  };

  // Alternative handler for elements that need persistent display
  const handleFieldHover = (fieldName) => {
    // Clear any pending blur timeout
    if (blurTimeout) {
      clearTimeout(blurTimeout);
      setBlurTimeout(null);
    }
    setActiveField(fieldName);
  };

  const handleFieldLeave = () => {
    // Shorter delay for mouse leave events
    const timeoutId = setTimeout(() => {
      setActiveField(null);
      setBlurTimeout(null);
    }, 300);
    setBlurTimeout(timeoutId);
  };

  const handleCloseGuidelines = () => {
    // Clear any pending blur timeout
    if (blurTimeout) {
      clearTimeout(blurTimeout);
      setBlurTimeout(null);
    }
    setActiveField(null);
  };

  const handleInputChange = (name, value) => {
    updateField(name, value);
  };

  const caregiverId = localStorage.getItem("userId");

  // Image-related state
  const [files, setFiles] = useState([]);
  const [video, setVideo] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Effect to set image preview if editing existing gig with image
  useEffect(() => {
    if (isEditMode && formData.image1) {
      // Check if it's already a URL or base64 data
      if (formData.image1.startsWith('http')) {
        // It's a Cloudinary URL, use it directly
        setImagePreview(formData.image1);
      } else {
        // It's base64 data, convert to data URL for preview
        const dataUrl = `data:image/jpeg;base64,${formData.image1}`;
        setImagePreview(dataUrl);
      }
    }
  }, [isEditMode, formData.image1]);

  // Effect to fetch existing gigs and count active ones
  useEffect(() => {
    const fetchActiveGigsCount = async () => {
      try {
        setIsLoadingGigs(true);
        const userDetails = JSON.parse(localStorage.getItem("userDetails"));
        if (!userDetails?.id) {
          console.warn("Caregiver ID not found in local storage.");
          setIsLoadingGigs(false);
          return;
        }

        // FIXED: Use centralized config instead of hardcoded Azure staging API URL
        const response = await fetch(
          `${config.BASE_URL}/Gigs/caregiver/caregiverId?caregiverId=${userDetails.id}`
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch gigs data.");
        }

        const existingGigs = await response.json();
        console.log('🔍 All existing gigs:', existingGigs.map(g => ({ id: g.id, status: g.status, title: g.title })));
        
        const activeGigs = existingGigs.filter(gig => {
          const status = gig.status?.toLowerCase();
          return status === 'published' || status === 'active';
        });
        
        console.log('🔍 Active gigs found:', activeGigs.length, activeGigs.map(g => ({ id: g.id, status: g.status })));
        setActiveGigsCount(activeGigs.length);
        
      } catch (err) {
        console.error('Error fetching active gigs count:', err);
        // Set to 0 on error to be safe, but log the error
      } finally {
        setIsLoadingGigs(false);
      }
    };

    fetchActiveGigsCount();
  }, []);

  // Cleanup blob URLs on component unmount
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const searchtags = formData.searchTags.length > 0
    ? formData.searchTags.join(", ")
    : null;

  const categories = {
    "Adult Care": [
      "Companionship", "Meal preparation", "Mobility assistance", "Medication reminders",
      "Bathing and grooming", "Dressing assistance", "Toileting and hygiene support",
      "Incontinence care", "Overnight supervision", "Chronic illness management"
    ],
    "Post Surgery Care": [
      "Wound care", "Medication management", "Post-surgery care",
      "Mobility assistance", "Home safety assessment", "Feeding assistance"
    ],
    "Child Care": [
      "Respite", "Babysitting", "Meal preparation", "Recreational activities assistance",
      "Emotional support and check-ins"
    ],
    "Pet Care": [
      "Pet minding", "Dog walking", "Feeding assistance", "Companionship"
    ],
    "Home Care": [
      "Light housekeeping", "Cleaning", "Cooking", "Home safety assessment",
      "Errands and shopping", "Transportation to appointments"
    ],
    "Special Needs Care": [
      "Dementia care", "Autism support", "Behavioral support", "Disability support services",
      "Assistive device training", "Language or communication support"
    ],
    "Medical Support": [
      "Nursing care", "Medication reminders", "Medical appointment coordination",
      "Palliative care support", "Chronic illness management"
    ],
    "Mobility Support": [
      "Mobility assistance", "Fall prevention monitoring", "Exercise and fitness support",
      "Assistive device training", "Transportation to appointments"
    ],
    "Therapy & Wellness": [
      "Physical therapy support", "Cognitive stimulation activities", "Emotional support and check-ins",
      "Recreational activities assistance", "Acupuncture", "Massage therapy"
    ],
    "Palliative": [
      "Palliative care support", "Overnight supervision", "Emotional support and check-ins",
      "Home safety assessment"
    ],
  };

  console.log("services:", formData.subcategory);

  const handleSaveAsDraft = async (e) => {
    e.preventDefault();
    setIsSubmitted(true);

    // Basic validation for draft - at least title and category should be present
    if (!formData.title || !formData.category) {
      toast.error("Please provide at least a title and category before saving as draft");
      return;
    }

    try {
      const formDataPayload = new FormData();

      // Map frontend form data to backend expected field names
      if (formData.title) {
        formDataPayload.append("Title", formData.title);
      }
      
      if (formData.category) {
        formDataPayload.append("Category", formData.category);
      }
      
      if (searchtags) {
        formDataPayload.append("Tags", searchtags);
      }
      
      // Always set status as Draft for this function
      formDataPayload.append("Status", "Draft");
      
      // Add CaregiverId (you'll need to get this from user context)
      const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
      if (userDetails.id) {
        formDataPayload.append("CaregiverId", userDetails.id);
      }

      // Handle pricing - only send the first package for now
      if (formData.pricing) {
        const packageTypes = Object.keys(formData.pricing);
        if (packageTypes.length > 0) {
          const firstPackageType = packageTypes[0];
          const packageData = formData.pricing[firstPackageType];
          
          formDataPayload.append("PackageType", firstPackageType);
          formDataPayload.append("PackageName", packageData.name || "");
          formDataPayload.append("PackageDetails", packageData.details || "");
          formDataPayload.append("DeliveryTime", packageData.deliveryTime || "");
          formDataPayload.append("Price", packageData.amount || "");
        }
      }

      // Handle image for draft save
      if (selectedFile) {
        console.log("Adding Image1 file to draft FormData:", selectedFile.name);
        formDataPayload.append("Image1", selectedFile);
      }

      // Add any other fields that might be missing but required by backend
      if (formData.description) {
        formDataPayload.append("Description", formData.description);
      }

      // FIXED: Use centralized config instead of hardcoded Azure staging API URL for gig creation
      const response = await axios.post(
        `${config.BASE_URL}/Gigs`,
        formDataPayload
      );

      if (response.status === 200) {
        setServerMessage("Gig saved as draft successfully!");
        setModalTitle("Success!");
        setModalDescription("Your Gig has been successfully saved as draft.");
        setButtonBgColor("#34A853");
        setButtonText("Proceed");
        setIsModalOpen(true);
        toast.success("Gig saved as draft!");
      }
    } catch (err) {
      console.error("Error saving draft:", err);
      setServerMessage("Failed to save draft.");
      toast.error("Failed to save draft. Please try again.");
    }
  };

  const handleCategoryChange = (category) => {
    updateField('category', category);
    updateField('subcategory', []); // Reset subcategory when category changes
  };

  const handleSubCategoryChange = (updatedSubcategories) => {
    updateField('subcategory', updatedSubcategories);
  };

  const handleSearchTagChange = (tags) => {
    updateField('searchTags', tags);
  };

  const handleTitleChange = (title) => {
    updateField('title', title);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitted(true);

    try {
      // Start loading state
      setSaving(true);

      // Check gig limit before validation
      if (!canPublish) {
        toast.error("You can only have 2 active gigs at a time. Please pause one of your active gigs first to publish this one.");
        setSaving(false);
        return;
      }

      // Check if image is selected (for new gigs) or exists (for edit mode)
      if (!selectedFile && !imagePreview) {
        console.error("No image selected or existing");
        setValidationErrors({ image1: "Please upload at least one image to showcase your service" });
        toast.error("Please upload an image before publishing");
        setSaving(false);
        return;
      }

      // Final validation before submission
      console.log("🔍 DEBUG - Form data before validation:", formData);
      console.log("🔍 DEBUG - Selected file:", selectedFile?.name, selectedFile?.size);
      console.log("🔍 DEBUG - Image preview:", imagePreview ? "exists" : "null", imagePreview?.length || "N/A");
      
      const validation = validatePublishPage(formData, selectedFile, imagePreview);
      console.log("🔍 DEBUG - Validation result:", validation);
      
      if (!validation.isValid) {
        console.log("❌ Validation failed with errors:", validation.errors);
        setValidationErrors(validation.errors);
        toast.error("Please fix all validation errors before publishing");
        setSaving(false);
        return;
      }

      console.log("✅ Validation passed, proceeding with submission...");
      
      // Debug: Log the exact subcategories being sent
      console.log("🔍 DEBUG - Subcategories to be sent:", formData.subcategory);
      console.log("🔍 DEBUG - Form data pricing:", formData.pricing);

      const formDataPayload = new FormData();

      // Get caregiver ID from localStorage if not in formData
      const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
      const caregiverId = formData.caregiverId || userDetails.id || "";
      
      console.log("🔍 DEBUG - Caregiver ID resolution:");
      console.log("- formData.caregiverId:", formData.caregiverId);
      console.log("- userDetails.id:", userDetails.id);
      console.log("- Final caregiverId:", caregiverId);

      // Handle basic fields
      formDataPayload.append("Title", formData.title || "");
      formDataPayload.append("Category", formData.category || "");
      
      // Handle subcategory array - API requires this field
      if (formData.subcategory && Array.isArray(formData.subcategory)) {
        formData.subcategory.forEach(sub => {
          formDataPayload.append("SubCategory", sub);
        });
        console.log("📋 Added SubCategory fields:", formData.subcategory);
      } else {
        // If no subcategories, we need to handle this error
        console.error("❌ No subcategories found in formData - this will cause validation error");
      }
      
      formDataPayload.append("Tags", searchtags || "");
      formDataPayload.append("Status", "Published");
      formDataPayload.append("CaregiverId", caregiverId);
      
      // Handle pricing - find the first completed package
      const completedPackage = Object.keys(formData.pricing).find(packageType => {
        const pkg = formData.pricing[packageType];
        return pkg.name && pkg.details && pkg.deliveryTime && pkg.amount;
      });
      
      if (completedPackage) {
        const packageData = formData.pricing[completedPackage];
        formDataPayload.append("PackageType", completedPackage || "");
        formDataPayload.append("PackageName", packageData.name || "");
        formDataPayload.append("PackageDetails", packageData.details || "");
        formDataPayload.append("DeliveryTime", packageData.deliveryTime || "");
        formDataPayload.append("Price", packageData.amount ? parseInt(packageData.amount, 10).toString() : "");
      } else {
        // Add empty values for required pricing fields if no package is completed
        formDataPayload.append("PackageType", "");
        formDataPayload.append("PackageName", "");
        formDataPayload.append("PackageDetails", "");
        formDataPayload.append("DeliveryTime", "");
        formDataPayload.append("Price", "");
      }
      
      // Handle image - append the file directly or existing base64 for edit mode
      if (selectedFile) {
        console.log("Adding new Image1 file to FormData:", selectedFile.name, selectedFile.type, selectedFile.size);
        formDataPayload.append("Image1", selectedFile);
      } else {
        // Add empty Image1 field if no file selected
        formDataPayload.append("Image1", "");
        console.log("No image file selected, appending empty Image1 field");
      }
      
      // Handle video URL
      if (formData.video) {
        formDataPayload.append("VideoURL", formData.video);
      }

      for (let [key, value] of formDataPayload.entries()) {
        console.log(`FormData field: ${key} = ${value} (type: ${typeof value}, length: ${value?.length || 'N/A'})`);
      }

      console.log("🚀 About to send FormData to backend...");
      console.log("📋 FormData Summary:");
      console.log("- Title:", formData.title || "EMPTY");
      console.log("- Category:", formData.category || "EMPTY");
      console.log("- CaregiverId:", caregiverId || "EMPTY");
      console.log("- SubCategory count:", formData.subcategory?.length || 0);
      console.log("- SubCategories:", formData.subcategory || "NONE");
      console.log("- Status: Published");
      console.log("- Has Image:", selectedFile ? "YES" : "NO");
      console.log("- Package Data:", completedPackage ? "YES" : "NO");

      // Create an AbortController for request cancellation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.error("⏰ Request timed out after 30 seconds");
      }, 30000); // 30 second timeout

      try {
        let response;
        const requestConfig = {
          timeout: 30000, // 30 seconds
          signal: controller.signal,
          headers: {
            // Let browser set Content-Type for FormData
          }
        };

        if (isEditMode && formData?.id) {
          console.log(`🔄 Updating existing gig with ID: ${formData.id}`);
          // Use centralized config for gig operations
          response = await axios.put(
            `${config.BASE_URL}/Gigs/UpdateGig/gigId?gigId=${formData.id}`,
            formDataPayload,
            requestConfig
          );
        } else {
          console.log("✨ Creating new gig");
          // Use centralized config for gig operations
          response = await axios.post(
            `${config.BASE_URL}/Gigs`,
            formDataPayload,
            requestConfig
          );
        }

        // Clear the timeout if request completes successfully
        clearTimeout(timeoutId);
        
        console.log("✅ API Response received:", response.status, response.data);

        if (response.status === 200) {
          const successMessage = isEditMode ? "Gig updated successfully!" : "Gig published successfully!";
          const modalDesc = isEditMode ? "Your Gig has been successfully updated." : "Your Gig has been successfully created.";
          
          setServerMessage(successMessage);
          setModalTitle("Success!");
          setModalDescription(modalDesc);
          
          if (!isEditMode) {
            // Only create notification for new gigs
            createNotification({
              recipientId: caregiverId,
              senderId: caregiverId,
              type: "NewGig",
              relatedEntityId: response.data?.id,
              title: "🛠️ New gig created by you",
              content: "You have successfully posted a new gig."
            }).then(() => {
              console.log("Notification created successfully"); 
            });
          }
          
          setButtonBgColor("#34A853");
          setButtonText("Proceed");
          setIsModalOpen(true);
          
          // Reset loading state on success as well
          setSaving(false);
        }
      } catch (requestError) {
        // Clear timeout on error
        clearTimeout(timeoutId);
        
        if (requestError.name === 'AbortError') {
          console.error("⏰ Request was aborted due to timeout");
          toast.error("Request timed out. Please try again.");
        } else {
          // Re-throw to be caught by outer catch block
          throw requestError;
        }
      }
    } catch (err) {
      console.error("🚨 ERROR - Submission failed:", err);
      
      if (err.response) {
        console.error("❌ API Error Response:", err.response.data);
        const errorMessage = err.response.data?.title || err.response.data?.message || "Submission failed.";
        setServerMessage(`Error: ${errorMessage}`);
        toast.error(`Submission failed: ${errorMessage}`);
        
        // Show validation errors if available
        if (err.response.data?.errors) {
          console.error("Validation Errors from API:", err.response.data.errors);
          setValidationErrors(err.response.data.errors);
        }
      } else if (err.request) {
        console.error("❌ Network Error - No response received:", err.request);
        setServerMessage("Network error: Please check your internet connection and try again.");
        toast.error("Network error. Please check your connection and try again.");
        setModalTitle("Network Error");
        setModalDescription("Unable to connect to the server. Please check your internet connection and try again.");
        setButtonBgColor("#FF0000");
        setButtonText("Okay");
        setIsModalOpen(true);
      } else {
        console.error("❌ Unexpected Error:", err.message);
        setServerMessage("An unexpected error occurred.");
        toast.error("An unexpected error occurred. Please try again.");
        setModalTitle("Error!");
        setModalDescription("Something went wrong during submission. Please try again.");
        setButtonBgColor("#FF0000");
        setButtonText("Okay");
        setIsModalOpen(true);
      }
    } finally {
      // Always reset loading state, regardless of success or failure
      setSaving(false);
      console.log("🔄 Loading state reset");
    }
  };

  const handleProceed = () => {
    setIsModalOpen(false);
    navigate("/app/caregiver/profile");
  };

  const onFileChange = (e, index) => {
    const file = e.target.files[0];
    
    // Handle image removal (when files array is empty or no file selected)
    if (!file || e.target.files.length === 0) {
      // Cleanup previous blob URL to prevent memory leaks
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      
      setSelectedFile(null);
      setImagePreview(null);
      console.log("Image removed/cleared");
      
      // Clear image validation error
      if (validationErrors.image1) {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.image1;
          return newErrors;
        });
      }
      return;
    }
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file (JPG, PNG, GIF, WebP).");
        return;
      }
      
      // Additional validation for specific formats
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        toast.error("Unsupported file format. Please use JPG, PNG, GIF, or WebP.");
        return;
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error("Image size must be less than 5MB.");
        return;
      }
      
      // Store the file object directly
      setSelectedFile(file);
      
      // Cleanup previous blob URL to prevent memory leaks
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      
      // Create preview using FileReader for data URL (CSP compliant)
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      console.log("File selected successfully:", file.name, file.size, "bytes");
      toast.success("Image selected successfully!");
      
      // Clear image validation error
      if (validationErrors.image1) {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.image1;
          return newErrors;
        });
      }
    }
  };

  return (
    <div className="gigs-form">
      <div className="gigs-form-header">
        <h1>{isEditMode ? 'Edit Gig' : 'Create New Gig'}</h1>
        {isEditMode && <p>Update your existing gig details</p>}
      </div>

      <div className="gigs-form-body">
        <div className="gigs-form-content">
          <div className="main-content">
            <PageBar 
              pages={pages} 
              currentPage={currentStep}
              onPageClick={(pageIndex) => setCurrentStep(pageIndex)}
              pageValidationStatus={pageValidationStatus}
            />
            
            {currentStep === 0 && (
              <GigsCard
                categories={categories}
                onCategoryChange={handleCategoryChange}
                onSubCategoryChange={handleSubCategoryChange}
                onSearchTagChange={handleSearchTagChange}
                onTitleChange={handleTitleChange}
                onFieldFocus={handleFieldFocus}
                onFieldBlur={handleFieldBlur}
                onFieldHover={handleFieldHover}
                onFieldLeave={handleFieldLeave}
                clearValidationErrors={clearValidationErrors}
              />
            )}
            {currentStep === 1 && (
              <PricingTable
                pricing={formData.pricing}
                onPricingChange={(updatedPricing) => {
                  updateField('pricing', updatedPricing);
                }}
                onFieldFocus={handleFieldFocus}
                onFieldBlur={handleFieldBlur}
                onFieldHover={handleFieldHover}
                onFieldLeave={handleFieldLeave}
                validationErrors={validationErrors}
              />
            )}
            {currentStep === 2 && (
              <GalleryUploads 
                onFileChange={onFileChange} 
                onFieldFocus={handleFieldFocus}
                onFieldBlur={handleFieldBlur}
                onFieldHover={handleFieldHover}
                onFieldLeave={handleFieldLeave}
                validationErrors={validationErrors}
                imagePreview={imagePreview}
                selectedFile={selectedFile}
              />
            )}
            {currentStep === 3 && (
              <PublishGig
                image={imagePreview || ''}
                title={formData.title || "Your Gig"}
                onSaveAsDraft={handleSaveAsDraft}
                onPublish={handleSubmit}
                onFieldFocus={handleFieldFocus}
                onFieldBlur={handleFieldBlur}
                onFieldHover={handleFieldHover}
                onFieldLeave={handleFieldLeave}
                canPublish={canPublish}
                activeGigsCount={activeGigsCount}
                isEditingPublishedGig={isEditingPublishedGig}
                isLoadingGigs={isLoadingGigs}
                isSaving={isSaving}
                validationErrors={(() => {
                  const validation = validatePublishPage(formData, selectedFile, imagePreview);
                  return validation.errors;
                })()}
              />
            )}
            <div className="gigs-form-buttons">
              {currentStep < pages.length - 1 && (
                <>
                  {currentStep > 0 && (
                    <Button onClick={goToPreviousPage}>Back</Button>
                  )}
                  <Button onClick={goToNextPage}>Save & Continue</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <GuidelinesCard 
        currentPage={currentStep} 
        activeField={activeField} 
        onClose={handleCloseGuidelines}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProceed={handleProceed}
        title={modalTitle}
        description={modalDescription}
        buttonText={buttonText}
        buttonBgColor={buttonBgColor}
      />
    </div>
  );
};

export default GigsForm;
