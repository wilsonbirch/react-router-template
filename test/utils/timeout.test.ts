import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { timeout } from '~/utils/timeout'

describe('timeout', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('resolves after the given number of seconds', async () => {
        let resolved = false
        const promise = timeout(2).then(() => {
            resolved = true
        })

        await vi.advanceTimersByTimeAsync(1000)
        expect(resolved).toBe(false)

        await vi.advanceTimersByTimeAsync(1000)
        await promise
        expect(resolved).toBe(true)
    })

    it('resolves immediately for timeout(0)', async () => {
        let resolved = false
        const promise = timeout(0).then(() => {
            resolved = true
        })
        await vi.advanceTimersByTimeAsync(0)
        await promise
        expect(resolved).toBe(true)
    })
})
