import { AxiosError } from "axios";
import { toast } from "react-hot-toast";
import { Response } from "@/types/Response";

export function autoToast(options: {
  error: AxiosError<Response>;
  messages?: Record<number | string, string>;
}) {
  const message = makeMessage({
    data: options.error.response?.data,
    error: options.error,
    messages: options.messages,
  });

  return toast.error(
    message ?? options.messages?.error ?? failureMessages.unknown_failure
  );
}

/*
  Tries to find the failure reason given an optional error instance and
  response. It doesn't account for the ok flag, if an error exists, it
  will always be returned.
*/
export function extractReason(options: {
  error?: AxiosError<Response>;
  data?: Response;
}): string | number | undefined {
  if (options.error) {
    // Axios will report an exception if the response is anything but 20X.
    // But, in some cases, we still return a structured response.
    if (options.error.response?.data?.error) {
      return options.error.response.data.error.reason;
    }

    if (options.error.code === "ERR_NETWORK") {
      return navigator.onLine
        ? "network_error_online"
        : "network_error_offline";
    }

    return options.error?.status;
  }

  if (options.data?.error) {
    return options.data?.error?.reason;
  }

  if (options.data?.detail) {
    if (!options.data.detail.includes(" ")) {
      return options.data.detail;
    }
  }
}

/*
  Given an error object, response and a map of messages, returns a
  presentable message using defaults.
*/
export function makeMessage(options: {
  data?: Response;
  error?: AxiosError<Response>;
  messages?: Record<string | number, string>;
}) {
  const reason = extractReason({
    data: options.data,
    error: options.error,
  });

  const messages: typeof options.messages = {
    ...failureMessages,
    ...options.messages,
  };

  return (
    ((reason && messages[reason]) || undefined) ??
    options.data?.error?.detail ??
    options.data?.detail
  );
}

export const failureMessages = {
  network_error_online:
    "We're having trouble connecting to our server right now. Please wait a moment and try again.",
  network_error_offline:
    "We're having trouble connecting to our server right now. Are you connected to the internet?",

  page_auth_unavailable: "You need to be logged in to access this page.",
  page_unauthorized: "You do not have permission to access this page.",
  auth_token_not_found:
    "We're having trouble checking your account. Try logging out and then logging back in.",
  auth_account_inactive:
    "Your account was deactivated. Contact support for more information.",
  auth_token_expired:
    "You session has expired. Please log back in to continue.",
  unauthorized: "You are not authorized to access this resource.",

  session_not_found:
    "We're having trouble checking your access to the challenge.?",
  session_not_idle:
    "Your challenge has already started. You cannot access this page anymore.",
  session_not_in_progress:
    "You can only access this page when your challenge is in progress.",

  validation_failed:
    "Your request could not be processed because it included some invalid data.",

  unknown_failure: "We couldn't process your request. Something went wrong.",
};
