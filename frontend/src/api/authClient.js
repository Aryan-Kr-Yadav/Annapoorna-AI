import { createAuthClient } from "@neondatabase/auth";

export const NEON_AUTH_URL =
  import.meta.env.VITE_NEON_AUTH_URL ||
  "https://ep-lively-pond-b42xr4gx.neonauth.c-6.us-east-2.aws.neon.tech/neondb/auth";

export const authClient = createAuthClient(NEON_AUTH_URL);

export default authClient;
