const config = {
  BASE_URL: "http://localhost:3000",
  FALLBACK_URL: "http://localhost:3000",
  
  // REMOVED: LOCAL_API_URL and LOCALHOST_API_URL are no longer needed
  // All API calls now go through the .NET backend BASE_URL
  
  DOJAH: {
    APP_ID: "690484faa4b1ea078950c1cb",
    WIDGET_ID: "69048546a4b1ea078950d7b9",
    API_URL: "https://api.dojah.io",
    IDENTITY_URL: "https://identity.dojah.io",
    PUBLIC_KEY: "test-public-key"
  },
  
  ENV: {
    ENVIRONMENT: 'test',
    API_URL: "http://localhost:3000",
    AZURE_API_URL: "http://localhost:3000/api",
    REDIRECT_URL: "http://localhost:3000/app/caregiver/dashboard",
    DEBUG: true
  },
  
  // Legacy properties for backward compatibility
  apiBaseUrl: 'http://localhost:5000',
  frontendUrl: 'http://localhost:3000',
  VITE_DOJAH_APP_ID: 'test-app-id',
  VITE_DOJAH_API_KEY: 'test-api-key',
  VITE_PAYSTACK_PUBLIC_KEY: 'test-paystack-key'
};

export default config;
