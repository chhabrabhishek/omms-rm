import { api } from "@/api"
import {
  GetDeploymentSnapshotResponse,
  SimpleGetDeploymentSnapshotSchema,
  SimpleRolesSchema,
} from "@/api/definitions"
import WithQuery from "@/components/indicators/WithQuery"
import { Shell } from "@/components/layout/Shell"
import If from "@/components/logic/If"
import DataTable from "@/components/table/Table"
import { useAppMutation } from "@/hooks/useAppMutation"
import { useAppQuery } from "@/hooks/useAppQuery"
import { Access } from "@/types/Page"
import { reverse } from "@/utils/reverse"
import {
  Box,
  Card,
  CardBody,
  Icon,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  VStack,
} from "@chakra-ui/react"
import { IconMenu, IconTrash } from "@tabler/icons-react"
import { ChangeEvent, useState } from "react"
import { Planet } from "react-kawaii"

DeploymentSnapshotPage.access = Access.User
export default function DeploymentSnapshotPage() {
  const [tempSnapshotData, setTempSnapshotData] = useState<SimpleGetDeploymentSnapshotSchema[]>([])
  const [snapshotData, setSnapshotData] = useState<SimpleGetDeploymentSnapshotSchema[]>([])

  const deleteMutation = useAppMutation(api.mutations.useReleasesApiDeleteSnapshot, {
    onOk() {
      query.refetch()
    },
  })

  const query = useAppQuery(api.queries.useReleasesApiDeploymentSnapshot, {
    autoRefetch: false,
    onOk(result) {
      setTempSnapshotData(result.result?.snapshot_data!)
      setSnapshotData(result.result?.snapshot_data!)
    },
  })

  const handleSnapshotFilter = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setSnapshotData(
        tempSnapshotData.filter(
          (item) =>
            item.docker_tag.toLowerCase().includes(e.target.value.toLowerCase()) ||
            item.repo_name.toLowerCase().includes(e.target.value.toLowerCase()) ||
            item.commit_hash.toLowerCase().includes(e.target.value.toLowerCase())
        )
      )
    } else {
      setSnapshotData(tempSnapshotData)
    }
  }

  return (
    <Shell
      page={{
        name: "deployment-snapshot",
        title: "Deployment Snapshot",
        sliver: {
          title: "Deployment Snapshot",
          subtitle: "Deployment Snapshots (Inventory Management) view",
          breadcrumbs: [
            { label: "Dashboard", href: reverse.user.dashboard() },
            { label: "Deployment Snapshot", href: reverse.user.deploymentSnapshot() },
          ],
        },
        back: false,
      }}
    >
      <Input
        placeholder="Search Docker Tag, Repo Name or Commit Hash"
        onChange={handleSnapshotFilter}
      />
      <WithQuery
        query={query}
        onOk={(response?: GetDeploymentSnapshotResponse) => (
          <If
            value={snapshotData}
            condition={(snapshot_data) => (snapshot_data?.length ?? 0) > 0}
            then={(snapshot_data) => (
              <Box w="full" border="default" borderRadius="md" shadow="sm" bg="white">
                <DataTable
                  rows={snapshot_data}
                  columns={{
                    id: {
                      id: "id",
                      light: true,
                      condensed: true,
                      cell: (cell) => cell.row.index + 1,
                    },
                    repo_name: {
                      id: "repo_name",
                      header: "Repo Name",
                      accessorKey: "repo_name",
                    },
                    docker_tag: {
                      id: "docker_tag",
                      header: "Docker Tag",
                      accessorKey: "docker_tag",
                    },
                    commit_hash: {
                      id: "commit_hash",
                      header: "Commit Hash",
                      accessorKey: "commit_hash",
                    },
                    target_env: {
                      id: "target_env",
                      header: "Target Env",
                      accessorKey: "target_env",
                    },
                    azure_repo: {
                      id: "azure_repo",
                      header: "Azure Repo",
                      accessorFn: (cell) =>
                        cell.azure_repo == "crpepshnprdcus001" ? "SGS Non Prod" : "Multi Tenant",
                    },
                    tenant_id: {
                      id: "tenant_id",
                      header: "Tenant ID",
                      accessorKey: "tenant_id",
                    },
                    deployed_by: {
                      id: "deployed_by",
                      header: "Deployed By",
                      accessorKey: "deployed_by",
                    },
                    deployment_date: {
                      id: "deployment_date",
                      header: "Deployment Date",
                      accessorKey: "deployment_date",
                    },
                    actions: JSON.parse(localStorage.getItem("$auth") ?? "").roles.find(
                      (item: SimpleRolesSchema) => item.role === 4
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
                                      docker_tag: cell.row.original.docker_tag ?? "",
                                    })
                                  }}
                                >
                                  Delete {cell.row.original.docker_tag}
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          ),
                        }
                      : { id: "actions" },
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

                    <Text color="muted">You do not have any snapshots</Text>
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
