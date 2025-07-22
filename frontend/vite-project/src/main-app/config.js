const config = {
    // Base URL without trailing slash - don't add '/api' in API calls since it's included here
    BASE_URL: "https://carepro-api20241118153443.azurewebsites.net/api",
    // Alternate URL in case the main one doesn't work
    FALLBACK_URL: "https://carepro-api20241118153443.azurewebsites.net",

    LOCAL_API_URL: "https://care-pro-node-api.onrender.com/api",
    LOCALHOST_API_URL: "http://localhost:3000/api",
    
    // Dojah Configuration
    DOJAH: {
        APP_ID: import.meta.env.VITE_DOJAH_APP_ID || "686c915878a2b53b2bdb5631",
        WIDGET_ID: import.meta.env.VITE_DOJAH_WIDGET_ID || "68732f5e97202a07f66bc89a",
        API_URL: "https://api.dojah.io",
        IDENTITY_URL: "https://identity.dojah.io"
    },
    
    // Environment Configuration
    ENV: {
        ENVIRONMENT: import.meta.env.MODE || 'development',
        API_URL: import.meta.env.VITE_API_URL || "https://care-pro-node-api.onrender.com",
        AZURE_API_URL: import.meta.env.VITE_AZURE_API_URL || "https://carepro-api20241118153443.azurewebsites.net/api",
        REDIRECT_URL: import.meta.env.VITE_REDIRECT_URL || `${window.location.origin}/app/caregiver/dashboard`,
        DEBUG: import.meta.env.VITE_DEBUG === 'true' || import.meta.env.MODE === 'development'
    }
};

// Initialize global variables for Dojah widget (fixes ENV and Dojah undefined errors)
if (typeof window !== 'undefined') {
    // Set global ENV for Dojah widget
    if (!window.ENV) {
        window.ENV = config.ENV;
    }

    // Initialize Dojah global object
    if (!window.Dojah) {
        window.Dojah = {
            initialized: false,
            config: {},
            init: function(dojahConfig) {
                this.config = { ...this.config, ...dojahConfig };
                this.initialized = true;
                console.log('✅ Dojah initialized with config:', this.config);
            },
            createWidget: function(element, widgetConfig) {
                console.log('📦 Dojah widget creation requested:', { element, widgetConfig });
                // Mock widget creation for iframe approach
                return {
                    open: () => console.log('🔓 Dojah widget opened'),
                    close: () => console.log('🔒 Dojah widget closed'),
                    destroy: () => console.log('💥 Dojah widget destroyed')
                };
            }
        };
    }

    // Initialize Dojah if not already initialized
    if (window.Dojah && !window.Dojah.initialized) {
        window.Dojah.init({
            appId: config.DOJAH.APP_ID,
            widgetId: config.DOJAH.WIDGET_ID,
            debug: config.ENV.DEBUG,
            webhook: true,
            stages: ["government-data", "selfie"],
            analytics: {
                posthog: {
                    enabled: false // Disable to prevent network errors
                }
            }
        });
    }
}

export default config;