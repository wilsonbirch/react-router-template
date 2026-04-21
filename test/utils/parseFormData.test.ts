import { describe, expect, it } from 'vitest'
import { parseFormData } from '~/utils/parse/formData.server'

describe('parseFormData', () => {
    describe('string values', () => {
        it('returns ok with the string for a non-empty string', () => {
            const result = parseFormData('hello', 'greeting')
            expect(result.isOk).toBe(true)
            if (result.isOk) expect(result.value).toBe('hello')
        })

        it('returns ok(null) for an empty string', () => {
            const result = parseFormData('', 'greeting')
            expect(result.isOk).toBe(true)
            if (result.isOk) expect(result.value).toBeNull()
        })

        it('returns ok(null) for the literal string "null"', () => {
            const result = parseFormData('null', 'greeting')
            expect(result.isOk).toBe(true)
            if (result.isOk) expect(result.value).toBeNull()
        })
    })

    describe('number mode', () => {
        it('returns ok with a parsed number when number flag is set', () => {
            const result = parseFormData('123', 'count', true)
            expect(result.isOk).toBe(true)
            if (result.isOk) expect(result.value).toBe(123)
        })

        it('returns err when number flag is set and value is not numeric', () => {
            const result = parseFormData('abc', 'count', true)
            expect(result.isErr).toBe(true)
        })
    })

    describe('null input', () => {
        it('returns ok(null) for a null input', () => {
            const result = parseFormData(null, 'anything')
            expect(result.isOk).toBe(true)
            if (result.isOk) expect(result.value).toBeNull()
        })
    })

    describe('File input', () => {
        it('returns ok for a File (typeof object)', () => {
            const file = new File(['content'], 'test.txt')
            const result = parseFormData(file, 'upload')
            expect(result.isOk).toBe(true)
            if (result.isOk) expect(result.value).toBe(file)
        })
    })
})
