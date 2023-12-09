import { AppFormControl } from "@/components/form/AppFormControl"
import { Shell } from "@/components/layout/Shell"
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Icon,
  Input,
  Select as ChakraSelect,
  SimpleGrid,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Tfoot,
  Th,
  Thead,
  Tr,
  VStack,
  Spinner,
  Textarea,
  Text,
  Tooltip,
  HStack,
} from "@chakra-ui/react"
import zod from "zod"
import { useAppForm } from "@/hooks/useAppForm"
import { IconCornerDownRight } from "@tabler/icons-react"
import { useAppMutation } from "@/hooks/useAppMutation"
import { api } from "@/api"
import { useRouter } from "next/router"
import { Access } from "@/types/Page"
import { useAppQuery } from "@/hooks/useAppQuery"
import WithQuery from "@/components/indicators/WithQuery"
import {
  AllReleaseResponse,
  ConstantUserResponse,
  GetReleaseResponse,
  SimpleConstantSchema,
  SimpleReleaseItemModelSchema,
  SimpleRolesSchema,
} from "@/api/definitions"
import { toast } from "react-hot-toast"
import { reverse } from "@/utils/reverse"
import If from "@/components/logic/If"
import { Select } from "chakra-react-select"
import { useState } from "react"
import { ControlledMultiAppSelect } from "@/components/form/controls/Select"
import { rolesOptions } from "../profile/index.page"
import { useMagicQueryHooks } from "@/hooks/useAppQuery"
import Datetime from "react-datetime"
import { DateTime } from "luxon"
import "react-datetime/css/react-datetime.css"

// This page is only accessible by a User.
CreateReleasePage.access = Access.User

export interface IServiceOptions {
  label: string
  value: string
}

const schema = zod.object({
  name: zod.string(),
  targetEnvs: zod.array(zod.string().nonempty()).nullish().default(null),
})

export default function CreateReleasePage() {
  const form = useAppForm<zod.infer<typeof schema>>({
    schema,
    initialFocus: "name",
  })

  const { replace } = useRouter()
  const [selectedOptions, setSelectedOptions] = useState<Array<string>>([])
  const [selectedApprovers, setSelectedApprovers] = useState<Array<number>>([])
  const [response, setResponse] = useState<Array<SimpleConstantSchema>>([])
  const [data, setData] = useState<Array<SimpleReleaseItemModelSchema>>()
  const [inheritData, setInheritData] = useState<Array<SimpleReleaseItemModelSchema>>()
  const [serviceOptions, setServiceOptions] = useState<Array<IServiceOptions>>([])
  const [releaseType, setReleaseType] = useState<string>()
  const [selectedReleaseUUID, setSelectedReleaseUUID] = useState<string>("")
  const [spin, setSpin] = useState<boolean>(true)
  const [startWindowDT, setStartWindowDT] = useState<Date>(new Date())
  const [endWindowDT, setEndWindowDT] = useState<Date>(new Date())

  const query = useAppQuery(api.queries.useReleasesApiGetConstantAndUsers, {
    autoRefetch: false,
    onOk(response) {
      setSpin(false)
      if (!serviceOptions.length) {
        const tempConstants = [
          ...new Map(response.result?.constants.map((item) => [item["service"], item])).values(),
        ]
        setServiceOptions(tempConstants.map((item) => ({ label: item.name, value: item.service })))
        setResponse(response.result?.constants ?? [])
        setData(
          response.result?.constants.map((item) => {
            return {
              repo: item.repo,
              service: item.service,
              release_branch: "",
              hotfix_branch: "",
              tag: "",
              special_notes: "",
            } as SimpleReleaseItemModelSchema
          }) ?? []
        )
      }
    },
  })

  const magic = useMagicQueryHooks({
    autoRefetch: false,
    onOk(responseData) {
      setSpin(false)
      if (!inheritData) {
        const tempConstants = [
          ...new Map(
            (responseData.result as GetReleaseResponse).constants.map((item) => [
              item["service"],
              item,
            ])
          ).values(),
        ]
        setServiceOptions(tempConstants.map((item) => ({ label: item.name, value: item.service })))
        setInheritData(
          (responseData.result as GetReleaseResponse).release_data.items.map((item) => item) ?? []
        )
      }
    },
  })

  const releaseQuery = api.queries.useReleasesApiGetReleaseWithUuid(selectedReleaseUUID, {
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
    retryOnMount: false,
    ...magic.hooks,
  })

  const allReleasesQuery = useAppQuery(api.queries.useReleasesApiGetAllReleases, {
    autoRefetch: false,
  })

  const mutation = useAppMutation(api.mutations.useReleasesApiPostConstant, {
    onOk(data) {
      setSpin(false)
      setResponse(data.result?.constants ?? [])
      setData(
        data.result?.constants.map((item) => {
          return {
            repo: item.repo,
            service: item.service,
            release_branch: "",
            hotfix_branch: "",
            tag: "",
            special_notes: "",
          } as SimpleReleaseItemModelSchema
        }) ?? []
      )
    },
  })

  const handleServiceSelect = (e: any) => {
    setSelectedOptions(e.map((item: IServiceOptions) => item.value))
  }

  const handleBranchTagChange = (eventData: SimpleReleaseItemModelSchema) => {
    const updatedRow = data?.find(
      (item) => item.service == eventData.service && item.repo == eventData.repo
    )
    setData(
      data?.filter((item) => !(item.service == eventData.service && item.repo == eventData.repo))
    )
    if ("tag" in eventData) {
      setData((previousData) => [
        ...(previousData as SimpleReleaseItemModelSchema[]),
        {
          ...eventData,
          release_branch: updatedRow?.release_branch,
          hotfix_branch: updatedRow?.hotfix_branch,
          special_notes: updatedRow?.special_notes,
          devops_notes: updatedRow?.devops_notes,
        } as SimpleReleaseItemModelSchema,
      ])
    }
    if ("release_branch" in eventData) {
      setData((previousData) => [
        ...(previousData as SimpleReleaseItemModelSchema[]),
        {
          ...eventData,
          tag: updatedRow?.tag,
          hotfix_branch: updatedRow?.hotfix_branch,
          special_notes: updatedRow?.special_notes,
          devops_notes: updatedRow?.devops_notes,
        } as SimpleReleaseItemModelSchema,
      ])
    }
    if ("hotfix_branch" in eventData) {
      setData((previousData) => [
        ...(previousData as SimpleReleaseItemModelSchema[]),
        {
          ...eventData,
          tag: updatedRow?.tag,
          release_branch: updatedRow?.release_branch,
          special_notes: updatedRow?.special_notes,
          devops_notes: updatedRow?.devops_notes,
        } as SimpleReleaseItemModelSchema,
      ])
    }
    if ("special_notes" in eventData) {
      setData((previousData) => [
        ...(previousData as SimpleReleaseItemModelSchema[]),
        {
          ...eventData,
          tag: updatedRow?.tag,
          release_branch: updatedRow?.release_branch,
          hotfix_branch: updatedRow?.hotfix_branch,
          devops_notes: updatedRow?.devops_notes,
        } as SimpleReleaseItemModelSchema,
      ])
    }
    if ("devops_notes" in eventData) {
      setData((previousData) => [
        ...(previousData as SimpleReleaseItemModelSchema[]),
        {
          ...eventData,
          tag: updatedRow?.tag,
          release_branch: updatedRow?.release_branch,
          hotfix_branch: updatedRow?.hotfix_branch,
          special_notes: updatedRow?.special_notes,
        } as SimpleReleaseItemModelSchema,
      ])
    }
  }

  const handleInheritBranchTagChange = (eventData: SimpleReleaseItemModelSchema) => {
    const updatedRow = inheritData?.find(
      (item) => item.service == eventData.service && item.repo == eventData.repo
    )
    setInheritData(
      inheritData?.filter(
        (item) => !(item.service == eventData.service && item.repo == eventData.repo)
      )
    )
    if ("tag" in eventData) {
      setInheritData((previousData) => [
        ...(previousData as SimpleReleaseItemModelSchema[]),
        {
          ...eventData,
          release_branch: updatedRow?.release_branch,
          hotfix_branch: updatedRow?.hotfix_branch,
          special_notes: updatedRow?.special_notes,
          devops_notes: updatedRow?.devops_notes,
        } as SimpleReleaseItemModelSchema,
      ])
    }
    if ("release_branch" in eventData) {
      setInheritData((previousData) => [
        ...(previousData as SimpleReleaseItemModelSchema[]),
        {
          ...eventData,
          tag: updatedRow?.tag,
          hotfix_branch: updatedRow?.hotfix_branch,
          special_notes: updatedRow?.special_notes,
          devops_notes: updatedRow?.devops_notes,
        } as SimpleReleaseItemModelSchema,
      ])
    }
    if ("hotfix_branch" in eventData) {
      setInheritData((previousData) => [
        ...(previousData as SimpleReleaseItemModelSchema[]),
        {
          ...eventData,
          tag: updatedRow?.tag,
          release_branch: updatedRow?.release_branch,
          special_notes: updatedRow?.special_notes,
          devops_notes: updatedRow?.devops_notes,
        } as SimpleReleaseItemModelSchema,
      ])
    }
    if ("special_notes" in eventData) {
      setInheritData((previousData) => [
        ...(previousData as SimpleReleaseItemModelSchema[]),
        {
          ...eventData,
          tag: updatedRow?.tag,
          release_branch: updatedRow?.release_branch,
          hotfix_branch: updatedRow?.hotfix_branch,
          devops_notes: updatedRow?.devops_notes,
        } as SimpleReleaseItemModelSchema,
      ])
    }
    if ("devops_notes" in eventData) {
      setInheritData((previousData) => [
        ...(previousData as SimpleReleaseItemModelSchema[]),
        {
          ...eventData,
          tag: updatedRow?.tag,
          release_branch: updatedRow?.release_branch,
          hotfix_branch: updatedRow?.hotfix_branch,
          special_notes: updatedRow?.special_notes,
        } as SimpleReleaseItemModelSchema,
      ])
    }
  }

  const createReleaseMutation = useAppMutation(api.mutations.useReleasesApiCreateRelease, {
    onOk() {
      toast.success("Release created.")
      replace(reverse.user.releases())
    },
    onNotOk() {
      toast.error(
        "You are not authorized to create a release. Please raise the access for Release Admin in your profile."
      )
    },
  })

  const handleApproversSelect = (e: any) => {
    setSelectedApprovers(e.map((item: IServiceOptions) => item.value))
  }

  const handleInheritRelease = () => {
    setSpin(true)
    setReleaseType("inherit")
  }

  return (
    <Shell
      page={{
        name: "releases",
        title: "Create a New Release",
        banner: {
          title: "Create a New Release",
          subtitle: "Lorem ipsum dolor, sit amet consectetur adipisicing elit.",
        },
      }}
    >
      {spin && (
        <Box position="fixed" top="9%" w="full" h="100vh" zIndex="10000" bg="blackAlpha.100">
          <Spinner position="fixed" top="50%" left="50%" />
        </Box>
      )}
      <WithQuery
        query={allReleasesQuery}
        onOk={(result?: AllReleaseResponse) => (
          <If
            value={result}
            condition={(result) => (result?.release_list?.length ?? 0) > 0}
            then={(result) => (
              <SimpleGrid
                w="full"
                columns={[1, 1, 2]}
                spacing={[6, 8]}
                display="flex"
                flexDirection={["column", "column", "row"]}
                alignItems={["flex-start", "flex-start", "center"]}
                justifyContent="space-between"
              >
                <VStack w={["full", "full", "50%"]} align="end">
                  <AppFormControl label="Inherit from Previous Releases">
                    <Select
                      colorScheme="purple"
                      placeholder="Select the release to inherit from"
                      options={result.release_list.map((item) => {
                        return {
                          label: item.name,
                          value: item.uuid,
                        }
                      })}
                      onChange={(e) => {
                        setSelectedReleaseUUID(e?.value ?? "")
                      }}
                    />
                  </AppFormControl>

                  <Button variant="outline" onClick={handleInheritRelease}>
                    Inherit Release
                  </Button>
                </VStack>

                <Button
                  variant="outline"
                  onClick={() => {
                    setReleaseType("new")
                  }}
                >
                  Create a New Release
                </Button>
              </SimpleGrid>
            )}
            else={() => (
              <Button
                variant="outline"
                onClick={() => {
                  setReleaseType("new")
                }}
              >
                Create a New Release
              </Button>
            )}
          />
        )}
      />
      {releaseType === "new" && (
        <WithQuery
          query={query}
          onOk={(result?: ConstantUserResponse) => (
            <If
              value={result}
              condition={(result) => (result?.constants?.length ?? 0) > 0}
              then={(result) => (
                <>
                  <AppFormControl label="Select the services to be included">
                    <Select
                      isMulti
                      colorScheme="purple"
                      placeholder="Select all the services you want to include in the release ..."
                      options={serviceOptions}
                      onChange={handleServiceSelect}
                      defaultValue={[
                        ...new Map(
                          result.constants.map((item) => [item["service"], item])
                        ).values(),
                      ].map((item) => ({ label: item.name, value: item.service }))}
                    />
                  </AppFormControl>
                  <Button
                    w={["full", "full", "auto"]}
                    colorScheme="blue"
                    rightIcon={<Icon as={IconCornerDownRight} />}
                    isLoading={mutation.isLoading}
                    loadingText="Loading Sheets"
                    onClick={() => {
                      setSpin(true)
                      mutation.mutate(selectedOptions)
                    }}
                  >
                    Submit
                  </Button>
                  <VStack
                    as="form"
                    w="full"
                    spacing={["6", "6", "8"]}
                    onSubmit={form.handleSubmit((form) => {
                      if (selectedApprovers.length) {
                        createReleaseMutation.mutate({
                          release: {
                            name: form.name,
                            items: data ?? [],
                            start_window: DateTime.fromISO(startWindowDT.toISOString())
                              .toFormat("yyyy-MM-dd HH:mm:ss")
                              .replace(" ", "T"),
                            end_window: DateTime.fromISO(endWindowDT.toISOString())
                              .toFormat("yyyy-MM-dd HH:mm:ss")
                              .replace(" ", "T"),
                          },
                          approvers: selectedApprovers,
                          targets: form.targetEnvs ?? [],
                        })
                      } else {
                        toast.error("Please select atleast one approver.")
                      }
                    })}
                  >
                    <SimpleGrid
                      w="full"
                      columns={[1, 1, 2]}
                      spacing={[6, 8]}
                      display="flex"
                      flexDirection={["column", "column", "row"]}
                      alignItems={["flex-start", "flex-start", "flex-end"]}
                    >
                      <AppFormControl
                        w={["full", "full", "50%"]}
                        label="Release Name"
                        isRequired
                        error={form.formState.errors.name}
                      >
                        <Input
                          type="text"
                          variant="filled"
                          placeholder="Release Name"
                          {...form.register("name")}
                        />
                      </AppFormControl>
                      <AppFormControl w={["full", "full", "50%"]} label="Approvers" isRequired>
                        <Select
                          isMulti
                          colorScheme="purple"
                          placeholder="Select all the approvers"
                          options={rolesOptions.filter(
                            (item) =>
                              item.value !== "1" &&
                              item.value !== "2" &&
                              item.value !== "3" &&
                              item.value !== "4"
                          )}
                          onChange={handleApproversSelect}
                        />
                      </AppFormControl>
                    </SimpleGrid>

                    <SimpleGrid
                      w="full"
                      columns={[1, 1, 2]}
                      spacing={[6, 8]}
                      display="flex"
                      flexDirection={["column", "column", "row"]}
                      alignItems={["flex-start", "flex-start", "flex-end"]}
                    >
                      <AppFormControl
                        w={["full", "full", "50%"]}
                        label="Target Envs"
                        error={form.formState.errors.targetEnvs}
                      >
                        <ControlledMultiAppSelect
                          controller={{
                            name: "targetEnvs",
                            control: form.control,
                          }}
                          variant="filled"
                          placeholder="Enter all the target envs"
                          closeMenuOnSelect={false}
                          noOptionsMessage={() => "Type to Create"}
                          tagVariant="solid"
                          isClearable={false}
                          isCreatable
                        />
                      </AppFormControl>

                      <HStack w={["full", "full", "50%"]}>
                        <AppFormControl w={["full", "full", "50%"]} label="Start Window" isRequired>
                          <Datetime
                            initialValue={startWindowDT}
                            onChange={(value: any) => setStartWindowDT(value.toDate())}
                          />
                        </AppFormControl>

                        <AppFormControl w={["full", "full", "50%"]} label="End Window" isRequired>
                          <Datetime
                            initialValue={endWindowDT}
                            onChange={(value: any) => setEndWindowDT(value.toDate())}
                          />
                        </AppFormControl>
                      </HStack>
                    </SimpleGrid>

                    {[...new Set(response.map((item) => item.service))].map((item, index) => (
                      <TableSheets
                        key={item}
                        response={[]}
                        constant={response.filter((responseItem) => responseItem.service === item)}
                        onBranchTagChange={handleBranchTagChange}
                        serviceOptions={serviceOptions}
                      />
                    ))}

                    <Box w="full" textAlign="end" py="8">
                      <Button
                        type="submit"
                        w={["full", "full", "auto"]}
                        colorScheme="blue"
                        rightIcon={<Icon as={IconCornerDownRight} />}
                        isLoading={createReleaseMutation.isLoading}
                        loadingText="Saving"
                      >
                        Save & Continue
                      </Button>
                    </Box>
                  </VStack>
                </>
              )}
            />
          )}
        />
      )}
      {releaseType === "inherit" && (
        <WithQuery
          query={releaseQuery}
          onOk={(result?: GetReleaseResponse) => (
            <If
              value={result}
              condition={(result) => (result?.release_data.items.length ?? 0) > 0}
              then={(result) => (
                <>
                  <VStack
                    as="form"
                    w="full"
                    spacing={["6", "6", "8"]}
                    onSubmit={form.handleSubmit((form) => {
                      if (selectedApprovers.length) {
                        createReleaseMutation.mutate({
                          release: {
                            name: form.name,
                            items: inheritData ?? [],
                            start_window: DateTime.fromISO(startWindowDT.toISOString())
                              .toFormat("yyyy-MM-dd HH:mm:ss")
                              .replace(" ", "T"),
                            end_window: DateTime.fromISO(endWindowDT.toISOString())
                              .toFormat("yyyy-MM-dd HH:mm:ss")
                              .replace(" ", "T"),
                          },
                          approvers: selectedApprovers,
                          targets: form.targetEnvs ?? [],
                        })
                      } else {
                        toast.error("Please select atleast one approver.")
                      }
                    })}
                  >
                    <SimpleGrid
                      w="full"
                      columns={[1, 1, 2]}
                      spacing={[6, 8]}
                      display="flex"
                      flexDirection={["column", "column", "row"]}
                      alignItems={["flex-start", "flex-start", "flex-end"]}
                    >
                      <AppFormControl
                        w={["full", "full", "50%"]}
                        label="Release Name"
                        isRequired
                        error={form.formState.errors.name}
                      >
                        <Input
                          type="text"
                          variant="filled"
                          placeholder="Release Name"
                          {...form.register("name")}
                        />
                      </AppFormControl>
                      <AppFormControl w={["full", "full", "50%"]} label="Approvers" isRequired>
                        <Select
                          isMulti
                          colorScheme="purple"
                          placeholder="Select all the approvers"
                          options={rolesOptions.filter(
                            (item) =>
                              item.value !== "1" &&
                              item.value !== "2" &&
                              item.value !== "3" &&
                              item.value !== "4"
                          )}
                          onChange={handleApproversSelect}
                        />
                      </AppFormControl>
                    </SimpleGrid>

                    <SimpleGrid
                      w="full"
                      columns={[1, 1, 2]}
                      spacing={[6, 8]}
                      display="flex"
                      flexDirection={["column", "column", "row"]}
                      alignItems={["flex-start", "flex-start", "flex-end"]}
                    >
                      <AppFormControl
                        w={["full", "full", "50%"]}
                        label="Target Envs"
                        error={form.formState.errors.targetEnvs}
                      >
                        <ControlledMultiAppSelect
                          controller={{
                            name: "targetEnvs",
                            control: form.control,
                          }}
                          variant="filled"
                          placeholder="Enter all the target envs"
                          closeMenuOnSelect={false}
                          noOptionsMessage={() => "Type to Create"}
                          tagVariant="solid"
                          isClearable={false}
                          isCreatable
                        />
                      </AppFormControl>

                      <HStack w={["full", "full", "50%"]}>
                        <AppFormControl w={["full", "full", "50%"]} label="Start Window" isRequired>
                          <Datetime
                            initialValue={startWindowDT}
                            onChange={(value: any) => setStartWindowDT(value.toDate())}
                          />
                        </AppFormControl>

                        <AppFormControl w={["full", "full", "50%"]} label="End Window" isRequired>
                          <Datetime
                            initialValue={endWindowDT}
                            onChange={(value: any) => setEndWindowDT(value.toDate())}
                          />
                        </AppFormControl>
                      </HStack>
                    </SimpleGrid>

                    {[...new Set(result.release_data.items.map((item) => item.service))].map(
                      (item, index) => (
                        <TableSheets
                          key={item}
                          response={result.release_data.items.filter(
                            (responseItem) => responseItem.service === item
                          )}
                          constant={result.constants.filter(
                            (responseItem) => responseItem.service === item
                          )}
                          onBranchTagChange={handleInheritBranchTagChange}
                          serviceOptions={serviceOptions}
                        />
                      )
                    )}

                    <Box w="full" textAlign="end" py="8">
                      <Button
                        type="submit"
                        w={["full", "full", "auto"]}
                        colorScheme="blue"
                        rightIcon={<Icon as={IconCornerDownRight} />}
                        isLoading={createReleaseMutation.isLoading}
                        loadingText="Saving"
                      >
                        Save & Continue
                      </Button>
                    </Box>
                  </VStack>
                </>
              )}
            />
          )}
        />
      )}
    </Shell>
  )
}

function TableSheets(props: {
  response: SimpleReleaseItemModelSchema[]
  constant: SimpleConstantSchema[]
  onBranchTagChange: (data: SimpleReleaseItemModelSchema) => void
  serviceOptions: Array<IServiceOptions>
}) {
  return (
    <>
      {!props.response.length ? (
        <Box w="full">
          <VStack w="full" spacing="12">
            <Card w="full">
              <CardHeader>
                <Heading size="md">
                  {
                    props.serviceOptions.find((item) => item.value === props.constant[0].service)
                      ?.label
                  }
                </Heading>
              </CardHeader>

              <CardBody>
                <TableContainer w="full">
                  <Table
                    variant="simple"
                    size="md"
                    __css={{ "table-layout": "fixed", "width": "150%" }}
                  >
                    <TableCaption>
                      {
                        props.serviceOptions.find(
                          (item) => item.value === props.constant[0].service
                        )?.label
                      }
                    </TableCaption>

                    <Thead>
                      <Tr>
                        <Th>Git Repo</Th>
                        <Th>Release Branches</Th>
                        <Th>Hotfix Branches</Th>
                        <Th>Tags</Th>
                        <Th>Special Notes</Th>
                        {JSON.parse(localStorage.getItem("$auth") ?? "").roles.find(
                          (item: SimpleRolesSchema) => item.role === 4
                        ) && <Th>DevOps Notes</Th>}
                      </Tr>
                    </Thead>

                    <Tbody>
                      {props.constant.map((item, index) => (
                        <Tr key={item.repo + item.service}>
                          <Td>
                            <Tooltip label={item.repo}>
                              <Text
                                overflow="auto"
                                css={{
                                  "&::-webkit-scrollbar": {
                                    display: "none",
                                  },
                                }}
                              >
                                {item.repo}
                              </Text>
                            </Tooltip>
                          </Td>
                          <Td>
                            <ChakraSelect
                              placeholder="Select Release Branch"
                              onChange={(e) =>
                                props.onBranchTagChange({
                                  release_branch: e.target.value ?? "",
                                  service: item.service,
                                  repo: item.repo,
                                } as SimpleReleaseItemModelSchema)
                              }
                            >
                              {item.branches.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </ChakraSelect>
                          </Td>
                          <Td>
                            <ChakraSelect
                              placeholder="Select Hotfix Branch"
                              onChange={(e) =>
                                props.onBranchTagChange({
                                  hotfix_branch: e.target.value ?? "",
                                  service: item.service,
                                  repo: item.repo,
                                } as SimpleReleaseItemModelSchema)
                              }
                            >
                              {item.branches.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </ChakraSelect>
                          </Td>
                          <Td>
                            <ChakraSelect
                              placeholder="Select Tag"
                              onChange={(e) =>
                                props.onBranchTagChange({
                                  tag: e.target.value ?? "",
                                  service: item.service,
                                  repo: item.repo,
                                } as SimpleReleaseItemModelSchema)
                              }
                            >
                              {item.tags.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </ChakraSelect>
                          </Td>
                          <Td>
                            <Textarea
                              placeholder="Special Notes"
                              onChange={(e) =>
                                props.onBranchTagChange({
                                  special_notes: e.target.value,
                                  service: item.service,
                                  repo: item.repo,
                                } as SimpleReleaseItemModelSchema)
                              }
                            />
                          </Td>
                          {JSON.parse(localStorage.getItem("$auth") ?? "").roles.find(
                            (item: SimpleRolesSchema) => item.role === 4
                          ) && (
                            <Td>
                              <Textarea
                                onChange={(e) =>
                                  props.onBranchTagChange({
                                    devops_notes: e.target.value,
                                    service: item.service,
                                    repo: item.repo,
                                  } as SimpleReleaseItemModelSchema)
                                }
                                placeholder="Devops Notes"
                                size="md"
                              />
                            </Td>
                          )}
                        </Tr>
                      ))}
                    </Tbody>

                    <Tfoot>
                      <Tr>
                        <Th>Git Repo</Th>
                        <Th>Release Branches</Th>
                        <Th>Hotfix Branches</Th>
                        <Th>Tags</Th>
                        <Th>Special Notes</Th>
                        {JSON.parse(localStorage.getItem("$auth") ?? "").roles.find(
                          (item: SimpleRolesSchema) => item.role === 4
                        ) && <Th>DevOps Notes</Th>}
                      </Tr>
                    </Tfoot>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>
          </VStack>
        </Box>
      ) : (
        <Box w="full">
          <VStack w="full" spacing="12">
            <Card w="full">
              <CardHeader>
                <Heading size="md">
                  {
                    props.serviceOptions.find((item) => item.value === props.response![0].service)
                      ?.label
                  }
                </Heading>
              </CardHeader>

              <CardBody>
                <TableContainer w="full">
                  <Table
                    variant="simple"
                    size="md"
                    __css={{ "table-layout": "fixed", "width": "150%" }}
                  >
                    <TableCaption>
                      {
                        props.serviceOptions.find(
                          (item) => item.value === props.response![0].service
                        )?.label
                      }
                    </TableCaption>

                    <Thead>
                      <Tr>
                        <Th>Git Repo</Th>
                        <Th>Release Branches</Th>
                        <Th>Hotfix Branches</Th>
                        <Th>Tags</Th>
                        <Th>Special Notes</Th>
                        {JSON.parse(localStorage.getItem("$auth") ?? "").roles.find(
                          (item: SimpleRolesSchema) => item.role === 4
                        ) && <Th>DevOps Notes</Th>}
                      </Tr>
                    </Thead>

                    <Tbody>
                      {props.response!.map((item, index) => (
                        <Tr key={item.repo + item.service}>
                          <Td>
                            <Tooltip label={item.repo}>
                              <Text
                                overflow="auto"
                                css={{
                                  "&::-webkit-scrollbar": {
                                    display: "none",
                                  },
                                }}
                              >
                                {item.repo}
                              </Text>
                            </Tooltip>
                          </Td>
                          <Td>
                            <ChakraSelect
                              placeholder="Select Release Branch"
                              defaultValue={item.release_branch}
                              onChange={(e) =>
                                props.onBranchTagChange({
                                  release_branch: e.target.value ?? "",
                                  service: item.service,
                                  repo: item.repo,
                                } as SimpleReleaseItemModelSchema)
                              }
                            >
                              {(
                                props.constant.find(
                                  (constantItem) => constantItem.repo === item.repo
                                )?.branches ?? []
                              ).map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </ChakraSelect>
                          </Td>
                          <Td>
                            <ChakraSelect
                              placeholder="Select Hotfix Branch"
                              defaultValue={item.hotfix_branch}
                              onChange={(e) =>
                                props.onBranchTagChange({
                                  hotfix_branch: e.target.value ?? "",
                                  service: item.service,
                                  repo: item.repo,
                                } as SimpleReleaseItemModelSchema)
                              }
                            >
                              {(
                                props.constant.find(
                                  (constantItem) => constantItem.repo === item.repo
                                )?.branches ?? []
                              ).map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </ChakraSelect>
                          </Td>
                          <Td>
                            <ChakraSelect
                              placeholder="Select Tag"
                              defaultValue={item.tag}
                              onChange={(e) =>
                                props.onBranchTagChange({
                                  tag: e.target.value ?? "",
                                  service: item.service,
                                  repo: item.repo,
                                } as SimpleReleaseItemModelSchema)
                              }
                            >
                              {(
                                props.constant.find(
                                  (constantItem) => constantItem.repo === item.repo
                                )?.tags ?? []
                              ).map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </ChakraSelect>
                          </Td>
                          <Td>
                            <Textarea
                              placeholder="Special Notes"
                              defaultValue={item.special_notes}
                              onChange={(e) =>
                                props.onBranchTagChange({
                                  special_notes: e.target.value,
                                  service: item.service,
                                  repo: item.repo,
                                } as SimpleReleaseItemModelSchema)
                              }
                            />
                          </Td>
                          {JSON.parse(localStorage.getItem("$auth") ?? "").roles.find(
                            (item: SimpleRolesSchema) => item.role === 4
                          ) && (
                            <Td>
                              <Textarea
                                defaultValue={item.devops_notes}
                                onChange={(e) =>
                                  props.onBranchTagChange({
                                    devops_notes: e.target.value,
                                    service: item.service,
                                    repo: item.repo,
                                  } as SimpleReleaseItemModelSchema)
                                }
                                placeholder="Devops Notes"
                                size="md"
                              />
                            </Td>
                          )}
                        </Tr>
                      ))}
                    </Tbody>

                    <Tfoot>
                      <Tr>
                        <Th>Git Repo</Th>
                        <Th>Release Branches</Th>
                        <Th>Hotfix Branches</Th>
                        <Th>Tags</Th>
                        <Th>Special Notes</Th>
                        {JSON.parse(localStorage.getItem("$auth") ?? "").roles.find(
                          (item: SimpleRolesSchema) => item.role === 4
                        ) && <Th>DevOps Notes</Th>}
                      </Tr>
                    </Tfoot>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>
          </VStack>
        </Box>
      )}
    </>
  )
}
