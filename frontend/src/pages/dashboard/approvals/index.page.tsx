import { api } from "@/api"
import { Shell } from "@/components/layout/Shell"
import { useAppMutation } from "@/hooks/useAppMutation"
import { useAppQuery } from "@/hooks/useAppQuery"
import {
  Box,
  Button,
  Card,
  CardBody,
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
} from "@chakra-ui/react"
import WithQuery from "@/components/indicators/WithQuery"
import { Access } from "@/types/Page"
import { PendingResponse, SimplePendingResponseSchema } from "@/api/definitions"
import { rolesOptions } from "../profile/index.page"
import If from "@/components/logic/If"
import { Planet } from "react-kawaii"
import toast from "react-hot-toast"

// Approvals page is only accessible by user.
ApprovalsPage.access = Access.User

export default function ApprovalsPage() {
  const query = useAppQuery(api.queries.useAccountsApiAllPending, {
    autoRefetch: false,
  })

  const approveMutation = useAppMutation(api.mutations.useAccountsApiManageApproval, {
    onOk(response) {
      toast.success("Updated")
      query.refetch()
    },
    onNotOk() {
      toast.error(
        "You are not authorized to manage approvals. Please raise the access for Admin in your profile."
      )
    },
  })

  const handleApprove = (item: SimplePendingResponseSchema) => {
    approveMutation.mutate({
      role: item.role,
      account: item.account,
      status: true,
    })
  }

  const handleReject = (item: SimplePendingResponseSchema) => {
    approveMutation.mutate({
      role: item.role,
      account: item.account,
      status: false,
    })
  }

  return (
    <Shell
      page={{
        name: "approvals",
        title: "Manage Approvals",
        banner: {
          title: "Manage Approvals",
          subtitle: "Approve or Reject the approvals",
        },
      }}
    >
      <Box w="full">
        <WithQuery
          query={query}
          onOk={(result?: PendingResponse) => (
            <If
              value={result?.requested_roles}
              condition={(requested_roles) => (requested_roles?.length ?? 0) > 0}
              then={(requested_roles) => (
                <TableContainer>
                  <Table variant="simple">
                    <TableCaption>Manage Pending Approvals</TableCaption>
                    <Thead>
                      <Tr>
                        <Th>User</Th>
                        <Th>Role</Th>
                        <Th isNumeric>Action</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {result?.requested_roles.map((item) => (
                        <Tr key={item.role + item.account}>
                          <Td>{item.account}</Td>
                          <Td>
                            {
                              rolesOptions.find(
                                (roleItem) => Number.parseInt(roleItem.value) == item.role
                              )?.label
                            }
                          </Td>
                          <Td isNumeric>
                            <Button variant="ghost" onClick={() => handleApprove(item)}>
                              Approve
                            </Button>
                            <Button variant="ghost" onClick={() => handleReject(item)}>
                              Reject
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                    <Tfoot>
                      <Tr>
                        <Th>User</Th>
                        <Th>Role</Th>
                        <Th isNumeric>Action</Th>
                      </Tr>
                    </Tfoot>
                  </Table>
                </TableContainer>
              )}
              else={() => (
                <Card w="full" border="default" shadow="none">
                  <CardBody py="24">
                    <VStack spacing="4">
                      <Box justifySelf="center">
                        <Planet mood="sad" size={64} />
                      </Box>

                      <Text color="muted">You do not have any requests</Text>
                    </VStack>
                  </CardBody>
                </Card>
              )}
            />
          )}
        />
      </Box>
    </Shell>
  )
}
