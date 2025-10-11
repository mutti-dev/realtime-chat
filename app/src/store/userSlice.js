import secure from "../core/secure";
import api from "../core/api";
import utils from "../core/utils";
import { uploadThumbnailREST } from "./helpers/apiHelpers";

export const createUserSlice = (set, get) => ({
  // ✅ Default values
  user: null,
  themeMode: "light",
  notificationsEnabled: true,
  userStatuses: {},

  // ✅ When login happens, call this to sync settings from server
  setUserFromServer: (userData) => {
    if (!userData) return;

    console.log("Setting user from server:", userData);
    const theme =
      userData.settings?.theme || userData.theme || "light";
    const notificationsEnabled =
      typeof userData.settings?.notifications !== "undefined"
        ? userData.settings.notifications
        : userData.notifications_enabled ?? true;

    set(() => ({
      user: userData,
      themeMode: theme,
      notificationsEnabled,
    }));
  },


 updateUser: async (userPayload) => {
  utils.log("updateUser payload:", userPayload);
  try {
    // 🔹 Instant local update for better UX
    set((state) => {
      const newTheme =
        userPayload.theme ?? state.themeMode;
      const newNotifications =
        typeof userPayload.notifications_enabled !== "undefined"
          ? userPayload.notifications_enabled
          : state.notificationsEnabled;

      return {
        ...state,
        themeMode: newTheme,
        notificationsEnabled: newNotifications,
        user: {
          ...state.user,
          theme: newTheme,
          notifications_enabled: newNotifications,
          settings: {
            ...state.user?.settings,
            theme: newTheme,
            notifications: newNotifications,
          },
        },
      };
    });

    // 🔹 Then sync with backend
    const tokens = await secure.get("tokens");
    const authHeaders = tokens
      ? { Authorization: `Bearer ${tokens.access}` }
      : {};

    const response = await api.post("/chat/profile/", userPayload, {
      headers: { ...authHeaders },
    });

    if (response?.data) {
      const updatedUser = response.data;
      const theme =
        updatedUser.settings?.theme || updatedUser.theme || "light";
      const notificationsEnabled =
        typeof updatedUser.settings?.notifications !== "undefined"
          ? updatedUser.settings.notifications
          : updatedUser.notifications_enabled ?? true;

      set((state) => ({
        ...state,
        user: updatedUser,
        themeMode: theme,
        notificationsEnabled,
      }));

      return updatedUser;
    }
    return null;
  } catch (err) {
    utils.log("updateUser error", err);
    throw err;
  }
},

  // ✅ Thumbnail upload (unchanged)
  uploadThumbnail: async (file) => uploadThumbnailREST(file),
});
