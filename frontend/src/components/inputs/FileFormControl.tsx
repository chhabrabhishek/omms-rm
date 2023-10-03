import { Box, Button, Icon, Input, Stack } from "@chakra-ui/react"
import { AppFormControl } from "../form/AppFormControl"
import { IconCloudUpload, IconExternalLink } from "@tabler/icons-react"
import { LinkButton } from "../buttons/LinkButton"
import { useRef } from "react"

// TODO: This field should support using the regular hook form interface.
export function FileFormControl(props: {
  currentFile?: string
  value?: File
  accept: string
  label: string
  isRequired?: boolean
  onFileSelect: (file: File) => void
  // TODO: This should ideally come from the form element itself.
  isTouched?: boolean
}) {
  const fieldRef = useRef<HTMLInputElement>(null)

  return (
    <AppFormControl
      label={props.label}
      isRequired={props.isRequired}
      error={
        props.isTouched && props.isRequired && !props.value
          ? {
              type: "required",
              message: "Select a file",
            }
          : undefined
      }
      position="relative"
    >
      <Input
        ref={fieldRef}
        type="file"
        accept={props.accept}
        // This style allows for the style bubbles to still work.
        // Such as the field required bubble.
        opacity={0}
        pointerEvents="none"
        position="absolute"
        zIndex={-1}
        tabIndex={-1}
        onChange={(event) => {
          if (event.target.files) {
            props.onFileSelect(event.target.files[0])
          }
        }}
      />

      <Stack direction={["column", "column", "row"]} spacing={["2", "2", "6"]}>
        <Button
          w="full"
          justifyContent="start"
          fontWeight="normal"
          overflow="hidden"
          leftIcon={<Icon as={IconCloudUpload} />}
          onClick={() => fieldRef?.current?.click()}
        >
          {props.value ? props.value.name : `Select your ${props.label}`}
        </Button>

        {props.currentFile && (
          <Box w={["full", "full", "auto"]}>
            <LinkButton
              w="full"
              href={props.currentFile}
              target="_blank"
              variant="solid"
              leftIcon={<Icon fontSize="md" as={IconExternalLink} />}
            >
              View Current
            </LinkButton>
          </Box>
        )}
      </Stack>
    </AppFormControl>
  )
}
