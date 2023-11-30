import { Shell } from "@/components/layout/Shell"
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Icon,
  Select as ChakraSelect,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Text,
  Tfoot,
  Th,
  Thead,
  Tr,
  VStack,
  Checkbox,
  AlertDialog,
  useDisclosure,
  AlertDialogOverlay,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  HStack,
  Textarea,
  Tooltip,
} from "@chakra-ui/react"
import { IconCornerDownRight } from "@tabler/icons-react"
import { useAppMutation } from "@/hooks/useAppMutation"
import { api } from "@/api"
import { useRouter } from "next/router"
import { Access } from "@/types/Page"
import { useMagicQueryHooks } from "@/hooks/useAppQuery"
import WithQuery from "@/components/indicators/WithQuery"
import {
  GetReleaseResponse,
  SimpleConstantSchema,
  SimpleReleaseItemModelSchema,
  SimpleRolesSchema,
} from "@/api/definitions"
import { toast } from "react-hot-toast"
import If from "@/components/logic/If"
import React, { ChangeEvent, useRef, useState } from "react"
import LoadingBlock from "@/components/indicators/LoadingBlock"
import { AppFormControl } from "@/components/form/AppFormControl"
import { ControlledMultiAppSelect } from "@/components/form/controls/Select"
import { useAppForm } from "@/hooks/useAppForm"
import zod from "zod"
import { rolesOptions } from "../profile/index.page"

// This page is only accessible by a User.
ManageReleasePage.access = Access.User

interface IServiceOptions {
  label: string
  value: string
}

const schema = zod.object({
  targetEnvs: zod.array(zod.string().nonempty()).nullish().default(null),
})

export default function ManageReleasePage() {
  const { asPath } = useRouter()
  const [response, setResponse] = useState<GetReleaseResponse>()
  const [data, setData] = useState<Array<SimpleReleaseItemModelSchema>>()
  const [serviceOptions, setServiceOptions] = useState<Array<IServiceOptions>>([])
  const [checked, setChecked] = useState<boolean>(false)
  const [sheetsDisabled, setSheetsDisabled] = useState<boolean>(false)
  const [approvedBy, setApprovedBy] = useState<Array<number>>([])
  const [pendingBy, setPendingBy] = useState<Array<number>>([])

  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = useRef(null)

  const revokeApprovalModal = useDisclosure()
  const revokeApprovalCancelRef = useRef(null)

  const [reason, setReason] = useState("")

  let handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setReason(e.target.value)
  }

  const form = useAppForm<zod.infer<typeof schema>>({
    schema,
    initialFocus: "targetEnvs",
  })

  const magic = useMagicQueryHooks({
    autoRefetch: false,
    onOk(responseData) {
      form.reset({
        targetEnvs:
          (responseData.result as GetReleaseResponse).release_data.targets.map(
            (item) => item.target
          ) ?? [],
      })
      if (!(response && data)) {
        const tempConstants = [
          ...new Map(
            (responseData.result as GetReleaseResponse).constants.map((item) => [
              item["service"],
              item,
            ])
          ).values(),
        ]
        setServiceOptions(tempConstants.map((item) => ({ label: item.name, value: item.service })))
        setResponse(responseData.result as GetReleaseResponse)
        setData(
          (responseData.result as GetReleaseResponse).release_data.items.map((item) => item) ?? []
        )
        setChecked(
          !(
            ((responseData.result as GetReleaseResponse).release_data.approvers
              .filter((item) => !item.approved)
              .map((item) => item.group)
              .includes(2) ||
              (responseData.result as GetReleaseResponse).release_data.approvers
                .filter((item) => !item.approved)
                .map((item) => item.group)
                .includes(4)) &&
            (JSON.parse(localStorage.getItem("$auth") ?? "")
              .roles.map((item: any) => item.role)
              .includes(2) ||
              JSON.parse(localStorage.getItem("$auth") ?? "")
                .roles.map((item: any) => item.role)
                .includes(4))
          ) &&
            ((responseData.result as GetReleaseResponse).release_data.approvers.find((item) =>
              JSON.parse(localStorage.getItem("$auth") ?? "")
                .roles.map((item: any) => item.role)
                .includes(item.group)
            )?.approved ??
              false)
        )
        setSheetsDisabled(
          (responseData.result as GetReleaseResponse).release_data.approvers
            .map((item) => item.approved)
            .includes(false)
            ? false
            : true
        )
        for (let approver of (responseData.result as GetReleaseResponse).release_data.approvers) {
          if (approver.approved) {
            setApprovedBy((previousApprovedBy) => [...previousApprovedBy, approver.group])
          } else {
            setPendingBy((previousPendingBy) => [...previousPendingBy, approver.group])
          }
        }
      }
    },
  })

  const query = api.queries.useReleasesApiGetReleaseWithUuid(
    asPath.split("/")[asPath.split("/").length - 1],
    {
      ...magic.hooks,
    }
  )

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

  const updateReleaseMutation = useAppMutation(api.mutations.useReleasesApiUpdateRelease, {
    onOk() {
      toast.success("Updated")
    },
    onNotOk() {
      toast.error(
        "This release has been approved by all the users and can't be further modified. Please contact your system administrator."
      )
      setSheetsDisabled(true)
    },
  })

  const { hooks } = useMagicQueryHooks({
    onOk() {
      toast.success("Approved")
      onClose()
      setChecked(true)
      setPendingBy(
        pendingBy.filter(
          (item) =>
            !JSON.parse(localStorage.getItem("$auth") ?? "")
              .roles.map((item: any) => item.role)
              .includes(item)
        )
      )
      setApprovedBy([
        ...new Set(
          approvedBy
            .concat(
              JSON.parse(localStorage.getItem("$auth") ?? "").roles.map((item: any) => item.role)
            )
            .filter((item) => item !== 1 && item !== 3)
        ),
      ])
      if (
        !pendingBy.filter(
          (item) =>
            !JSON.parse(localStorage.getItem("$auth") ?? "")
              .roles.map((item: any) => item.role)
              .includes(item)
        ).length
      ) {
        setSheetsDisabled(true)
      }
    },
    autoRefetch: false,
  })

  const approveMutation = api.mutations.useReleasesApiApproveRelease(
    asPath.split("/")[asPath.split("/").length - 1] as string,
    hooks
  )

  const magicQueryHooks = useMagicQueryHooks({
    onOk() {
      toast.success("Approval Revoked")
      query.refetch()
      revokeApprovalModal.onClose()
      setChecked(false)
      setSheetsDisabled(false)
      setApprovedBy(approvedBy.filter((item) => item !== 2))
      setPendingBy([2])
    },
    autoRefetch: false,
  })

  const revokeApprovalMutation = api.mutations.useReleasesApiRevokeApproval(
    asPath.split("/")[asPath.split("/").length - 1] as string,
    reason,
    magicQueryHooks.hooks
  )

  return (
    <Shell
      page={{
        name: "releases",
        title: response?.release_data ? `Manage ${response?.release_data.name}` : "Manage Release",
        banner: {
          title: response?.release_data
            ? `Manage ${response?.release_data.name}`
            : "Manage Release",
          subtitle: "Lorem ipsum dolor, sit amet consectetur adipisicing elit.",
        },
      }}
    >
      {data && asPath.split("/")[asPath.split("/").length - 1] != "[uuid]" ? (
        <>
          <WithQuery
            query={query}
            onOk={(response?: GetReleaseResponse) => (
              <If
                value={response}
                condition={(response) => (response?.release_data.items.length ?? 0) > 0}
                then={(response) => (
                  <>
                    <HStack w="full" spacing="6" align="center" justify="space-evenly">
                      {response.release_data.approvers.find((item) =>
                        JSON.parse(localStorage.getItem("$auth") ?? "")
                          .roles.map((item: any) => item.role)
                          .includes(item.group)
                      ) && (
                        <Checkbox
                          disabled={
                            (!(
                              (pendingBy.includes(2) || pendingBy.includes(4)) &&
                              (JSON.parse(localStorage.getItem("$auth") ?? "")
                                .roles.map((item: any) => item.role)
                                .includes(2) ||
                                JSON.parse(localStorage.getItem("$auth") ?? "")
                                  .roles.map((item: any) => item.role)
                                  .includes(4))
                            ) &&
                              response.release_data.approvers.find((item) =>
                                JSON.parse(localStorage.getItem("$auth") ?? "")
                                  .roles.map((item: any) => item.role)
                                  .includes(item.group)
                              )?.approved) ||
                            checked
                          }
                          isChecked={checked}
                          onChange={(e) => (e.target.checked ? onOpen() : onClose())}
                        >
                          Approve
                        </Checkbox>
                      )}
                      {sheetsDisabled &&
                        response.release_data.approvers.find((item) =>
                          JSON.parse(localStorage.getItem("$auth") ?? "")
                            .roles.map((item: any) => item.role)
                            .includes(2)
                        ) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            fontWeight="medium"
                            onClick={revokeApprovalModal.onOpen}
                          >
                            Revoke Approval
                          </Button>
                        )}
                    </HStack>
                    {approvedBy.length > 0 && (
                      <Text fontSize="md" textAlign="center">
                        This release has been approved by :{" "}
                        <strong>
                          {approvedBy.map((item, index) =>
                            index === approvedBy.length - 1
                              ? `${
                                  rolesOptions.find(
                                    (roleoption) => Number.parseInt(roleoption.value) === item
                                  )?.label
                                }`
                              : `${
                                  rolesOptions.find(
                                    (roleoption) => Number.parseInt(roleoption.value) === item
                                  )?.label
                                }, `
                          )}
                        </strong>
                      </Text>
                    )}
                    {pendingBy.length > 0 && (
                      <Text fontSize="md" textAlign="center">
                        This release is pending approval by :{" "}
                        <strong>
                          {pendingBy.map((item, index) =>
                            index === pendingBy.length - 1
                              ? `${
                                  rolesOptions.find(
                                    (roleoption) => Number.parseInt(roleoption.value) === item
                                  )?.label
                                }`
                              : `${
                                  rolesOptions.find(
                                    (roleoption) => Number.parseInt(roleoption.value) === item
                                  )?.label
                                }, `
                          )}
                        </strong>
                      </Text>
                    )}
                    {sheetsDisabled && (
                      <Text fontSize="md" fontWeight="bold" textAlign="center">
                        This release has been approved by all the approvers, hence can't be
                        modified. To make further adjustments, please contact your system
                        administrator.
                      </Text>
                    )}
                    <AppFormControl label="Target Envs" error={form.formState.errors.targetEnvs}>
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
                        isDisabled={
                          sheetsDisabled &&
                          !JSON.parse(localStorage.getItem("$auth") ?? "")
                            .roles.map((item: any) => item.role)
                            .includes(4)
                        }
                      />
                    </AppFormControl>
                    {[...new Set(response.release_data.items.map((item) => item.service))].map(
                      (item, index) => (
                        <TableSheets
                          key={item}
                          response={response.release_data.items.filter(
                            (responseItem) => responseItem.service === item
                          )}
                          constant={response.constants.filter(
                            (constantItem) => constantItem.service === item
                          )}
                          serviceOptions={serviceOptions}
                          sheetsDisabled={sheetsDisabled}
                          onBranchTagChange={handleBranchTagChange}
                        />
                      )
                    )}
                  </>
                )}
              />
            )}
          />

          <AlertDialog
            isOpen={isOpen}
            leastDestructiveRef={cancelRef}
            onClose={onClose}
            closeOnEsc={false}
            closeOnOverlayClick={false}
          >
            <AlertDialogOverlay>
              <AlertDialogContent>
                <AlertDialogHeader fontSize="lg" fontWeight="bold">
                  Approve {response?.release_data.name}
                </AlertDialogHeader>

                <AlertDialogBody>
                  Are you sure you want to approve the release? You can't undo this action
                  afterwards.
                </AlertDialogBody>

                <AlertDialogFooter>
                  <Button
                    ref={cancelRef}
                    onClick={() => {
                      onClose()
                      setChecked(false)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    colorScheme="red"
                    onClick={() => {
                      approveMutation.mutate({})
                    }}
                    ml={3}
                  >
                    Approve
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialogOverlay>
          </AlertDialog>

          <AlertDialog
            isOpen={revokeApprovalModal.isOpen}
            leastDestructiveRef={revokeApprovalCancelRef}
            onClose={revokeApprovalModal.onClose}
            closeOnEsc={false}
            closeOnOverlayClick={false}
          >
            <AlertDialogOverlay>
              <AlertDialogContent>
                <AlertDialogHeader fontSize="lg" fontWeight="bold">
                  Revoke Approval by {JSON.parse(localStorage.getItem("$auth") ?? "").email}
                </AlertDialogHeader>

                <AlertDialogBody>
                  Are you sure you want to revoke the approval? If yes, you need to provide a valid
                  reason to do so.
                  <Textarea
                    mt={4}
                    value={reason}
                    onChange={handleInputChange}
                    placeholder="Provide a valid reason, to revoke this approval"
                  />
                </AlertDialogBody>

                <AlertDialogFooter>
                  <Button ref={cancelRef} onClick={revokeApprovalModal.onClose}>
                    Cancel
                  </Button>
                  <Button
                    colorScheme="red"
                    onClick={() => {
                      if (reason) {
                        revokeApprovalMutation.mutate({})
                      } else {
                        toast.error("Reason field cannot by empty.")
                      }
                    }}
                    ml={3}
                  >
                    Revoke
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialogOverlay>
          </AlertDialog>

          <Box w="full" textAlign="end" py="8">
            <Button
              w={["full", "full", "auto"]}
              mr={2}
              type="submit"
              colorScheme="blue"
              rightIcon={<Icon as={IconCornerDownRight} />}
              isLoading={updateReleaseMutation.isLoading}
              loadingText="Saving"
              isDisabled={sheetsDisabled}
              onClick={() =>
                updateReleaseMutation.mutate({
                  release: {
                    name: response?.release_data.name ?? "",
                    items: data ?? [],
                  },
                  uuid: asPath.split("/")[asPath.split("/").length - 1],
                  targets: form.getValues().targetEnvs ?? [],
                })
              }
            >
              Save & Continue
            </Button>
            {JSON.parse(localStorage.getItem("$auth") ?? "").roles.find(
              (item: SimpleRolesSchema) => item.role === 4
            ) && (
              <Button
                w={["full", "full", "auto"]}
                colorScheme="blue"
                rightIcon={<Icon as={IconCornerDownRight} />}
                isLoading={updateReleaseMutation.isLoading}
                loadingText="Saving"
                onClick={() =>
                  updateReleaseMutation.mutate({
                    release: {
                      name: response?.release_data.name ?? "",
                      items: data ?? [],
                    },
                    uuid: asPath.split("/")[asPath.split("/").length - 1],
                    targets: form.getValues().targetEnvs ?? [],
                  })
                }
              >
                Save Devops
              </Button>
            )}
          </Box>
        </>
      ) : (
        <LoadingBlock />
      )}
    </Shell>
  )
}

function TableSheets(props: {
  response: SimpleReleaseItemModelSchema[]
  constant: SimpleConstantSchema[]
  serviceOptions: Array<IServiceOptions>
  sheetsDisabled: boolean
  onBranchTagChange: (data: SimpleReleaseItemModelSchema) => void
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
              <Table
                variant="simple"
                size="md"
                __css={{ "table-layout": "fixed", "width": "150%" }}
              >
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
                    {JSON.parse(localStorage.getItem("$auth") ?? "").roles.find(
                      (item: SimpleRolesSchema) => item.role === 4
                    ) && <Th>DevOps Notes</Th>}
                  </Tr>
                </Thead>

                <Tbody>
                  {props.response
                    .sort(function (x, y) {
                      if (!x.release_branch) {
                        return 1
                      }
                      if (!y.release_branch) {
                        return -1
                      }
                      return 0
                    })
                    .map((item, index) => (
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
                              p={2}
                              borderRadius="md"
                              bg={item.release_branch ? "green.100" : "red.100"}
                            >
                              {item.repo}
                            </Text>
                          </Tooltip>
                        </Td>
                        <Td>
                          <ChakraSelect
                            placeholder="Select Release Branch"
                            defaultValue={item.release_branch}
                            disabled={props.sheetsDisabled}
                            onChange={(e) =>
                              props.onBranchTagChange({
                                release_branch: e.target.value ?? "",
                                service: item.service,
                                repo: item.repo,
                              } as SimpleReleaseItemModelSchema)
                            }
                          >
                            {(
                              props.constant.find((constantItem) => constantItem.repo === item.repo)
                                ?.branches ?? []
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
                            disabled={props.sheetsDisabled}
                            onChange={(e) =>
                              props.onBranchTagChange({
                                hotfix_branch: e.target.value ?? "",
                                service: item.service,
                                repo: item.repo,
                              } as SimpleReleaseItemModelSchema)
                            }
                          >
                            {(
                              props.constant.find((constantItem) => constantItem.repo === item.repo)
                                ?.branches ?? []
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
                            disabled={props.sheetsDisabled}
                            onChange={(e) =>
                              props.onBranchTagChange({
                                tag: e.target.value ?? "",
                                service: item.service,
                                repo: item.repo,
                              } as SimpleReleaseItemModelSchema)
                            }
                          >
                            {(
                              props.constant.find((constantItem) => constantItem.repo === item.repo)
                                ?.tags ?? []
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
                            isDisabled={props.sheetsDisabled}
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
                              placeholder="Notes"
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
  )
}
