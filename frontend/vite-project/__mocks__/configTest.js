// Test-specific config that avoids import.meta issues
const config = {
  BASE_URL: "http://localhost:3000/api",
  FALLBACK_URL: "http://localhost:3000",
  
  // REMOVED: LOCAL_API_URL and LOCALHOST_API_URL are no longer needed
  // All API calls now go through the .NET backend BASE_URL
  
  DOJAH: {
    APP_ID: "test-app-id",
    WIDGET_ID: "test-widget-id",
    API_URL: "https://api.dojah.io",
    IDENTITY_URL: "https://identity.dojah.io",
    PUBLIC_KEY: "test-public-key"
  },
  
  ENV: {
    ENVIRONMENT: 'test',
    API_URL: "http://localhost:3000/api",
    AZURE_API_URL: "http://localhost:3000/api",
    REDIRECT_URL: "http://localhost:3000/app/caregiver/dashboard",
    DEBUG: true
  }
};

export default config;