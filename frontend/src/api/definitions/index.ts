import type { AxiosInstance, AxiosRequestConfig } from "axios"
import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
  type MutationFunction,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query"
export type Error = {
  reason: string
  detail?: string
}
export type SimpleRolesSchema = {
  role: number
}
export type LoginResponse = {
  token: string
  valid_until: number
  first_name: string
  last_name: string
  email: string
  roles: SimpleRolesSchema[]
}
export type LoginStructuredResponse = {
  ok: boolean
  error?: Error
  result?: LoginResponse
}
export type LoginRequest = {
  email: string
  password: string
}
export type CreateAccountResponse = {}
export type CreateAccountStructuredResponse = {
  ok: boolean
  error?: Error
  result?: CreateAccountResponse
}
export type CreateAccountRequest = {
  first_name: string
  last_name: string
  email: string
  password: string
}
export type SimplePendingRolesSchema = {
  requested_role: number
  account: number
}
export type MeResponse = {
  first_name: string
  last_name: string
  roles: SimpleRolesSchema[]
  requested_roles: SimplePendingRolesSchema[]
  email: string
  msid: string
  team_name: string
}
export type MeStructuredResponse = {
  ok: boolean
  error?: Error
  result?: MeResponse
}
export type SimplePendingResponseSchema = {
  role: number
  account: string
}
export type PendingResponse = {
  requested_roles: SimplePendingResponseSchema[]
}
export type PendingStructuredResponse = {
  ok: boolean
  error?: Error
  result?: PendingResponse
}
export type AckResponse = {}
export type AckStructuredResponse = {
  ok: boolean
  error?: Error
  result?: AckResponse
}
export type UpdateAccountRequest = {
  first_name: string
  last_name: string
  msid: string
  team_name: string
}
export type ManageApprovalRequest = {
  role: number
  account: string
  status: boolean
}
export type LogoutResponse = {}
export type LogoutStructuredResponse = {
  ok: boolean
  error?: Error
  result?: LogoutResponse
}
export type PingResponse = {
  time: number
}
export type PingStructuredResponse = {
  ok: boolean
  error?: Error
  result?: PingResponse
}
export type CreateTicketResponse = {
  uuid?: string
}
export type CreateTicketStructuredResponse = {
  ok: boolean
  error?: Error
  result?: CreateTicketResponse
}
export type CreateTicketRequest = {
  impact: number
  priority: number
  name: string
  assigned_to: string
  description?: string
}
export type SimpleAccountSchema = {
  first_name: string
  last_name: string
  email: string
}
export type SimpleTicketSchema = {
  impact: number
  priority: number
  opened_by: SimpleAccountSchema
  created_at: string
  uuid?: string
  name: string
  assigned_to: string
  description?: string
}
export type AllTicketsResponse = {
  tickets: SimpleTicketSchema[]
}
export type AllTicketsStructuredResponse = {
  ok: boolean
  error?: Error
  result?: AllTicketsResponse
}
export type SimpleConstantSchema = {
  repo: string
  service: string
  name: string
}
export type ConstantResponse = {
  constants: SimpleConstantSchema[]
}
export type ConstantStructuredResponse = {
  ok: boolean
  error?: Error
  result?: ConstantResponse
}
export type SimpleUserSchema = {
  first_name: string
  last_name: string
  email: string
}
export type SimpleReleaseItemModelSchema = {
  repo: string
  service: string
  release_branch?: string
  feature_number?: string
  tag?: string
  special_notes?: string
  devops_notes?: string
}
export type SimpleAllConstantReleaseModelSchema = {
  items: SimpleReleaseItemModelSchema[]
  uuid?: string
  name: string
}
export type ConstantUserResponse = {
  constants: SimpleConstantSchema[]
  users: SimpleUserSchema[]
  release_list: SimpleAllConstantReleaseModelSchema[]
}
export type ConstantUserStructuredResponse = {
  ok: boolean
  error?: Error
  result?: ConstantUserResponse
}
export type SimpleTalendReleaseItemModelSchema = {
  job_name: string
  package_location: string
  feature_number?: string
  special_notes?: string
}
export type SimpleReleaseModelSchema = {
  items: SimpleReleaseItemModelSchema[]
  talend_items: SimpleTalendReleaseItemModelSchema[]
  name: string
  start_window?: string
  end_window?: string
}
export type CreateReleaseRequest = {
  release: SimpleReleaseModelSchema
  approvers: number[]
  targets: string[]
}
export type SimpleUpdateReleaseModelSchema = {
  items: SimpleReleaseItemModelSchema[]
  talend_items: SimpleTalendReleaseItemModelSchema[]
  deployment_status: number
  name: string
  start_window?: string
  end_window?: string
  deployment_comment?: string
}
export type UpdateReleaseRequest = {
  release: SimpleUpdateReleaseModelSchema
  targets: string[]
  uuid: string
}
export type DeleteReleaseRequest = {
  uuid: string
}
export type SimpleApproverModelSchema = {
  group: number
  approved?: boolean
}
export type SimpleTargetModelSchema = {
  target: string
}
export type SimpleAllReleaseModelSchema = {
  approvers: SimpleApproverModelSchema[]
  created_by: SimpleUserSchema
  updated_by: SimpleUserSchema
  targets: SimpleTargetModelSchema[]
  deployment_status: number
  created_at: string
  updated_at: string
  uuid?: string
  name: string
  start_window?: string
  end_window?: string
  deployment_comment?: string
}
export type AllReleaseResponse = {
  release_list: SimpleAllReleaseModelSchema[]
}
export type AllReleaseStructuredResponse = {
  ok: boolean
  error?: Error
  result?: AllReleaseResponse
}
export type SimpleGetReleaseModelSchema = {
  items: SimpleReleaseItemModelSchema[]
  talend_items: SimpleTalendReleaseItemModelSchema[]
  approvers: SimpleApproverModelSchema[]
  targets: SimpleTargetModelSchema[]
  deployment_status: number
  name: string
  start_window?: string
  end_window?: string
  deployment_comment?: string
}
export type GetReleaseResponse = {
  release_data: SimpleGetReleaseModelSchema
  constants: SimpleConstantSchema[]
}
export type GetReleaseStructuredResponse = {
  ok: boolean
  error?: Error
  result?: GetReleaseResponse
}
export type SimpleGetDeploymentSnapshotSchema = {
  azure_repo: string
  commit_hash: string
  deployed_by: string
  deployment_date: string
  docker_tag: string
  repo_name: string
  target_env: string
  tenant_id: string
}
export type GetDeploymentSnapshotResponse = {
  snapshot_data: SimpleGetDeploymentSnapshotSchema[]
}
export type GetDeploymentSnapshotStructuredResponse = {
  ok: boolean
  error?: Error
  result?: GetDeploymentSnapshotResponse
}
export type DeleteSnapshotRequest = {
  docker_tag: string
}
export type AxiosConfig = {
  paramsSerializer?: AxiosRequestConfig["paramsSerializer"]
}
export type Config = {
  mutations?: MutationConfigs
  axios?: AxiosConfig
}
export function initialize(axios: AxiosInstance, config?: Config) {
  const requests = makeRequests(axios, config?.axios)
  return {
    requests,
    queries: makeQueries(requests),
    mutations: makeMutations(requests, config?.mutations),
  }
}
function useRapiniMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
>(
  mutationFn: MutationFunction<TData, TVariables>,
  config?: (
    queryClient: QueryClient
  ) => Pick<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    "onSuccess" | "onSettled" | "onError"
  >,
  options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, "mutationFn">
): UseMutationResult<TData, TError, TVariables, TContext> {
  const { onSuccess, onError, onSettled, ...rest } = options ?? {}
  const queryClient = useQueryClient()
  const conf = config?.(queryClient)
  const mutationOptions: typeof options = {
    onSuccess: (data: TData, variables: TVariables, context?: TContext) => {
      conf?.onSuccess?.(data, variables, context)
      onSuccess?.(data, variables, context)
    },
    onError: (error: TError, variables: TVariables, context?: TContext) => {
      conf?.onError?.(error, variables, context)
      onError?.(error, variables, context)
    },
    onSettled: (
      data: TData | undefined,
      error: TError | null,
      variables: TVariables,
      context?: TContext
    ) => {
      conf?.onSettled?.(data, error, variables, context)
      onSettled?.(data, error, variables, context)
    },
    ...rest,
  }
  return useMutation({ mutationFn, ...mutationOptions })
}
function nullIfUndefined<T>(value: T): NonNullable<T> | null {
  return typeof value === "undefined" ? null : (value as NonNullable<T> | null)
}
export const queryKeys = {
  accountsApiMe: () => ["accountsApiMe"] as const,
  accountsApiAllPending: () => ["accountsApiAllPending"] as const,
  appApiPublicPingDetails: () => ["appApiPublicPingDetails"] as const,
  appApiPrivatePingDetails: () => ["appApiPrivatePingDetails"] as const,
  ticketsApiGetAllTickets: () => ["ticketsApiGetAllTickets"] as const,
  releasesApiGetConstantAndUsers: () => ["releasesApiGetConstantAndUsers"] as const,
  releasesApiGetAllReleases: () => ["releasesApiGetAllReleases"] as const,
  releasesApiGetReleaseWithUuid: (uuid: string) => ["releasesApiGetReleaseWithUuid", uuid] as const,
  releasesApiDeploymentSnapshot: () => ["releasesApiDeploymentSnapshot"] as const,
} as const
export type QueryKeys = typeof queryKeys
function makeRequests(axios: AxiosInstance, config?: AxiosConfig) {
  return {
    accountsApiLogin: (payload: LoginRequest) =>
      axios
        .request<LoginStructuredResponse>({
          method: "post",
          url: `/api/accounts/login`,
          data: payload,
        })
        .then((res) => res.data),
    accountsApiCreateAccount: (payload: CreateAccountRequest) =>
      axios
        .request<CreateAccountStructuredResponse>({
          method: "post",
          url: `/api/accounts/create`,
          data: payload,
        })
        .then((res) => res.data),
    accountsApiMe: () =>
      axios
        .request<MeStructuredResponse>({
          method: "get",
          url: `/api/accounts/me`,
        })
        .then((res) => res.data),
    accountsApiAllPending: () =>
      axios
        .request<PendingStructuredResponse>({
          method: "get",
          url: `/api/accounts/pending`,
        })
        .then((res) => res.data),
    accountsApiUpdateAccount: (payload: { form: UpdateAccountRequest; roles: number[] }) =>
      axios
        .request<AckStructuredResponse>({
          method: "post",
          url: `/api/accounts/update`,
          data: payload,
        })
        .then((res) => res.data),
    accountsApiManageApproval: (payload: ManageApprovalRequest) =>
      axios
        .request<AckStructuredResponse>({
          method: "post",
          url: `/api/accounts/manage_approval`,
          data: payload,
        })
        .then((res) => res.data),
    accountsApiLogout: () =>
      axios
        .request<LogoutStructuredResponse>({
          method: "post",
          url: `/api/accounts/logout`,
        })
        .then((res) => res.data),
    appApiPublicPingDetails: () =>
      axios
        .request<PingStructuredResponse>({
          method: "get",
          url: `/api/general/ping/public`,
        })
        .then((res) => res.data),
    appApiPrivatePingDetails: () =>
      axios
        .request<PingStructuredResponse>({
          method: "get",
          url: `/api/general/ping/private`,
        })
        .then((res) => res.data),
    ticketsApiCreateTicket: (payload: CreateTicketRequest) =>
      axios
        .request<CreateTicketStructuredResponse>({
          method: "post",
          url: `/api/tickets/create`,
          data: payload,
        })
        .then((res) => res.data),
    ticketsApiGetAllTickets: () =>
      axios
        .request<AllTicketsStructuredResponse>({
          method: "get",
          url: `/api/tickets/all`,
        })
        .then((res) => res.data),
    releasesApiGetConstantAndUsers: () =>
      axios
        .request<ConstantUserStructuredResponse>({
          method: "get",
          url: `/api/releases/constant`,
        })
        .then((res) => res.data),
    releasesApiPostConstant: (payload: string[]) =>
      axios
        .request<ConstantStructuredResponse>({
          method: "post",
          url: `/api/releases/constant`,
          data: payload,
        })
        .then((res) => res.data),
    releasesApiCreateRelease: (payload: CreateReleaseRequest) =>
      axios
        .request<AckStructuredResponse>({
          method: "post",
          url: `/api/releases/create`,
          data: payload,
        })
        .then((res) => res.data),
    releasesApiUpdateRelease: (payload: UpdateReleaseRequest) =>
      axios
        .request<AckStructuredResponse>({
          method: "post",
          url: `/api/releases/update`,
          data: payload,
        })
        .then((res) => res.data),
    releasesApiDeleteRelease: (payload: DeleteReleaseRequest) =>
      axios
        .request<AckStructuredResponse>({
          method: "post",
          url: `/api/releases/delete`,
          data: payload,
        })
        .then((res) => res.data),
    releasesApiGetAllReleases: () =>
      axios
        .request<AllReleaseStructuredResponse>({
          method: "get",
          url: `/api/releases/all`,
        })
        .then((res) => res.data),
    releasesApiGetReleaseWithUuid: (uuid: string) =>
      axios
        .request<GetReleaseStructuredResponse>({
          method: "get",
          url: `/api/releases/release`,
          params: {
            uuid,
          },
          paramsSerializer: config?.paramsSerializer,
        })
        .then((res) => res.data),
    releasesApiApproveRelease: (uuid: string) =>
      axios
        .request<AckStructuredResponse>({
          method: "post",
          url: `/api/releases/approve`,
          params: {
            uuid,
          },
          paramsSerializer: config?.paramsSerializer,
        })
        .then((res) => res.data),
    releasesApiDeletePendingReleaseItems: (uuid: string) =>
      axios
        .request<AckStructuredResponse>({
          method: "post",
          url: `/api/releases/deleteReleaseItems`,
          params: {
            uuid,
          },
          paramsSerializer: config?.paramsSerializer,
        })
        .then((res) => res.data),
    releasesApiRevokeApproval: (uuid: string, reason: string) =>
      axios
        .request<AckStructuredResponse>({
          method: "post",
          url: `/api/releases/revoke`,
          params: {
            uuid,
            reason,
          },
          paramsSerializer: config?.paramsSerializer,
        })
        .then((res) => res.data),
    releasesApiDeploymentSnapshot: () =>
      axios
        .request<GetDeploymentSnapshotStructuredResponse>({
          method: "get",
          url: `/api/releases/snapshots`,
        })
        .then((res) => res.data),
    releasesApiDeleteSnapshot: (payload: DeleteSnapshotRequest) =>
      axios
        .request<AckStructuredResponse>({
          method: "post",
          url: `/api/releases/delete-snapshot`,
          data: payload,
        })
        .then((res) => res.data),
  } as const
}
export type Requests = ReturnType<typeof makeRequests>
export type Response<T extends keyof Requests> = Awaited<ReturnType<Requests[T]>>
function makeQueries(requests: Requests) {
  return {
    useAccountsApiMe: (
      options?: Omit<
        UseQueryOptions<
          Response<"accountsApiMe">,
          unknown,
          Response<"accountsApiMe">,
          ReturnType<QueryKeys["accountsApiMe"]>
        >,
        "queryKey" | "queryFn"
      >
    ): UseQueryResult<Response<"accountsApiMe">, unknown> =>
      useQuery({
        queryKey: queryKeys.accountsApiMe(),
        queryFn: () => requests.accountsApiMe(),
        ...options,
      }),
    useAccountsApiAllPending: (
      options?: Omit<
        UseQueryOptions<
          Response<"accountsApiAllPending">,
          unknown,
          Response<"accountsApiAllPending">,
          ReturnType<QueryKeys["accountsApiAllPending"]>
        >,
        "queryKey" | "queryFn"
      >
    ): UseQueryResult<Response<"accountsApiAllPending">, unknown> =>
      useQuery({
        queryKey: queryKeys.accountsApiAllPending(),
        queryFn: () => requests.accountsApiAllPending(),
        ...options,
      }),
    useAppApiPublicPingDetails: (
      options?: Omit<
        UseQueryOptions<
          Response<"appApiPublicPingDetails">,
          unknown,
          Response<"appApiPublicPingDetails">,
          ReturnType<QueryKeys["appApiPublicPingDetails"]>
        >,
        "queryKey" | "queryFn"
      >
    ): UseQueryResult<Response<"appApiPublicPingDetails">, unknown> =>
      useQuery({
        queryKey: queryKeys.appApiPublicPingDetails(),
        queryFn: () => requests.appApiPublicPingDetails(),
        ...options,
      }),
    useAppApiPrivatePingDetails: (
      options?: Omit<
        UseQueryOptions<
          Response<"appApiPrivatePingDetails">,
          unknown,
          Response<"appApiPrivatePingDetails">,
          ReturnType<QueryKeys["appApiPrivatePingDetails"]>
        >,
        "queryKey" | "queryFn"
      >
    ): UseQueryResult<Response<"appApiPrivatePingDetails">, unknown> =>
      useQuery({
        queryKey: queryKeys.appApiPrivatePingDetails(),
        queryFn: () => requests.appApiPrivatePingDetails(),
        ...options,
      }),
    useTicketsApiGetAllTickets: (
      options?: Omit<
        UseQueryOptions<
          Response<"ticketsApiGetAllTickets">,
          unknown,
          Response<"ticketsApiGetAllTickets">,
          ReturnType<QueryKeys["ticketsApiGetAllTickets"]>
        >,
        "queryKey" | "queryFn"
      >
    ): UseQueryResult<Response<"ticketsApiGetAllTickets">, unknown> =>
      useQuery({
        queryKey: queryKeys.ticketsApiGetAllTickets(),
        queryFn: () => requests.ticketsApiGetAllTickets(),
        ...options,
      }),
    useReleasesApiGetConstantAndUsers: (
      options?: Omit<
        UseQueryOptions<
          Response<"releasesApiGetConstantAndUsers">,
          unknown,
          Response<"releasesApiGetConstantAndUsers">,
          ReturnType<QueryKeys["releasesApiGetConstantAndUsers"]>
        >,
        "queryKey" | "queryFn"
      >
    ): UseQueryResult<Response<"releasesApiGetConstantAndUsers">, unknown> =>
      useQuery({
        queryKey: queryKeys.releasesApiGetConstantAndUsers(),
        queryFn: () => requests.releasesApiGetConstantAndUsers(),
        ...options,
      }),
    useReleasesApiGetAllReleases: (
      options?: Omit<
        UseQueryOptions<
          Response<"releasesApiGetAllReleases">,
          unknown,
          Response<"releasesApiGetAllReleases">,
          ReturnType<QueryKeys["releasesApiGetAllReleases"]>
        >,
        "queryKey" | "queryFn"
      >
    ): UseQueryResult<Response<"releasesApiGetAllReleases">, unknown> =>
      useQuery({
        queryKey: queryKeys.releasesApiGetAllReleases(),
        queryFn: () => requests.releasesApiGetAllReleases(),
        ...options,
      }),
    useReleasesApiGetReleaseWithUuid: (
      uuid: string,
      options?: Omit<
        UseQueryOptions<
          Response<"releasesApiGetReleaseWithUuid">,
          unknown,
          Response<"releasesApiGetReleaseWithUuid">,
          ReturnType<QueryKeys["releasesApiGetReleaseWithUuid"]>
        >,
        "queryKey" | "queryFn"
      >
    ): UseQueryResult<Response<"releasesApiGetReleaseWithUuid">, unknown> =>
      useQuery({
        queryKey: queryKeys.releasesApiGetReleaseWithUuid(uuid),
        queryFn: () => requests.releasesApiGetReleaseWithUuid(uuid),
        ...options,
      }),
    useReleasesApiDeploymentSnapshot: (
      options?: Omit<
        UseQueryOptions<
          Response<"releasesApiDeploymentSnapshot">,
          unknown,
          Response<"releasesApiDeploymentSnapshot">,
          ReturnType<QueryKeys["releasesApiDeploymentSnapshot"]>
        >,
        "queryKey" | "queryFn"
      >
    ): UseQueryResult<Response<"releasesApiDeploymentSnapshot">, unknown> =>
      useQuery({
        queryKey: queryKeys.releasesApiDeploymentSnapshot(),
        queryFn: () => requests.releasesApiDeploymentSnapshot(),
        ...options,
      }),
  } as const
}
type MutationConfigs = {
  useAccountsApiLogin?: (
    queryClient: QueryClient
  ) => Pick<
    UseMutationOptions<
      Response<"accountsApiLogin">,
      unknown,
      Parameters<Requests["accountsApiLogin"]>[0],
      unknown
    >,
    "onSuccess" | "onSettled" | "onError"
  >
  useAccountsApiCreateAccount?: (
    queryClient: QueryClient
  ) => Pick<
    UseMutationOptions<
      Response<"accountsApiCreateAccount">,
      unknown,
      Parameters<Requests["accountsApiCreateAccount"]>[0],
      unknown
    >,
    "onSuccess" | "onSettled" | "onError"
  >
  useAccountsApiUpdateAccount?: (
    queryClient: QueryClient
  ) => Pick<
    UseMutationOptions<
      Response<"accountsApiUpdateAccount">,
      unknown,
      Parameters<Requests["accountsApiUpdateAccount"]>[0],
      unknown
    >,
    "onSuccess" | "onSettled" | "onError"
  >
  useAccountsApiManageApproval?: (
    queryClient: QueryClient
  ) => Pick<
    UseMutationOptions<
      Response<"accountsApiManageApproval">,
      unknown,
      Parameters<Requests["accountsApiManageApproval"]>[0],
      unknown
    >,
    "onSuccess" | "onSettled" | "onError"
  >
  useAccountsApiLogout?: (
    queryClient: QueryClient
  ) => Pick<
    UseMutationOptions<Response<"accountsApiLogout">, unknown, unknown, unknown>,
    "onSuccess" | "onSettled" | "onError"
  >
  useTicketsApiCreateTicket?: (
    queryClient: QueryClient
  ) => Pick<
    UseMutationOptions<
      Response<"ticketsApiCreateTicket">,
      unknown,
      Parameters<Requests["ticketsApiCreateTicket"]>[0],
      unknown
    >,
    "onSuccess" | "onSettled" | "onError"
  >
  useReleasesApiPostConstant?: (
    queryClient: QueryClient
  ) => Pick<
    UseMutationOptions<
      Response<"releasesApiPostConstant">,
      unknown,
      Parameters<Requests["releasesApiPostConstant"]>[0],
      unknown
    >,
    "onSuccess" | "onSettled" | "onError"
  >
  useReleasesApiCreateRelease?: (
    queryClient: QueryClient
  ) => Pick<
    UseMutationOptions<
      Response<"releasesApiCreateRelease">,
      unknown,
      Parameters<Requests["releasesApiCreateRelease"]>[0],
      unknown
    >,
    "onSuccess" | "onSettled" | "onError"
  >
  useReleasesApiUpdateRelease?: (
    queryClient: QueryClient
  ) => Pick<
    UseMutationOptions<
      Response<"releasesApiUpdateRelease">,
      unknown,
      Parameters<Requests["releasesApiUpdateRelease"]>[0],
      unknown
    >,
    "onSuccess" | "onSettled" | "onError"
  >
  useReleasesApiDeleteRelease?: (
    queryClient: QueryClient
  ) => Pick<
    UseMutationOptions<
      Response<"releasesApiDeleteRelease">,
      unknown,
      Parameters<Requests["releasesApiDeleteRelease"]>[0],
      unknown
    >,
    "onSuccess" | "onSettled" | "onError"
  >
  useReleasesApiApproveRelease?: (
    queryClient: QueryClient
  ) => Pick<
    UseMutationOptions<Response<"releasesApiApproveRelease">, unknown, unknown, unknown>,
    "onSuccess" | "onSettled" | "onError"
  >
  useReleasesApiDeletePendingReleaseItems?: (
    queryClient: QueryClient
  ) => Pick<
    UseMutationOptions<Response<"releasesApiDeletePendingReleaseItems">, unknown, unknown, unknown>,
    "onSuccess" | "onSettled" | "onError"
  >
  useReleasesApiRevokeApproval?: (
    queryClient: QueryClient
  ) => Pick<
    UseMutationOptions<Response<"releasesApiRevokeApproval">, unknown, unknown, unknown>,
    "onSuccess" | "onSettled" | "onError"
  >
  useReleasesApiDeleteSnapshot?: (
    queryClient: QueryClient
  ) => Pick<
    UseMutationOptions<
      Response<"releasesApiDeleteSnapshot">,
      unknown,
      Parameters<Requests["releasesApiDeleteSnapshot"]>[0],
      unknown
    >,
    "onSuccess" | "onSettled" | "onError"
  >
}
function makeMutations(requests: Requests, config?: Config["mutations"]) {
  return {
    useAccountsApiLogin: (
      options?: Omit<
        UseMutationOptions<
          Response<"accountsApiLogin">,
          unknown,
          Parameters<Requests["accountsApiLogin"]>[0],
          unknown
        >,
        "mutationFn"
      >
    ) =>
      useRapiniMutation<
        Response<"accountsApiLogin">,
        unknown,
        Parameters<Requests["accountsApiLogin"]>[0]
      >((payload) => requests.accountsApiLogin(payload), config?.useAccountsApiLogin, options),
    useAccountsApiCreateAccount: (
      options?: Omit<
        UseMutationOptions<
          Response<"accountsApiCreateAccount">,
          unknown,
          Parameters<Requests["accountsApiCreateAccount"]>[0],
          unknown
        >,
        "mutationFn"
      >
    ) =>
      useRapiniMutation<
        Response<"accountsApiCreateAccount">,
        unknown,
        Parameters<Requests["accountsApiCreateAccount"]>[0]
      >(
        (payload) => requests.accountsApiCreateAccount(payload),
        config?.useAccountsApiCreateAccount,
        options
      ),
    useAccountsApiUpdateAccount: (
      options?: Omit<
        UseMutationOptions<
          Response<"accountsApiUpdateAccount">,
          unknown,
          Parameters<Requests["accountsApiUpdateAccount"]>[0],
          unknown
        >,
        "mutationFn"
      >
    ) =>
      useRapiniMutation<
        Response<"accountsApiUpdateAccount">,
        unknown,
        Parameters<Requests["accountsApiUpdateAccount"]>[0]
      >(
        (payload) => requests.accountsApiUpdateAccount(payload),
        config?.useAccountsApiUpdateAccount,
        options
      ),
    useAccountsApiManageApproval: (
      options?: Omit<
        UseMutationOptions<
          Response<"accountsApiManageApproval">,
          unknown,
          Parameters<Requests["accountsApiManageApproval"]>[0],
          unknown
        >,
        "mutationFn"
      >
    ) =>
      useRapiniMutation<
        Response<"accountsApiManageApproval">,
        unknown,
        Parameters<Requests["accountsApiManageApproval"]>[0]
      >(
        (payload) => requests.accountsApiManageApproval(payload),
        config?.useAccountsApiManageApproval,
        options
      ),
    useAccountsApiLogout: (
      options?: Omit<
        UseMutationOptions<Response<"accountsApiLogout">, unknown, unknown, unknown>,
        "mutationFn"
      >
    ) =>
      useRapiniMutation<Response<"accountsApiLogout">, unknown, unknown>(
        () => requests.accountsApiLogout(),
        config?.useAccountsApiLogout,
        options
      ),
    useTicketsApiCreateTicket: (
      options?: Omit<
        UseMutationOptions<
          Response<"ticketsApiCreateTicket">,
          unknown,
          Parameters<Requests["ticketsApiCreateTicket"]>[0],
          unknown
        >,
        "mutationFn"
      >
    ) =>
      useRapiniMutation<
        Response<"ticketsApiCreateTicket">,
        unknown,
        Parameters<Requests["ticketsApiCreateTicket"]>[0]
      >(
        (payload) => requests.ticketsApiCreateTicket(payload),
        config?.useTicketsApiCreateTicket,
        options
      ),
    useReleasesApiPostConstant: (
      options?: Omit<
        UseMutationOptions<
          Response<"releasesApiPostConstant">,
          unknown,
          Parameters<Requests["releasesApiPostConstant"]>[0],
          unknown
        >,
        "mutationFn"
      >
    ) =>
      useRapiniMutation<
        Response<"releasesApiPostConstant">,
        unknown,
        Parameters<Requests["releasesApiPostConstant"]>[0]
      >(
        (payload) => requests.releasesApiPostConstant(payload),
        config?.useReleasesApiPostConstant,
        options
      ),
    useReleasesApiCreateRelease: (
      options?: Omit<
        UseMutationOptions<
          Response<"releasesApiCreateRelease">,
          unknown,
          Parameters<Requests["releasesApiCreateRelease"]>[0],
          unknown
        >,
        "mutationFn"
      >
    ) =>
      useRapiniMutation<
        Response<"releasesApiCreateRelease">,
        unknown,
        Parameters<Requests["releasesApiCreateRelease"]>[0]
      >(
        (payload) => requests.releasesApiCreateRelease(payload),
        config?.useReleasesApiCreateRelease,
        options
      ),
    useReleasesApiUpdateRelease: (
      options?: Omit<
        UseMutationOptions<
          Response<"releasesApiUpdateRelease">,
          unknown,
          Parameters<Requests["releasesApiUpdateRelease"]>[0],
          unknown
        >,
        "mutationFn"
      >
    ) =>
      useRapiniMutation<
        Response<"releasesApiUpdateRelease">,
        unknown,
        Parameters<Requests["releasesApiUpdateRelease"]>[0]
      >(
        (payload) => requests.releasesApiUpdateRelease(payload),
        config?.useReleasesApiUpdateRelease,
        options
      ),
    useReleasesApiDeleteRelease: (
      options?: Omit<
        UseMutationOptions<
          Response<"releasesApiDeleteRelease">,
          unknown,
          Parameters<Requests["releasesApiDeleteRelease"]>[0],
          unknown
        >,
        "mutationFn"
      >
    ) =>
      useRapiniMutation<
        Response<"releasesApiDeleteRelease">,
        unknown,
        Parameters<Requests["releasesApiDeleteRelease"]>[0]
      >(
        (payload) => requests.releasesApiDeleteRelease(payload),
        config?.useReleasesApiDeleteRelease,
        options
      ),
    useReleasesApiApproveRelease: (
      uuid: string,
      options?: Omit<
        UseMutationOptions<Response<"releasesApiApproveRelease">, unknown, unknown, unknown>,
        "mutationFn"
      >
    ) =>
      useRapiniMutation<Response<"releasesApiApproveRelease">, unknown, unknown>(
        () => requests.releasesApiApproveRelease(uuid),
        config?.useReleasesApiApproveRelease,
        options
      ),
    useReleasesApiDeletePendingReleaseItems: (
      uuid: string,
      options?: Omit<
        UseMutationOptions<
          Response<"releasesApiDeletePendingReleaseItems">,
          unknown,
          unknown,
          unknown
        >,
        "mutationFn"
      >
    ) =>
      useRapiniMutation<Response<"releasesApiDeletePendingReleaseItems">, unknown, unknown>(
        () => requests.releasesApiDeletePendingReleaseItems(uuid),
        config?.useReleasesApiDeletePendingReleaseItems,
        options
      ),
    useReleasesApiRevokeApproval: (
      uuid: string,
      reason: string,
      options?: Omit<
        UseMutationOptions<Response<"releasesApiRevokeApproval">, unknown, unknown, unknown>,
        "mutationFn"
      >
    ) =>
      useRapiniMutation<Response<"releasesApiRevokeApproval">, unknown, unknown>(
        () => requests.releasesApiRevokeApproval(uuid, reason),
        config?.useReleasesApiRevokeApproval,
        options
      ),
    useReleasesApiDeleteSnapshot: (
      options?: Omit<
        UseMutationOptions<
          Response<"releasesApiDeleteSnapshot">,
          unknown,
          Parameters<Requests["releasesApiDeleteSnapshot"]>[0],
          unknown
        >,
        "mutationFn"
      >
    ) =>
      useRapiniMutation<
        Response<"releasesApiDeleteSnapshot">,
        unknown,
        Parameters<Requests["releasesApiDeleteSnapshot"]>[0]
      >(
        (payload) => requests.releasesApiDeleteSnapshot(payload),
        config?.useReleasesApiDeleteSnapshot,
        options
      ),
  } as const
}
