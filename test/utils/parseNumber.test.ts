import { describe, expect, it } from 'vitest'
import { parseNumber } from '~/utils/parse/number.server'

describe('parseNumber', () => {
    it('returns ok(null) for an empty string', () => {
        const result = parseNumber('age', '')
        expect(result.isOk).toBe(true)
        if (result.isOk) expect(result.value).toBeNull()
    })

    it('returns ok with a number for a numeric string', () => {
        const result = parseNumber('age', '42')
        expect(result.isOk).toBe(true)
        if (result.isOk) expect(result.value).toBe(42)
    })

    it('returns ok with a number for an actual number', () => {
        const result = parseNumber('age', 7)
        expect(result.isOk).toBe(true)
        if (result.isOk) expect(result.value).toBe(7)
    })

    it('returns err for a non-numeric string', () => {
        const result = parseNumber('age', 'not-a-number')
        expect(result.isErr).toBe(true)
        if (result.isErr) {
            expect(result.error.code).toBe(401)
            expect(result.error.message).toContain('age')
        }
    })

    it('returns err for undefined', () => {
        const result = parseNumber('age', undefined)
        expect(result.isErr).toBe(true)
    })
})
