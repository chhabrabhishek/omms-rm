import { api } from "@/api"
import { AppFormControl } from "@/components/form/AppFormControl"
import { Shell } from "@/components/layout/Shell"
import { useAppForm } from "@/hooks/useAppForm"
import { useAppMutation } from "@/hooks/useAppMutation"
import { useAppQuery } from "@/hooks/useAppQuery"
import { Box, Button, Icon, Input, SimpleGrid, VStack } from "@chakra-ui/react"
import zod from "zod"
import { UseFormReturn } from "react-hook-form"
import { CardSection } from "@/components/containers/CardSection"
import WithQuery from "@/components/indicators/WithQuery"
import { Access } from "@/types/Page"
import { MeResponse } from "@/api/definitions"
import { IconCornerDownRight } from "@tabler/icons-react"
import { Select } from "chakra-react-select"
import { IServiceOptions } from "../releases/create.page"
import { useState } from "react"

// Profile page is only accessible by user.
ProfilePage.access = Access.User

const schema = zod.object({
  first_name: zod.string().nonempty(),
  last_name: zod.string().nonempty(),
  msid: zod.string().optional(),
  team_name: zod.string().optional(),
})

export default function ProfilePage() {
  const [isResponse, setIsResponse] = useState<boolean>(false)
  const [roles, setRoles] = useState<Array<number>>([])
  const [pendingRoles, setPendingRoles] = useState<Array<number>>([])

  const form = useAppForm<zod.infer<typeof schema>>({
    schema,
  })

  const query = useAppQuery(api.queries.useAccountsApiMe, {
    onOk(response) {
      if (!roles.length) {
        setIsResponse(true)
        form.reset(response.result)
        setRoles(response.result?.roles.map((item) => item.role) ?? [])
        setPendingRoles(response.result?.requested_roles.map((item) => item.requested_role) ?? [])
      }
    },
    autoRefetch: false,
  })

  const mutation = useAppMutation(api.mutations.useAccountsApiUpdateAccount, {
    onOk() {
      query.refetch()
    },
    messages: {
      ok: "Updated",
    },
  })

  const handleOnSubmit = async (form: zod.infer<typeof schema>) => {
    console.log(roles)
    mutation.mutate({ form: form as never, roles: roles })
  }

  return (
    <Shell
      page={{
        name: "profile",
        title: "Profile",
        banner: {
          title: "Profile",
          subtitle: "Lorem ipsum dolor, sit amet consectetur adipisicing elit.",
        },
      }}
    >
      <Box w="full">
        <WithQuery
          onOk={(result?: MeResponse) => (
            <form onSubmit={form.handleSubmit(handleOnSubmit)}>
              <VStack w="full" spacing="12">
                {isResponse && (
                  <ProfileUpdateSection
                    form={form}
                    user={result}
                    roles={roles}
                    pendingRoles={pendingRoles}
                    onRoleSelect={(e: any) =>
                      setRoles(e.map((item: IServiceOptions) => Number.parseInt(item.value)))
                    }
                  />
                )}
              </VStack>

              <Box textAlign="end" py="8">
                <Button
                  w={["full", "full", "auto"]}
                  type="submit"
                  colorScheme="blue"
                  rightIcon={<Icon as={IconCornerDownRight} />}
                  isLoading={mutation.isLoading}
                  loadingText="Saving"
                >
                  Save
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

export const rolesOptions: Array<IServiceOptions> = [
  {
    label: "Admin",
    value: "1",
  },
  {
    label: "ReleaseAdmin",
    value: "2",
  },
  {
    label: "User",
    value: "3",
  },
]

function ProfileUpdateSection(props: {
  form: UseFormReturn<zod.infer<typeof schema>>
  user?: MeResponse
  roles: Array<number>
  pendingRoles: Array<number>
  onRoleSelect: (e: any) => void
}) {
  const handleRoleSelect = (e: any) => {
    props.onRoleSelect(e)
  }

  return (
    <CardSection
      title="Personal Details"
      subtitle="Lorem ipsum dolor sit amet consectetur adipisicing elit."
    >
      <VStack spacing="12" mb="6rem">
        <SimpleGrid w="full" spacing="6" columns={[1, 1, 2]}>
          <AppFormControl
            label="First Name"
            isRequired
            error={props.form.formState.errors.first_name}
          >
            <Input
              type="text"
              variant="filled"
              placeholder="Super"
              {...props.form.register("first_name")}
            />
          </AppFormControl>

          <AppFormControl
            label="Last Name"
            isRequired
            error={props.form.formState.errors.last_name}
          >
            <Input
              type="text"
              variant="filled"
              placeholder="Man"
              {...props.form.register("last_name")}
            />
          </AppFormControl>

          <AppFormControl label="Email">
            <Input readOnly disabled variant="filled" defaultValue={props.user?.email} />
          </AppFormControl>

          <AppFormControl label="MSID" isRequired error={props.form.formState.errors.msid}>
            <Input
              type="text"
              variant="filled"
              placeholder="achhabr9"
              {...props.form.register("msid")}
            />
          </AppFormControl>

          <AppFormControl
            label="Team Name"
            isRequired
            error={props.form.formState.errors.team_name}
          >
            <Input
              type="text"
              variant="filled"
              placeholder="OMMS"
              {...props.form.register("team_name")}
            />
          </AppFormControl>
          <AppFormControl label="Roles">
            <Select
              isMulti
              colorScheme="purple"
              placeholder="Select roles"
              defaultValue={rolesOptions.filter((item) =>
                props.roles.includes(Number.parseInt(item.value))
              )}
              options={rolesOptions.filter(
                (item) => !props.pendingRoles.includes(Number.parseInt(item.value))
              )}
              onChange={handleRoleSelect}
            />
          </AppFormControl>
          {props.pendingRoles.length > 0 && (
            <AppFormControl label="Pending Roles">
              <Select
                isMulti
                colorScheme="purple"
                isDisabled
                defaultValue={rolesOptions.filter((item) =>
                  props.pendingRoles.includes(Number.parseInt(item.value))
                )}
                options={rolesOptions}
                onChange={handleRoleSelect}
              />
            </AppFormControl>
          )}
        </SimpleGrid>
      </VStack>
    </CardSection>
  )
}
