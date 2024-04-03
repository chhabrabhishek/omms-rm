import { Shell } from "@/components/layout/Shell"
import DataTable from "@/components/table/Table"
import { Access } from "@/types/Page"
import { reverse } from "@/utils/reverse"
import {
  Box,
  Card,
  CardBody,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import axios from "axios"
import { ChangeEvent, useEffect, useState } from "react"
import { Planet } from "react-kawaii"

interface SnapshotData {
  id: string
  azure_repo: string
  commit_hash: string
  deployed_by: string
  deployment_date: string
  docker_tag: string
  repo_name: string
  target_env: string
  tenant_id: string
}

DeploymentSnapshotPage.access = Access.User
export default function DeploymentSnapshotPage() {
  const [tempSnapshotData, setTempSnapshotData] = useState<SnapshotData[]>([])
  const [snapshotData, setSnapshotData] = useState<SnapshotData[]>([])

  useEffect(() => {
    axios
      .get("http://rn000133847:3000/snapshots")
      .then((response) => {
        setTempSnapshotData(response.data.data)
        setSnapshotData(response.data.data)
      })
      .catch((error) => console.log(error))
  }, [])

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
      {snapshotData.length > 0 ? (
        <Box w="full" border="default" borderRadius="md" shadow="sm" bg="white">
          <DataTable
            rows={snapshotData}
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
            }}
            onRowClick={(release) => {
              // push(reverse.user.manageRelease(release.uuid ?? ""))
            }}
          />
        </Box>
      ) : (
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
    </Shell>
  )
}
