import { api } from "@/api"
import { Canvas } from "@/components/containers/Canvas"
import { AppFormControl } from "@/components/form/AppFormControl"
import { useAppForm } from "@/hooks/useAppForm"
import { useAppMutation } from "@/hooks/useAppMutation"
import { reverse } from "@/utils/reverse"
import {
  Alert,
  AlertDescription,
  Button,
  Container,
  Heading,
  Icon,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { IconCornerDownRight } from "@tabler/icons-react"
import Link from "next/link"
import zod from "zod"
import { Access } from "@/types/Page"
import { toast } from "react-hot-toast"
import { useAuthStore } from "@/hooks/auth"
import { useRouter } from "next/router"

// The page is only accessible if you are not already logged in.
LoginPage.access = Access.NoAuthOnly

export default function LoginPage() {
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
      <Container maxW="lg" py="16" px={["6", "6", "auto"]}>
        <LoginForm />
      </Container>
    </Canvas>
  )
}

const schema = zod.object({
  email: zod.string().nonempty().email(),
  password: zod.string().nonempty(),
})

function LoginForm() {
  const form = useAppForm<zod.infer<typeof schema>>({
    schema,
    initialFocus: "email",
  })

  const save = useAuthStore((store) => {
    return store.save
  })

  const { replace } = useRouter()

  const login = useAppMutation(api.mutations.useAccountsApiLogin, {
    onOk: (data) => {
      toast.success("Login Successful")
      save(data.result!)
      // replace(reverse.roles.home(AccountType.User))
    },
    messages: {
      no_account: "This email address or password you provided is incorrect.",
    },
  })

  return (
    <form
      onSubmit={form.handleSubmit((credentials) => {
        login.mutate(credentials)
      })}
    >
      <VStack spacing="8">
        <VStack spacing="3">
          <Heading size="lg">Log in to RelEase</Heading>
          <Text textAlign="left">and manage your everyday errands</Text>
        </VStack>

        {login.failureMessage && (
          <Alert status="error" variant="top-accent" rounded="md">
            <AlertDescription>{login.failureMessage}</AlertDescription>
          </Alert>
        )}

        <AppFormControl label="Email" error={form.formState.errors.email}>
          <Input
            type="email"
            variant="filled"
            placeholder="you@company.com"
            {...form.register("email")}
          />
        </AppFormControl>

        <AppFormControl label="Password" error={form.formState.errors.password}>
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
          disabled={!form.formState.isValid}
          isLoading={login.isLoading}
        >
          Contine to Login
        </Button>

        <Link href={reverse.user.createAccount()} passHref legacyBehavior>
          <Button as="a" w="full" variant="ghost">
            Create an account
          </Button>
        </Link>
      </VStack>
    </form>
  )
}
