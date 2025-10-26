const config = {
    // Base URL without trailing slash - don't add '/api' in API calls since it's included here
    BASE_URL: import.meta.env.VITE_API_URL || "https://carepro-api20241118153443.azurewebsites.net/api",
    // Alternate URL in case the main one doesn't work - Remove /api to get the base domain
    FALLBACK_URL: (import.meta.env.VITE_API_URL || "https://carepro-api20241118153443.azurewebsites.net/api").replace('/api', ''),

    LOCAL_API_URL: "https://care-pro-node-api.onrender.com/api",
    LOCALHOST_API_URL: "http://localhost:3000/api",
    
    // Dojah Configuration
    DOJAH: {
        APP_ID: import.meta.env.VITE_DOJAH_APP_ID || "686c915878a2b53b2bdb5631",
        WIDGET_ID: import.meta.env.VITE_DOJAH_WIDGET_ID || "68732f5e97202a07f66bc89a",
        API_URL: "https://api.dojah.io",
        IDENTITY_URL: "https://identity.dojah.io",
        PUBLIC_KEY: import.meta.env.VITE_DOJAH_PUBLIC_KEY 
    },
    
    // Environment Configuration
    ENV: {
        ENVIRONMENT: import.meta.env.MODE || 'development',
        API_URL: import.meta.env.VITE_API_URL || "https://carepro-api20241118153443.azurewebsites.net/api",
        AZURE_API_URL: import.meta.env.VITE_AZURE_API_URL || "https://carepro-api20241118153443.azurewebsites.net/api",
        REDIRECT_URL: import.meta.env.VITE_REDIRECT_URL || `${window.location.origin}/app/caregiver/dashboard`,
        DEBUG: import.meta.env.VITE_DEBUG === 'true' || import.meta.env.MODE === 'development'
    }
};

// Log config for debugging


export default config;