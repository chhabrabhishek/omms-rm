import { api } from "@/api"
import { AllTicketsResponse } from "@/api/definitions"
import WithQuery from "@/components/indicators/WithQuery"
import { Shell } from "@/components/layout/Shell"
import If from "@/components/logic/If"
import DataTable from "@/components/table/Table"
import { useAppQuery } from "@/hooks/useAppQuery"
import { Access } from "@/types/Page"
import { TicketImportanceStatus } from "@/types/enum"
import { fromDjangoISO, toDateString } from "@/utils/date"
import { reverse } from "@/utils/reverse"
import { Box, Card, CardBody, Icon, Tag, Text, VStack } from "@chakra-ui/react"
import { IconPlus } from "@tabler/icons-react"
import { Planet } from "react-kawaii"

TicketPage.access = Access.User
export default function TicketPage() {
  const query = useAppQuery(api.queries.useTicketsApiGetAllTickets)

  return (
    <Shell
      page={{
        name: "tickets",
        title: "My Tickets",
        sliver: {
          title: "My Tickets",
          subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
          breadcrumbs: [
            { label: "Dashboard", href: reverse.user.dashboard() },
            { label: "Ticket", href: reverse.user.tickets() },
          ],
        },
        back: false,
      }}
      actions={{
        // TODO: This needs to be a link button.
        callToAction: {
          label: "Open a New Ticket",
          icon: <Icon as={IconPlus} />,
          href: reverse.user.createTicket(),
        },
      }}
    >
      <WithQuery
        query={query}
        onOk={(response?: AllTicketsResponse) => (
          <If
            value={response?.tickets}
            condition={(tickets) => (tickets?.length ?? 0) > 0}
            then={(tickets) => (
              <Box w="full" border="default" borderRadius="md" shadow="sm" bg="white">
                <DataTable
                  rows={tickets}
                  columns={{
                    id: {
                      id: "id",
                      light: true,
                      condensed: true,
                      cell: (cell) => cell.row.index + 1,
                    },
                    opened_by: {
                      id: "opened_by",
                      header: "Opened By",
                      accessorFn: (cell) =>
                        `${cell.opened_by.first_name} ${cell.opened_by.last_name}`,
                    },
                    name: {
                      id: "name",
                      header: "Name",
                      accessorKey: "name",
                    },
                    impact: {
                      id: "impact",
                      header: "Impact",
                      accessorKey: "impact",
                      cell: (cell) => <TicketImportanceTag status={cell.row.original.impact} />,
                    },
                    priority: {
                      id: "priority",
                      header: "Priority",
                      accessorKey: "priority",
                      cell: (cell) => <TicketImportanceTag status={cell.row.original.priority} />,
                    },
                    assigned_to: {
                      id: "assigned_to",
                      header: "Assigned To",
                      accessorKey: "assigned_to",
                    },
                    created: {
                      id: "created",
                      header: "Created",
                      accessorFn: (cell) => {
                        return cell.created_at ? toDateString(fromDjangoISO(cell.created_at)) : null
                      },
                    },
                  }}
                  onRowClick={(campaign) => {
                    console.log(campaign.uuid)
                    // push(reverse.admin.manageCampaign(campaign.uuid!, "invites"))
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

                    <Text color="muted">You do not have any tickets</Text>
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

function TicketImportanceTag(props: { status?: TicketImportanceStatus }) {
  switch (props.status) {
    case TicketImportanceStatus.Low: {
      return (
        <Tag variant="subtle" colorScheme="orange" rounded="full">
          Low
        </Tag>
      )
    }

    case TicketImportanceStatus.Medium: {
      return (
        <Tag variant="subtle" colorScheme="green" rounded="full">
          Medium
        </Tag>
      )
    }

    case TicketImportanceStatus.High: {
      return (
        <Tag variant="subtle" colorScheme="red" rounded="full">
          High
        </Tag>
      )
    }

    default: {
      return (
        <Tag variant="subtle" colorScheme="gray" rounded="full">
          Unknown
        </Tag>
      )
    }
  }
}
