
/**
 * Dojah Configuration
 * 
 * This file contains configuration for the Dojah Verification Widget
 */

export const DOJAH_CONFIG = {
  // Use env variables if available, otherwise use hardcoded values
  // For production, make sure to set these in your .env file
  widgetId: import.meta.env.VITE_DOJAH_WIDGET_ID || "68732f5e97202a07f66bc89a",
  appId: import.meta.env.VITE_DOJAH_APP_ID || "686c915878a2b53b2bdb5631",
  type: "custom",
  config: {
    debug: true, // Set to true to see more logs
    webhook: true,
    stages: ["government-data", "selfie"]
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
