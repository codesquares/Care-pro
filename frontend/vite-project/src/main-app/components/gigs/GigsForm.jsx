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
  const [validationErrors, setValidationErrors] = useState({});
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
    isSaving
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

        const response = await fetch(
          `https://carepro-api20241118153443.azurewebsites.net/api/Gigs/caregiver/caregiverId?caregiverId=${userDetails.id}`
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

      Object.keys(formData).forEach((key) => {
        if (key === "searchTags") {
          formDataPayload.append("Tags", searchtags);
        } else if (key === "status") {
          formDataPayload.append("status", "Draft");
        } else if (key === "pricing") {
          Object.keys(formData.pricing).forEach((packageType) => {
            const packageData = formData.pricing[packageType];
            formDataPayload.append("PackageType", packageType);
            formDataPayload.append("PackageName", packageData.name);
            formDataPayload.append("PackageDetails", packageData.details);
            formDataPayload.append("DeliveryTime", packageData.deliveryTime);
            formDataPayload.append("Price", packageData.amount);
          });
        } else {
          formDataPayload.append(key, formData[key]);
        }
      });

      // Handle image for draft save
      if (selectedFile) {
        console.log("Adding Image1 file to draft FormData:", selectedFile.name);
        formDataPayload.append("Image1", selectedFile);
      } else if (isEditMode && formData?.image1) {
        // For edit mode without new image, don't append anything - the backend should keep existing
        console.log("Edit mode: keeping existing image, not appending to FormData");
        // Note: Backend should preserve existing image when no new Image1 is provided
      }

      const response = await axios.post(
        "https://carepro-api20241118153443.azurewebsites.net/api/Gigs",
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
    // Clear category validation error
    if (validationErrors.category) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.category;
        return newErrors;
      });
    }
  };

  const handleSubCategoryChange = (updatedSubcategories) => {
    updateField('subcategory', updatedSubcategories);
    // Clear subcategory validation error
    if (validationErrors.subcategory) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.subcategory;
        return newErrors;
      });
    }
  };

  const handleSearchTagChange = (tags) => {
    updateField('searchTags', tags);
    // Clear searchTags validation error
    if (validationErrors.searchTags) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.searchTags;
        return newErrors;
      });
    }
  };

  const handleTitleChange = (title) => {
    updateField('title', title);
    // Clear title validation error when user starts typing
    if (validationErrors.title) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.title;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitted(true);

    // Check gig limit before validation
    if (!canPublish) {
      toast.error("You can only have 2 active gigs at a time. Please pause one of your active gigs first to publish this one.");
      return;
    }

    // Check if image is selected (for new gigs) or exists (for edit mode)
    if (!selectedFile && !imagePreview) {
      console.error("No image selected or existing");
      setValidationErrors({ image1: "Please upload at least one image to showcase your service" });
      toast.error("Please upload an image before publishing");
      return;
    }

    // Final validation before submission
    console.log("Form data before validation:", formData);
    console.log("Selected file:", selectedFile?.name, selectedFile?.size);
    console.log("Image preview:", imagePreview ? "exists" : "null", imagePreview?.length || "N/A");
    
    const validation = validatePublishPage(formData, selectedFile, imagePreview);
    if (!validation.isValid) {
      console.log("Validation errors:", validation.errors);
      setValidationErrors(validation.errors);
      toast.error("Please fix all validation errors before publishing");
      return;
    }

    try {
      const formDataPayload = new FormData();

      // Handle basic fields
      formDataPayload.append("Title", formData.title || "");
      formDataPayload.append("Category", formData.category || "");
      
      // Handle subcategory array - backend expects List<string>
      if (formData.subcategory && Array.isArray(formData.subcategory)) {
        formData.subcategory.forEach(sub => {
          formDataPayload.append("SubCategory", sub);
        });
      }
      
      formDataPayload.append("Tags", searchtags || "");
      formDataPayload.append("Status", "Published");
      formDataPayload.append("CaregiverId", formData.caregiverId || "");
      
      // Handle image - append the file directly or existing base64 for edit mode
      if (selectedFile) {
        console.log("Adding new Image1 file to FormData:", selectedFile.name, selectedFile.type, selectedFile.size);
        formDataPayload.append("Image1", selectedFile);
      } else if (isEditMode && formData?.image1) {
        // For edit mode without new image, don't append anything - the backend should keep existing
        console.log("Edit mode: keeping existing image, not appending to FormData");
        // Note: Backend should preserve existing image when no new Image1 is provided
      }
      
      // Handle video URL
      if (formData.video) {
        formDataPayload.append("VideoURL", formData.video);
      }

      // Handle pricing - find the first completed package
      const completedPackage = Object.keys(formData.pricing).find(packageType => {
        const pkg = formData.pricing[packageType];
        return pkg.name && pkg.details && pkg.deliveryTime && pkg.amount;
      });
      
      if (completedPackage) {
        const packageData = formData.pricing[completedPackage];
        formDataPayload.append("PackageType", completedPackage);
        formDataPayload.append("PackageName", packageData.name);
        formDataPayload.append("PackageDetails", packageData.details);
        formDataPayload.append("DeliveryTime", packageData.deliveryTime);
        formDataPayload.append("Price", parseInt(packageData.amount, 10).toString());
      }

      for (let [key, value] of formDataPayload.entries()) {
        console.log(`FormData field: ${key} = ${value} (type: ${typeof value}, length: ${value?.length || 'N/A'})`);
      }

      console.log("About to send FormData to backend...");

      let response;
      if (isEditMode && formData?.id) {
        // Update existing gig
        response = await axios.put(
          `https://carepro-api20241118153443.azurewebsites.net/api/Gigs/UpdateGig/gigId?gigId=${formData.id}`,
          formDataPayload
        );
      } else {
        // Create new gig
        response = await axios.post(
          "https://carepro-api20241118153443.azurewebsites.net/api/Gigs",
          formDataPayload
        );
      }

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
          }).then(() => {
            console.log("Notification created successfully"); 
          });
        }
        
        setButtonBgColor("#34A853");
        setButtonText("Proceed");
        setIsModalOpen(true);
      }
    } catch (err) {
      if (err.response) {
        console.error("Validation Errors:", err.response.data.errors);
        setServerMessage(
          `Error: ${err.response.data.title || "Submission failed."}`
        );
        toast.error("Submission failed. Please try again.");
      } else {
        console.error("Unexpected Error:", err);
        setServerMessage("An unexpected error occurred.");
        toast.error("An unexpected error occurred. Please try again.");
        setModalTitle("Error!");
        setModalDescription("Something went wrong during registration. Please try again.");
        setButtonBgColor("#FF0000");
        setButtonText("Okay");
        setIsModalOpen(true);
      }
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
                  // Clear pricing validation errors when user makes changes
                  if (Object.keys(validationErrors).some(key => 
                    key.includes('basic') || key.includes('standard') || key.includes('premium') || key === 'general' || key === 'progression'
                  )) {
                    setValidationErrors(prev => {
                      const newErrors = { ...prev };
                      Object.keys(newErrors).forEach(key => {
                        if (key.includes('basic') || key.includes('standard') || key.includes('premium') || key === 'general' || key === 'progression') {
                          delete newErrors[key];
                        }
                      });
                      return newErrors;
                    });
                  }
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
