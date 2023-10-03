import { FieldValues, Path, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

export function useAppForm<T extends FieldValues>(
  options: Parameters<typeof useForm<T>>[0] & {
    schema: Parameters<typeof zodResolver>[0];
    initialFocus?: Path<T>;
  }
) {
  const { schema, initialFocus, ...rest } = options;

  const form = useForm<T>({
    resolver: zodResolver(schema),
    ...rest,
  });

  const setFocus = form.setFocus;
  useEffect(() => {
    if (initialFocus) {
      setFocus(initialFocus);
    }
  }, [initialFocus, setFocus]);

  return form;
}
