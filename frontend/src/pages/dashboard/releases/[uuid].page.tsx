import { Shell } from "@/components/layout/Shell"
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Icon,
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
  SimpleGrid,
  Input,
} from "@chakra-ui/react"
import { IconCornerDownRight, IconFileExport } from "@tabler/icons-react"
import { useAppMutation } from "@/hooks/useAppMutation"
import { api } from "@/api"
import { useRouter } from "next/router"
import { Access } from "@/types/Page"
import { useMagicQueryHooks } from "@/hooks/useAppQuery"
import WithQuery from "@/components/indicators/WithQuery"
import {
  GetReleaseResponse,
  SimpleReleaseItemModelSchema,
  SimpleRolesSchema,
  SimpleTalendReleaseItemModelSchema,
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
import Datetime from "react-datetime"
import { DateTime } from "luxon"
import { Select } from "chakra-react-select"
import "react-datetime/css/react-datetime.css"
import { reverse } from "@/utils/reverse"

// This page is only accessible by a User.
ManageReleasePage.access = Access.User

interface IServiceOptions {
  label: string
  value: string
}

const schema = zod.object({
  targetEnvs: zod.array(zod.string().nonempty()).nullish().default(null),
  deploymentComment: zod.string(),
})

export default function ManageReleasePage() {
  const { asPath, push } = useRouter()
  const [response, setResponse] = useState<GetReleaseResponse>()
  const [data, setData] = useState<Array<SimpleReleaseItemModelSchema>>()
  const [serviceOptions, setServiceOptions] = useState<Array<IServiceOptions>>([])
  const [checked, setChecked] = useState<boolean>(false)
  const [sheetsDisabled, setSheetsDisabled] = useState<boolean>(false)
  const [approvedBy, setApprovedBy] = useState<Array<number>>([])
  const [pendingBy, setPendingBy] = useState<Array<number>>([])
  const [talendData, setTalendData] = useState<Array<SimpleTalendReleaseItemModelSchema>>([
    { job_name: "", package_location: "" },
  ])

  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = useRef(null)

  const revokeApprovalModal = useDisclosure()
  const revokeApprovalCancelRef = useRef(null)

  const [reason, setReason] = useState("")

  const [startWindowDT, setStartWindowDT] = useState<Date>()
  const [endWindowDT, setEndWindowDT] = useState<Date>()

  const [deploymentStatus, setDeploymentStatus] = useState<number>(0)
  const [falseBranches, setFalseBranches] = useState<Array<string>>([])

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
      if (!(response && data)) {
        form.reset({
          targetEnvs:
            (responseData.result as GetReleaseResponse).release_data.targets.map(
              (item) => item.target
            ) ?? [],
          deploymentComment: (responseData.result as GetReleaseResponse).release_data
            .deployment_comment,
        })
        setStartWindowDT(
          new Date(
            (responseData.result as GetReleaseResponse).release_data.start_window!.replace("Z", "")
          )
        )
        setEndWindowDT(
          new Date(
            (responseData.result as GetReleaseResponse).release_data.end_window!.replace("Z", "")
          )
        )
        setDeploymentStatus(
          (responseData.result as GetReleaseResponse).release_data.deployment_status
        )
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
        setTalendData(
          (responseData.result as GetReleaseResponse).release_data.talend_items.length
            ? (responseData.result as GetReleaseResponse).release_data.talend_items
            : [{ job_name: "", package_location: "" }]
        )
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
          feature_number: updatedRow?.feature_number,
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
          feature_number: updatedRow?.feature_number,
          special_notes: updatedRow?.special_notes,
          devops_notes: updatedRow?.devops_notes,
        } as SimpleReleaseItemModelSchema,
      ])
    }
    if ("feature_number" in eventData) {
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
          feature_number: updatedRow?.feature_number,
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
          feature_number: updatedRow?.feature_number,
          special_notes: updatedRow?.special_notes,
        } as SimpleReleaseItemModelSchema,
      ])
    }
  }

  const updateReleaseMutation = useAppMutation(api.mutations.useReleasesApiUpdateRelease, {
    onOk() {
      toast.success("Updated")
    },
    onNotOk(response) {
      if (response.error?.reason === "branch_not_found") {
        setFalseBranches(response.error.detail?.split(", ") ?? [])
        toast.error(
          `Release branch you entered in ${response.error.detail} does not exist. Please verify the branches and try again`,
          { duration: 5000 }
        )
      } else {
        toast.error(
          "This release has been approved by all the users and can't be further modified. Please contact your system administrator."
        )
        setSheetsDisabled(true)
      }
    },
  })

  const deletePendingReleaseItemsMutation = api.mutations.useReleasesApiDeletePendingReleaseItems(
    asPath.split("/")[asPath.split("/").length - 1] as string
  )

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
        deletePendingReleaseItemsMutation.mutate({})
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
        sliver: {
          title: response?.release_data
            ? `Manage ${response?.release_data.name}`
            : "Manage Release",
          subtitle: "Manage, Modify and View the release",
        },
      }}
      actions={{
        mainActions: [
          {
            label: response?.release_data
              ? `Export ${response?.release_data.name}`
              : "Export Release",
            icon: <Icon as={IconFileExport} />,
            onClick: () =>
              push(reverse.user.exportRelease(asPath.split("/")[asPath.split("/").length - 1])),
          },
        ],
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
                          isDisabled={
                            sheetsDisabled &&
                            !JSON.parse(localStorage.getItem("$auth") ?? "")
                              .roles.map((item: any) => item.role)
                              .includes(4)
                          }
                        />
                      </AppFormControl>

                      <HStack w={["full", "full", "50%"]}>
                        <AppFormControl w={["full", "full", "50%"]} label="Start Window">
                          <Datetime
                            initialValue={startWindowDT}
                            onChange={(value: any) => setStartWindowDT(value.toDate())}
                            inputProps={{
                              disabled:
                                sheetsDisabled &&
                                !JSON.parse(localStorage.getItem("$auth") ?? "")
                                  .roles.map((item: any) => item.role)
                                  .includes(4),
                            }}
                          />
                        </AppFormControl>

                        <AppFormControl w={["full", "full", "50%"]} label="End Window">
                          <Datetime
                            initialValue={endWindowDT}
                            onChange={(value: any) => setEndWindowDT(value.toDate())}
                            inputProps={{
                              disabled:
                                sheetsDisabled &&
                                !JSON.parse(localStorage.getItem("$auth") ?? "")
                                  .roles.map((item: any) => item.role)
                                  .includes(4),
                            }}
                          />
                        </AppFormControl>
                      </HStack>
                    </SimpleGrid>

                    <SimpleGrid
                      w="full"
                      columns={[1, 1, 2]}
                      spacing={[6, 8]}
                      display="flex"
                      flexDirection={["column", "column", "row"]}
                      alignItems="flex-start"
                    >
                      <AppFormControl w={["full", "full", "50%"]} label="Deployment Status">
                        <Select
                          colorScheme="purple"
                          placeholder="Select the deployment status"
                          options={deploymentStatusOptions}
                          defaultValue={deploymentStatusOptions.find(
                            (item) => item.value === deploymentStatus
                          )}
                          isDisabled={
                            sheetsDisabled &&
                            !JSON.parse(localStorage.getItem("$auth") ?? "")
                              .roles.map((item: any) => item.role)
                              .includes(4)
                          }
                          onChange={(e) => {
                            setDeploymentStatus(e?.value!)
                          }}
                        />
                      </AppFormControl>

                      <AppFormControl
                        w={["full", "full", "50%"]}
                        label="Deployment Comments"
                        error={form.formState.errors.deploymentComment}
                      >
                        <Textarea
                          placeholder="Deployment Comments"
                          disabled={
                            sheetsDisabled &&
                            !JSON.parse(localStorage.getItem("$auth") ?? "")
                              .roles.map((item: any) => item.role)
                              .includes(4)
                          }
                          {...form.register("deploymentComment")}
                        />
                      </AppFormControl>
                    </SimpleGrid>

                    {falseBranches.length > 0 && (
                      <Text color="red.800">
                        Release branch you entered in <strong>`{falseBranches.join(", ")}`</strong>{" "}
                        does not exist. Please verify the branches and try again
                      </Text>
                    )}

                    {!(
                      sheetsDisabled &&
                      talendData.length == 1 &&
                      talendData[0].job_name == ""
                    ) && (
                      <Box w="full">
                        <VStack w="full" spacing="12">
                          <Card w="full">
                            <CardHeader>
                              <Heading size="md">Talend</Heading>
                            </CardHeader>

                            <CardBody>
                              <TableContainer w="full">
                                <Table
                                  variant="simple"
                                  size="md"
                                  __css={{ "table-layout": "fixed", "width": "100%" }}
                                >
                                  <TableCaption>Talend</TableCaption>

                                  <Thead>
                                    <Tr>
                                      <Th>Job Name</Th>
                                      <Th>Package Location</Th>
                                    </Tr>
                                  </Thead>

                                  <Tbody>
                                    {talendData.map((item, index) => (
                                      <Tr key={index}>
                                        <Td>
                                          <Input
                                            type="text"
                                            variant="filled"
                                            placeholder="Enter Job Name"
                                            defaultValue={item.job_name ?? ""}
                                            disabled={sheetsDisabled}
                                            onChange={(e) => {
                                              const copyArr = [...talendData]
                                              const element = copyArr[index]
                                              const talendObj = {
                                                job_name: e.target.value,
                                                package_location: element.package_location,
                                              }
                                              copyArr[index] = talendObj
                                              setTalendData(copyArr)
                                            }}
                                          />
                                        </Td>
                                        <Td>
                                          <Input
                                            type="text"
                                            variant="filled"
                                            placeholder="Enter Package Location"
                                            defaultValue={item.package_location ?? ""}
                                            disabled={sheetsDisabled}
                                            onChange={(e) => {
                                              const copyArr = [...talendData]
                                              const element = copyArr[index]
                                              const talendObj = {
                                                job_name: element.job_name,
                                                package_location: e.target.value,
                                              }
                                              copyArr[index] = talendObj
                                              setTalendData(copyArr)
                                            }}
                                          />
                                        </Td>
                                      </Tr>
                                    ))}
                                    {!sheetsDisabled && (
                                      <Tr>
                                        <Td>
                                          <Button
                                            onClick={() => {
                                              talendData[talendData.length - 1].job_name
                                                ? setTalendData((oldTalendData) => {
                                                    return [
                                                      ...oldTalendData,
                                                      { job_name: "", package_location: "" },
                                                    ]
                                                  })
                                                : toast.error("Please fill out the prior Job Name")
                                            }}
                                          >
                                            Add
                                          </Button>
                                        </Td>
                                        <Td></Td>
                                      </Tr>
                                    )}
                                  </Tbody>

                                  <Tfoot>
                                    <Tr>
                                      <Th>Job Name</Th>
                                      <Th>Package Location</Th>
                                    </Tr>
                                  </Tfoot>
                                </Table>
                              </TableContainer>
                            </CardBody>
                          </Card>
                        </VStack>
                      </Box>
                    )}

                    {[...new Set(response.release_data.items.map((item) => item.service))].map(
                      (item, index) => (
                        <TableSheets
                          key={item}
                          response={response.release_data.items.filter(
                            (responseItem) => responseItem.service === item
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
                    talend_items: talendData.filter((item) => item.job_name),
                    start_window: DateTime.fromISO(startWindowDT!.toISOString())
                      .toFormat("yyyy-MM-dd HH:mm:ss")
                      .replace(" ", "T"),
                    end_window: DateTime.fromISO(endWindowDT!.toISOString())
                      .toFormat("yyyy-MM-dd HH:mm:ss")
                      .replace(" ", "T"),
                    deployment_status: deploymentStatus,
                    deployment_comment: form.getValues().deploymentComment,
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
                      talend_items: talendData.filter((item) => item.job_name),
                      start_window: DateTime.fromISO(startWindowDT!.toISOString())
                        .toFormat("yyyy-MM-dd HH:mm:ss")
                        .replace(" ", "T"),
                      end_window: DateTime.fromISO(endWindowDT!.toISOString())
                        .toFormat("yyyy-MM-dd HH:mm:ss")
                        .replace(" ", "T"),
                      deployment_status: deploymentStatus,
                      deployment_comment: form.getValues().deploymentComment,
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

export const deploymentStatusOptions = [
  { label: "Unknown", value: 0 },
  { label: "Success", value: 1 },
  { label: "Partial Success", value: 2 },
  { label: "Fail", value: 3 },
]

function TableSheets(props: {
  response: SimpleReleaseItemModelSchema[]
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
                __css={{ "table-layout": "fixed", "width": "100%" }}
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
                    <Th>Feature Number</Th>
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
                          <Tooltip label={`https://github.com/${item.repo}`}>
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
                              https://github.com/{item.repo}
                            </Text>
                          </Tooltip>
                        </Td>
                        <Td>
                          <Input
                            type="text"
                            variant="filled"
                            placeholder="Enter Release Branch"
                            defaultValue={item.release_branch}
                            disabled={props.sheetsDisabled}
                            onChange={(e) =>
                              props.onBranchTagChange({
                                release_branch: e.target.value ?? "",
                                service: item.service,
                                repo: item.repo,
                              } as SimpleReleaseItemModelSchema)
                            }
                          />
                        </Td>
                        <Td>
                          <Input
                            type="text"
                            variant="filled"
                            placeholder="Enter Feature/Defect Number"
                            defaultValue={item.feature_number}
                            disabled={props.sheetsDisabled}
                            onChange={(e) =>
                              props.onBranchTagChange({
                                feature_number: e.target.value ?? "",
                                service: item.service,
                                repo: item.repo,
                              } as SimpleReleaseItemModelSchema)
                            }
                          />
                        </Td>
                        <Td>
                          <Input
                            type="text"
                            variant="filled"
                            placeholder="Enter Tag"
                            defaultValue={item.tag}
                            disabled={props.sheetsDisabled}
                            onChange={(e) =>
                              props.onBranchTagChange({
                                tag: e.target.value ?? "",
                                service: item.service,
                                repo: item.repo,
                              } as SimpleReleaseItemModelSchema)
                            }
                          />
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
                    <Th>Feature Number</Th>
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
