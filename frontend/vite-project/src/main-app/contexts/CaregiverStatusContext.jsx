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

  const [isInitialized, setIsInitialized] = useState(false);

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
      
      console.log('CaregiverStatusContext - Verification status updated:', { isVerified, verificationData });
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
      
      console.log('CaregiverStatusContext - Qualification status updated:', { isQualified, qualificationData });
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
      
      const response = await fetch(`${config.BASE_URL}/Certificates?caregiverId=${userId}`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch certificates: ${response.status}`);
      }

      const certificates = await response.json();
      const certificatesArray = Array.isArray(certificates) ? certificates : [];
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
      
      console.log('CaregiverStatusContext - Certificates updated:', { certificatesCount, hasCertificates });
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
    
    if (!userDetails?.id) {
      console.warn('CaregiverStatusContext - No user ID available');
      return;
    }

    console.log('CaregiverStatusContext - Refreshing all status data for user:', userDetails.id);
    
    // Fetch all data in parallel
    const [verificationResult, qualificationResult, certificatesResult] = await Promise.allSettled([
      token ? fetchVerificationStatus(userDetails.id, token) : Promise.resolve({ isVerified: false }),
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

    console.log('CaregiverStatusContext - Publishing eligibility calculated:', {
      isVerified,
      isQualified,
      hasCertificates,
      canPublishGigs
    });

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
      if (isInitialized) return;
      
      const userDetails = getUserDetails();
      if (!userDetails?.id) {
        console.log('CaregiverStatusContext - No user details, skipping initialization');
        return;
      }

      console.log('CaregiverStatusContext - Initializing for user:', userDetails.id);
      await refreshStatusData();
      setIsInitialized(true);
    };

    initializeStatus();
  }, []); // Only run once on mount

  // Public methods to update specific parts of the status
  const updateVerificationStatus = async () => {
    const userDetails = getUserDetails();
    const token = localStorage.getItem('authToken');
    
    if (!userDetails?.id || !token) return;
    
    return await fetchVerificationStatus(userDetails.id, token);
  };

  const updateQualificationStatus = async () => {
    const userDetails = getUserDetails();
    if (!userDetails?.id) return;
    
    return await fetchQualificationStatus(userDetails.id);
  };

  const updateCertificates = async () => {
    const userDetails = getUserDetails();
    if (!userDetails?.id) return;
    
    return await fetchCertificates(userDetails.id);
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