// socketHandlers.js
// Keep behavior identical to original global.js response handlers
export function handleSocketMessage(set, get, parsed, type = "chat") {
  // parsed: { source: "friend.list", data: ... }
  const source = parsed.source;
  const payload = parsed.data !== undefined ? parsed.data : parsed;

  // group-specific mapping
  if (type === "group") {
    const groupResponses = {
      "group.list": responseGroupList,
      "group.create": responseGroupNew,
      "group.new": responseGroupNew,
      "group.join": responseGroupJoin,
      "group.message.list": responseGroupMessageList,
      "group.message.send": responseGroupMessageSend,
    };
    const resp = groupResponses[source];
    if (typeof resp === "function") {
      try {
        resp(set, get, payload);
      } catch (err) {
        console.log("groupSocket handler error for " + source, err);
      }
    } else {
      console.log('groupSocket parsed.source "' + source + '" not found');
    }
    return;
  }

  // chat mapping
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

  const resp = responses[source];
  if (!resp) {
    console.log('parsed.source "' + source + '" not found');
    return;
  }
  resp(set, get, payload);
}

// ---------- handlers (copied/ported from original) ----------

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
  const friendList = [...get().friendList];
  const friendIndex = friendList.findIndex(
    (item) => item.friend.username === username
  );
  if (friendIndex >= 0) {
    const item = friendList[friendIndex];
    item.preview = data.message.text || "image";
    item.updated = data.message.created;
    friendList.splice(friendIndex, 1);
    friendList.unshift(item);
    set((state) => ({
      friendList: friendList,
    }));
  }
  if (username !== get().messagesUsername) {
    return;
  }

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
  const sl = get().searchList;
  if (sl === null) {
    return;
  }
  const searchList = [...sl];

  let searchIndex = -1;
  if (user.username === connection.receiver.username) {
    searchIndex = searchList.findIndex(
      (user) => user.username === connection.sender.username
    );
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
        : get().notificationsEnabled,
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
    ollamaResponse: data.message,
    ollamaTyping: false,
  }));
}

function responseUserStatus(set, get, data) {
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
        : get().notificationsEnabled,
  }));
}

// Group handlers (copied directly)
function responseGroupList(set, get, groups) {
  set((state) => ({
    groupList: groups,
  }));
}

function responseGroupNew(set, get, group) {
  const groupList = [group, ...get().groupList];
  set({ groupList });
}

function responseGroupJoin(set, get, payload) {
  const groupId = payload && (payload.groupId || payload.id);
  if (groupId) {
    set({ groupCurrentId: groupId });
    if (typeof get().fetchGroupMessages === "function") {
      get().fetchGroupMessages(groupId, 0);
    } else if (typeof get().groupMessageList === "function") {
      get().groupMessageList(groupId, 0);
    }
  }
}

function responseGroupMessageList(set, get, data) {
  const { groupId, messages = [], next = null } = data || {};
  const gm = { ...(get().groupMessages || {}) };
  gm[groupId] = {
    messages: [...(gm[groupId]?.messages || []), ...messages],
    next: next,
  };
  set({ groupMessages: gm });
}

function responseGroupMessageSend(set, get, data) {
  const { groupId, message } = data || {};
  if (!groupId || !message) return;
  const gm = { ...(get().groupMessages || {}) };
  const existing = (gm[groupId]?.messages || []).filter(
    (m) => m.clientTempId !== message.clientTempId
  );
  gm[groupId] = {
    messages: [message, ...existing],
    next: gm[groupId]?.next || null,
  };
  set({ groupMessages: gm });
}
