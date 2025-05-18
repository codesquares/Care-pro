// This file contains mocked responses for testing verification methods
const mockVerifications = {
  /**
   * Mock a successful BVN verification
   */
  mockSuccessBVN: (bvnNumber) => {
    return {
      entity: {
        bvn: bvnNumber,
        firstname: "Mock",
        lastname: "User",
        middlename: "",
        phone: "08012345678",
        gender: "Male",
        birthdate: "1990-01-01",
        verified: true,
        verification_status: "verified"
      },
      status: true
    };
  },
  
  /**
   * Mock a failed BVN verification due to invalid BVN
   */
  mockFailedBVN: (bvnNumber) => {
    return {
      entity: {
        bvn: bvnNumber,
        verification_status: "failed",
        verified: false,
        message: "Invalid BVN provided. Please check and try again."
      },
      status: false
    };
  },
  
  /**
   * Mock a successful NIN verification
   */
  mockSuccessNIN: (ninNumber) => {
    return {
      entity: {
        nin: ninNumber,
        firstname: "Mock",
        lastname: "User",
        middlename: "",
        phone: "08012345678",
        gender: "Male",
        birthdate: "1990-01-01",
        verified: true,
        verification_status: "verified"
      },
      status: true
    };
  },
  
  /**
   * Mock a failed NIN verification due to invalid NIN
   */
  mockFailedNIN: (ninNumber) => {
    return {
      entity: {
        nin: ninNumber,
        verification_status: "failed",
        verified: false,
        message: "Invalid NIN provided. Please check and try again."
      },
      status: false
    };
  },
  
  /**
   * Mock a successful ID & Selfie verification
   */
  mockSuccessIdSelfie: () => {
    return {
      entity: {
        selfie_image_verified: true,
        id_image_verified: true,
        confidence: 0.95,
        match_score: 0.92,
        verification_status: "verified",
        verified: true
      },
      status: true
    };
  },
  
  /**
   * Mock a failed ID & Selfie verification due to poor image quality
   */
  mockFailedIdSelfie: () => {
    return {
      entity: {
        selfie_image_verified: false,
        id_image_verified: false,
        confidence: 0.20,
        match_score: 0.15,
        verification_status: "failed",
        verified: false,
        message: "Low quality images or mismatch between ID and selfie."
      },
      status: false
    };
  }
};

module.exports = mockVerifications;
