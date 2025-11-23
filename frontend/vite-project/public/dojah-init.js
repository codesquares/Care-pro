/**
 * Dojah Global Initialization Script
 * 
 * This script must be loaded BEFORE any Dojah scripts to prevent
 * "ENV is not defined" and "Dojah is not defined" errors.
 * 
 * Place this in the HTML <head> before Dojah CDN scripts.
 */

// Initialize ENV global variable (fixes ENV is not defined error)
window.ENV = {
    ENVIRONMENT: 'development',
    API_URL: 'https://care-pro-node-api.onrender.com',
    DOJAH_API_URL: 'https://api.dojah.io',
    DEBUG: true
};

// Initialize Dojah global object (fixes Dojah is not defined error)
window.Dojah = {
    initialized: false,
    config: {},
    init: function(dojahConfig) {
        this.config = { ...this.config, ...dojahConfig };
        this.initialized = true;
        console.log('✅ Dojah initialized with config:', this.config);
        return this;
    },
    createWidget: function(element, widgetConfig) {
        console.log('📦 Dojah widget creation requested:', { element, widgetConfig });
        // Mock widget creation for iframe approach
        return {
            open: () => {
                console.log('🔓 Dojah widget opened');
                // Trigger custom event for iframe approach
                window.dispatchEvent(new CustomEvent('dojah-widget-open', { detail: widgetConfig }));
            },
            close: () => {
                console.log('🔒 Dojah widget closed');
                window.dispatchEvent(new CustomEvent('dojah-widget-close'));
            },
            destroy: () => {
                console.log('💥 Dojah widget destroyed');
                window.dispatchEvent(new CustomEvent('dojah-widget-destroy'));
            }
        };
    },
    // Add common methods that Dojah scripts might expect
    utils: {
        addCountries: function() {
            console.log('🌍 Mock addCountries called');
        }
    }
};

// Initialize Dojah with basic config
window.Dojah.init({
    appId: "686c915878a2b53b2bdb5631",
    widgetId: "69048546a4b1ea078950d7b9",
    debug: true,
    webhook: true,
    stages: ["government-data", "selfie"],
    analytics: {
        posthog: {
            enabled: false // Disable to prevent network errors
        }
    }
});

console.log('🎯 Dojah global environment initialized');
