import { describe, expect, it } from 'vitest'
import {
  findMatchingEnvVerifyToken,
  getWebhookVerifyTokensFromEnv,
} from './webhook-verify-token'

describe('webhook verify token env config', () => {
  it('loads the primary WhatsApp webhook verify token', () => {
    expect(
      getWebhookVerifyTokensFromEnv({
        WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'secret-token',
      }),
    ).toEqual([
      { key: 'WHATSAPP_WEBHOOK_VERIFY_TOKEN', value: 'secret-token' },
    ])
  })

  it('trims comma-separated values for token rotation', () => {
    expect(
      getWebhookVerifyTokensFromEnv({
        WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'old-token, new-token ,,',
      }),
    ).toEqual([
      { key: 'WHATSAPP_WEBHOOK_VERIFY_TOKEN', value: 'old-token' },
      { key: 'WHATSAPP_WEBHOOK_VERIFY_TOKEN', value: 'new-token' },
    ])
  })

  it('supports the legacy META_WEBHOOK_VERIFY_TOKEN alias', () => {
    expect(
      findMatchingEnvVerifyToken('meta-token', {
        META_WEBHOOK_VERIFY_TOKEN: 'meta-token',
      }),
    ).toEqual({ key: 'META_WEBHOOK_VERIFY_TOKEN', value: 'meta-token' })
  })

  it('rejects missing or different values', () => {
    expect(
      findMatchingEnvVerifyToken('expected', {
        WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'different',
      }),
    ).toBeNull()
    expect(findMatchingEnvVerifyToken('expected', {})).toBeNull()
  })
})

