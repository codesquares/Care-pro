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
