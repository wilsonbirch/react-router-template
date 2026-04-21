import { beforeEach, describe, expect, it, vi } from 'vitest'

const redirectIfAuthenticatedMock = vi.fn()

vi.mock('~/auth/auth.server', () => ({
    redirectIfAuthenticated: redirectIfAuthenticatedMock,
}))

const { authSignupLoader } = await import('~/loader/auth.signup.server')

describe('authSignupLoader', () => {
    beforeEach(() => {
        redirectIfAuthenticatedMock.mockReset()
        redirectIfAuthenticatedMock.mockResolvedValue(undefined)
    })

    it('returns { error: true } when ?error=true', async () => {
        const result = await authSignupLoader(
            new Request('http://t/auth/signup?error=true')
        )
        expect(result).toEqual({ error: true })
    })

    it('returns { error: false } when the error param is missing', async () => {
        const result = await authSignupLoader(
            new Request('http://t/auth/signup')
        )
        expect(result).toEqual({ error: false })
    })

    it('returns { error: false } when ?error=something-else', async () => {
        const result = await authSignupLoader(
            new Request('http://t/auth/signup?error=false')
        )
        expect(result).toEqual({ error: false })
    })
})
