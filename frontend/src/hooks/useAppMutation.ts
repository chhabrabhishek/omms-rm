import { UseMutationOptions, UseMutationResult } from "@tanstack/react-query";
import type { Response } from "@/types/Response";
import { AppOptions, useMagicQueryHooks } from "./useAppQuery";

type MutationOptions<R extends Response, E, V, C> = Omit<
  UseMutationOptions<R, E, V, C>,
  "mutationFn"
>;

// Mutation that automatically shows a toast with an error in case of a hard
// failure or exposes a failure message and calls a not ok callback in case of a
// soft failure.
// TODO: It seems like you cannot pass data to hooks, that need to be fixed.
export function useAppMutation<R extends Response, E, V, C>(
  useMutation: (
    options?: MutationOptions<R, E, V, C> | undefined
  ) => UseMutationResult<R, E, V, C>,
  options: MutationOptions<R, E, V, C> & AppOptions<R, E>
) {
  const { failureMessage, hooks } = useMagicQueryHooks(options);

  const mutation = useMutation({
    ...options,
    ...hooks,
  });

  return {
    ...mutation,
    failureMessage,
  };
}
