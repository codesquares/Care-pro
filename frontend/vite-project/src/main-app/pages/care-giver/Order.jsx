import { useState } from "react";
import "./FormComponent.css"; // Import the CSS file
import config from "../../config"; // Import centralized config for API URLs

const FormComponent = () => {
  const [formData, setFormData] = useState({
    Title: "",
    Category: "",
    SubCategory: "",
    Tags: "",
    PackageType: "",
    PackageName: "",
    PackageDetails: "",
    DeliveryTime: "",
    Price: 0,
    Image1: "",
    VideoURL: "",
    Status: "",
    CaregiverId: "",
  });

  const [backendErrors, setBackendErrors] = useState({});
  const [submittedData, setSubmittedData] = useState(null); 

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
            const base64String = reader.result.toString().split(",")[1]; // Extract Base64 string
            setFormData({ ...formData, Image1: base64String });
          }
      };
      reader.readAsDataURL(file);
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      // Use FormData to handle file uploads
      const formDataPayload = new FormData();
  
      // Append each field to FormData
      Object.keys(formData).forEach((key) => {
        if (key === "Image1" && formData.Image1) {
          // Append the file directly
          formDataPayload.append(key, formData.Image1);
        } else {
          // Append other fields
          formDataPayload.append(key, formData[key]);
        }
      });
  
      // Send the data as multipart/form-data
      // FIXED: Use centralized config instead of hardcoded Azure staging API URL
      const response = await fetch(
        `${config.BASE_URL}/Gigs`,
        {
          method: "POST",
          body: formDataPayload,
        }
      );
  
      const result = await response.json();
  
      if (!response.ok) {
        setBackendErrors(result.errors || {});
        return;
      }
  
      setSubmittedData(result); // Store returned data
      alert("Form submitted successfully!");
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("An error occurred while submitting the form.");
    }
  };
  

  return (
    <div className="form-container">
      <h1>Submit Form</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="Title"
          placeholder="Title"
          value={formData.Title}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="Category"
          placeholder="Category"
          value={formData.Category}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="SubCategory"
          placeholder="Sub Category"
          value={formData.SubCategory}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="Tags"
          placeholder="Tags"
          value={formData.Tags}
          onChange={handleChange}
        />

        <input
          type="text"
          name="PackageType"
          placeholder="Package Type"
          value={formData.PackageType}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="PackageName"
          placeholder="Package Name"
          value={formData.PackageName}
          onChange={handleChange}
          required
        />

        <textarea
          name="PackageDetails"
          placeholder="Package Details"
          value={formData.PackageDetails}
          onChange={handleChange}
          required
        ></textarea>
        {backendErrors.PackageDetails && (
          <p className="error">{backendErrors.PackageDetails[0]}</p>
        )}

        <input
          type="text"
          name="DeliveryTime"
          placeholder="Delivery Time"
          value={formData.DeliveryTime}
          onChange={handleChange}
          required
        />
        {backendErrors.DeliveryTime && (
          <p className="error">{backendErrors.DeliveryTime[0]}</p>
        )}

        <input
          type="number"
          name="Price"
          placeholder="Price"
          value={formData.Price}
          onChange={handleChange}
        />

        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          required
        />
        {backendErrors.Image1 && <p className="error">{backendErrors.Image1[0]}</p>}

        <input
          type="text"
          name="VideoURL"
          placeholder="Video URL"
          value={formData.VideoURL}
          onChange={handleChange}
        />

        <input
          type="text"
          name="Status"
          placeholder="Status"
          value={formData.Status}
          onChange={handleChange}
          required
        />
        {backendErrors.Status && <p className="error">{backendErrors.Status[0]}</p>}

        <input
          type="text"
          name="CaregiverId"
          placeholder="Caregiver ID"
          value={formData.CaregiverId}
          onChange={handleChange}
          required
        />
        {backendErrors.CaregiverId && <p className="error">{backendErrors.CaregiverId[0]}</p>}

        <button type="submit">Submit</button>
      </form>

      {submittedData && (
        <div className="submitted-data">
          <h2>Submitted Data:</h2>
          <pre>{JSON.stringify(submittedData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default FormComponent;
