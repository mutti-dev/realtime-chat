import secure from "../core/secure";
import { ADDRESS } from "../core/api";
import utils from "../core/utils";

import {
  handleSocketMessage,
} from "./helpers/socketHandlers";

export const createSocketSlice = (set, get) => ({
  socket: null,
  groupSocket: null,

  // Generic helper to retry sending to group socket (mirrors your original)
  _sendToGroupSocketWithRetry: async (payload, attempts = 6, interval = 250) => {
    for (let i = 0; i < attempts; i++) {
      const groupSocket = get().groupSocket;
      if (groupSocket && groupSocket.readyState === 1) {
        try {
          groupSocket.send(JSON.stringify(payload));
          return true;
        } catch (err) {
          // continue retrying
        }
      }
      try {
        const connectFn = get().groupSocketConnect;
        if (typeof connectFn === "function") connectFn();
      } catch (e) {
        // ignore
      }
      await new Promise((res) => setTimeout(res, interval));
    }
    utils.log("Failed to send to group socket after retries:", payload);
    return false;
  },

  // connect group socket
  groupSocketConnect: async () => {
    const tokens = await secure.get("tokens");
    if (!tokens || !tokens.access) {
      utils.log("groupSocketConnect: missing tokens");
      return;
    }
    const existing = get().groupSocket;
    if (existing && existing.readyState === 1) return;

    const socket = new WebSocket(
      `ws://${ADDRESS}/groupchat/?token=${tokens.access}`
    );

    socket.onopen = () => {
      utils.log("groupSocket.onopen");
      try {
        socket.send(JSON.stringify({ source: "group.list" }));
      } catch (e) {
        utils.log("groupSocket initial group.list send failed", e);
      }
    };

    socket.onmessage = (event) => {
      let parsed;
      try {
        parsed = JSON.parse(event.data);
      } catch (e) {
        utils.log("groupSocket onmessage parse error", e, event.data);
        return;
      }
      handleSocketMessage(set, get, parsed, "group");
    };

    socket.onerror = (e) => utils.log("groupSocket.onerror", e?.message || e);
    socket.onclose = (e) => {
      utils.log("groupSocket.onclose", e?.code, e?.reason);
      set({ groupSocket: null });
    };

    set({ groupSocket: socket });
  },

  // primary chat websocket connect
  socketConnect: async () => {
    const tokens = await secure.get("tokens");
    if (!tokens || !tokens.access) {
      utils.log("socketConnect: missing tokens");
      return;
    }
    const url = `ws://${ADDRESS}/chat/?token=${tokens.access}`;
    const socket = new WebSocket(url);

    socket.onopen = () => {
      utils.log("socket.onopen");
      try {
        socket.send(JSON.stringify({ source: "request.list" }));
        socket.send(JSON.stringify({ source: "friend.list" }));
      } catch (e) {
        utils.log("socket.onopen send failed", e);
      }
    };

    socket.onmessage = (event) => {
      let parsed;
      try {
        parsed = JSON.parse(event.data);
      } catch (e) {
        utils.log("onmessage parse error", e, event.data);
        return;
      }
      utils.log("onmessage:", parsed);
      handleSocketMessage(set, get, parsed, "chat");
    };

    socket.onerror = (e) => {
      utils.log("socket.onerror", e?.message || e);
    };
    socket.onclose = () => {
      utils.log("socket.onclose");
    };

    set({ socket });
  },

  socketClose: () => {
    const socket = get().socket;
    if (socket) socket.close();
    set(() => ({ socket: null }));
  },

  // small wrapper to send to group socket (used by group actions)
  _sendGroup: (payload) => {
    const socket = get().groupSocket;
    if (!socket || socket.readyState !== 1) return get()._sendToGroupSocketWithRetry(payload);
    try {
      socket.send(JSON.stringify(payload));
      return true;
    } catch (err) {
      utils.log("group send failed, retrying", err);
      return get()._sendToGroupSocketWithRetry(payload);
    }
  },
});
