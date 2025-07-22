
/**
 * Dojah Configuration
 * 
 * This file imports Dojah configuration from the main config.js file
 * to maintain consistency across the application.
 */

import config from '../config.js';

// Export Dojah configuration from main config
export const DOJAH_CONFIG = {
  // Use values from main config which respects env variables
  widgetId: config.DOJAH.WIDGET_ID,
  appId: config.DOJAH.APP_ID,
  type: "custom",
  config: {
    debug: config.ENV.DEBUG,
    webhook: true,
    stages: ["government-data", "selfie"],
    // Disable PostHog analytics to prevent network errors
    analytics: {
      posthog: {
        enabled: false
      }
    }
  },
  metadata: {
    user_id: "", // Will be set dynamically
  },
  callback: (response) => {
    console.log("Verification completed:", response);
  },
  onError: (error) => {
    console.error("Verification error:", error);
  }
};

// Re-export config for backward compatibility
export { config as CONFIG };
