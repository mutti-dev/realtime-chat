export const createRequestSlice = (set, get) => ({
  requestList: null,
  searchList: null,

  searchUsers: (query) => {
    if (query) {
      const socket = get().socket;
      if (!socket || socket.readyState !== 1) return;
      socket.send(JSON.stringify({ source: "search", query }));
    } else {
      set(() => ({ searchList: null }));
    }
  },

  requestAccept: (username) => {
    const socket = get().socket;
    if (!socket || socket.readyState !== 1) return;
    socket.send(JSON.stringify({ source: "request.accept", username }));
  },

  requestConnect: (username) => {
    const socket = get().socket;
    if (!socket || socket.readyState !== 1) return;
    socket.send(JSON.stringify({ source: "request.connect", username }));
  },
});
