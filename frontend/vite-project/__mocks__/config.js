const config = {
  BASE_URL: "http://localhost:3000",
  FALLBACK_URL: "http://localhost:3000",
  LOCAL_API_URL: "http://localhost:3000/api",
  LOCALHOST_API_URL: "http://localhost:3000/api",
  
  DOJAH: {
    APP_ID: "686c915878a2b53b2bdb5631",
    WIDGET_ID: "68732f5e97202a07f66bc89a",
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
