import {
  FormControl,
  FormControlProps,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
} from "@chakra-ui/react";
import { FieldError } from "react-hook-form";

/*
    FormControl that is aware of the react-hook-form binding
    of the underlying input element.
  */
export function AppFormControl(
  props: FormControlProps & {
    label?: string;
    help?: string;
    error?: Partial<FieldError>;
  }
) {
  const { label, error, help, children, ...rest } = props;

  return (
    <FormControl isInvalid={Boolean(error)} {...rest}>
      {label && <FormLabel>{label}</FormLabel>}
      {children}
      {error && <ReactHookFormErrorMessage error={error} />}
      {help && <FormHelperText>{help}</FormHelperText>}
    </FormControl>
  );
}

export function ReactHookFormErrorMessage(props: {
  error?: Partial<FieldError>;
}) {
  let message = props.error?.message;

  if (props.error && !message) {
    switch (props.error.type) {
      case "required":
        message = "This field is required.";
        break;
    }
  }

  return message ? <FormErrorMessage>{message}</FormErrorMessage> : null;
}
