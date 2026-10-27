import Button from "../button/Button";
import GigsCard from "./GigsCard";
import PageBar from "./PageBar";
import PricingTable from "./Pricing";
import GalleryUploads from "./Gallery";
import GuidelinesCard from "./GuidelinesCard_fixed";
import "./gigs.css";
import "./Pricing.css";
import "./galleryUploads.css";
import { useState, useEffect, useRef } from "react";
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
import { isSpecializedCategory, toServiceKey } from "../../constants/serviceClassification";
import specializedAssessmentService from "../../services/specializedAssessmentService";
import CertificateUploadModal from "../shared/CertificateUploadModal";
import { fetchGigTemplates, buildCategoriesMap, getTagsForSubcategories, getSampleTasks } from "../../services/gigTemplateService";

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
  const [redirectCountdown, setRedirectCountdown] = useState(null);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [failureMessage, setFailureMessage] = useState("");
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [draftInfo, setDraftInfo] = useState(null);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState(null);
  // Specialized eligibility state
  const [categoryEligibility, setCategoryEligibility] = useState(null); // full eligibility response
  const [eligibilityError, setEligibilityError] = useState(null); // 403 error details from publish
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [showCertUpload, setShowCertUpload] = useState(false);
  // Gig template data from API
  const [gigTemplates, setGigTemplates] = useState(null);
  const [categories, setCategories] = useState({});
  const navigate = useNavigate();
  
  // Use caregiver status context for eligibility
  const { 
    canPublishGigs, 
    isLoading: isLoadingStatus,
    isVerified,
    isQualified,
    hasCertificates,
    refreshStatusData
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

  // Fetch specialized eligibility when user logs in
  useEffect(() => {
    const fetchEligibility = async () => {
      try {
        const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
        if (!userDetails.id) return;
        const res = await specializedAssessmentService.getEligibility(userDetails.id);
        if (res.success) setCategoryEligibility(res.data);
      } catch (err) {
        console.warn('Could not fetch specialized eligibility:', err);
      }
    };
    fetchEligibility();
  }, []);

  // Fetch gig templates from API (categories, subcategories, tags, sample tasks)
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await fetchGigTemplates();
        setGigTemplates(data);
        setCategories(buildCategoriesMap(data));
      } catch (err) {
        console.warn('Could not fetch gig templates, using empty categories:', err);
      }
    };
    loadTemplates();
  }, []);

  // Derive suggested tags and sample tasks based on current category + subcategory selection
  const suggestedTags = gigTemplates && formData.category
    ? getTagsForSubcategories(gigTemplates, formData.category, formData.subcategory || [])
    : [];

  const sampleTasks = gigTemplates && formData.category
    ? getSampleTasks(gigTemplates, formData.category, formData.subcategory || [])
    : [];

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
        console.log('🔄 Auto-saving draft...', 'data.id:', data.id);
        const result = await GigService.saveDraft(data);
        
        // Store the draft ID if this was a new creation (POST)
        // Use data.id (the parameter) instead of formData (closure) to avoid stale reference
        if (result.success && result.id && !data.id) {
          console.log('📌 Auto-save captured new draft ID:', result.id);
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
  const [imageRejectionError, setImageRejectionError] = useState(null);
  const fileInputRef = useRef(null);

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
        
        // Exclude special/care-request gigs — they have no Pause button so
        // they must not count toward the 2-gig publish limit.
        const activeGigs = existingGigs.filter(gig => {
          const status = gig.status?.toLowerCase();
          const isSpecial = gig.isSpecialGig || gig.IsSpecialGig;
          return (status === 'published' || status === 'active') && !isSpecial;
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
    // Refresh caregiver eligibility status to ensure fresh data
    refreshStatusData();
  }, []);

  // Cleanup blob URLs on component unmount
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Auto-redirect countdown after publish success

  useEffect(() => {
    if (!showSuccessModal) {
      setRedirectCountdown(null);
      return;
    }
    setRedirectCountdown(5);
    const interval = setInterval(() => {
      setRedirectCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowSuccessModal(false);
          navigate('/app/caregiver/profile', { state: { refreshGigs: true } });
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showSuccessModal]);

  const searchtags = formData.searchTags.length > 0
    ? formData.searchTags.join(", ")
    : null;

  // categories is now loaded from API via gigTemplateService (state initialized above)

  console.log("services:", formData.subcategory);

  const handleSaveAsDraft = async (e) => {
    e.preventDefault();
    setIsSubmitted(true);

    // Basic validation for draft - at least title and category should be present
    if (!formData.title || !formData.category) {
      toast.error("Please provide at least a title and category before saving as draft");
      return;
    }

    setSaving(true);
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

      // Handle create vs update — use formData.id to decide (covers both edit mode and auto-saved drafts)
      let response;
      const authToken = localStorage.getItem('authToken');
      const draftRequestConfig = {
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        }
      };
      if (formData?.id) {
        console.log(`🔄 Updating existing draft gig with ID: ${formData.id}`);
        response = await axios.put(
          `${config.BASE_URL}/Gigs/UpdateGig/${formData.id}`,
          formDataPayload,
          draftRequestConfig
        );
      } else {
        console.log("✨ Creating new draft gig");
        response = await axios.post(
          `${config.BASE_URL}/Gigs`,
          formDataPayload,
          draftRequestConfig
        );
      }

      if (response.status === 200) {
        // Store the returned gig ID to prevent duplicate drafts
        const returnedId = response.data?.id || response.data?.Id;
        if (returnedId && !formData.id) {
          console.log('📌 Draft save captured new gig ID:', returnedId);
          updateField('id', String(returnedId));
        }
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

      // Handle 422 — image moderation rejection from backend (same as publish path)
      if (err.response?.status === 422 && err.response.data?.error === 'image_rejected') {
        setImageRejectionError({
          reason: err.response.data.reason,
          suggestions: err.response.data.suggestions || []
        });
        setCurrentStep(2); // Navigate back to Gallery so the user sees the error inline
        setSelectedFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Reset DOM input so re-selecting the same file fires onChange
        }
        return; // Don't show generic error
      }

      setServerMessage("Failed to save draft.");
      toast.error("Failed to save draft. Please try again.");
    } finally {
      setSaving(false);
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
        const authToken = localStorage.getItem('authToken');
        const requestConfig = {
          timeout: 30000, // 30 seconds
          signal: controller.signal,
          headers: {
            // Let browser set Content-Type for FormData
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
          }
        };

        if (formData?.id) {
          console.log(`🔄 Updating existing gig with ID: ${formData.id} (isEditMode: ${isEditMode})`);
          // Use centralized config for gig operations
          response = await axios.put(
            `${config.BASE_URL}/Gigs/UpdateGig/${formData.id}`,
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
          
          // Show eligibility warning for specialized category drafts (non-breaking)
          if (response.data?.eligibilityWarning) {
            toast.warning(response.data.eligibilityWarning, { autoClose: 8000 });
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

        // Handle 403 — eligibility rejection from backend
        if (err.response.status === 403) {
          const eligError = specializedAssessmentService.parsePublishEligibilityError(err.response);
          if (eligError) {
            setEligibilityError(eligError);
            setShowEligibilityModal(true);
            return; // Don't show generic error
          }
        }

        // Handle 422 — image moderation rejection from backend
        if (err.response.status === 422 && err.response.data?.error === 'image_rejected') {
          setImageRejectionError({
            reason: err.response.data.reason,
            suggestions: err.response.data.suggestions || []
          });
          setCurrentStep(2); // Navigate back to Gallery so the user sees the error inline
          setSelectedFile(null);
          setImagePreview(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset DOM input so re-selecting the same file fires onChange
          }
          return; // Don't show generic error
        }

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
      setImageRejectionError(null);
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
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!file.type.startsWith('image/') || !allowedTypes.includes(file.type.toLowerCase())) {
        const msg = `Unsupported file format (${file.type || 'unknown'}). Please use JPEG, PNG, or WebP.`;
        toast.error(msg);
        setValidationErrors(prev => ({ ...prev, image1: msg }));
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        const msg = `Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 5 MB.`;
        toast.error(msg);
        setValidationErrors(prev => ({ ...prev, image1: msg }));
        return;
      }
      
      // Clear any previous rejection error when a new file is selected
      setImageRejectionError(null);

      // Cleanup previous blob URL to prevent memory leaks
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }

      // Create preview using FileReader for data URL (CSP compliant).
      // setSelectedFile is deferred until the dimension check passes inside onload.
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          const { naturalWidth: w, naturalHeight: h } = img;
          if (w < 300 || h < 300) {
            toast.error(`Image is too small (${w}\u00d7${h}px). Minimum size is 300\u00d7300 px.`);
            setValidationErrors(prev => ({ ...prev, image1: `Image must be at least 300\u00d7300 px (yours is ${w}\u00d7${h}).` }));
            return;
          }
          if (w > 5000 || h > 5000) {
            toast.error(`Image is too large (${w}\u00d7${h}px). Maximum size is 5000\u00d75000 px.`);
            setValidationErrors(prev => ({ ...prev, image1: `Image must not exceed 5000\u00d75000 px (yours is ${w}\u00d7${h}).` }));
            return;
          }
          // All pre-checks pass — commit the selection
          setSelectedFile(file);
          setImagePreview(readerEvent.target.result);
          console.log("File selected successfully:", file.name, file.size, "bytes");
          toast.success("Image selected successfully!");
          // Clear any lingering image validation error
          setValidationErrors(prev => {
            const next = { ...prev };
            delete next.image1;
            return next;
          });
        };
        img.src = readerEvent.target.result;
      };
      reader.readAsDataURL(file);
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
          <div className="gigs-form-main">
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
                categoryEligibility={categoryEligibility}
                suggestedTags={suggestedTags}
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
                sampleTasks={sampleTasks}
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
                imageRejectionError={imageRejectionError}
                fileInputRef={fileInputRef}
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
                selectedCategory={formData.category}
                selectedSubcategories={formData.subcategory}
                categoryEligibility={categoryEligibility}
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
          navigate('/app/caregiver/profile', { state: { refreshGigs: true } });
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
            <p className="success-description">
              {redirectCountdown !== null
                ? `Redirecting to your gigs in ${redirectCountdown}…`
                : 'Your gig is now live on your profile.'}
            </p>
            
            <div className="success-modal-actions">
              <button 
                className="success-continue-btn-secondary" 
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/app/caregiver/profile', { state: { refreshGigs: true } });
                }}
              >
                Continue
              </button>
            </div>

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

      {/* Eligibility Error Modal (403 from publish) */}
      {/* Certificate Upload Modal (inline) */}
      <CertificateUploadModal
        isOpen={showCertUpload}
        onClose={() => setShowCertUpload(false)}
        onUploadDone={() => setShowCertUpload(false)}
      />

      {showEligibilityModal && eligibilityError && (
        <div className="gig-failure-modal-overlay" onClick={() => setShowEligibilityModal(false)}>
          <div className="gig-failure-modal-content eligibility-error-modal" onClick={(e) => e.stopPropagation()}>
            <div className="failure-icon-container">
              <div className="failure-cross">
                <span style={{ fontSize: '3.5rem' }}>🔒</span>
              </div>
            </div>
            <h2 className="failure-title">Not Eligible to Publish</h2>
            <p className="failure-description">{eligibilityError.message}</p>

            <div className="eligibility-error-details">
              {eligibilityError.missing?.includes('assessment') && (
                <div className="eligibility-error-item">
                  <span className="eligibility-error-icon">❌</span>
                  <span>Specialized assessment not passed</span>
                </div>
              )}
              {eligibilityError.missing?.includes('certificate') && (
                <div className="eligibility-error-item">
                  <span className="eligibility-error-icon">📄</span>
                  <span>Required certificates are missing or unverified</span>
                </div>
              )}
            </div>

            <div className="eligibility-error-actions">
              {eligibilityError.missing?.includes('assessment') && (
                <button
                  className="sa-btn sa-btn-primary"
                  onClick={() => {
                    setShowEligibilityModal(false);
                    navigate(`/app/caregiver/specialized-assessment?category=${eligibilityError.category}`);
                  }}
                >
                  Take Assessment
                </button>
              )}
              {eligibilityError.missing?.includes('certificate') && (
                <button
                  className="sa-btn sa-btn-secondary"
                  onClick={() => {
                    setShowEligibilityModal(false);
                    setShowCertUpload(true);
                  }}
                >
                  Upload Certificates
                </button>
              )}
              <button
                className="failure-retry-btn"
                style={{ marginTop: '0.5rem', background: '#6b7280' }}
                onClick={() => setShowEligibilityModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GigsForm;
