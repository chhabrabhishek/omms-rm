export type ResourceResponse<R = unknown> = {
  ok?: boolean;
  error?: {
    reason?: string;
    detail?: string;
  };
  result?: R;
};

// The expected response structure when processing the request
// failed for whatever reason.
export type ErrorResponse = {
  detail?: string;
};

export type Response = ResourceResponse & ErrorResponse;
