import { api } from "@/api"
import { Canvas } from "@/components/containers/Canvas"
import { AppFormControl } from "@/components/form/AppFormControl"
import If from "@/components/logic/If"
import { useAppForm } from "@/hooks/useAppForm"
import { useAppMutation } from "@/hooks/useAppMutation"
import { AccountType } from "@/types/enum"
import { Access } from "@/types/Page"
import { reverse } from "@/utils/reverse"
import {
  Alert,
  AlertDescription,
  Avatar,
  Box,
  Button,
  Container,
  Heading,
  Icon,
  Input,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react"
import { IconConfetti, IconCornerDownRight } from "@tabler/icons-react"
import Link from "next/link"
import { useState } from "react"
import zod from "zod"

// The page is only accessible if you are not already logged in.
CreateAccountPage.access = Access.NoAuthOnly

export default function CreateAccountPage() {
  const [accountCreated, setAccountCreated] = useState(false)

  return (
    <Canvas
      as="main"
      display="flex"
      justifyContent="center"
      alignItems="center"
      bg="white"
      accent
      stretched
    >
      <Container maxW="lg" py="16">
        <If
          value={accountCreated}
          then={() => <CreateAccountComplete />}
          else={() => <CreateAccountForm onComplete={() => setAccountCreated(true)} />}
        />
      </Container>
    </Canvas>
  )
}

const schema = zod.object({
  first_name: zod.string().nonempty(),
  last_name: zod.string().nonempty(),
  email: zod.string().email(),
  password: zod.string().nonempty(),
})

function CreateAccountForm(props: { onComplete: () => void }) {
  const form = useAppForm<zod.infer<typeof schema>>({
    schema,
    initialFocus: "first_name",
  })

  const createAccount = useAppMutation(api.mutations.useAccountsApiCreateAccount, {
    onOk() {
      props.onComplete()
    },
    messages: {
      email_taken:
        "An account with the email address already exists. If it belongs to you, try logging in.",
    },
  })

  return (
    <form
      onSubmit={form.handleSubmit((form) => {
        createAccount.mutate(form)
      })}
    >
      <VStack spacing={[6, 8]} px={["6", "6", "auto"]}>
        <VStack spacing="4">
          <Heading size="lg">Create an Account</Heading>

          <Box>
            <Text as="span">and manage your </Text>
            <Text as="span" color="brand" fontWeight="semibold">
              RelEase
            </Text>
            <Text as="span"> with ease</Text>
          </Box>
        </VStack>

        {createAccount.failureMessage && (
          <Alert status="error" variant="top-accent" rounded="md">
            <AlertDescription>{createAccount.failureMessage}</AlertDescription>
          </Alert>
        )}

        <SimpleGrid w="full" columns={[1, 1, 2]} spacing={[6, 8]}>
          <AppFormControl label="First name" isRequired error={form.formState.errors.first_name}>
            <Input
              type="text"
              variant="filled"
              placeholder="Super"
              {...form.register("first_name")}
            />
          </AppFormControl>

          <AppFormControl label="Last name" isRequired error={form.formState.errors.last_name}>
            <Input type="text" variant="filled" placeholder="Man" {...form.register("last_name")} />
          </AppFormControl>
        </SimpleGrid>

        <AppFormControl label="Work email" isRequired error={form.formState.errors.email}>
          <Input
            type="email"
            variant="filled"
            placeholder="you@company.com"
            {...form.register("email")}
          />
        </AppFormControl>

        <AppFormControl label="Password" isRequired error={form.formState.errors.password}>
          <Input
            type="password"
            variant="filled"
            placeholder="• • • • • • • •"
            {...form.register("password")}
          />
        </AppFormControl>

        <Button
          w="full"
          type="submit"
          colorScheme="blue"
          rightIcon={<Icon as={IconCornerDownRight} />}
          isLoading={createAccount.isLoading}
        >
          Create Account
        </Button>

        <Link href={reverse.user.login()} passHref legacyBehavior>
          <Button as="a" w="full" variant="ghost">
            Already have an account?
          </Button>
        </Link>
      </VStack>
    </form>
  )
}

function CreateAccountComplete() {
  return (
    <VStack spacing="6">
      <Avatar icon={<Icon as={IconConfetti} />} bg="brand" size="md" />

      <Box p="2">
        <Text as="span">Congratulations! Your are all set up now. You can log in and explore </Text>
        <Text as="span" color="brand" fontWeight="semibold">
          RelEase
        </Text>
        <Text as="span"> now.</Text>
      </Box>

      <Link href={reverse.roles.login(AccountType.User)} passHref legacyBehavior>
        <Button as="a" w="full" colorScheme="blue" rightIcon={<Icon as={IconCornerDownRight} />}>
          Continue to Login
        </Button>
      </Link>
    </VStack>
  )
}
