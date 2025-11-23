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
  },
  
  // Legacy properties for backward compatibility
  apiBaseUrl: 'http://localhost:5000',
  frontendUrl: 'http://localhost:3000',
  VITE_DOJAH_APP_ID: 'test-app-id',
  VITE_DOJAH_API_KEY: 'test-api-key',
  VITE_PAYSTACK_PUBLIC_KEY: 'test-paystack-key'
};

export default config;
