import Button from "../button/Button";
import GigsCard from "./GigsCard";
import PageBar from "./PageBar";
import PricingTable from "./Pricing";
import GalleryUploads from "./Gallery";
import GuidelinesCard from "./GuidelinesCard";
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

const GigsForm = () => {
  const pages = ["Overview", "Pricing", "Gallery", "Publish"];
  const [currentPage, setCurrentPage] = useState(0);
  const [activeField, setActiveField] = useState(null);
  const [blurTimeout, setBlurTimeout] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [buttonText, setButtonText] = useState("okay");
  const [buttonBgColor, setButtonBgColor] = useState("#34A853");
<<<<<<< HEAD
=======
  const source = "/src/assets/dog_on_a_leash.jpg";
  // const alt = "Dog on a leash";
>>>>>>> d3a8f7d97cb25569b4a5ab53a34841907a9b133b
  const [serverMessage, setServerMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [pageValidationStatus, setPageValidationStatus] = useState({
    0: false, // Overview
    1: false, // Pricing
    2: false, // Gallery
    3: false  // Publish
  });
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're in edit mode
  const isEditMode = location.state?.editMode || false;
  const gigData = location.state?.gigData || null;

  const goToNextPage = () => {
    const currentPageValidation = validateCurrentPage();
    
    if (!currentPageValidation.isValid) {
      setValidationErrors(currentPageValidation.errors);
      toast.error("Please fix the validation errors before proceeding");
      return;
    }
    
    if (currentPage < pages.length - 1) {
      setValidationErrors({});
      setPageValidationStatus(prev => ({ ...prev, [currentPage]: true }));
      setCurrentPage((prev) => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setValidationErrors({});
      setCurrentPage((prev) => prev - 1);
    }
  };

  const validateCurrentPage = () => {
    switch (currentPage) {
      case 0:
        return validateOverviewPage(formData);
      case 1:
        return validatePricingPage(formData.pricing);
      case 2:
        return validateGalleryPage(formData);
      case 3:
        return validatePublishPage(formData);
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const caregiverId = localStorage.getItem("userId");

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    subcategory: [],
    searchTags: [],
    pricing: {
      Basic: { name: "", details: "", deliveryTime: "", amount: "" },
      Standard: { name: "", details: "", deliveryTime: "", amount: "" },
      Premium: { name: "", details: "", deliveryTime: "", amount: "" },
    },
    image1: "",
    video: "https://www.youtube.com/watch?v=RVFAyFWO4go",
    status: "",
    caregiverId: caregiverId,
  });

  // Effect to populate form data when in edit mode
  useEffect(() => {
    if (isEditMode && gigData) {
      // Parse pricing data if it exists
      let pricingData = {
        Basic: { name: "", details: "", deliveryTime: "", amount: "" },
        Standard: { name: "", details: "", deliveryTime: "", amount: "" },
        Premium: { name: "", details: "", deliveryTime: "", amount: "" },
      };

      // If gig has pricing data, parse it
      if (gigData.pricing) {
        try {
          pricingData = typeof gigData.pricing === 'string' 
            ? JSON.parse(gigData.pricing) 
            : gigData.pricing;
        } catch (error) {
          console.error('Error parsing pricing data:', error);
        }
      }

      // Parse search tags if they exist
      let searchTagsArray = [];
      if (gigData.tags) {
        searchTagsArray = typeof gigData.tags === 'string' 
          ? gigData.tags.split(', ') 
          : gigData.tags;
      }

      // Parse subcategory if it exists
      let subcategoryArray = [];
      if (gigData.subcategory) {
        subcategoryArray = Array.isArray(gigData.subcategory) 
          ? gigData.subcategory 
          : [gigData.subcategory];
      }

      setFormData({
        title: gigData.title || "",
        category: gigData.category || "",
        subcategory: subcategoryArray,
        searchTags: searchTagsArray,
        pricing: pricingData,
        image1: gigData.image1 || "",
        video: gigData.video || "https://www.youtube.com/watch?v=RVFAyFWO4go",
        status: gigData.status || "",
        caregiverId: gigData.caregiverId || caregiverId,
      });
    }
  }, [isEditMode, gigData, caregiverId]);

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
        if (key === "image1" && formData.image1) {
          formDataPayload.append("Image1", formData.image1);
        } else if (key === "searchTags") {
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

      const response = await axios.post(
        "https://carepro-api20241118153443.azurewebsites.net/api/Gigs",
        formDataPayload,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.status === 200) {
        setServerMessage("Gig saved as draft successfully!");
        toast.success("Gig saved as draft!");
      }
    } catch (err) {
      console.error("Error saving draft:", err);
      setServerMessage("Failed to save draft.");
      toast.error("Failed to save draft. Please try again.");
    }
  };

  const handleCategoryChange = (category) => {
    setFormData((prev) => ({
      ...prev,
      category,
      subcategory: [],
    }));
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
    setFormData((prev) => ({
      ...prev,
      subcategory: updatedSubcategories,
    }));
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
    setFormData((prev) => ({
      ...prev,
      searchTags: tags,
    }));
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
    setFormData((prev) => ({
      ...prev,
      title,
    }));
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

    // Final validation before submission
    const validation = validatePublishPage(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast.error("Please fix all validation errors before publishing");
      return;
    }

    try {
      const formDataPayload = new FormData();

      Object.keys(formData).forEach((key) => {
        if (key === "image1" && formData.image1) {
          formDataPayload.append("Image1", formData.image1);
        } else if (key === "searchTags") {
          formDataPayload.append("Tags", searchtags);
        } else if (key === "status") {
          formDataPayload.append("status", "Published");
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

      for (let [key, value] of formDataPayload.entries()) {
        console.log(key, value);
      }

      let response;
      if (isEditMode && gigData?.id) {
        // Update existing gig
        response = await axios.put(
          `https://carepro-api20241118153443.azurewebsites.net/api/Gigs/${gigData.id}`,
          formDataPayload,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      } else {
        // Create new gig
        response = await axios.post(
          "https://carepro-api20241118153443.azurewebsites.net/api/Gigs",
          formDataPayload,
          { headers: { "Content-Type": "multipart/form-data" } }
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

  const [files, setFiles] = useState([]);
  const [video, setVideo] = useState(null);

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result.split(",")[1];
        setFormData((prevData) => ({
          ...prevData,
          image1: base64String || "",
        }));
        console.log("base64String:", base64String);
        
        // Clear image validation error
        if (validationErrors.image1) {
          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.image1;
            return newErrors;
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="gigs-form">
      <div className="gigs-form-header">
        <h1>{isEditMode ? 'Edit Gig' : 'Create New Gig'}</h1>
        {isEditMode && <p>Update your existing gig details</p>}
      </div>

      <div className="gigs-form-body">
<<<<<<< HEAD
        <div className="gigs-form-content">
          <div className="main-content">
            <PageBar 
              pages={pages} 
              currentPage={currentPage}
              onPageClick={(pageIndex) => setCurrentPage(pageIndex)}
              pageValidationStatus={pageValidationStatus}
            />
            
            {currentPage === 0 && (
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
                formData={formData}
                validationErrors={validationErrors}
                clearValidationErrors={clearValidationErrors}
              />
            )}
            {currentPage === 1 && (
              <PricingTable
                pricing={formData.pricing}
                onPricingChange={(updatedPricing) => {
                  setFormData((prev) => ({ ...prev, pricing: updatedPricing }));
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
            {currentPage === 2 && (
              <GalleryUploads 
                onFileChange={onFileChange} 
                onFieldFocus={handleFieldFocus}
                onFieldBlur={handleFieldBlur}
                onFieldHover={handleFieldHover}
                onFieldLeave={handleFieldLeave}
                validationErrors={validationErrors}
              />
            )}
            {currentPage === 3 && (
              <PublishGig
                image={`data:image/jpeg;base64,${formData.image1}`}
                title={formData.title || "Your Gig"}
                onSaveAsDraft={handleSaveAsDraft}
                onPublish={handleSubmit}
                onFieldFocus={handleFieldFocus}
                onFieldBlur={handleFieldBlur}
                onFieldHover={handleFieldHover}
                onFieldLeave={handleFieldLeave}
                validationErrors={(() => {
                  const validation = validatePublishPage(formData);
                  return validation.errors;
                })()}
              />
            )}
            <div className="gigs-form-buttons">
              {currentPage < pages.length - 1 && (
                <>
                  {currentPage > 0 && (
                    <Button onClick={goToPreviousPage}>Back</Button>
                  )}
                  <Button onClick={goToNextPage}>Save & Continue</Button>
                </>
              )}
            </div>
          </div>
=======
        <PageBar pages={pages} currentPage={currentPage}
         onPageClick={(pageIndex) => setCurrentPage(pageIndex)}
         />
        <br />
        {currentPage === 0 && (
          <GigsCard
            categories={categories}
            onCategoryChange={handleCategoryChange}
            onSubCategoryChange={handleSubCategoryChange}
            onSearchTagChange={handleSearchTagChange}
            onTitleChange={handleTitleChange}
            formData={formData}
          />
        )}
        {currentPage === 1 && (
          <PricingTable
            pricing={formData.pricing}
            onPricingChange={(updatedPricing) =>
              setFormData((prev) => ({ ...prev, pricing: updatedPricing }))
            }
          />
        )}
        {currentPage === 2 && (
          <GalleryUploads onFileChange={onFileChange} />
        )}
        {currentPage === 3 && (
          <PublishGig
            image={`data:image/jpeg;base64,${formData.image1}`}
            title={formData.title}
            onSaveAsDraft={handleSaveAsDraft}
            onPublish={handleSubmit}
          />
        )}
        <div className="gigs-form-buttons">
          {currentPage < pages.length - 1 && (
            <>
              {currentPage > 0 && (
                <Button className="gig-back-button" onClick={goToPreviousPage}>Back</Button>
              )}
              <Button className="gig-next-button" onClick={goToNextPage}>Save & Continue</Button>
            </>
          )}
>>>>>>> d3a8f7d97cb25569b4a5ab53a34841907a9b133b
        </div>
      </div>

      <GuidelinesCard 
        currentPage={currentPage} 
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
