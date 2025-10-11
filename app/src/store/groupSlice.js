import utils from "../core/utils";


export const createGroupSlice = (set, get) => ({
  groupList: [],
  groupMessages: {},
  groupCurrentId: null,

  groupListFetch: () => {
    get()._sendGroup({ source: "group.list" });
  },

  groupCreate: (name, members = []) => {
    const payload = { source: "group.create", name, members };
    get()._sendGroup(payload);
  },

  joinGroup: (groupId) => {
    const socket = get().groupSocket;
    if (!socket || socket.readyState !== 1) return;
    socket.send(JSON.stringify({ source: "group.join", groupId }));
    set({ groupCurrentId: groupId });
  },

  fetchGroupMessages: (groupId, page = 0) => {
    const socket = get().groupSocket;
    if (!socket || socket.readyState !== 1) return;
    socket.send(JSON.stringify({ source: "group.message.list", groupId, page }));
  },
});
