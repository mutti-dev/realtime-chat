export const createAISlice = (set, get) => ({
  ollamaResponse: null,
  ollamaTyping: false,

  // sending an ai query could be done via websocket
  sendAIQuery: (query) => {
    const socket = get().socket;
    if (!socket || socket.readyState !== 1) return;
    socket.send(JSON.stringify({ source: "ai.query", query }));
    set({ ollamaTyping: true });
  },
});
