import { Access, AppPageComponent } from "@/types/Page"
import { useRouter } from "next/router"
import { useAuthStore } from "./auth"
import { useEffect, useMemo } from "react"
import { toast } from "react-hot-toast"
import { failureMessages } from "@/utils/failures"
import { reverse } from "@/utils/reverse"
import { useCurrentAccessStore } from "./useCurrentAccess"
import { AccountType } from "@/types/enum"

export function useAuthGuard(options: { component: AppPageComponent }) {
  const { replace } = useRouter()

  const access = useMemo(() => {
    return options.component.access ?? Access.Public
  }, [options.component])

  // Save the current access to the global store so it can be
  // consumed elsewhere.
  const setCurrentAccess = useCurrentAccessStore((state) => {
    return state.set
  })

  useEffect(() => {
    setCurrentAccess(access)
  }, [access, setCurrentAccess])

  const auth = useAuthStore((state) => {
    return state.auth
  })

  // Check if the current state of the auth satisfies the access.
  const guardage = useMemo(() => {
    if (access === Access.Public) {
      return null
    }

    // TODO: How do we make this work for no_auth_only?
    if (access === Access.NoAuthOnly) {
      return auth
        ? // TODO: The side effect here is a bit too connected to the auth flow.
          // It should instead be netural.
          "go_home_instead"
        : null
    }

    if (access === Access.User) {
      switch (auth) {
        case undefined:
          return "auth_not_loaded"

        case null:
          return "auth_unavailable"

        default:
          return null
      }
    }
  }, [access, auth])

  // Act upon the side effects of the guardage.
  useEffect(() => {
    switch (guardage) {
      case "go_home_instead":
        // TODO: go_home_instead only works with auth at the moment.
        replace(reverse.user.releases())
        break

      // If auth is unavailable, redirect away to the login page.
      case "auth_unavailable":
        replace(reverse.user.login())
        // TODO: This should not be called during logout.
        toast.error(failureMessages.page_auth_unavailable)
        break
    }
  }, [access, guardage, replace])

  return {
    guardage: guardage as typeof guardage,
  }
}
