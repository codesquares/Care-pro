import Button from "../button/Button";
import GigsCard from "./GigsCard";
import PageBar from "./PageBar";
import PricingTable from "./Pricing";
import GalleryUploads from "./Gallery";
import GuidelinesCard from "./GuidelinesCard_fixed";
import "./gigs.css";
import "./Pricing.css";
import "./galleryUploads.css";
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
import { useCaregiverStatus } from "../../contexts/CaregiverStatusContext";
import { useAutoSave } from "../../hooks/useAutoSave";
import ResumeModal from "./ResumeModal";
import GigService from "../../services/gigService";

const GigsForm = () => {
  const pages = ["Overview", "Pricing", "Gallery", "Publish"];
  const [activeField, setActiveField] = useState(null);
  const [blurTimeout, setBlurTimeout] = useState(null);
  const [showGuidelines, setShowGuidelines] = useState(true);
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [failureMessage, setFailureMessage] = useState("");
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [publishedGigId, setPublishedGigId] = useState(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [draftInfo, setDraftInfo] = useState(null);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState(null);
  const navigate = useNavigate();
  
  // Use caregiver status context for eligibility
  const { 
    canPublishGigs, 
    isLoading: isLoadingStatus,
    isVerified,
    isQualified,
    hasCertificates
  } = useCaregiverStatus();
  
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
    setValidationErrors,
    populateFromGig
  } = useGigForm();
  
  // Check if we're editing a published gig (not a draft)
  // Normalize status comparison for idempotency - handle both "Published" and "published"
  const isEditingPublishedGig = isEditMode && 
    (formData.status?.toLowerCase() === "published" || formData.status?.toLowerCase() === "active");
  
  // Check if we can publish (considering 2-gig limit and caregiver eligibility)
  // Idempotent logic:
  // - If editing an already published gig: Always allow (not adding a new active gig)
  // - If editing a draft or creating new: Only allow if activeGigsCount < 2
  // - All cases require eligibility (canPublishGigs)
  const canPublish = (isEditingPublishedGig || activeGigsCount < 2) && canPublishGigs;
  
  // Debug logging for publish logic
  console.log('🔍 Publish Logic Debug:', {
    isEditMode,
    isEditingPublishedGig,
    activeGigsCount,
    canPublishGigs,
    canPublish,
    formDataStatus: formData.status,
    isLoadingStatus
  });

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
    setShowGuidelines(false);
  };

  const handleCopyGigLink = async () => {
    const shareUrl = `https://api.oncarepro.com/api/share/gig/${publishedGigId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleResumeDraft = () => {
    if (draftInfo && draftInfo.data) {
      // Populate form with draft data using context
      populateFromGig(draftInfo.data);
      setIsAutoSaveEnabled(true);
      toast.success('Draft loaded successfully');
    }
  };

  const handleStartFresh = async () => {
    // Delete the draft and start fresh
    if (draftInfo?.id) {
      try {
        // Optional: Delete the draft from backend
        // await GigService.deleteDraft(draftInfo.id);
        console.log('Starting fresh, draft discarded');
      } catch (error) {
        console.error('Error deleting draft:', error);
      }
    }
    setDraftInfo(null);
    setIsAutoSaveEnabled(true);
  };

  const handleSocialShareGig = (platform) => {
    const shareUrl = `https://api.oncarepro.com/api/share/gig/${publishedGigId}`;
    const text = `Check out this care service: ${formData?.title || ''}`;
    
    let url = '';
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      default:
        return;
    }
    
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleInputChange = (name, value) => {
    updateField(name, value);
  };

  const caregiverId = localStorage.getItem("userId");

  // Auto-save hook - saves draft every 10 seconds when enabled
  const { saveImmediately } = useAutoSave(
    formData,
    async (data) => {
      // Only auto-save if there's meaningful content
      if (!data.title && !data.category && !data.description) {
        return { success: false, message: 'No data to save' };
      }
      
      try {
        console.log('🔄 Auto-saving draft...');
        const result = await GigService.saveDraft(data);
        
        // Only update form data with saved draft ID if save was successful
        if (result.success && result.id && !formData.id) {
          updateField('id', result.id);
        }
        
        return result;
      } catch (error) {
        // Silently fail auto-save - don't disrupt user experience
        console.error('Auto-save error:', error?.response?.data || error.message);
        return { success: false, error };
      }
    },
    10000, // Auto-save every 10 seconds
    {
      enabled: isAutoSaveEnabled,
      skipInitial: true,
      onSaveSuccess: (result) => {
        if (result?.success !== false) {
          setLastAutoSave(new Date());
          console.log('✅ Draft auto-saved successfully');
        }
      },
      onSaveError: (error) => {
        // Silently log error without showing to user
        console.warn('⚠️ Auto-save failed (silent):', error?.message || 'Unknown error');
      }
    }
  );

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

  // Effect to check for existing drafts on mount (only if not in edit mode)
  useEffect(() => {
    const checkForDrafts = async () => {
      // Skip if already in edit mode (loading existing gig)
      if (isEditMode) {
        setIsAutoSaveEnabled(true); // Enable auto-save for editing
        return;
      }

      try {
        const result = await GigService.getUserDrafts();
        if (result.success && result.data.length > 0) {
          // Get the most recent draft (sorted by date)
          const sortedDrafts = result.data.sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt || 0);
            const dateB = new Date(b.updatedAt || b.createdAt || 0);
            return dateB - dateA;
          });
          
          const recentDraft = sortedDrafts[0];
          setDraftInfo({
            id: recentDraft.id,
            lastSaved: recentDraft.updatedAt || recentDraft.createdAt,
            data: recentDraft
          });
          setShowResumeModal(true);
        } else {
          // No drafts found, enable auto-save for new gig
          setIsAutoSaveEnabled(true);
        }
      } catch (error) {
        // Handle errors gracefully (404, network issues, etc.)
        console.warn('Could not check for drafts:', error?.response?.status, error?.message);
        // Enable auto-save even on error - don't block user
        setIsAutoSaveEnabled(true);
      }
    };

    checkForDrafts();
  }, []); // Only run on mount

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
        const token = localStorage.getItem('authToken');
        const response = await fetch(
          `${config.BASE_URL}/Gigs/caregiver/${userDetails.id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
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

      // Handle image for draft save - same logic as publish
      if (selectedFile) {
        console.log("Adding Image1 file to draft FormData:", selectedFile.name);
        formDataPayload.append("Image1", selectedFile);
      } else if (isEditMode && imagePreview) {
        console.log("Edit mode (draft): Preserving existing image, not appending Image1 field");
        // Don't append Image1 - backend will keep existing image
      } else {
        // New draft creation without image - backend may require this
        console.log("New draft without image, appending empty Image1 field");
        formDataPayload.append("Image1", "");
      }

      // Handle subcategory array - API requires this field
      if (formData.subcategory && Array.isArray(formData.subcategory)) {
        formData.subcategory.forEach(sub => {
          formDataPayload.append("SubCategory", sub);
        });
        console.log("📋 Added SubCategory fields to draft:", formData.subcategory);
      }

      // Add any other fields that might be missing but required by backend
      if (formData.description) {
        formDataPayload.append("Description", formData.description);
      }

      // Handle create vs update based on edit mode
      let response;
      if (isEditMode && formData?.id) {
        console.log(`🔄 Updating existing draft gig with ID: ${formData.id}`);
        response = await axios.put(
          `${config.BASE_URL}/Gigs/UpdateGig/gigId?gigId=${formData.id}`,
          formDataPayload
        );
      } else {
        console.log("✨ Creating new draft gig");
        response = await axios.post(
          `${config.BASE_URL}/Gigs`,
          formDataPayload
        );
      }

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

      // Check gig limit and eligibility before validation
      if (!canPublish) {
        // Provide specific error messages based on the reason
        if (!canPublishGigs) {
          const missingRequirements = [];
          if (!isVerified) missingRequirements.push('complete identity verification');
          if (!isQualified) missingRequirements.push('pass qualification assessment');
          if (!hasCertificates) missingRequirements.push('upload at least one certificate');
          
          toast.error(`To publish gigs, you need to: ${missingRequirements.join(', ')}`);
        } else if (activeGigsCount >= 2 && !isEditingPublishedGig) {
          toast.error("You can only have 2 active gigs at a time. Please pause one of your active gigs first to publish this one.");
        }
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
      
      // Idempotent status handling:
      // - If editing a published gig: maintain "published" status
      // - If editing a draft OR creating new: set to "Published" (user clicked Publish)
      // This ensures consistent behavior regardless of entry point
      const targetStatus = (isEditMode && formData.status?.toLowerCase() === "published") 
        ? "published"  // Preserve published status
        : "Published"; // Publish draft or new gig
      
      console.log("🔍 DEBUG - Status handling:");
      console.log("- isEditMode:", isEditMode);
      console.log("- formData.status:", formData.status);
      console.log("- targetStatus:", targetStatus);
      
      formDataPayload.append("Status", targetStatus);
      
      formDataPayload.append("CaregiverId", caregiverId);
      
      // Handle pricing - find the first completed package
      const completedPackage = Object.keys(formData.pricing).find(packageType => {
        const pkg = formData.pricing[packageType];
        return pkg.name && pkg.details && pkg.amount; // deliveryTime is auto-set
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
      
      // Handle image - only append if a new file is selected
      // For edit mode without image changes, omit Image1 field to preserve existing image
      if (selectedFile) {
        console.log("Adding new Image1 file to FormData:", selectedFile.name, selectedFile.type, selectedFile.size);
        formDataPayload.append("Image1", selectedFile);
      } else if (isEditMode && imagePreview) {
        console.log("Edit mode: Preserving existing image, not appending Image1 field");
        // Don't append Image1 - backend will keep existing image
      } else {
        // New gig creation without image - this should not happen due to validation
        console.warn("No image provided for new gig creation");
        formDataPayload.append("Image1", "");
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
          // Idempotent success messaging based on actual action taken
          const successMessage = isEditMode 
            ? (isEditingPublishedGig ? "Gig updated successfully!" : "Gig published successfully!") 
            : "Gig published successfully!";
          
          // Store the published gig ID for sharing
          if (response.data?.id) {
            setPublishedGigId(response.data.id);
          }
          
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
          
          // Show custom success modal instead of generic modal
          setShowSuccessModal(true);
          
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
        setFailureMessage("Unable to connect to the server. Please check your internet connection and try again.");
        setShowFailureModal(true);
      } else {
        console.error("❌ Unexpected Error:", err.message);
        setServerMessage("An unexpected error occurred.");
        toast.error("An unexpected error occurred. Please try again.");
        setFailureMessage("Something went wrong during submission. Please try again.");
        setShowFailureModal(true);
      }
    } finally {
      // Always reset loading state, regardless of success or failure
      setSaving(false);
      console.log("🔄 Loading state reset");
    }
  };

  const handleProceed = () => {
    setIsModalOpen(false);
    navigate("/app/caregiver/profile", { state: { refreshGigs: true } });
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
        <div>
          <h1>{isEditMode ? 'Edit Gig' : 'Create New Gig'}</h1>
          {isEditMode && <p>Update your existing gig details</p>}
        </div>
        
        {/* Auto-save indicator */}
        {isAutoSaveEnabled && lastAutoSave && (
          <div className="auto-save-indicator">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            <span>Last saved {new Date(lastAutoSave).toLocaleTimeString()}</span>
          </div>
        )}
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
                category={formData.category}
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
                isLoadingGigs={isLoadingGigs || isLoadingStatus}
                isSaving={isSaving}
                caregiverStatus={{
                  isVerified,
                  isQualified,
                  hasCertificates
                }}
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

      {showGuidelines && (
        <GuidelinesCard 
          currentPage={currentStep} 
          activeField={activeField} 
          onClose={handleCloseGuidelines}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProceed={handleProceed}
        title={modalTitle}
        description={modalDescription}
        buttonText={buttonText}
        buttonBgColor={buttonBgColor}
      />

      {/* Custom Success Modal for Gig Creation */}
      {showSuccessModal && (
        <div className="gig-success-modal-overlay" onClick={() => {
          setShowSuccessModal(false);
          setShowShareOptions(false);
        }}>
          <div className="gig-success-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="success-icon-container">
              <div className="success-checkmark">
                <svg width="64" height="64" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="gigTickGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4"/>
                      <stop offset="50%" stopColor="#0891b2"/>
                      <stop offset="100%" stopColor="#a7f3d0"/>
                    </linearGradient>
                  </defs>
                  <path 
                    d="M25 50 L42 67 L75 33" 
                    stroke="url(#gigTickGradient)" 
                    strokeWidth="8" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
            </div>
            <h2 className="success-title">Your gig has been published</h2>
            <p className="success-description">Spread the word to boost your sales.</p>
            
            <div className="success-modal-actions">
              <button 
                className="success-share-btn" 
                onClick={() => setShowShareOptions(!showShareOptions)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3"/>
                  <circle cx="6" cy="12" r="3"/>
                  <circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Share Your Gig
              </button>
              <button 
                className="success-continue-btn-secondary" 
                onClick={() => {
                  setShowSuccessModal(false);
                  setShowShareOptions(false);
                  navigate("/app/caregiver/profile", { state: { refreshGigs: true } });
                }}
              >
                Continue
              </button>
            </div>

            {/* Share Options Panel */}
            {showShareOptions && publishedGigId && (
              <div className="share-options-panel">
                <div className="share-link-section">
                  <input 
                    type="text" 
                    value={`${window.location.origin}/service/${publishedGigId}`} 
                    readOnly 
                    className="share-link-input-gig"
                  />
                  <button className="copy-link-btn-gig" onClick={handleCopyGigLink}>
                    {copySuccess ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Copied!
                      </>
                    ) : (
                      'Copy Link'
                    )}
                  </button>
                </div>
                <div className="social-share-grid">
                  <button className="social-share-btn facebook" onClick={() => handleSocialShareGig('facebook')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </button>
                  <button className="social-share-btn twitter" onClick={() => handleSocialShareGig('twitter')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    Twitter
                  </button>
                  <button className="social-share-btn whatsapp" onClick={() => handleSocialShareGig('whatsapp')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    WhatsApp
                  </button>
                  <button className="social-share-btn linkedin" onClick={() => handleSocialShareGig('linkedin')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resume Draft Modal */}
      <ResumeModal
        isOpen={showResumeModal}
        onClose={() => setShowResumeModal(false)}
        onResume={handleResumeDraft}
        onStartFresh={handleStartFresh}
        draftInfo={draftInfo}
      />

      {/* Custom Failure Modal for Gig Creation */}
      {showFailureModal && (
        <div className="gig-failure-modal-overlay" onClick={() => setShowFailureModal(false)}>
          <div className="gig-failure-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="failure-icon-container">
              <div className="failure-cross">
                <svg width="64" height="64" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="gigErrorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ef4444"/>
                      <stop offset="50%" stopColor="#dc2626"/>
                      <stop offset="100%" stopColor="#b91c1c"/>
                    </linearGradient>
                  </defs>
                  <path 
                    d="M25 25 L75 75 M75 25 L25 75" 
                    stroke="url(#gigErrorGradient)" 
                    strokeWidth="8" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
            </div>
            <h2 className="failure-title">Publication failed</h2>
            <p className="failure-description">{failureMessage}</p>
            <button 
              className="failure-retry-btn" 
              onClick={() => setShowFailureModal(false)}
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GigsForm;
