import crypto from 'crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSignature } from '~/utils/createSignature.server.'

describe('createSignature', () => {
    const originalSecret = process.env.APP_SECRET

    afterEach(() => {
        process.env.APP_SECRET = originalSecret
        vi.restoreAllMocks()
    })

    it('returns an HMAC-SHA256 hex signature of the body using APP_SECRET', () => {
        process.env.APP_SECRET = 'my-test-secret'
        const body = 'payload-to-sign'
        const expected = crypto
            .createHmac('sha256', 'my-test-secret')
            .update(body)
            .digest('hex')
        expect(createSignature(body)).toBe(expected)
    })

    it('returns an empty string and logs a warning when APP_SECRET is unset', () => {
        delete process.env.APP_SECRET
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
        expect(createSignature('anything')).toBe('')
        expect(logSpy).toHaveBeenCalledWith('APP Secret not set')
    })

    it('produces different signatures for different bodies', () => {
        process.env.APP_SECRET = 'secret'
        expect(createSignature('a')).not.toBe(createSignature('b'))
    })
})
