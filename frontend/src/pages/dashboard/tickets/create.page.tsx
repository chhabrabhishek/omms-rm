import { AppFormControl } from "@/components/form/AppFormControl"
import { Shell } from "@/components/layout/Shell"
import { Box, Button, Icon, Input, Select, SimpleGrid, Textarea, VStack } from "@chakra-ui/react"
import zod from "zod"
import { useAppForm } from "@/hooks/useAppForm"
import { UseFormReturn } from "react-hook-form"
import { IconCornerDownRight } from "@tabler/icons-react"
import { useAppMutation } from "@/hooks/useAppMutation"
import { api } from "@/api"
import { CardSection } from "@/components/containers/CardSection"
import { useRouter } from "next/router"
import { Access } from "@/types/Page"
import { useAppQuery } from "@/hooks/useAppQuery"
import WithQuery from "@/components/indicators/WithQuery"
import { MeResponse } from "@/api/definitions"
import { toast } from "react-hot-toast"
import { reverse } from "@/utils/reverse"

// This page is only accessible by a User.
CreateTicketPage.access = Access.User

const schema = zod.object({
  name: zod.string().nonempty(),
  impact: zod.number().min(1).max(3),
  priority: zod.number().min(1).max(3),
  assigned_to: zod.string().nonempty().email(),
  description: zod.string().nonempty(),
})

export const ImpactPriorityOptions = [
  {
    value: 1,
    label: "Low",
  },
  {
    value: 2,
    label: "Medium",
  },
  {
    value: 3,
    label: "High",
  },
]

export default function CreateTicketPage() {
  const form = useAppForm<zod.infer<typeof schema>>({
    schema,
    initialFocus: "name",
  })

  const query = useAppQuery(api.queries.useAccountsApiMe, {
    autoRefetch: false,
  })

  const { replace } = useRouter()

  const mutation = useAppMutation(api.mutations.useTicketsApiCreateTicket, {
    onOk: (response) => {
      if (response.result?.uuid) {
        toast.success("Ticket Added")
        replace(reverse.user.tickets())
      }
    },
  })

  return (
    <Shell
      page={{
        name: "tickets",
        title: "Open a New Ticket",
        banner: {
          title: "Open a New Ticket",
          subtitle: "Lorem ipsum dolor, sit amet consectetur adipisicing elit.",
        },
      }}
    >
      <Box w="full">
        <WithQuery
          onOk={(result?: MeResponse) => (
            <form
              onSubmit={form.handleSubmit((form) => {
                mutation.mutate({
                  ...form,
                })
              })}
            >
              <VStack w="full" spacing="12">
                <PersonalDetailsSection user={result} />
                <TicketDetailsSection form={form} />
              </VStack>

              <Box textAlign="end" py="8">
                <Button
                  w={["full", "full", "auto"]}
                  type="submit"
                  colorScheme="blue"
                  rightIcon={<Icon as={IconCornerDownRight} />}
                  //   isLoading={mutation.isLoading}
                  loadingText="Saving"
                >
                  Save & Continue
                </Button>
              </Box>
            </form>
          )}
          query={query}
        />
      </Box>
    </Shell>
  )
}

export function PersonalDetailsSection(props: { user?: MeResponse }) {
  return (
    <CardSection
      title="Personal Details"
      subtitle="Lorem, ipsum dolor sit amet consectetur adipisicing elit."
    >
      <VStack spacing="8">
        <SimpleGrid w="full" spacing="6" columns={[1, 1, 2]}>
          <AppFormControl label="Opened By">
            <Input
              readOnly
              disabled
              variant="filled"
              defaultValue={`${props.user?.first_name} ${props.user?.last_name}`}
            />
          </AppFormControl>

          <AppFormControl label="MSID">
            <Input readOnly disabled variant="filled" defaultValue={props.user?.msid} />
          </AppFormControl>
        </SimpleGrid>

        <AppFormControl label="Email">
          <Input readOnly disabled variant="filled" defaultValue={props.user?.email} />
        </AppFormControl>

        <AppFormControl label="Team Name">
          <Input readOnly disabled variant="filled" defaultValue={props.user?.team_name} />
        </AppFormControl>
      </VStack>
    </CardSection>
  )
}

function TicketDetailsSection(props: { form: UseFormReturn<zod.infer<typeof schema>> }) {
  return (
    <CardSection
      title="Ticket"
      subtitle="Lorem, ipsum dolor sit amet consectetur adipisicing elit."
    >
      <VStack spacing={8}>
        <AppFormControl label="Name" error={props.form.formState.errors.name} isRequired>
          <Input
            variant="filled"
            placeholder={"Could be a small name or short description"}
            {...props.form.register("name")}
          />
        </AppFormControl>
        <SimpleGrid w="full" spacing="6" columns={[1, 1, 2]}>
          <AppFormControl
            label="Impact"
            bg="white"
            isRequired
            error={props.form.formState.errors.impact}
          >
            <Select
              variant="filled"
              {...props.form.register("impact", {
                valueAsNumber: true,
              })}
            >
              {ImpactPriorityOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </AppFormControl>
          <AppFormControl
            label="Priority"
            bg="white"
            isRequired
            error={props.form.formState.errors.priority}
          >
            <Select
              variant="filled"
              {...props.form.register("priority", {
                valueAsNumber: true,
              })}
            >
              {ImpactPriorityOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </AppFormControl>
        </SimpleGrid>
        <AppFormControl
          label="Assigned To"
          error={props.form.formState.errors.assigned_to}
          isRequired
        >
          <Input
            variant="filled"
            placeholder={"super.man@dc.com"}
            {...props.form.register("assigned_to")}
          />
        </AppFormControl>
        <AppFormControl
          label="Description"
          error={props.form.formState.errors.description}
          isRequired
        >
          <Textarea rows={3} variant="filled" {...props.form.register("description")} />
        </AppFormControl>
      </VStack>
    </CardSection>
  )
}
