import { create } from "zustand";
import secure from "./secure";
import api, { ADDRESS } from "./api";
import utils from "./utils";

//-------------------------------------
//   Socket receive message handlers
//-------------------------------------

function responseFriendList(set, get, friendList) {
  set((state) => ({
    friendList: friendList,
  }));
}

function responseFriendNew(set, get, friend) {
  const friendList = [friend, ...get().friendList];
  set((state) => ({
    friendList: friendList,
  }));
}

function responseMessageList(set, get, data) {
  set((state) => ({
    messagesList: [...get().messagesList, ...data.messages],
    messagesNext: data.next,
    messagesUsername: data.friend.username,
  }));
}

function responseMessageSend(set, get, data) {
  const username = data.friend.username;
  // Move friendList item for this friend to the start of
  // list, update the preview text and update the time stamp
  const friendList = [...get().friendList];
  const friendIndex = friendList.findIndex(
    (item) => item.friend.username === username
  );
  if (friendIndex >= 0) {
    const item = friendList[friendIndex];
    item.preview = data.message.text;
    item.updated = data.message.created;
    friendList.splice(friendIndex, 1);
    friendList.unshift(item);
    set((state) => ({
      friendList: friendList,
    }));
  }
  // If the message data does not belong to this friend then
  // dont update the message list, as a fresh messageList will
  // be loaded the next time the user opens the correct chat window
  if (username !== get().messagesUsername) {
    return;
  }

  // If server echoed a clientTempId, remove the optimistic local message
  const clientTempId =
    data.clientTempId || (data.message && data.message.clientTempId);
  let existing = [...get().messagesList];
  if (clientTempId) {
    existing = existing.filter((m) => m.clientTempId !== clientTempId);
  }
  const messagesList = [data.message, ...existing];
  set((state) => ({
    messagesList: messagesList,
    messagesTyping: null,
  }));
}

function responseMessageType(set, get, data) {
  if (data.username !== get().messagesUsername) return;
  set((state) => ({
    messagesTyping: new Date(),
  }));
}

function responseRequestAccept(set, get, connection) {
  const user = get().user;
  // If I was the one that accepted the request, remove
  // request from the  requestList
  if (user.username === connection.receiver.username) {
    const requestList = [...get().requestList];
    const requestIndex = requestList.findIndex(
      (request) => request.id === connection.id
    );
    if (requestIndex >= 0) {
      requestList.splice(requestIndex, 1);
      set((state) => ({
        requestList: requestList,
      }));
    }
  }
  // If the corresponding user is contained within the
  // searchList for the  acceptor or the  acceptee, update
  // the state of the searchlist item
  const sl = get().searchList;
  if (sl === null) {
    return;
  }
  const searchList = [...sl];

  let searchIndex = -1;
  // If this user  accepted
  if (user.username === connection.receiver.username) {
    searchIndex = searchList.findIndex(
      (user) => user.username === connection.sender.username
    );
    // If the other user accepted
  } else {
    searchIndex = searchList.findIndex(
      (user) => user.username === connection.receiver.username
    );
  }
  if (searchIndex >= 0) {
    searchList[searchIndex].status = "connected";
    set((state) => ({
      searchList: searchList,
    }));
  }
}

function responseRequestConnect(set, get, connection) {
  const user = get().user;
  // If i was the one that made the connect request,
  // update the search list row
  if (user.username === connection.sender.username) {
    const searchList = [...get().searchList];
    const searchIndex = searchList.findIndex(
      (request) => request.username === connection.receiver.username
    );
    if (searchIndex >= 0) {
      searchList[searchIndex].status = "pending-them";
      set((state) => ({
        searchList: searchList,
      }));
    }
    // If they were the one  that sent the connect
    // request, add request to request list
  } else {
    const requestList = [...get().requestList];
    const requestIndex = requestList.findIndex(
      (request) => request.sender.username === connection.sender.username
    );
    if (requestIndex === -1) {
      requestList.unshift(connection);
      set((state) => ({
        requestList: requestList,
      }));
    }
  }
}

function responseRequestList(set, get, requestList) {
  set((state) => ({
    requestList: requestList,
  }));
}

function responseSearch(set, get, data) {
  set((state) => ({
    searchList: data,
  }));
}

function responseThumbnail(set, get, data) {
  set((state) => ({
    user: data,
    themeMode: data?.theme || null,
    notificationsEnabled:
      typeof data?.notifications_enabled !== "undefined"
        ? data.notifications_enabled
        : state.notificationsEnabled,
  }));
}

function responseFile(set, get, data) {
  set((state) => ({
    user: data,
  }));
}

function responseOllama(set, get, data) {
  console.log("Ollama data", data);
  set((state) => ({
    ollamaResponse: data,
    ollamaTyping: false,
  }));
}

function responseAI(set, get, data) {
  set((state) => ({
    ollamaResponse: data.message, // Save the AI message
    ollamaTyping: false, // Set typing status to false when the response is received
  }));
}

function responseUserStatus(set, get, data) {
  // console.log("responseUserStatus got:", data);
  const userStatuses = { ...get().userStatuses };
  userStatuses[data.username] = {
    is_online: data.is_online,
    last_online: data.last_online,
  };
  set({ userStatuses });
}

function responseUserUpdate(set, get, data) {
  set((state) => ({
    user: data,
    themeMode: data?.theme || null,
    notificationsEnabled:
      typeof data?.notifications_enabled !== "undefined"
        ? data.notifications_enabled
        : state.notificationsEnabled,
  }));
}

const useGlobal = create((set, get) => ({
  //---------------------
  //   Initialization
  //---------------------

  initialized: false,
  userStatuses: {},

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
        if (response.status !== 200) {
          throw "Authentication error";
        }
        const user = response.data.user;
        const tokens = response.data.tokens;

        secure.set("tokens", tokens);

        set((state) => ({
          initialized: true,
          authenticated: true,
          user: user,
          themeMode: user?.theme || null,
          notificationsEnabled:
            typeof user?.notifications_enabled !== "undefined"
              ? user.notifications_enabled
              : null,
        }));
        return;
      } catch (error) {
        console.log("useGlobal.init: ", error);
      }
    }
    set((state) => ({
      initialized: true,
    }));
  },

  //---------------------
  //   Authentication
  //---------------------

  authenticated: false,
  user: {},

  login: (credentials, user, tokens) => {
    secure.set("credentials", credentials);
    secure.set("tokens", tokens);
    set(() => ({
      authenticated: true,
      user,
      themeMode: user.theme || null,
      notificationsEnabled:
        typeof user?.notifications_enabled !== "undefined"
          ? user.notifications_enabled
          : null,
    }));
  },

  logout: () => {
    secure.wipe();
    set((state) => ({
      authenticated: false,
      user: {},
      themeMode: null, // clear theme on logout
      notificationsEnabled: null, // clear notifications preference on logout
    }));
  },

  //---------------------
  //   Theme & Notifications / settings
  //---------------------
  // themeMode: null = follow system, 'light' or 'dark' = user preference
  // inside useGlobal
  themeMode: null,
  notificationsEnabled: true,

  setThemeMode: (mode) => {
    set({ themeMode: mode });
    get().updateSettings({ theme: mode });
  },

  toggleTheme: () => {
    set((state) => {
      const next = state.themeMode === "dark" ? "light" : "dark";
      get().updateSettings({ theme: next });
      return { themeMode: next };
    });
  },

  toggleNotifications: () => {
    set((state) => {
      const next = state.notificationsEnabled === true ? false : true;
      get().updateSettings({ notifications: next });
      return { notifications: next };
    });
  },

  //---------------------
  //     Ollama
  //---------------------
  ollamaResponse: null,
  ollamaTyping: false,

  // Send a message to Ollama
  sendToOllama: (message) => {
    const socket = get().socket;
    socket.send(
      JSON.stringify({
        source: "ai.query",
        message: message,
      })
    );
    set((state) => ({
      ollamaTyping: true,
    }));
  },

  //---------------------
  //     Websocket
  //---------------------

  socket: null,

  socketConnect: async () => {
    const tokens = await secure.get("tokens");

    const url = `ws://${ADDRESS}/chat/?token=${tokens.access}`;

    const socket = new WebSocket(url);
    socket.onopen = () => {
      utils.log("socket.onopen");

      socket.send(
        JSON.stringify({
          source: "request.list",
        })
      );
      socket.send(
        JSON.stringify({
          source: "friend.list",
        })
      );
    };
    socket.onmessage = (event) => {
      // Convert data to javascript object
      const parsed = JSON.parse(event.data);

      // Debug log formatted  data
      utils.log("onmessage haha:", parsed);

      const responses = {
        "friend.list": responseFriendList,
        "friend.new": responseFriendNew,
        "message.list": responseMessageList,
        "message.send": responseMessageSend,
        "message.type": responseMessageType,
        "request.accept": responseRequestAccept,
        "request.connect": responseRequestConnect,
        "request.list": responseRequestList,
        "ai.query": responseOllama,
        "ai.response": responseAI,
        "user.status": responseUserStatus,
        "user.update": responseUserUpdate,
        search: responseSearch,
        thumbnail: responseThumbnail,
        file: responseFile,
      };
      const resp = responses[parsed.source];
      if (!resp) {
        utils.log('parsed.source "' + parsed.source + '" not found');
        return;
      }
      // Call response function
      resp(set, get, parsed.data);
    };
    socket.onerror = (e) => {
      utils.log("socket.onerror", e.message);
    };
    socket.onclose = () => {
      utils.log("socket.onclose");
    };
    set((state) => ({
      socket: socket,
    }));
  },

  socketClose: () => {
    const socket = get().socket;
    if (socket) {
      socket.close();
    }
    set((state) => ({
      socket: null,
    }));
  },

  //---------------------
  //     Search
  //---------------------

  searchList: null,

  searchUsers: (query) => {
    if (query) {
      const socket = get().socket;
      socket.send(
        JSON.stringify({
          source: "search",
          query: query,
        })
      );
    } else {
      set((state) => ({
        searchList: null,
      }));
    }
  },

  //---------------------
  //     Requests
  //---------------------

  friendList: null,

  //---------------------
  //     Messages
  //---------------------

  messagesList: [],
  messagesNext: null,
  messagesTyping: null,
  messagesUsername: null,

  messageList: (connectionId, page = 0) => {
    if (page === 0) {
      set((state) => ({
        messagesList: [],
        messagesNext: null,
        messagesTyping: null,
        messagesUsername: null,
      }));
    } else {
      set((state) => ({
        messagesNext: null,
      }));
    }
    const socket = get().socket;
    socket.send(
      JSON.stringify({
        source: "message.list",
        connectionId: connectionId,
        page: page,
      })
    );
  },

  // <-- ADD: send a message (text or object) over the websocket
  messageSend: (connectionId, message) => {
    const socket = get().socket;
    if (!socket || socket.readyState !== 1) {
      utils.log("messageSend: socket not available");
      return;
    }
    try {
      socket.send(
        JSON.stringify({
          source: "message.send",
          connectionId: connectionId,
          message: message,
        })
      );
    } catch (err) {
      utils.log("messageSend error", err);
    }
  },

  // <-- ADD: notify server that user is typing for a given username
  messageType: (username) => {
    const socket = get().socket;
    if (!socket || socket.readyState !== 1) {
      return;
    }
    try {
      socket.send(
        JSON.stringify({
          source: "message.type",
          username: username,
        })
      );
    } catch (err) {
      utils.log("messageType error", err);
    }
  },

  //---------------------
  //     Requests
  //---------------------

  requestList: null,

  requestAccept: (username) => {
    const socket = get().socket;
    socket.send(
      JSON.stringify({
        source: "request.accept",
        username: username,
      })
    );
  },

  requestConnect: (username) => {
    const socket = get().socket;
    socket.send(
      JSON.stringify({
        source: "request.connect",
        username: username,
      })
    );
  },

  //---------------------
  //     Thumbnail (now via REST)
  //---------------------

  uploadThumbnail: async (file) => {
    try {
      const tokens = await secure.get("tokens");
      const authHeaders = tokens ? { Authorization: `Bearer ${tokens.access}` } : {};

      const filename =
        file?.fileName ||
        file?.name ||
        (file?.uri ? file.uri.split("/").pop() : "thumbnail.jpg");
      const fileType = file?.type || "image/jpeg";

      const form = new FormData();
      form.append("thumbnail", {
        uri: file.uri,
        name: filename,
        type: fileType,
      });

      // Use fetch for multipart uploads on React Native to avoid axios content-type/adapter issues
      const baseURL = (api && api.defaults && api.defaults.baseURL) ? api.defaults.baseURL : `https://${ADDRESS}`;
      const url = baseURL.replace(/\/$/, "") + "/chat/profile/";

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          ...authHeaders,
          // Do NOT set Content-Type (fetch will set boundary for multipart/form-data)
        },
        body: form,
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => null);
        const err = new Error(`upload failed: ${resp.status} ${resp.statusText} ${text || ""}`);
        utils.log("uploadThumbnail fetch response error", err);
        throw err;
      }

      const data = await resp.json().catch(() => null);
      if (data) {
        set(() => ({
          user: data,
          themeMode: data?.theme || null,
          notificationsEnabled:
            typeof data?.notifications_enabled !== "undefined"
              ? data.notifications_enabled
              : null,
        }));
      }
    } catch (err) {
      utils.log("uploadThumbnail error", err);
      throw err; // let UI know upload failed
    }
  },

  // Update user fields (name, password) via REST JSON
  updateUser: async (userPayload) => {
    console.log("updateUser payload:", userPayload);
    try {
      const tokens = await secure.get("tokens");
      const authHeaders = tokens
        ? { Authorization: `Bearer ${tokens.access}` }
        : {};

      const response = await api.post("/chat/profile/", userPayload, {
        headers: { ...authHeaders },
      });
      if (response && response.data) {
        set(() => ({
          user: response.data,
          themeMode: response.data?.theme || null,
          notificationsEnabled:
            typeof response.data?.notifications_enabled !== "undefined"
              ? response.data.notifications_enabled
              : null,
        }));
        return response.data; // <-- return updated user for caller
      }
      return null;
    } catch (err) {
      utils.log("updateUser error", err);
      throw err; // allow UI to catch and show error
    }
  },

  // Update settings (theme/notifications) via websocket or REST (authorized)
  updateSettings: async (settings) => {
    const socket = get().socket;
    if (socket && socket.readyState === 1) {
      // websocket path uses settings object and server handles it
      socket.send(
        JSON.stringify({
          source: "user.update",
          settings,
        })
      );
      return;
    }

    try {
      const tokens = await secure.get("tokens");
      const authHeaders = tokens
        ? { Authorization: `Bearer ${tokens.access}` }
        : {};

      const response = await api.post("/chat/profile/", settings, {
        headers: { ...authHeaders },
      });
      if (response && response.data) {
        set(() => ({
          user: response.data,
          themeMode: response.data?.theme || null,
          notificationsEnabled:
            typeof response.data?.notifications_enabled !== "undefined"
              ? response.data.notifications_enabled
              : null,
        }));
      }
    } catch (err) {
      utils.log("updateSettings error", err);
    }
  },
}));

export default useGlobal;
