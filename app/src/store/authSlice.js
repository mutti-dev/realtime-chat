import secure from "../core/secure";
import api from "../core/api";
import utils from "../core/utils";

export const createAuthSlice = (set, get) => ({
  initialized: false,
  authenticated: false,
  user: null, // ✅ single global source of user data

  init: async () => {
    const credentials = await secure.get("credentials");
    if (credentials) {
      try {
        const response = await api({
          method: "POST",
          url: "/chat/signin/",
          data: {
            username: credentials.username,
            password: credentials.password,
          },
        });

        if (response.status !== 200) throw new Error("Authentication error");

        const user = response.data.user;
        const tokens = response.data.tokens;
        utils.log("Auth tokens", tokens);

        await secure.set("tokens", tokens);

       
        if (typeof get().setUserFromServer === "function") {
        get().setUserFromServer(user);
      }

        set((state) => ({
          initialized: true,
          authenticated: true,
          user: user,
          
        }));
        return;

        // connect sockets after auth
        // if (typeof get().socketConnect === "function") get().socketConnect();
        // if (typeof get().groupSocketConnect === "function")
        //   get().groupSocketConnect();
      } catch (error) {
        utils.log("authSlice.init error:", error);
        await secure.wipe();
        set({ initialized: true });
      }
    }
  },

  login: (credentials, user, tokens) => {
    secure.set("credentials", credentials);
    secure.set("tokens", tokens);
    set({
      authenticated: true,
      user,
    });
  },

  logout: () => {
    secure.wipe();
    set({
      authenticated: false,
      user: null,
    });
  },
});
