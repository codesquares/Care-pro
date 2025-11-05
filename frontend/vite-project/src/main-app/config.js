const config = {
    // Base URL without trailing slash - includes '/api' for REST endpoints  
    BASE_URL: import.meta.env.VITE_API_URL || "https://carepro-api20241118153443.azurewebsites.net/api",
    // Alternate URL for WebSocket/SignalR connections - domain only without /api
    FALLBACK_URL: (import.meta.env.VITE_API_URL || "https://carepro-api20241118153443.azurewebsites.net/api").replace('/api', '').replace('https://api.', 'https://'),

    // Local development API URL for localhost backend
    LOCAL_API_URL: import.meta.env.VITE_LOCAL_API_URL || "http://localhost:5005",
    
    // Dojah Configuration
    DOJAH: {
        APP_ID: import.meta.env.VITE_DOJAH_APP_ID || "690484faa4b1ea078950c1cb",
        WIDGET_ID: import.meta.env.VITE_DOJAH_WIDGET_ID || "69048546a4b1ea078950d7b9",
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

// Debug config for development
if (import.meta.env.MODE === 'development') {
    console.log('🔧 CONFIG DEBUG:', {
        environment: import.meta.env.MODE,
        VITE_DOJAH_APP_ID_from_env: import.meta.env.VITE_DOJAH_APP_ID,
        DOJAH_APP_ID_resolved: config.DOJAH.APP_ID,
        BASE_URL: config.BASE_URL,
        all_env_vars: import.meta.env
    });
}

// Log config for debugging


export default config;