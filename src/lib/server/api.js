export class ApiError extends Error {
  constructor(message, code = "UPSTREAM_UNAVAILABLE", status = 503, retryAfter = null) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export function positiveInteger(value, name = "id", fallback, max = 2147483647) {
  if ((value === undefined || value === null || value === "") && fallback !== undefined) return fallback;
  if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) > max) {
    throw new ApiError(`${name} must be an integer between 1 and ${max}.`, "INVALID_REQUEST", 400);
  }
  return Number(value);
}

export function apiSuccess(data, maxAge = 60) {
  return Response.json(data, {
    headers: { "Cache-Control": `public, s-maxage=${maxAge}, stale-while-revalidate=60`, "X-Content-Type-Options": "nosniff" },
  });
}

export function apiFailure(error) {
  const recognized = typeof error?.code === "string" && Number.isInteger(error?.status);
  const status = recognized && error.status >= 400 && error.status <= 599 ? error.status : 503;
  return Response.json({ error: {
    code: recognized ? error.code : "SERVICE_UNAVAILABLE",
    message: recognized ? error.message : "The anime service is temporarily unavailable. Please try again.",
  } }, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...(error?.retryAfter ? { "Retry-After": String(error.retryAfter) } : {}),
    },
  });
}
