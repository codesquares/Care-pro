import { createContext, useContext, useState, useEffect } from 'react';
import { getDojahStatus } from '../services/dojahService';
import assessmentService from '../services/assessmentService';
import config from '../config';

// Create context
const CaregiverStatusContext = createContext();

// Context provider component
export function CaregiverStatusProvider({ children }) {
  const [statusData, setStatusData] = useState({
    // Verification status from Dojah
    verificationStatus: null,
    isVerified: false,
    verificationLoading: true,
    verificationError: null,
    
    // Qualification status from assessment
    qualificationStatus: null,
    isQualified: false,
    qualificationLoading: true,
    qualificationError: null,
    
    // Certificate status
    certificates: [],
    certificatesCount: 0,
    hasCertificates: false,
    certificatesLoading: true,
    certificatesError: null,
    
    // Overall publishing eligibility
    canPublishGigs: false,
    eligibilityChecked: false,
    
    // Last updated timestamp
    lastUpdated: null
  });

  // Track the current userId to detect changes
  const [currentUserId, setCurrentUserId] = useState(null);

  // Get user details from localStorage
  const getUserDetails = () => {
    try {
      const userDetailsStr = localStorage.getItem("userDetails");
      if (!userDetailsStr) return null;
      return JSON.parse(userDetailsStr);
    } catch (error) {
      console.error('Error parsing userDetails:', error);
      return null;
    }
  };

  // Fetch verification status
  const fetchVerificationStatus = async (userId, token) => {
    try {
      setStatusData(prev => ({ ...prev, verificationLoading: true, verificationError: null }));
      
      const verificationData = await getDojahStatus(userId, 'Caregiver', token);
      
      const isVerified = verificationData?.verificationStatus === "completed" || 
                        verificationData?.isVerified === true;
      
      setStatusData(prev => ({
        ...prev,
        verificationStatus: verificationData,
        isVerified,
        verificationLoading: false,
        verificationError: null
      }));
      
      return { isVerified, verificationData };
      
    } catch (error) {
      console.error('Error fetching verification status:', error);
      setStatusData(prev => ({
        ...prev,
        verificationStatus: null,
        isVerified: false,
        verificationLoading: false,
        verificationError: error.message
      }));
      return { isVerified: false, error: error.message };
    }
  };

  // Fetch qualification status
  const fetchQualificationStatus = async (userId) => {
    try {
      setStatusData(prev => ({ ...prev, qualificationLoading: true, qualificationError: null }));
      
      const qualificationData = await assessmentService.getQualificationStatus(userId);
      
      const isQualified = qualificationData?.isQualified === true;
      
      setStatusData(prev => ({
        ...prev,
        qualificationStatus: qualificationData,
        isQualified,
        qualificationLoading: false,
        qualificationError: null
      }));
      
      return { isQualified, qualificationData };
      
    } catch (error) {
      console.error('Error fetching qualification status:', error);
      setStatusData(prev => ({
        ...prev,
        qualificationStatus: null,
        isQualified: false,
        qualificationLoading: false,
        qualificationError: error.message
      }));
      return { isQualified: false, error: error.message };
    }
  };

  // Fetch certificates
  const fetchCertificates = async (userId) => {
    try {
      setStatusData(prev => ({ ...prev, certificatesLoading: true, certificatesError: null }));
      
      const token = localStorage.getItem('authToken');
      
      // Don't make API call if no token
      if (!token) {
        setStatusData(prev => ({
          ...prev,
          certificates: [],
          certificatesCount: 0,
          hasCertificates: false,
          certificatesLoading: false,
          certificatesError: null
        }));
        return { certificatesCount: 0, hasCertificates: false };
      }
      
      const response = await fetch(`${config.BASE_URL}/Certificates?caregiverId=${userId}`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch certificates: ${response.status}`);
      }

      const response_data = await response.json();
      
      // Handle the API response structure: { success: true, data: [...] }
      const certificatesArray = response_data?.success ? response_data.data : (Array.isArray(response_data) ? response_data : []);
      const certificatesCount = certificatesArray.length;
      const hasCertificates = certificatesCount >= 1;
      
      setStatusData(prev => ({
        ...prev,
        certificates: certificatesArray,
        certificatesCount,
        hasCertificates,
        certificatesLoading: false,
        certificatesError: null
      }));
      
      return { certificatesCount, hasCertificates, certificates: certificatesArray };
      
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setStatusData(prev => ({
        ...prev,
        certificates: [],
        certificatesCount: 0,
        hasCertificates: false,
        certificatesLoading: false,
        certificatesError: error.message
      }));
      return { certificatesCount: 0, hasCertificates: false, error: error.message };
    }
  };

  // Refresh all status data
  const refreshStatusData = async () => {
    const userDetails = getUserDetails();
    const token = localStorage.getItem('authToken');
    
    if (!userDetails?.id || !token) {
      // Don't make API calls without a valid user ID and token
      return;
    }
    
    // Fetch all data in parallel
    const [verificationResult, qualificationResult, certificatesResult] = await Promise.allSettled([
      fetchVerificationStatus(userDetails.id, token),
      fetchQualificationStatus(userDetails.id),
      fetchCertificates(userDetails.id)
    ]);

    // Extract results
    const isVerified = verificationResult.status === 'fulfilled' ? verificationResult.value.isVerified : false;
    const isQualified = qualificationResult.status === 'fulfilled' ? qualificationResult.value.isQualified : false;
    const hasCertificates = certificatesResult.status === 'fulfilled' ? certificatesResult.value.hasCertificates : false;

    // Calculate overall publishing eligibility
    const canPublishGigs = isVerified && isQualified && hasCertificates;
    
    setStatusData(prev => ({
      ...prev,
      canPublishGigs,
      eligibilityChecked: true,
      lastUpdated: new Date().toISOString()
    }));

    return {
      isVerified,
      isQualified,
      hasCertificates,
      canPublishGigs
    };
  };

  // Initialize status data on mount and when user changes
  useEffect(() => {
    const initializeStatus = async () => {
      const userDetails = getUserDetails();
      if (!userDetails?.id) {
        // Reset state when no user - also reset loading states to prevent UI from being stuck
        setCurrentUserId(null);
        setStatusData(prev => ({
          ...prev,
          verificationLoading: false,
          qualificationLoading: false,
          certificatesLoading: false,
        }));
        return;
      }

      // Check if userId has changed
      if (currentUserId !== userDetails.id) {
        setCurrentUserId(userDetails.id);
        await refreshStatusData();
      } else if (!currentUserId) {
        // First initialization
        setCurrentUserId(userDetails.id);
        await refreshStatusData();
      }
    };

    initializeStatus();
  }, [currentUserId]); // Re-run when currentUserId changes

  // Helper function to recalculate canPublishGigs with optional override values
  // This allows us to pass in freshly fetched values that may not yet be in state
  const recalculatePublishingEligibility = (overrides = {}) => {
    setStatusData(prev => {
      const isVerified = overrides.isVerified !== undefined ? overrides.isVerified : prev.isVerified;
      const isQualified = overrides.isQualified !== undefined ? overrides.isQualified : prev.isQualified;
      const hasCertificates = overrides.hasCertificates !== undefined ? overrides.hasCertificates : prev.hasCertificates;
      
      const canPublishGigs = isVerified && isQualified && hasCertificates;
      console.log('CaregiverStatusContext - Recalculating publishing eligibility:', {
        isVerified,
        isQualified,
        hasCertificates,
        canPublishGigs,
        overrides
      });
      return {
        ...prev,
        canPublishGigs,
        lastUpdated: new Date().toISOString()
      };
    });
  };

  // Public methods to update specific parts of the status
  const updateVerificationStatus = async () => {
    const userDetails = getUserDetails();
    const token = localStorage.getItem('authToken');
    
    if (!userDetails?.id || !token) return;
    
    const result = await fetchVerificationStatus(userDetails.id, token);
    // Recalculate canPublishGigs with the fresh verification result
    recalculatePublishingEligibility({ isVerified: result?.isVerified });
    return result;
  };

  const updateQualificationStatus = async () => {
    const userDetails = getUserDetails();
    if (!userDetails?.id) return;
    
    const result = await fetchQualificationStatus(userDetails.id);
    // Recalculate canPublishGigs with the fresh qualification result
    recalculatePublishingEligibility({ isQualified: result?.isQualified });
    return result;
  };

  const updateCertificates = async () => {
    const userDetails = getUserDetails();
    if (!userDetails?.id) return;
    
    const result = await fetchCertificates(userDetails.id);
    // Recalculate canPublishGigs with the fresh certificates result
    recalculatePublishingEligibility({ hasCertificates: result?.hasCertificates });
    return result;
  };

  // Context value
  const value = {
    // Status data
    ...statusData,
    
    // Refresh methods
    refreshStatusData,
    updateVerificationStatus,
    updateQualificationStatus,
    updateCertificates,
    
    // Helper methods
    getPublishingEligibility: () => ({
      canPublish: statusData.canPublishGigs,
      reasons: {
        verification: {
          required: true,
          met: statusData.isVerified,
          status: statusData.verificationStatus?.verificationStatus || 'unknown'
        },
        qualification: {
          required: true,
          met: statusData.isQualified,
          score: statusData.qualificationStatus?.score || 0
        },
        certificates: {
          required: true,
          met: statusData.hasCertificates,
          count: statusData.certificatesCount
        }
      }
    }),
    
    isLoading: statusData.verificationLoading || statusData.qualificationLoading || statusData.certificatesLoading,
    hasErrors: !!(statusData.verificationError || statusData.qualificationError || statusData.certificatesError)
  };

  return (
    <CaregiverStatusContext.Provider value={value}>
      {children}
    </CaregiverStatusContext.Provider>
  );
}

// Custom hook to use the context
export function useCaregiverStatus() {
  const context = useContext(CaregiverStatusContext);
  
  if (!context) {
    throw new Error('useCaregiverStatus must be used within a CaregiverStatusProvider');
  }
  
  return context;
}

// Convenience hook for just publishing eligibility
export function usePublishingEligibility() {
  const { getPublishingEligibility, isLoading } = useCaregiverStatus();
  
  return {
    ...getPublishingEligibility(),
    isLoading
  };
}