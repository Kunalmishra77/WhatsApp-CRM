const VERIFY_TOKEN_ENV_KEYS = [
  'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
  'META_WEBHOOK_VERIFY_TOKEN',
] as const

export type WebhookVerifyTokenEnvKey = (typeof VERIFY_TOKEN_ENV_KEYS)[number]

export interface WebhookVerifyToken {
  key: WebhookVerifyTokenEnvKey
  value: string
}

/**
 * Reads one or more production webhook verification tokens from env.
 *
 * Multiple values may be comma-separated to support short key rotation:
 * set `old-token,new-token`, update Meta to `new-token`, then remove
 * `old-token` after verification succeeds.
 */
export function getWebhookVerifyTokensFromEnv(
  env: Record<string, string | undefined> = process.env,
): WebhookVerifyToken[] {
  return VERIFY_TOKEN_ENV_KEYS.flatMap((key) => {
    const raw = env[key]
    if (!raw) return []

    return raw
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => ({ key, value }))
  })
}

export function findMatchingEnvVerifyToken(
  candidate: string,
  env: Record<string, string | undefined> = process.env,
): WebhookVerifyToken | null {
  return (
    getWebhookVerifyTokensFromEnv(env).find(
      (token) => token.value === candidate,
    ) ?? null
  )
}
