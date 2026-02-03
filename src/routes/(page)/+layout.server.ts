// Re-enable SSR for public page routes (event pages, etc.)
// The root layout disables SSR globally, but these pages need SSR
// because they use one-time tokens (OTP) for authentication that get
// consumed during the hooks processing. Without SSR, the load function
// only runs on the second request (data fetch) after the OTP is already consumed.
export const ssr = true;
