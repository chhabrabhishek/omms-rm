import { Response } from "@/types/Response"
import * as failures from "@/utils/failures"
import { QueryKey, UseQueryOptions, UseQueryResult } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { useRouter } from "next/router"
import { useState } from "react"
import { toast } from "react-hot-toast"
import { useCurrentAccessStore } from "./useCurrentAccess"
import { useAuthStore } from "./auth"
import { Access } from "@/types/Page"
import { reverse } from "@/utils/reverse"
import { AccountType } from "@/types/enum"

export type AppOptions<R extends Response, E> = {
  onOk?: (result: R) => void
  onNotOk?: (result: R) => void
  onError?: (error: E) => void
  messages?: Record<string | number, string> & {
    ok?: string
  }
  magic?: {
    toast?: boolean
    redirect?: boolean
  }
  autoRefetch?: boolean
}

export type QueryOptions<A, E, R extends Response, Q extends QueryKey> = Omit<
  UseQueryOptions<A, E, R, Q>,
  "queryKey" | "queryFn"
>

// Query that automatically shows a toast with an error in case of a hard
// failure or exposes a failure message and calls a not ok callback in case of
// a soft failure.
export function useAppQuery<A, E, R extends Response, Q extends QueryKey>(
  useQuery: (options?: QueryOptions<A, E, R, Q> | undefined) => UseQueryResult<R, E>,
  options?: QueryOptions<A, E, R, Q> & AppOptions<R, E>
) {
  const { failureMessage, hooks } = useMagicQueryHooks(options)

  const query = useQuery({
    ...options,
    ...hooks,
    ...(options?.autoRefetch === false && {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchIntervalInBackground: false,
      refetchInterval: false,
      refetchOnMount: false,
      retry: false,
      staleTime: 1000 * 60,
    }),
  })

  return {
    ...query,
    failureMessage,
  }
}

export function useMagicQueryHooks<R extends Response, E>(options?: AppOptions<R, E>) {
  const { replace } = useRouter()

  const [failureMessage, setFailureMessage] = useState<string | null>()

  return {
    hooks: {
      onSuccess: (data: R) => {
        if (data.ok) {
          if (options?.messages?.ok) {
            toast.success(options.messages.ok)
          }
          options?.onOk?.(data)
        } else {
          if (options?.messages) {
            setFailureMessage(
              failures.makeMessage({
                data,
                messages: options.messages,
              })
            )
          }
          options?.onNotOk?.(data)
        }
      },
      onError: (error: E) => {
        if (options?.onError) {
          options.onError?.(error)
        } else if (error instanceof AxiosError) {
          if (options?.magic?.toast ?? true) {
            failures.autoToast({
              error,
              messages: options?.messages,
            })
          }

          if (options?.magic?.redirect ?? true) {
            // Determine if the failure is because of an auth issue.
            const reason = failures.extractReason({
              error,
              data: error.response?.data,
            })

            const isAuthStatusIssue = error.status === 401
            const isAuthReasonIssue = reason?.toString()?.startsWith("auth_")
            const isAuthIssue = isAuthStatusIssue || isAuthReasonIssue

            // If it is, then force the user to log back in.
            if (isAuthIssue) {
              // We do not need to reactively listen to these slices of state because
              // the useAppQuery hook will be used too frequently while the following
              // dependencies are a minor quality of life improvements at best.
              const access = useCurrentAccessStore.getState().access
              const reset = useAuthStore.getState().reset

              if (access === Access.User) {
                reset()
                replace(reverse.roles.login(AccountType.User))
              }
            }
          }
        }
      },
    },
    failureMessage,
  }
}
