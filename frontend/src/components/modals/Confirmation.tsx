import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  ButtonProps,
  HStack,
} from "@chakra-ui/react"
import { useRef } from "react"

export default function ConfirmationDialog(props: {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void

  title?: string
  content: string

  confirmLabel?: string
  confirmColorScheme?: ButtonProps["colorScheme"]
}) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  return (
    <AlertDialog
      isOpen={props.isOpen}
      onClose={props.onClose}
      leastDestructiveRef={cancelRef as never}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader>{props.title ?? "Confirmation"}</AlertDialogHeader>

          <AlertDialogCloseButton />
          <AlertDialogBody>{props.content}</AlertDialogBody>

          <AlertDialogFooter>
            <HStack spacing="2">
              <Button variant="ghost" ref={cancelRef} onClick={props.onClose}>
                Cancel
              </Button>

              <Button
                colorScheme={props.confirmColorScheme}
                onClick={() => {
                  props.onConfirm?.()
                  props.onClose()
                }}
              >
                {props.confirmLabel ?? "Yes"}
              </Button>
            </HStack>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  )
}
