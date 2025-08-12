// Simple mobile detection test
// You can run this in the browser console to test mobile detection

const testMobileDetection = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
  const isSmallScreen = window.innerWidth <= 768;
  const isMobile = isMobileDevice || isSmallScreen;
  
  console.log('User Agent:', userAgent);
  console.log('Is Mobile Device:', isMobileDevice);
  console.log('Is Small Screen:', isSmallScreen);
  console.log('Final Mobile Detection:', isMobile);
  
  return isMobile;
};

// Test the mobile detection
testMobileDetection();
