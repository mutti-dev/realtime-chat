import { create } from "zustand";
import { createAuthSlice } from "./authSlice";
import { createSocketSlice } from "./socketSlice";
import { createMessageSlice } from "./messageSlice";
import { createGroupSlice } from "./groupSlice";
import { createRequestSlice } from "./requestSlice";
import { createUserSlice } from "./userSlice";
import { createAISlice } from "./aiSlice";

const useGlobal = create((set, get) => ({
  ...createAuthSlice(set, get),
  ...createUserSlice(set, get),
  ...createSocketSlice(set, get),
  ...createMessageSlice(set, get),
  ...createGroupSlice(set, get),
  ...createRequestSlice(set, get),
  ...createAISlice(set, get),
}));

export default useGlobal;
