import Button from "../button/Button";
import GigsCard from "./GigsCard";
import PageBar from "./PageBar";
import PricingTable from "./Pricing";
import GalleryUploads from "./Gallery";
import "./gigs.scss";
import "./Pricing.scss";
import "./galleryUploads.scss";
import { useState } from "react";
import PublishGig from "./Publish";
import axios from "axios";
import validateFormData from "../../Vadlidations/GigCreationValidation";
import { toast } from "react-toastify";
import Modal from "../../components/modal/Modal";
import { useNavigate } from "react-router-dom";

const GigsForm = () => {
  const pages = ["Overview", "Pricing", "Gallery", "Publish"];
  const [currentPage, setCurrentPage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [buttonText, setButtonText] = useState("okay");
  const [buttonBgColor, setButtonBgColor] = useState("#34A853");
  const source = "/src/assets/dog_on_a_leash.jpg";
  const alt = "Dog on a leash";
  const [serverMessage, setServerMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(null);
  const navigate = useNavigate();

  const goToNextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };
  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  //get caregiver id from local storage
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

  const searchtags = formData.searchTags.length > 0
    ? formData.searchTags.join(", ")
    : null;

    const categories = {
      "Adult Care": [
        "Companionship",
        "Meal preparation",
        "Mobility assistance",
        "Medication reminders",
        "Bathing and grooming",
        "Dressing assistance",
        "Toileting and hygiene support",
        "Incontinence care",
        "Overnight supervision",
        "Chronic illness management"
      ],
      "Post Surgery Care": [
        "Wound care",
        "Medication management",
        "Post-surgery care",
        "Mobility assistance",
        "Home safety assessment",
        "Feeding assistance"
      ],
      "Child Care": [
        "Respite",
        "Babysitting",
        "Meal preparation",
        "Recreational activities assistance",
        "Emotional support and check-ins"
      ],
      "Pet Care": [
        "Pet minding",
        "Dog walking",
        "Feeding assistance",
        "Companionship" // for emotional comfort animals
      ],
      "Home Care": [
        "Light housekeeping",
        "Cleaning",
        "Cooking",
        "Home safety assessment",
        "Errands and shopping",
        "Transportation to appointments"
      ],
      "Special Needs Care": [
        "Dementia care",
        "Autism support",
        "Behavioral support",
        "Disability support services",
        "Assistive device training",
        "Language or communication support"
      ],
      "Medical Support": [
        "Nursing care",
        "Medication reminders",
        "Medical appointment coordination",
        "Palliative care support",
        "Chronic illness management"
      ],
      "Mobility Support": [
        "Mobility assistance",
        "Fall prevention monitoring",
        "Exercise and fitness support",
        "Assistive device training",
        "Transportation to appointments"
      ],
      "Therapy & Wellness": [
        "Physical therapy support",
        "Cognitive stimulation activities",
        "Emotional support and check-ins",
        "Recreational activities assistance",
        "Acupuncture",
        "Massage therapy"
      ],
      "End of Life Care": [
        "Palliative care support",
        "Overnight supervision",
        "Emotional support and check-ins",
        "Home safety assessment"
      ]
    };
    
  console.log("services:", formData.subcategory);
  const handleSaveAsDraft = async (e) => {
  e.preventDefault();
  setIsSubmitted(true);

  try {
    const formDataPayload = new FormData();

    // Append all formData keys
    Object.keys(formData).forEach((key) => {
      if (key === "image1" && formData.image1) {
        formDataPayload.append("Image1", formData.image1);
      } else if (key === "searchTags") {
        formDataPayload.append("Tags", searchtags);
      } else if (key === "status") {
        formDataPayload.append("status", "Draft");
      } 
      else if (key === "pricing") {
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


    const response = await axios.post("https://carepro-api20241118153443.azurewebsites.net/api/Gigs", formDataPayload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

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
    subcategory: [], // ← reset as an array
  }));
};

const handleSubCategoryChange = (updatedSubcategories) => {
  setFormData((prev) => ({
    ...prev,
    subcategory: updatedSubcategories,
  }));
};




  const handleSearchTagChange = (tags) => {
    setFormData((prev) => ({
      ...prev,
      searchTags: tags,
    }));
  };

  // const handlePricingChange = (value) => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     packageName: value.packageName || prev.packageName,
  //     packageDetails: value.packageDetails || prev.packageDetails,
  //     deliveryTime: value.deliveryTime || prev.deliveryTime,
  //     price: value.price || prev.price,
  //   }));
  // };

  const handleTitleChange = (title) => {
    setFormData((prev) => ({
      ...prev,
      title,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitted(true);

    try {
      const formDataPayload = new FormData();

      // Append all formData keys
      Object.keys(formData).forEach((key) => {
        if (key === "image1" && formData.image1) {
          // Handle the image file (already base64 encoded in formData)
          formDataPayload.append("Image1", formData.image1);
        } else if (key === "searchTags") {
          formDataPayload.append("Tags", searchtags);
        }
        else if (key === "status") {
          formDataPayload.append("status", "Published");
        }
        else if (key === "pricing") {
          // Handle pricing object
          Object.keys(formData.pricing).forEach((packageType) => {
            const packageData = formData.pricing[packageType];
            formDataPayload.append("PackageType", packageType); // Basic, Standard, Premium
            formDataPayload.append("PackageName", packageData.name);
            formDataPayload.append("PackageDetails", packageData.details);
            formDataPayload.append("DeliveryTime", packageData.deliveryTime);
            formDataPayload.append("Price", packageData.amount);
          });
        }
        else {
          formDataPayload.append(key, formData[key]);
        }
      });

      // Debugging: Log FormData entries
      for (let [key, value] of formDataPayload.entries()) {
        console.log(key, value);
      }

      const response = await axios.post("https://carepro-api20241118153443.azurewebsites.net/api/Gigs", formDataPayload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        setServerMessage("Gig published successfully!");
        // Show success modal
        setModalTitle("Success!");
        setModalDescription("Your Gig has been successfully created.");
        setButtonBgColor("#34A853");
        setButtonText("Proceed"); // Update button text for success case
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
        setButtonText("Okay"); // Keep "Okay" for the error case
        setIsModalOpen(true);
      }
    }
  };
  const handleProceed = () => {
    setIsModalOpen(false);
    navigate("/"); // Navigate to success page
  }  


  const [files, setFiles] = useState([]);
  const [video, setVideo] = useState(null);



  const onFileChange = (e) => {
    const file = e.target.files[0]; // Get the selected file
    if (file) {
      const reader = new FileReader();

      reader.onload = () => {
        const base64String = reader.result.split(",")[1]; // Extract base64 string from the result
        setFormData((prevData) => ({
          ...prevData,
          image1: base64String || "", // Save the base64 string to formData
        }));

        console.log("base64String:", base64String); // Log the base64 string to the console
        // console.log("File uploaded:", "file"); // Log the file to the console
      };

      reader.readAsDataURL(file); // Read the file as a Data URL to convert to base64
      // console.log("File uploaded:", file);
    }
  };

  return (
    <div className="gigs-form">
      <div className="gigs-form-header">
        {/* <GigsHeader /> */}
      </div>

      <div className="gigs-form-body">
        <PageBar pages={pages} currentPage={currentPage} />
        <br></br>
        {currentPage === 0 && (<GigsCard
          categories={categories}
          onCategoryChange={handleCategoryChange}
          onSubCategoryChange={handleSubCategoryChange}
          onSearchTagChange={handleSearchTagChange}
          onTitleChange={handleTitleChange}
          formData={formData}
        />)}
        {currentPage === 1 && (
          <PricingTable
            pricing={formData.pricing}
            onPricingChange={(updatedPricing) =>
              setFormData((prev) => ({ ...prev, pricing: updatedPricing }))
            }
          />
        )}
        {currentPage === 2 && (<GalleryUploads
          onFileChange={onFileChange}
        // onVideoChange={onVideoChange}
        />)}
        {currentPage === 3 && (
          <PublishGig
            image={source}
            title={alt}
            onSaveAsDraft={handleSaveAsDraft}
            onPublish={handleSubmit}
          />
        )}
        <div className="gigs-form-buttons">
          {currentPage < pages.length - 1 && (
            <>
              {currentPage > 0 && <Button onClick={goToPreviousPage}>Back</Button>}
              <Button onClick={goToNextPage}>Save & Continue</Button>
            </>
          )}

          {/* {currentPage === pages.length - 1 && (
            <Button type="submit" onClick={handleSubmit}>Publish</Button>
          )} */}
        </div>


      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProceed={handleProceed} // Call handleProceed on modal proceed
        title={modalTitle}
        description={modalDescription}
        buttonText={buttonText}
        buttonBgColor={buttonBgColor}
      />

    </div>
  );
};
export default GigsForm;