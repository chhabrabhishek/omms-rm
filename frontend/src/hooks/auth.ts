import { api } from "@/api"
import { useAppMutation } from "./useAppMutation"
import { LoginResponse } from "@/api/definitions"
import { create } from "zustand"
import { useEffect } from "react"

interface AuthStore {
  auth?: Auth | null

  load: () => void
  save: (auth: LoginResponse | null) => void
  reset: () => void
}

type Auth = LoginResponse

// Global auth store.
export const useAuthStore = create<AuthStore>((set, get) => ({
  auth: undefined,

  load() {
    const json = localStorage.getItem("$auth") || "null"
    const auth = JSON.parse(json)
    set({ auth })
  },

  save(auth: Auth | null) {
    const json = JSON.stringify(auth)
    localStorage.setItem("$auth", json ?? null)
    set({ auth })
  },

  reset() {
    get().save(null)
  },
}))

export function useAuthInit() {
  // Load up auth.
  const load = useAuthStore((state) => {
    return state.load
  })

  useEffect(() => {
    load()
  }, [load])
}

export const useLogout = () => {
  const reset = useAuthStore((store) => {
    return store.reset
  })

  const logout = useAppMutation(api.mutations.useAccountsApiLogout, {
    onSettled() {
      reset()
    },
  })

  return {
    logout,
  }
}
