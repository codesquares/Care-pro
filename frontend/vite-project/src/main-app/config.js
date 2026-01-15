// Environment detection and API URL resolution
const resolveApiUrl = () => {
    // If explicit API URL is set, use it
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    
    // Auto-detect environment based on current location
    const hostname = window.location.hostname;
    const isDevelopment = import.meta.env.MODE === 'development';
    
    // Production environment
    if (hostname === 'oncarepro.com' || hostname === 'www.oncarepro.com') {
        return import.meta.env.VITE_PRODUCTION_API_URL || 'https://api.oncarepro.com/api';
    }
    
    // Staging environment (S3 static hosting)
    if (hostname.includes('carepro-frontend-staging') || hostname.includes('s3-website')) {
        return import.meta.env.VITE_STAGING_API_URL || 'https://carepro-api20241118153443.azurewebsites.net/api';
    }
    
    // Local development - try local backend first, fallback to staging
    if (isDevelopment && (hostname === 'localhost' || hostname === '127.0.0.1')) {
        // For local development, we'll check if local backend is available
        // If VITE_LOCAL_API_URL is set, prefer local backend
        const localApiUrl = import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:5005/api';
        const stagingApiUrl = import.meta.env.VITE_STAGING_API_URL || 'https://carepro-api20241118153443.azurewebsites.net/api';
        
        // Return local URL - the app will handle fallback at runtime
        return localApiUrl;
    }
    
    // Default fallback to staging
    return import.meta.env.VITE_STAGING_API_URL || 'https://carepro-api20241118153443.azurewebsites.net/api';
};

const config = {
    // Base URL with intelligent environment detection
    BASE_URL: resolveApiUrl(),
    // Alternate URL for WebSocket/SignalR connections - domain only without /api
    FALLBACK_URL: (() => {
        // First check if explicit WebSocket URL is provided
        if (import.meta.env.VITE_WEBSOCKET_URL) {
            return import.meta.env.VITE_WEBSOCKET_URL;
        }
        // Otherwise derive from base URL by removing /api suffix only (must end with /api)
        const baseUrl = resolveApiUrl();
        // Use a regex to only replace /api at the end of the URL, not in the domain
        return baseUrl ? baseUrl.replace(/\/api$/, '') : null;
    })(),

    // Environment-specific URLs
    LOCAL_API_URL: import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:5005/api',
    STAGING_API_URL: import.meta.env.VITE_STAGING_API_URL || 'https://carepro-api20241118153443.azurewebsites.net/api',
    PRODUCTION_API_URL: import.meta.env.VITE_PRODUCTION_API_URL || 'https://api.oncarepro.com/api',
    
    // Dojah Configuration
    DOJAH: {
        APP_ID: import.meta.env.VITE_DOJAH_APP_ID || null,
        WIDGET_ID: import.meta.env.VITE_DOJAH_WIDGET_ID || null,
        API_URL: "https://api.dojah.io",
        IDENTITY_URL: "https://identity.dojah.io",
        PUBLIC_KEY: import.meta.env.VITE_DOJAH_PUBLIC_KEY || null
    },
    
    // Environment Configuration
    ENV: {
        ENVIRONMENT: import.meta.env.MODE || 'development',
        API_URL: resolveApiUrl(),
        CURRENT_HOSTNAME: window.location.hostname,
        IS_PRODUCTION: window.location.hostname.includes('oncarepro.com'),
        IS_STAGING: window.location.hostname.includes('carepro-frontend-staging') || window.location.hostname.includes('s3-website'),
        IS_LOCAL: import.meta.env.MODE === 'development' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'),
        REDIRECT_URL: import.meta.env.VITE_REDIRECT_URL || `${window.location.origin}/app/caregiver/dashboard`,
        DEBUG: import.meta.env.VITE_DEBUG === 'true' || import.meta.env.MODE === 'development'
    }
};

// Debug config for development AND log critical info in production if URLs look malformed
const shouldDebug = import.meta.env.MODE === 'development' || 
                   config.BASE_URL.includes('..') || 
                   config.BASE_URL.match(/\.com\..*\.com/) ||
                   config.FALLBACK_URL?.includes('..') ||
                   config.FALLBACK_URL?.match(/\.com\..*\.com/);

if (shouldDebug) {
    console.log('🔧 CONFIG DEBUG:', {
        environment: import.meta.env.MODE,
        hostname: window.location.hostname,
        href: window.location.href,
        detected_environment: config.ENV.IS_PRODUCTION ? 'production' : 
                            config.ENV.IS_STAGING ? 'staging' : 
                            config.ENV.IS_LOCAL ? 'local' : 'unknown',
        resolved_api_url: config.BASE_URL,
        fallback_url: config.FALLBACK_URL,
        vite_api_url: import.meta.env.VITE_API_URL,
        vite_websocket_url: import.meta.env.VITE_WEBSOCKET_URL,
        has_DOJAH_credentials: !!(config.DOJAH.APP_ID && config.DOJAH.WIDGET_ID),
        has_CONTENTFUL_credentials: !!(config.DOJAH.PUBLIC_KEY),
        config_valid: !!(config.DOJAH.APP_ID && config.DOJAH.WIDGET_ID && config.BASE_URL)
    });
    
    // Warn about missing required environment variables
    const requiredVars = ['VITE_DOJAH_APP_ID', 'VITE_DOJAH_WIDGET_ID', 'VITE_DOJAH_PUBLIC_KEY'];
    const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
    
    if (missingVars.length > 0) {
        console.warn('⚠️ Missing required environment variables:', missingVars);
        console.warn('🔧 Add these to your .env.local file');
    }
    
    // Warn about malformed URLs
    if (config.BASE_URL.includes('..') || config.BASE_URL.match(/\.com\..*\.com/)) {
        console.error('🚨 MALFORMED BASE_URL DETECTED:', config.BASE_URL);
        console.error('🚨 window.location:', window.location.href);
        console.error('🚨 This may cause API request failures');
    }
    
    if (config.FALLBACK_URL?.includes('..') || config.FALLBACK_URL?.match(/\.com\..*\.com/)) {
        console.error('🚨 MALFORMED FALLBACK_URL DETECTED:', config.FALLBACK_URL);
    }
    
    // Local backend availability check
    if (config.ENV.IS_LOCAL && config.BASE_URL.includes('localhost')) {
        console.log('🔍 Local backend detection enabled - will attempt to connect to:', config.BASE_URL);
        console.log('📡 Fallback URL if local backend unavailable:', config.STAGING_API_URL);
    }
}

// Log config for debugging


export default config;