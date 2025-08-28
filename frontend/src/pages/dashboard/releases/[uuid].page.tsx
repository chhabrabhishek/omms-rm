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
  Select as ChakraSelect,
  Tag,
  Code,
} from "@chakra-ui/react"
import { IconCornerDownRight, IconDrone, IconFileExport, IconJson } from "@tabler/icons-react"
import { useAppMutation } from "@/hooks/useAppMutation"
import { api } from "@/api"
import { useRouter } from "next/router"
import { Access } from "@/types/Page"
import { useMagicQueryHooks } from "@/hooks/useAppQuery"
import WithQuery from "@/components/indicators/WithQuery"
import {
  ApprovedByResponse,
  GetReleaseResponse,
  SimpleApproverModelSchema,
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
  const [deploymentStarted, setDeploymentStarted] = useState<boolean>(false)
  const [approvedBy, setApprovedBy] = useState<Array<SimpleApproverModelSchema>>([])
  const [pendingBy, setPendingBy] = useState<Array<number>>([])
  const [talendData, setTalendData] = useState<Array<SimpleTalendReleaseItemModelSchema>>([
    { job_name: "", package_location: "", feature_number: "", special_notes: "" },
  ])

  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = useRef(null)

  const revokeApprovalModal = useDisclosure()
  const revokeApprovalCancelRef = useRef(null)

  const deployModal = useDisclosure()
  const deployCancelRef = useRef(null)

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
            setApprovedBy((previousApprovedBy) => [...previousApprovedBy, approver])
          } else {
            setPendingBy((previousPendingBy) => [...previousPendingBy, approver.group])
          }
        }
        setTalendData(
          (responseData.result as GetReleaseResponse).release_data.talend_items.length
            ? (responseData.result as GetReleaseResponse).release_data.talend_items
            : [{ job_name: "", package_location: "", feature_number: "", special_notes: "" }]
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
      const { tag, repo, service, ...rest } = updatedRow ?? {}
      setData((previousData) => [
        ...(previousData as SimpleReleaseItemModelSchema[]),
        {
          ...eventData,
          ...rest,
        } as SimpleReleaseItemModelSchema,
      ])
    }
    if ("release_branch" in eventData) {
      const { release_branch, repo, service, ...rest } = updatedRow ?? {}
      setData((previousData) => [
        ...(previousData as SimpleReleaseItemModelSchema[]),
        {
          ...eventData,
          ...rest,
        } as SimpleReleaseItemModelSchema,
      ])
    }
    if ("feature_number" in eventData) {
      const { feature_number, repo, service, ...rest } = updatedRow ?? {}
      setData((previousData) => [
        ...(previousData as SimpleReleaseItemModelSchema[]),
        {
          ...eventData,
          ...rest,
        } as SimpleReleaseItemModelSchema,
      ])
    }
    if ("special_notes" in eventData) {
      const { special_notes, repo, service, ...rest } = updatedRow ?? {}
      setData((previousData) => [
        ...(previousData as SimpleReleaseItemModelSchema[]),
        {
          ...eventData,
          ...rest,
        } as SimpleReleaseItemModelSchema,
      ])
    }
    if ("devops_notes" in eventData) {
      const { devops_notes, repo, service, ...rest } = updatedRow ?? {}
      setData((previousData) => [
        ...(previousData as SimpleReleaseItemModelSchema[]),
        {
          ...eventData,
          ...rest,
        } as SimpleReleaseItemModelSchema,
      ])
    }
    if ("azure_env" in eventData) {
      const { azure_env, repo, service, ...rest } = updatedRow ?? {}
      setData((previousData) => [
        ...(previousData as SimpleReleaseItemModelSchema[]),
        {
          ...eventData,
          ...rest,
        } as SimpleReleaseItemModelSchema,
      ])
    }
    if ("azure_tenant" in eventData) {
      const { azure_tenant, repo, service, ...rest } = updatedRow ?? {}
      setData((previousData) => [
        ...(previousData as SimpleReleaseItemModelSchema[]),
        {
          ...eventData,
          ...rest,
        } as SimpleReleaseItemModelSchema,
      ])
    }
    if ("platform" in eventData) {
      const { platform, repo, service, ...rest } = updatedRow ?? {}
      setData((previousData) => [
        ...(previousData as SimpleReleaseItemModelSchema[]),
        {
          ...eventData,
          ...rest,
        } as SimpleReleaseItemModelSchema,
      ])
    }
  }

  const updateReleaseMutation = useAppMutation(api.mutations.useReleasesApiUpdateRelease, {
    onOk(response) {
      toast.success("Updated")
      setFalseBranches([])
      setTalendData(response.result?.talend_items ?? [])
    },
    onNotOk(response) {
      if (response.error?.reason === "branch_not_found") {
        setFalseBranches(response.error.detail?.split(", ") ?? [])
        toast.error(
          `Tag or Release Branch you entered in ${response.error.detail} does not exist. Please verify and try again`,
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
    onOk(response) {
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
      setApprovedBy((response.result as ApprovedByResponse).approved_by)
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
      setApprovedBy(approvedBy.filter((item) => item.group !== 2))
      setPendingBy([2])
    },
  })

  const revokeApprovalMutation = api.mutations.useReleasesApiRevokeApproval(
    asPath.split("/")[asPath.split("/").length - 1] as string,
    reason,
    magicQueryHooks.hooks
  )

  const jobStatusMagic = useMagicQueryHooks({
    onOk(responseData) {},
  })

  const jobStatusMutation = api.mutations.useReleasesApiGetDeploymentStatus(
    asPath.split("/")[asPath.split("/").length - 1] as string,
    jobStatusMagic.hooks
  )

  const deployMutation = useAppMutation(api.mutations.useReleasesApiDeployRelease, {
    onOk() {
      toast.success("Deployment Started")
    },
    onNotOk(response) {
      if (response.error?.reason === "devops_role_not_found") {
        toast.error(`You can only deploy if you have Devops role.`)
      } else if (response.error?.reason === "release_not_approved") {
        toast.error(
          `This release is still pending approvals. Please get all the approvals before deployment.`
        )
      } else if (response.error?.reason === "deployment_already_started") {
        toast.error(`This deployment has already been started for this release. Please refresh.`)
      } else {
        toast.error(
          "Something went wrong while triggering builds. Please check in Jenkins for more information."
        )
        setDeploymentStarted(false)
      }
    },
  })

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
        callToAction: {
          label: "Export JSON data",
          icon: <Icon as={IconJson} />,
          onClick: () =>
            push(reverse.user.exportJSON(asPath.split("/")[asPath.split("/").length - 1])),
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
                condition={(response) =>
                  ((response?.release_data.items.length ||
                    response?.release_data.talend_items.length) ??
                    0) >= 0
                }
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
                          {approvedBy.map(
                            (item, index) =>
                              `${
                                rolesOptions.find(
                                  (roleoption) => Number.parseInt(roleoption.value) === item.group
                                )?.label
                              } (${
                                item.approved_by
                                  ? item.approved_by?.first_name + " " + item.approved_by?.last_name
                                  : "Unknown"
                              })${index == approvedBy.length - 1 ? "" : ", "}`
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
                      alignItems={["flex-start", "flex-start", "center"]}
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
                        <Text fontSize="sm" textAlign="center" fontWeight="bold">
                          If this release is for OFE, please make sure your Target Envs contains
                          either of the following values:
                        </Text>
                        <Text fontSize="sm" textAlign="center" fontWeight="bold">
                          [mtpt, mtuat, mtstage, mtprod]
                        </Text>
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

                    {response.release_data.revoke_approvers.length ? (
                      <SimpleGrid
                        w="full"
                        columns={[1, 1, 1]}
                        spacing={[6, 8]}
                        display="flex"
                        flexDirection={["column", "column", "row"]}
                        alignItems="flex-start"
                      >
                        <AppFormControl
                          w={["full", "full", "full"]}
                          label={`Revoked Approvals (${response.release_data.revoke_approvers.length})`}
                        >
                          <VStack
                            align="flex-start"
                            gap={4}
                            borderWidth="1px"
                            borderColor="gray.200"
                            borderRadius="md"
                            p={4}
                          >
                            {response.release_data.revoke_approvers.map((item) => (
                              <Text
                                fontSize="md"
                                borderLeftWidth={2}
                                borderLeftColor="brand"
                                pl={4}
                              >
                                {item.reason}
                                <br></br>
                                <strong>
                                  - {item.user?.first_name} {item.user?.last_name} (
                                  {item.created_at})
                                </strong>
                              </Text>
                            ))}
                          </VStack>
                        </AppFormControl>
                      </SimpleGrid>
                    ) : (
                      <></>
                    )}

                    {response.release_data.deployed_by && (
                      <SimpleGrid
                        w="full"
                        columns={[1, 1, 2]}
                        spacing={[6, 8]}
                        display="flex"
                        flexDirection={["column", "column", "row"]}
                        alignItems="flex-start"
                      >
                        <AppFormControl w={["full", "full", "50%"]} label="Deployed By">
                          <Input
                            type="text"
                            variant="filled"
                            defaultValue={`${response.release_data.deployed_by?.first_name} ${response.release_data.deployed_by?.last_name}`}
                            disabled={true}
                          />
                        </AppFormControl>
                        <AppFormControl w={["full", "full", "50%"]} label="Job Status">
                          <Button onClick={() => jobStatusMutation.mutate({})}>
                            Poll Job Status
                          </Button>
                        </AppFormControl>
                      </SimpleGrid>
                    )}

                    {falseBranches.length > 0 && (
                      <Text color="red.800">
                        Tag or Release Branch you entered in{" "}
                        <strong>`{falseBranches.join(", ")}`</strong> does not exist. Please verify
                        and try again
                      </Text>
                    )}

                    {!(
                      sheetsDisabled &&
                      talendData.length == 1 &&
                      talendData[0].job_name == ""
                    ) && (
                      <Box w="full">
                        <VStack w="full" spacing="12">
                          <Card w="full" borderWidth="6px" borderColor="gray.100">
                            <CardHeader>
                              <Heading size="md">
                                {response.release_data.targets.find(
                                  (item) => item.target.toLowerCase() == "salesforce"
                                )
                                  ? "Salesforce"
                                  : "Talend"}
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
                                    {response.release_data.targets.find(
                                      (item) => item.target.toLowerCase() == "salesforce"
                                    )
                                      ? "Salesforce"
                                      : "Talend"}
                                  </TableCaption>

                                  <Thead>
                                    <Tr>
                                      <Th>Job Name</Th>
                                      <Th>
                                        {response.release_data.targets.find(
                                          (item) => item.target.toLowerCase() == "salesforce"
                                        )
                                          ? "Repo URL Location"
                                          : "Package Location"}
                                      </Th>
                                      <Th>Feature Number</Th>
                                      <Th>Special Notes</Th>
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
                                                id: element.id,
                                                job_name: e.target.value,
                                                package_location: element.package_location,
                                                feature_number: element.feature_number,
                                                special_notes: element.special_notes,
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
                                            placeholder={
                                              response.release_data.targets.find(
                                                (item) => item.target.toLowerCase() == "salesforce"
                                              )
                                                ? "Enter Repo URL Location"
                                                : "Enter Package Location"
                                            }
                                            defaultValue={item.package_location ?? ""}
                                            disabled={sheetsDisabled}
                                            onChange={(e) => {
                                              const copyArr = [...talendData]
                                              const element = copyArr[index]
                                              const talendObj = {
                                                id: element.id,
                                                job_name: element.job_name,
                                                package_location: e.target.value,
                                                feature_number: element.feature_number,
                                                special_notes: element.special_notes,
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
                                            placeholder="Enter Feature Number"
                                            defaultValue={item.feature_number ?? ""}
                                            disabled={sheetsDisabled}
                                            onChange={(e) => {
                                              const copyArr = [...talendData]
                                              const element = copyArr[index]
                                              const talendObj = {
                                                id: element.id,
                                                job_name: element.job_name,
                                                package_location: element.package_location,
                                                feature_number: e.target.value,
                                                special_notes: element.special_notes,
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
                                            placeholder="Enter Special Notes"
                                            defaultValue={item.special_notes ?? ""}
                                            disabled={sheetsDisabled}
                                            onChange={(e) => {
                                              const copyArr = [...talendData]
                                              const element = copyArr[index]
                                              const talendObj = {
                                                id: element.id,
                                                job_name: element.job_name,
                                                package_location: element.package_location,
                                                feature_number: element.feature_number,
                                                special_notes: e.target.value,
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
                                                      {
                                                        job_name: "",
                                                        package_location: "",
                                                        feature_number: "",
                                                        special_notes: "",
                                                      },
                                                    ]
                                                  })
                                                : toast.error("Please fill out the prior Job Name")
                                            }}
                                          >
                                            Add
                                          </Button>
                                        </Td>
                                        <Td></Td>
                                        <Td></Td>
                                        <Td></Td>
                                      </Tr>
                                    )}
                                  </Tbody>

                                  <Tfoot>
                                    <Tr>
                                      <Th>Job Name</Th>
                                      <Th>
                                        {response.release_data.targets.find(
                                          (item) => item.target.toLowerCase() == "salesforce"
                                        )
                                          ? "Repo URL Location"
                                          : "Package Location"}
                                      </Th>
                                      <Th>Feature Number</Th>
                                      <Th>Special Notes</Th>
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
                          deploymentStarted={
                            response.release_data.deployed_by ? true : deploymentStarted
                          }
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
                  <Button ref={revokeApprovalCancelRef} onClick={revokeApprovalModal.onClose}>
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

          <AlertDialog
            isOpen={deployModal.isOpen}
            leastDestructiveRef={deployCancelRef}
            onClose={deployModal.onClose}
            closeOnEsc={false}
            closeOnOverlayClick={false}
          >
            <AlertDialogOverlay>
              <AlertDialogContent>
                <AlertDialogHeader fontSize="lg" fontWeight="bold">
                  Deploy {response?.release_data.name} Items
                </AlertDialogHeader>

                <AlertDialogBody>
                  Are you sure you want to deploy all the release items? Please check all the build
                  parameters carefully.
                </AlertDialogBody>

                <AlertDialogFooter>
                  <Button
                    ref={deployCancelRef}
                    onClick={() => {
                      deployModal.onClose()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    colorScheme="red"
                    onClick={() => {
                      setDeploymentStarted(true)
                      deployModal.onClose()
                      const deployData = data.map((item) => {
                        return {
                          repo: item.repo,
                          service: item.service,
                          release_branch: item.release_branch,
                          tag: item.tag,
                          platform: item.platform ? item.platform : "azure",
                          azure_env: item.azure_env ? item.azure_env : "pat",
                          azure_tenant: item.azure_tenant ? item.azure_tenant : "at",
                        }
                      })
                      deployMutation.mutate({
                        items: deployData,
                        uuid: asPath.split("/")[asPath.split("/").length - 1],
                      })
                      jobStatusMutation.mutate({})
                    }}
                    ml={3}
                  >
                    Deploy
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
              onClick={() => {
                type ChangedItem = {
                  repo: string
                  service: string
                  [key: string]: any
                }

                function getChangedFieldsWithValues(
                  obj1List: SimpleReleaseItemModelSchema[],
                  obj2List: SimpleReleaseItemModelSchema[]
                ): ChangedItem[] {
                  const changes: ChangedItem[] = []

                  const defObject = {
                    repo: "default_value_unique",
                    service: "default_value_unique",
                    release_branch: "default_value_unique",
                    feature_number: "default_value_unique",
                    tag: "default_value_unique",
                    special_notes: "default_value_unique",
                    devops_notes: "default_value_unique",
                    platform: "default_value_unique",
                    azure_env: "default_value_unique",
                    azure_tenant: "default_value_unique",
                    job_status: "default_value_unique",
                    job_logs: "default_value_unique",
                  }

                  obj1List.forEach((obj1) => {
                    const match = obj2List.find(
                      (obj2) => obj2.repo === obj1.repo && obj2.service === obj1.service
                    )

                    if (match) {
                      const changedItem: ChangedItem = {
                        repo: obj1.repo,
                        service: obj1.service,
                      }

                      ;(Object.keys(obj1) as (keyof SimpleReleaseItemModelSchema)[]).forEach(
                        (key) => {
                          if (obj1[key] !== match[key]) {
                            changedItem[key] = obj1[key]
                          }
                        }
                      )

                      if (Object.keys(changedItem).length > 2) {
                        changes.push({ ...defObject, ...changedItem })
                      }
                    }
                  })

                  return changes
                }

                const result = getChangedFieldsWithValues(data, response?.release_data.items ?? [])

                updateReleaseMutation.mutate({
                  release: {
                    name: response?.release_data.name ?? "",
                    items: result ?? [],
                    talend_items: talendData.filter((item) => item.id || item.job_name),
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
              }}
            >
              Save & Continue
            </Button>
            {JSON.parse(localStorage.getItem("$auth") ?? "").roles.find(
              (item: SimpleRolesSchema) => item.role === 4
            ) && (
              <Button
                w={["full", "full", "auto"]}
                mr={2}
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
            {JSON.parse(localStorage.getItem("$auth") ?? "").roles.find(
              (item: SimpleRolesSchema) => item.role === 4
            ) &&
              sheetsDisabled && (
                <Button
                  w={["full", "full", "auto"]}
                  colorScheme="blue"
                  rightIcon={<Icon as={IconDrone} />}
                  isDisabled={
                    !sheetsDisabled ||
                    deploymentStarted ||
                    (response?.release_data.deployed_by ? true : false)
                  }
                  isLoading={deployMutation.isLoading}
                  loadingText="Deploying"
                  onClick={deployModal.onOpen}
                >
                  Start Deployment
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
  { label: "Started", value: 4 },
]

function TableSheets(props: {
  response: SimpleReleaseItemModelSchema[]
  serviceOptions: Array<IServiceOptions>
  sheetsDisabled: boolean
  onBranchTagChange: (data: SimpleReleaseItemModelSchema) => void
  deploymentStarted: boolean
}) {
  const [platform, setPlatform] = useState<any>({})
  // const [currentJobLogs, setCurrentJobLogs] = useState<any>({})

  // const { isOpen, onOpen, onClose } = useDisclosure()
  // const cancelRef = useRef(null)

  return (
    <Box w="full">
      <VStack w="full" spacing="12">
        <Card w="full" borderWidth="6px" borderColor="gray.100">
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
                __css={{ "table-layout": "fixed", "width": props.sheetsDisabled ? "150%" : "100%" }}
              >
                <TableCaption>
                  {
                    props.serviceOptions.find((item) => item.value === props.response[0].service)
                      ?.label
                  }
                </TableCaption>

                <Thead>
                  <Tr>
                    <Th position="sticky" left={0} zIndex={2} bg="white">
                      Git Repo
                    </Th>
                    <Th>Tags</Th>
                    <Th>Feature Number</Th>
                    <Th>Release Branches</Th>
                    <Th>Special Notes</Th>
                    <Th>DevOps Notes</Th>
                    {props.sheetsDisabled && (
                      <>
                        <Th>Platform</Th>
                        <Th>Environment</Th>
                        <Th>Tenant</Th>
                        <Th>Job Status</Th>
                      </>
                    )}
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
                        <Td position="sticky" left={0} zIndex={2} bg="white">
                          <Tooltip label={`https://github.com/${item.repo}`}>
                            <Text
                              whiteSpace="initial"
                              css={{
                                "&::-webkit-scrollbar": {
                                  display: "none",
                                },
                              }}
                              p={2}
                              borderRadius="md"
                              bg={item.tag || item.release_branch ? "green.100" : "red.100"}
                            >
                              https://github.com/{item.repo}
                            </Text>
                          </Tooltip>
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
                            disabled={
                              !JSON.parse(localStorage.getItem("$auth") ?? "").roles.find(
                                (item: SimpleRolesSchema) => item.role === 4
                              )
                            }
                          />
                        </Td>
                        {props.sheetsDisabled && (
                          <>
                            <Td>
                              <ChakraSelect
                                defaultValue={props.deploymentStarted ? item.platform : "azure"}
                                variant="filled"
                                onChange={(e) => {
                                  setPlatform({
                                    ...platform,
                                    [`${item.repo}${item.service}`]:
                                      e.target.selectedOptions[0].value,
                                  })
                                  props.onBranchTagChange({
                                    platform: e.target.selectedOptions[0].value,
                                    service: item.service,
                                    repo: item.repo,
                                  } as SimpleReleaseItemModelSchema)
                                }}
                                isDisabled={
                                  props.deploymentStarted ||
                                  !JSON.parse(localStorage.getItem("$auth") ?? "").roles.find(
                                    (item: SimpleRolesSchema) => item.role === 4
                                  )
                                }
                              >
                                {["azure", "onprem", "mule"].map((item) => (
                                  <option key={item} value={item}>
                                    {item.toUpperCase()}
                                  </option>
                                ))}
                              </ChakraSelect>
                            </Td>
                            <Td>
                              {props.deploymentStarted ? (
                                <Input
                                  type="text"
                                  variant="filled"
                                  defaultValue={item.azure_env?.toUpperCase()}
                                  disabled
                                />
                              ) : (
                                <ChakraSelect
                                  defaultValue={props.deploymentStarted ? item.azure_env : "pat"}
                                  variant="filled"
                                  onChange={(e) =>
                                    props.onBranchTagChange({
                                      azure_env: e.target.selectedOptions[0].value,
                                      service: item.service,
                                      repo: item.repo,
                                    } as SimpleReleaseItemModelSchema)
                                  }
                                  isDisabled={
                                    props.deploymentStarted ||
                                    !JSON.parse(localStorage.getItem("$auth") ?? "").roles.find(
                                      (item: SimpleRolesSchema) => item.role === 4
                                    )
                                  }
                                >
                                  {(!platform[`${item.repo}${item.service}`] ||
                                  platform[`${item.repo}${item.service}`] == "azure"
                                    ? [
                                        "pat",
                                        "demo",
                                        "dev",
                                        "test",
                                        "dev2",
                                        "test2",
                                        "dev3",
                                        "test3",
                                        "dc",
                                        "jpas",
                                        "sitconv",
                                        "sitdi",
                                      ]
                                    : platform[`${item.repo}${item.service}`] == "onprem"
                                    ? [
                                        "pat",
                                        "mttest",
                                        "mttest2",
                                        "mtps",
                                        "mtsb",
                                        "mtdev",
                                        "mtpt",
                                        "mtuat",
                                        "mtstage",
                                        "mtprod",
                                      ]
                                    : [
                                        "dev",
                                        "test",
                                        "dev2",
                                        "test2",
                                        "dev3",
                                        "test3",
                                        "pat",
                                        "demo",
                                        "dc",
                                        "jpas",
                                        "sitconv",
                                        "sitdi",
                                        "ps",
                                        "sb",
                                        "uat",
                                        "stage",
                                        "prod",
                                        "dr",
                                      ]
                                  ).map((item) => (
                                    <option key={item} value={item}>
                                      {item.toUpperCase()}
                                    </option>
                                  ))}
                                </ChakraSelect>
                              )}
                            </Td>
                            <Td>
                              {props.deploymentStarted ? (
                                <Input
                                  type="text"
                                  variant="filled"
                                  defaultValue={item.azure_tenant?.toUpperCase()}
                                  disabled
                                />
                              ) : (
                                <ChakraSelect
                                  defaultValue={props.deploymentStarted ? item.azure_tenant : "at"}
                                  variant="filled"
                                  onChange={(e) =>
                                    props.onBranchTagChange({
                                      azure_tenant: e.target.selectedOptions[0].value,
                                      service: item.service,
                                      repo: item.repo,
                                    } as SimpleReleaseItemModelSchema)
                                  }
                                  isDisabled={
                                    props.deploymentStarted ||
                                    !JSON.parse(localStorage.getItem("$auth") ?? "").roles.find(
                                      (item: SimpleRolesSchema) => item.role === 4
                                    ) ||
                                    platform[`${item.repo}${item.service}`] == "onprem"
                                  }
                                >
                                  {(!platform[`${item.repo}${item.service}`] ||
                                  platform[`${item.repo}${item.service}`] == "azure"
                                    ? ["at", "om", "nc"]
                                    : ["at", "om", "nc", "mt", "pt", "oc"]
                                  ).map((item) => (
                                    <option key={item} value={item}>
                                      {item.toUpperCase()}
                                    </option>
                                  ))}
                                </ChakraSelect>
                              )}
                            </Td>
                            <Td>
                              <Tooltip label="Click to see the job logs.">
                                <Tag
                                  cursor="pointer"
                                  onClick={() => {
                                    let jenkinsUrl
                                    if (item.platform) {
                                      if (item.platform == "azure") {
                                        jenkinsUrl = item.tag
                                          ? `https://jenkins-omms-sgs.optum.com/view/GitHub_Organizations/job/PEP-Azure/job/${
                                              item.repo.split("/")[1]
                                            }/view/tags/job/${encodeURIComponent(item.tag ?? "")}`
                                          : `https://jenkins-omms-sgs.optum.com/view/GitHub_Organizations/job/PEP-Azure/job/${
                                              item.repo.split("/")[1]
                                            }/job/${encodeURIComponent(item.release_branch ?? "")}`
                                      } else if (item.platform == "onprem") {
                                        jenkinsUrl = item.tag
                                          ? `https://jenkins-omms-sgs.optum.com/view/GitHub_Organizations/job/PEP-MT/job/${
                                              item.repo.split("/")[1]
                                            }/view/tags/job/${encodeURIComponent(item.tag ?? "")}`
                                          : `https://jenkins-omms-sgs.optum.com/view/GitHub_Organizations/job/PEP-MT/job/${
                                              item.repo.split("/")[1]
                                            }/job/${encodeURIComponent(item.release_branch ?? "")}`
                                      } else {
                                        jenkinsUrl = item.tag
                                          ? `https://jenkins-omms-sgs.optum.com/view/GitHub_Organizations/job/OIL/job/${
                                              item.repo.split("/")[1]
                                            }/view/tags/job/${encodeURIComponent(item.tag ?? "")}`
                                          : `https://jenkins-omms-sgs.optum.com/view/GitHub_Organizations/job/OIL/job/${
                                              item.repo.split("/")[1]
                                            }/job/${encodeURIComponent(item.release_branch ?? "")}`
                                      }
                                    } else {
                                      if (
                                        !platform[`${item.repo}${item.service}`] ||
                                        platform[`${item.repo}${item.service}`] == "azure"
                                      ) {
                                        jenkinsUrl = item.tag
                                          ? `https://jenkins-omms-sgs.optum.com/view/GitHub_Organizations/job/PEP-Azure/job/${
                                              item.repo.split("/")[1]
                                            }/view/tags/job/${encodeURIComponent(item.tag ?? "")}`
                                          : `https://jenkins-omms-sgs.optum.com/view/GitHub_Organizations/job/PEP-Azure/job/${
                                              item.repo.split("/")[1]
                                            }/job/${encodeURIComponent(item.release_branch ?? "")}`
                                      } else if (
                                        platform[`${item.repo}${item.service}`] == "onprem"
                                      ) {
                                        jenkinsUrl = item.tag
                                          ? `https://jenkins-omms-sgs.optum.com/view/GitHub_Organizations/job/PEP-MT/job/${
                                              item.repo.split("/")[1]
                                            }/view/tags/job/${encodeURIComponent(item.tag ?? "")}`
                                          : `https://jenkins-omms-sgs.optum.com/view/GitHub_Organizations/job/PEP-MT/job/${
                                              item.repo.split("/")[1]
                                            }/job/${encodeURIComponent(item.release_branch ?? "")}`
                                      } else {
                                        jenkinsUrl = item.tag
                                          ? `https://jenkins-omms-sgs.optum.com/view/GitHub_Organizations/job/OIL/job/${
                                              item.repo.split("/")[1]
                                            }/view/tags/job/${encodeURIComponent(item.tag ?? "")}`
                                          : `https://jenkins-omms-sgs.optum.com/view/GitHub_Organizations/job/OIL/job/${
                                              item.repo.split("/")[1]
                                            }/job/${encodeURIComponent(item.release_branch ?? "")}`
                                      }
                                    }
                                    // setCurrentJobLogs({
                                    //   logs: item.job_logs,
                                    //   url: jenkinsUrl,
                                    //   status: item.job_status,
                                    // })
                                    window.open(jenkinsUrl)
                                    // onOpen()
                                  }}
                                  colorScheme={
                                    item.job_status == "Started"
                                      ? "blue"
                                      : item.job_status == "PAUSED_PENDING_INPUT"
                                      ? "orange"
                                      : item.job_status == "IN_PROGRESS"
                                      ? "yellow"
                                      : item.job_status == "SUCCESS"
                                      ? "green"
                                      : "red"
                                  }
                                >
                                  {item.job_status ? item.job_status : "Unknown"}
                                </Tag>
                              </Tooltip>
                            </Td>
                          </>
                        )}
                      </Tr>
                    ))}
                </Tbody>

                <Tfoot>
                  <Tr>
                    <Th position="sticky" left={0} zIndex={2} bg="white">
                      Git Repo
                    </Th>
                    <Th>Tags</Th>
                    <Th>Feature Number</Th>
                    <Th>Release Branches</Th>
                    <Th>Special Notes</Th>
                    <Th>DevOps Notes</Th>
                    {props.sheetsDisabled && (
                      <>
                        <Th>Platform</Th>
                        <Th>Environment</Th>
                        <Th>Tenant</Th>
                        <Th>Job Status</Th>
                      </>
                    )}
                  </Tr>
                </Tfoot>
              </Table>
            </TableContainer>
          </CardBody>
        </Card>
      </VStack>
      {/* <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} size="full">
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {currentJobLogs.logs
                ? currentJobLogs.logs.split("CURRENT_STAGE=")[1]
                : "Job Logs (Jenkins)"}
            </AlertDialogHeader>

            <AlertDialogBody>
              <Code
                p={4}
                colorScheme={
                  currentJobLogs.status == "Started"
                    ? "blue"
                    : currentJobLogs.status == "PAUSED_PENDING_INPUT"
                    ? "orange"
                    : currentJobLogs.status == "IN_PROGRESS"
                    ? "yellow"
                    : currentJobLogs.status == "SUCCESS"
                    ? "green"
                    : "red"
                }
                children={
                  currentJobLogs.logs
                    ? currentJobLogs.status == "FAILED"
                      ? currentJobLogs.logs.split("CURRENT_STAGE=")[0]
                      : `The status of the job is ${currentJobLogs.status}. Please go to Jenkins for further information.`
                    : "The status of the job is Unknown. Please go to Jenkins for further information."
                }
              />
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button
                ref={cancelRef}
                onClick={() => {
                  onClose()
                }}
              >
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={() => {
                  window.open(currentJobLogs.url)
                }}
                ml={3}
              >
                Take me to Jenkins
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog> */}
    </Box>
  )
}
