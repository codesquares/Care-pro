


export const DOJAH_CONFIG = {

  widgetId: import.meta.env.VITE_DOJAH_WIDGET_ID || "YOUR_WIDGET_ID", // Replace with your actual widget ID from Dojah
  appId: import.meta.env.VITE_DOJAH_APP_ID || "YOUR_APP_ID",     // Replace with your actual app ID from Dojah
  type: "custom",
  config: {
    debug: false,
    webhook: true
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
