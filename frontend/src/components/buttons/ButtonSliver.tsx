import {
  Box,
  Button,
  ButtonProps,
  HStack,
  Icon,
  SimpleGrid,
  Text,
  useDisclosure,
} from "@chakra-ui/react"
import { IconCornerDownRight } from "@tabler/icons-react"
import Link from "next/link"
import ConfirmationDialog from "../modals/Confirmation"

export default function ButtonSliver(
  props: ButtonProps & {
    href?: string
    onClick?: () => void
    confirmation?: {
      title: string
      content: string
      colorScheme?: ButtonProps["colorScheme"]
    }
    message?: string | boolean
    secondary?: Omit<ButtonProps, "children"> & { label: string }
  }
) {
  const confirmation = useDisclosure()

  return (
    <>
      <Box w="full" p="2" border="default" borderRadius="md">
        <SimpleGrid columns={props.message ? [1, 1, 2] : 1} alignItems="center" spacing="4">
          {props.message && (
            <Text color="muted" pl="2">
              {props.message}
            </Text>
          )}

          <HStack justify="end">
            {props.secondary && (
              <Button
                w={["full", "full", "auto"]}
                variant="solid"
                fontWeight="medium"
                {...props.secondary}
              >
                {props.secondary.label}
              </Button>
            )}

            <Button
              as={props.href ? Link : undefined}
              href={props.href}
              w={["full", "full", "auto"]}
              px="6"
              colorScheme="blue"
              rightIcon={<Icon as={IconCornerDownRight} />}
              {...props}
              onClick={() => {
                if (props.confirmation) {
                  confirmation.onOpen()
                } else {
                  props.onClick?.()
                }
              }}
            >
              {props.children}
            </Button>
          </HStack>
        </SimpleGrid>
      </Box>

      {props.confirmation && (
        <ConfirmationDialog
          isOpen={confirmation.isOpen}
          onClose={confirmation.onClose}
          title={props.confirmation.title}
          content={props.confirmation.content}
          confirmColorScheme={props.confirmation.colorScheme ?? "blue"}
          onConfirm={() => props.onClick?.()}
        />
      )}
    </>
  )
}
