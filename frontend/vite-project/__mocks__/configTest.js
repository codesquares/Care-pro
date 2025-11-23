// Test-specific config that avoids import.meta issues
const config = {
  BASE_URL: "http://localhost:3000/api",
  FALLBACK_URL: "http://localhost:3000",
  LOCAL_API_URL: "http://localhost:5005/api",
  STAGING_API_URL: "https://carepro-api20241118153443.azurewebsites.net/api",
  PRODUCTION_API_URL: "https://api.oncarepro.com/api",
  
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
    CURRENT_HOSTNAME: "localhost",
    IS_PRODUCTION: false,
    IS_STAGING: false,
    IS_LOCAL: true,
    REDIRECT_URL: "http://localhost:3000/app/caregiver/dashboard",
    DEBUG: true
  }
};

export default config;