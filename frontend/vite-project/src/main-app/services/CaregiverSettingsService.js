import api from "./api";

const notificationPreferencesEndpoint = (caregiverId) =>
  `/CaregiverPreferences/notification-preferences/${caregiverId}`;

// Matches the backend's actual "no preference record yet" default
// (CaregiverPreferenceService.GetNotificationPreferencesAsync) — this is only ever shown
// transiently before the real GET resolves, or if it fails, so it must reflect that default
// exactly rather than an arbitrary placeholder.
const defaultPreferences = {
  emailNotifications: true,
  smsNotifications: true,
  marketingEmails: false,
  newGig: false,
  careRequestUpdates: false,
};

const normalizePreferences = (raw = {}) => {
  const source = raw?.data || raw;

  return {
    emailNotifications: !!source.emailNotifications,
    smsNotifications: !!source.smsNotifications,
    marketingEmails: !!source.marketingEmails,
    newGig: !!source.newGig,
    careRequestUpdates: !!source.careRequestUpdates,
  };
};

const buildPayload = (preferences) => ({
  emailNotifications: !!preferences.emailNotifications,
  smsNotifications: !!preferences.smsNotifications,
  marketingEmails: !!preferences.marketingEmails,
  newGig: !!preferences.newGig,
  careRequestUpdates: !!preferences.careRequestUpdates,
});

const CaregiverSettingsService = {
  defaultPreferences,

  async getNotificationPreferences(caregiverId) {
    if (!caregiverId) {
      throw new Error("Caregiver ID is required.");
    }

    try {
      const response = await api.get(notificationPreferencesEndpoint(caregiverId));
      return {
        success: true,
        data: normalizePreferences(response?.data),
      };
    } catch (error) {
      return {
        success: false,
        error: error?.response?.data?.message || error.message || "Failed to load caregiver notification preferences.",
      };
    }
  },

  async updateNotificationPreferences(caregiverId, preferences) {
    if (!caregiverId) {
      throw new Error("Caregiver ID is required.");
    }

    const payload = buildPayload(preferences);

    try {
      const response = await api.put(notificationPreferencesEndpoint(caregiverId), payload);
      return {
        success: true,
        data: normalizePreferences(response?.data),
        rawResponse: response?.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error?.response?.data?.message || error.message || "Failed to update caregiver notification preferences.",
      };
    }
  },
};

export default CaregiverSettingsService;
