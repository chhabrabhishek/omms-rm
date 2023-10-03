import { Box, Center, HStack, Spinner, Text } from "@chakra-ui/react"

export default function LoadingBlock() {
  return (
    <Box w="full" py="32">
      <Center>
        <HStack>
          <Spinner size="sm" label="Loading" />
          <Text>Loading</Text>
        </HStack>
      </Center>
    </Box>
  )
}
