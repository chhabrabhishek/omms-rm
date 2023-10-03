import { HStack, StackProps, Text } from "@chakra-ui/react"

export function Brand(props: StackProps) {
  return (
    <HStack {...props} align="center">
      <Text color="brand" fontWeight="semibold">
        RelEase
      </Text>
    </HStack>
  )
}
