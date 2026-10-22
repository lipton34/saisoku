export type InviteCodeCheck = "unavailable" | "invalid" | "allowed";

/** Fail closed in production when the invite-code environment setting is missing. */
export function checkInviteCode(nodeEnv: string | undefined, configuredCode: string | undefined, suppliedCode: string): InviteCodeCheck {
  const required = configuredCode?.trim();
  if (nodeEnv === "production" && !required) return "unavailable";
  if (required && suppliedCode !== required) return "invalid";
  return "allowed";
}
