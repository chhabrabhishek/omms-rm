import { Canvas } from "@/components/containers/Canvas"
import LoadingBlock from "@/components/indicators/LoadingBlock"
import { useAuthGuard } from "@/hooks/useAuthGuard"
import { AppPageComponent } from "@/types/Page"
import { failureMessages } from "@/utils/failures"
import { Box, ChakraProvider, Text, VStack, extendTheme } from "@chakra-ui/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { AppProps } from "next/app"
import { Karla as Font } from "next/font/google"
import { useMemo } from "react"
import { ToastOptions, Toaster } from "react-hot-toast"
import NextTopLoader from "nextjs-toploader"
import Head from "next/head"
import { useAuthInit } from "@/hooks/auth"

const font = Font({
  subsets: ["latin"],
})

const theme = extendTheme({
  colors: {
    muted: "dimgray",
    brand: "#ea8190",
    stone: "#fafaf9",
    subtle: "#828FA3",
  },
  fonts: {
    body: font.style.fontFamily,
    heading: font.style.fontFamily,
  },
  borders: {
    default: "1px solid var(--chakra-colors-gray-200)",
    accent: "3px solid var(--chakra-colors-brand)",
  },
  styles: {
    global: () => ({
      body: {
        bg: "stone",
      },
    }),
  },
})

type CustomAppProps = Omit<AppProps, "Component"> & {
  Component: AppPageComponent
}

export default function App(props: CustomAppProps) {
  // Use state to hold the client instead of a top level
  // variable to make the value is not reused across requests.
  const client = useMemo(() => new QueryClient(), [])

  return (
    <>
      <Head>
        <meta name="theme-color" content="#ffffff" />
      </Head>

      <QueryClientProvider client={client}>
        <AppWithContext {...props} />
      </QueryClientProvider>
    </>
  )
}

function AppWithContext(props: CustomAppProps) {
  // Load the stored credentials.
  useAuthInit()

  // Check if the page being loaded is accessible.
  const { guardage } = useAuthGuard({
    component: props.Component,
  })

  const toastOptions: ToastOptions = {
    style: {
      borderWidth: "1px",
      borderRadius: "var(--chakra-radii-full)",
    },
  }

  return (
    <ChakraProvider theme={theme}>
      <NextTopLoader color="#ea8190" />
      <PageContent guardage={guardage} {...props} />
      <Toaster toastOptions={toastOptions} position="top-center" />
    </ChakraProvider>
  )
}

function PageContent(
  props: CustomAppProps & {
    guardage: ReturnType<typeof useAuthGuard>["guardage"]
  }
) {
  if ((props.guardage ?? null) === null) {
    const Component = props.Component
    return <Component {...props.pageProps} />
  }
  console.log(props.guardage)
  switch (props.guardage) {
    // TODO: The message should be tailored.
    case "auth_unavailable":
      return <PageUnauthorized />
  }

  // This is the default instead of the content component because
  // the guard might want to perform a side effect that happens
  // after a render and we don't want to flash content.
  return (
    <Canvas accent stretched>
      <LoadingBlock />
    </Canvas>
  )
}

function PageUnauthorized() {
  return (
    <Canvas accent stretched>
      <Box py="32">
        <VStack spacing="4">
          <Text p="2">:(</Text>
          <Text p="2">{failureMessages.page_unauthorized}</Text>
        </VStack>
      </Box>
    </Canvas>
  )
}
