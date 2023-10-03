import { AppFormControl } from "@/components/form/AppFormControl"
import { Shell } from "@/components/layout/Shell"
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Editable,
  EditableInput,
  EditablePreview,
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
  ConstantUserResponse,
  SimpleConstantSchema,
  SimpleReleaseItemModelSchema,
} from "@/api/definitions"
import { toast } from "react-hot-toast"
import { reverse } from "@/utils/reverse"
import If from "@/components/logic/If"
import { Select } from "chakra-react-select"
import { useState } from "react"

// This page is only accessible by a User.
CreateReleasePage.access = Access.User

export interface IServiceOptions {
  label: string
  value: string
}

const schema = zod.object({
  name: zod.string(),
})

export default function CreateReleasePage() {
  const form = useAppForm<zod.infer<typeof schema>>({
    schema,
    initialFocus: "name",
  })

  const { replace } = useRouter()
  const [selectedOptions, setSelectedOptions] = useState<Array<string>>([])
  const [selectedApprovers, setSelectedApprovers] = useState<Array<string>>([])
  const [response, setResponse] = useState<Array<SimpleConstantSchema>>([])
  const [data, setData] = useState<Array<SimpleReleaseItemModelSchema>>()
  const [serviceOptions, setServiceOptions] = useState<Array<IServiceOptions>>([])

  const query = useAppQuery(api.queries.useReleasesApiGetConstantAndUsers, {
    autoRefetch: false,
    onOk(response) {
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

  const mutation = useAppMutation(api.mutations.useReleasesApiPostConstant, {
    onOk(data) {
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
      <WithQuery
        query={query}
        onOk={(result?: ConstantUserResponse) => (
          <If
            value={result}
            condition={(result) => (result?.constants?.length ?? 0) > 0}
            then={(result) => (
              <>
                <Select
                  isMulti
                  colorScheme="purple"
                  placeholder="Select all the services you want to include in the release ..."
                  options={serviceOptions}
                  onChange={handleServiceSelect}
                  defaultValue={[
                    ...new Map(result.constants.map((item) => [item["service"], item])).values(),
                  ].map((item) => ({ label: item.name, value: item.service }))}
                />
                <Button
                  w={["full", "full", "auto"]}
                  colorScheme="blue"
                  rightIcon={<Icon as={IconCornerDownRight} />}
                  isLoading={mutation.isLoading}
                  loadingText="Loading Sheets"
                  onClick={() => mutation.mutate(selectedOptions)}
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
                        },
                        approvers: selectedApprovers,
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
                        options={result.users.map((item) => ({
                          label: `${item.last_name}, ${item.first_name}`,
                          value: item.email,
                        }))}
                        onChange={handleApproversSelect}
                      />
                    </AppFormControl>
                  </SimpleGrid>

                  {[...new Set(response.map((item) => item.service))].map((item, index) => (
                    <TableSheets
                      key={item}
                      response={response.filter((responseItem) => responseItem.service === item)}
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
    </Shell>
  )
}

function TableSheets(props: {
  response: SimpleConstantSchema[]
  onBranchTagChange: (data: SimpleReleaseItemModelSchema) => void
  serviceOptions: Array<IServiceOptions>
}) {
  return (
    <Box w="full">
      <VStack w="full" spacing="12">
        <Card w="full">
          <CardHeader>
            <Heading size="md">
              {props.serviceOptions.find((item) => item.value === props.response[0].service)?.label}
            </Heading>
          </CardHeader>

          <CardBody>
            <TableContainer w="full">
              <Table variant="simple">
                <TableCaption>
                  {
                    props.serviceOptions.find((item) => item.value === props.response[0].service)
                      ?.label
                  }
                </TableCaption>

                <Thead>
                  <Tr>
                    <Th>Git Repo</Th>
                    <Th>Release Branches</Th>
                    <Th>Hotfix Branches</Th>
                    <Th>Tags</Th>
                    <Th>Special Notes</Th>
                  </Tr>
                </Thead>

                <Tbody>
                  {props.response.map((item, index) => (
                    <Tr key={item.repo + item.service}>
                      <Td>{item.repo}</Td>
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
                        <Editable
                          w="20vh"
                          overflowX="auto"
                          placeholder="Notes"
                          onChange={(e) =>
                            props.onBranchTagChange({
                              special_notes: e,
                              service: item.service,
                              repo: item.repo,
                            } as SimpleReleaseItemModelSchema)
                          }
                        >
                          <EditablePreview />
                          <EditableInput />
                        </Editable>
                      </Td>
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
                  </Tr>
                </Tfoot>
              </Table>
            </TableContainer>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  )
}
