import { describe, expect, it } from 'vitest'
import { parseEmail } from '~/utils/parse/email.server'

describe('parseEmail', () => {
    it('returns ok for a valid email', () => {
        const result = parseEmail('user@example.com')
        expect(result.isOk).toBe(true)
        if (result.isOk) {
            expect(result.value).toBe('user@example.com')
        }
    })

    it('returns err for a string without @', () => {
        const result = parseEmail('not-an-email')
        expect(result.isErr).toBe(true)
        if (result.isErr) {
            expect(result.error.code).toBe(401)
        }
    })

    it('returns err for a string with whitespace', () => {
        const result = parseEmail('user @example.com')
        expect(result.isErr).toBe(true)
    })

    it('returns err for a string missing a TLD', () => {
        const result = parseEmail('user@example')
        expect(result.isErr).toBe(true)
    })
})
