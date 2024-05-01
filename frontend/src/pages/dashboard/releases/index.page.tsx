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
import { IconPlus, IconFileExport, IconMenu, IconTrash } from "@tabler/icons-react"
import { useRouter } from "next/router"
import { Planet } from "react-kawaii"
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
              <Box w="full" border="default" borderRadius="md" shadow="sm" bg="white">
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
                    },
                    status: {
                      id: "status",
                      header: "Checklist Status",
                      cell: (cell) => (
                        <Tag>
                          {cell.row.original.approvers.filter((item) => !item.approved).length
                            ? "Draft"
                            : "Completed"}
                        </Tag>
                      ),
                    },
                    deployment_status: {
                      id: "deployment_status",
                      header: "Deployment Status",
                      cell: (cell) => (
                        <Tag>
                          {
                            deploymentStatusOptions.find(
                              (item) => item.value === cell.row.original.deployment_status
                            )?.label
                          }
                        </Tag>
                      ),
                    },
                    release_window: {
                      id: "release_window",
                      header: "Release Window",
                      cell: (cell) => (
                        <HStack>
                          <Tag>
                            {DateTime.fromISO(
                              cell.row.original.start_window!.replace("Z", "")
                            ).toLocaleString(DateTime.DATETIME_MED)}
                          </Tag>
                          <Text>~</Text>
                          <Tag>
                            {DateTime.fromISO(
                              cell.row.original.end_window!.replace("Z", "")
                            ).toLocaleString(DateTime.DATETIME_MED)}
                          </Tag>
                        </HStack>
                      ),
                    },
                    created_at: {
                      id: "created_at",
                      header: "Created At",
                      accessorFn: (cell) => toDateTimeString(fromDjangoISO(cell.created_at)),
                    },
                    updated_at: {
                      id: "updated_at",
                      header: "Updated At",
                      accessorFn: (cell) => toDateTimeString(fromDjangoISO(cell.updated_at)),
                    },
                    created_by: {
                      id: "created_by",
                      header: "Created By",
                      accessorFn: (cell) =>
                        `${cell.created_by.first_name} ${cell.created_by.last_name}`,
                    },
                    updated_by: {
                      id: "updated_by",
                      header: "Updated By",
                      accessorFn: (cell) =>
                        `${cell.updated_by.first_name} ${cell.updated_by.last_name}`,
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
