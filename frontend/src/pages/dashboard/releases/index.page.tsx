import { api } from "@/api"
import { AllReleaseResponse, SimpleRolesSchema } from "@/api/definitions"
import WithQuery from "@/components/indicators/WithQuery"
import { Shell } from "@/components/layout/Shell"
import If from "@/components/logic/If"
import DataTable from "@/components/table/Table"
import { useAppQuery } from "@/hooks/useAppQuery"
import { Access } from "@/types/Page"
import { fromDjangoISO, toDateTimeString } from "@/utils/date"
import { reverse } from "@/utils/reverse"
import {
  Box,
  Card,
  CardBody,
  HStack,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Tag,
  Text,
  VStack,
} from "@chakra-ui/react"
import { IconPlus, IconFileExport, IconMenu, IconTrash, IconArrowBack } from "@tabler/icons-react"
import { useRouter } from "next/router"
import { Browser, Folder, Mug, Planet } from "react-kawaii"
import { deploymentStatusOptions } from "./[uuid].page"
import { DateTime } from "luxon"
import { useAppMutation } from "@/hooks/useAppMutation"

ReleasesPage.access = Access.User
export default function ReleasesPage() {
  const { push } = useRouter()
  const query = useAppQuery(api.queries.useReleasesApiGetAllReleases, {
    autoRefetch: false,
  })

  const deleteMutation = useAppMutation(api.mutations.useReleasesApiDeleteRelease, {
    onOk() {
      query.refetch()
    },
  })

  return (
    <Shell
      page={{
        name: "releases",
        title: "Releases",
        sliver: {
          title: "Releases",
          subtitle: "All the historical releases",
          breadcrumbs: [
            { label: "Dashboard", href: reverse.user.dashboard() },
            { label: "Releases", href: reverse.user.releases() },
          ],
        },
        back: false,
      }}
      actions={{
        // TODO: This needs to be a link button.
        callToAction: JSON.parse(localStorage.getItem("$auth") ?? "").roles.find(
          (item: SimpleRolesSchema) => item.role === 2
        )
          ? {
              label: "Create a New Release",
              icon: <Icon as={IconPlus} />,
              href: reverse.user.createRelease(),
            }
          : undefined,
        mainActions: [
          {
            label: "Export All Releases",
            icon: <Icon as={IconFileExport} />,
            onClick: () => push(reverse.user.exportReleases()),
          },
        ],
      }}
    >
      <WithQuery
        query={query}
        onOk={(response?: AllReleaseResponse) => (
          <If
            value={response?.release_list}
            condition={(release_list) => (release_list?.length ?? 0) > 0}
            then={(release_list) => (
              <Box
                w="full"
                border="6px solid"
                borderColor="gray.100"
                borderRadius="md"
                shadow="sm"
                bg="white"
              >
                <DataTable
                  rows={release_list}
                  columns={{
                    id: {
                      id: "id",
                      light: true,
                      condensed: true,
                      cell: (cell) => cell.row.index + 1,
                    },
                    name: {
                      id: "name",
                      header: "Name",
                      accessorKey: "name",
                    },
                    targetEnv: {
                      id: "targetEnv",
                      header: "Target Envs",
                      cell: (cell) => (
                        <>
                          {cell.row.original.targets.map((item) => (
                            <Tag key={item.target} mx={1}>
                              {item.target}
                            </Tag>
                          ))}
                        </>
                      ),
                      accessorFn: (cell) => (cell.targets.length ? cell.targets[0].target : ""),
                    },
                    status: {
                      id: "status",
                      header: "Checklist Status",
                      cell: (cell) => (
                        <Tag
                          bg={
                            cell.row.original.approvers.filter((item) => !item.approved).length
                              ? "yellow.100"
                              : "green.100"
                          }
                        >
                          {cell.row.original.approvers.filter((item) => !item.approved).length
                            ? "Draft"
                            : "Completed"}
                        </Tag>
                      ),
                      accessorFn: (cell) =>
                        cell.approvers.filter((item) => !item.approved).length
                          ? "Draft"
                          : "Completed",
                    },
                    deployment_status: {
                      id: "deployment_status",
                      header: "Deployment Status",
                      cell: (cell) => (
                        <Tag
                          bg={
                            cell.row.original.deployment_status == 1
                              ? "green.100"
                              : cell.row.original.deployment_status == 2
                              ? "yellow.100"
                              : cell.row.original.deployment_status == 3
                              ? "red.100"
                              : cell.row.original.deployment_status == 4
                              ? "blue.100"
                              : "gray.100"
                          }
                        >
                          {
                            deploymentStatusOptions.find(
                              (item) => item.value === cell.row.original.deployment_status
                            )?.label
                          }
                        </Tag>
                      ),
                      accessorFn: (cell) =>
                        deploymentStatusOptions.find(
                          (item) => item.value === cell.deployment_status
                        )?.label,
                    },
                    deployed_by: {
                      id: "deployed_by",
                      header: "Deployed By",
                      accessorFn: (cell) =>
                        cell.deployed_by
                          ? `${cell.deployed_by.first_name} ${cell.deployed_by.last_name}`
                          : "Unknown",
                    },
                    release_window: {
                      id: "release_window",
                      header: "Start Window",
                      cell: (cell) => (
                        <HStack>
                          <Tag>
                            {DateTime.fromISO(
                              cell.row.original.start_window!.replace("Z", "")
                            ).toLocaleString(DateTime.DATETIME_MED)}
                          </Tag>
                        </HStack>
                      ),
                      accessorFn: (cell) => Date.parse(cell.start_window ?? ""),
                    },
                    created_by: {
                      id: "created_by",
                      header: "Created By",
                      accessorFn: (cell) =>
                        `${cell.created_by.first_name} ${cell.created_by.last_name}`,
                    },
                    updated_by: {
                      id: "updated_by",
                      header: "Last Updated",
                      accessorFn: (cell) =>
                        `${cell.updated_by.first_name} ${
                          cell.updated_by.last_name
                        } (${toDateTimeString(fromDjangoISO(cell.updated_at))})`,
                    },
                    revoke_approvers: {
                      id: "revoke_approvers",
                      header: "Revoked Approvals",
                      accessorFn: (cell) => `${cell.revoke_approvers.length} Approvals`,
                    },
                    actions: JSON.parse(localStorage.getItem("$auth") ?? "").roles.find(
                      (item: SimpleRolesSchema) => item.role === 2
                    )
                      ? {
                          id: "actions",
                          header: "Actions",
                          cell: (cell) => (
                            <Menu>
                              <MenuButton
                                as={IconButton}
                                size="sm"
                                aria-label="Options"
                                icon={<Icon as={IconMenu} />}
                                variant="outline"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <MenuList>
                                <MenuItem
                                  icon={<Icon as={IconTrash} />}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteMutation.mutate({
                                      uuid: cell.row.original.uuid ?? "",
                                    })
                                  }}
                                >
                                  Delete {cell.row.original.name}
                                </MenuItem>
                                <MenuItem icon={<Icon as={IconArrowBack} />}>
                                  {cell.row.original.revoke_approvers.length
                                    ? cell.row.original.revoke_approvers.length
                                    : "None"}{" "}
                                  Approvals Revoked
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          ),
                        }
                      : { id: "actions" },
                  }}
                  onRowClick={(release) => {
                    push(reverse.user.manageRelease(release.uuid ?? ""))
                  }}
                  pagination={{
                    size: 50,
                  }}
                />
                <Card w="full" border="default" shadow="none">
                  <CardBody py="24">
                    <HStack justify="space-around">
                      <VStack spacing="4">
                        <Box justifySelf="center">
                          <Mug mood="blissful" size={64} />
                        </Box>

                        <Text color="muted">Don't forget to smile today</Text>
                      </VStack>

                      <VStack spacing="4">
                        <Box justifySelf="center">
                          <Browser mood="excited" size={64} />
                        </Box>

                        <Text color="muted">You are all caught up. Keep RelEasing</Text>
                      </VStack>

                      <VStack spacing="4">
                        <Box justifySelf="center">
                          <Folder mood="lovestruck" size={64} />
                        </Box>

                        <Text color="muted">Made with ❤ by Team Release</Text>
                      </VStack>
                    </HStack>
                  </CardBody>
                </Card>
              </Box>
            )}
            else={() => (
              <Card w="full" border="default" shadow="none">
                <CardBody py="24">
                  <VStack spacing="4">
                    <Box justifySelf="center">
                      <Planet mood="sad" size={64} />
                    </Box>

                    <Text color="muted">You do not have any releases</Text>
                  </VStack>
                </CardBody>
              </Card>
            )}
          />
        )}
      />
    </Shell>
  )
}
