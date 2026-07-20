import api from "./api";

const notificationPreferencesEndpoint = (caregiverId) =>
  `/CaregiverPreferences/notification-preferences/${caregiverId}`;

const defaultPreferences = {
  emailNotifications: true,
  smsNotifications: false,
  marketingEmails: false,
  promotions: false,
  newGig: true,
  careRequestUpdates: true,
};

const normalizePreferences = (raw = {}) => {
  const source = raw?.data || raw;

  return {
    emailNotifications: !!source.emailNotifications,
    smsNotifications: !!source.smsNotifications,
    marketingEmails: !!source.marketingEmails,
    promotions: !!source.promotions,
    newGig: !!source.newGig,
    careRequestUpdates: !!source.careRequestUpdates,
  };
};

const buildPayload = (preferences) => ({
  emailNotifications: !!preferences.emailNotifications,
  smsNotifications: !!preferences.smsNotifications,
  marketingEmails: !!preferences.marketingEmails,
  promotions: !!preferences.promotions,
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
