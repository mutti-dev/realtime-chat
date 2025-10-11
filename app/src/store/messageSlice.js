import utils from "../core/utils";

import { uploadFileREST } from "./helpers/apiHelpers";

export const createMessageSlice = (set, get) => ({
  messagesList: [],
  messagesNext: null,
  messagesTyping: null,
  messagesUsername: null,

  messageList: (connectionId, page = 0) => {
    if (page === 0) {
      set(() => ({
        messagesList: [],
        messagesNext: null,
        messagesTyping: null,
        messagesUsername: null,
      }));
    } else {
      set(() => ({ messagesNext: null }));
    }
    const socket = get().socket;
    if (!socket || socket.readyState !== 1) return;
    socket.send(
      JSON.stringify({
        source: "message.list",
        connectionId,
        page,
      })
    );
  },

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
          connectionId,
          message,
        })
      );
    } catch (err) {
      utils.log("messageSend error", err);
    }
  },

  messageType: (username) => {
    const socket = get().socket;
    if (!socket || socket.readyState !== 1) return;
    try {
      socket.send(JSON.stringify({ source: "message.type", username }));
    } catch (err) {
      utils.log("messageType error", err);
    }
  },

  // send file (REST upload) - mirrors your original sendFile
  sendFile: async ({ file, connectionId, text }) => {
    if (!file) throw new Error("File is required");
    return uploadFileREST({ file, connectionId, text });
  },
});
