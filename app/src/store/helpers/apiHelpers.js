import secure from "../../core/secure";
import api, { ADDRESS } from "../../core/api";
import { Platform } from "react-native";
import * as mime from "mime";
import utils from "../../core/utils";

export async function uploadThumbnailREST(file) {
  try {
    const tokens = await secure.get("tokens");
    const authHeaders = tokens
      ? {
          Authorization: `Bearer ${tokens.access}`,
          Accept: "application/json",
        }
      : { Accept: "application/json" };

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

    const baseURL =
      api && api.defaults && api.defaults.baseURL
        ? api.defaults.baseURL
        : `http://${ADDRESS}`;
    let url = baseURL.replace(/\/$/, "") + "/chat/profile/";
    if (Platform.OS === "android") {
      url = url
        .replace("http://localhost", "http://10.0.2.2")
        .replace("http://127.0.0.1", "http://10.0.2.2");
    }

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        ...authHeaders,
      },
      body: form,
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => null);
      const err = new Error(
        `upload failed: ${resp.status} ${resp.statusText} ${text || ""}`
      );
      utils.log("uploadThumbnail fetch response error", err);
      throw err;
    }

    const data = await resp.json().catch(() => null);
    return data;
  } catch (err) {
    utils.log("uploadThumbnail error", err);
    throw err;
  }
}

export async function uploadFileREST({ file, connectionId, text }) {
  if (!file) throw new Error("File is required");

  try {
    const tokens = await secure.get("tokens");
    const headers = tokens
      ? { Authorization: `Bearer ${tokens.access}` }
      : {};

    const filename = file.fileName || file.name || file.uri.split("/").pop();
    const fileType =
      file.type ||
      (filename.includes(".")
        ? mime.getType(filename)
        : "application/octet-stream");

    const form = new FormData();
    form.append("file", { uri: file.uri, name: filename, type: fileType });
    if (connectionId) form.append("connectionId", String(connectionId));
    if (text) form.append("text", String(text));

    let url = `${api?.defaults?.baseURL || `http://${ADDRESS}`}/chat/upload/`;
    if (Platform.OS === "android") {
      url = url
        .replace("http://localhost", "http://10.0.2.2")
        .replace("http://127.0.0.1", "http://10.0.2.2");
    }

    utils.log("uploadFileREST: uploading", { filename, url, connectionId });
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: form,
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(
        `Upload failed: ${resp.status} ${resp.statusText} ${text}`
      );
    }

    const json = await resp.json();
    utils.log("uploadFileREST: server response", json);
    return json;
  } catch (err) {
    utils.log("sendFile error:", err);
    throw err;
  }
}
