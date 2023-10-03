import axios from "axios"
import { initialize } from "./definitions"
import { useCurrentAccessStore } from "@/hooks/useCurrentAccess"
import { useAuthStore } from "@/hooks/auth"
import { Access } from "@/types/Page"

export const ax = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API,
})

// If an auth token is available, apply it to the request.
ax.interceptors.request.use((config) => {
  let token: string | null = null
  const access = useCurrentAccessStore.getState().access

  if (access) {
    if (access === Access.User) {
      token = useAuthStore.getState().auth?.token ?? null
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export const api = initialize(ax)
