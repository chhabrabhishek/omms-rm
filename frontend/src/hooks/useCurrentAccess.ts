import { Access } from "@/types/Page";
import { create } from "zustand";

interface CurrentAccessStore {
  access?: Access | null;
  set: (access?: Access | null) => void;
}

// Keep track of the access restriction on the current page.
// Primarily useful to help code that lives outside the react tree to react
// with the expected permissions.
export const useCurrentAccessStore = create<CurrentAccessStore>((set) => ({
  access: null,

  set(access) {
    set({ access });
  },
}));
