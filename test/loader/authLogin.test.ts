import { beforeEach, describe, expect, it, vi } from 'vitest'

const redirectIfAuthenticatedMock = vi.fn()

vi.mock('~/auth/auth.server', () => ({
    redirectIfAuthenticated: redirectIfAuthenticatedMock,
}))

const { authLoginLoader } = await import('~/loader/auth.login.server')

describe('authLoginLoader', () => {
    beforeEach(() => {
        redirectIfAuthenticatedMock.mockReset()
        redirectIfAuthenticatedMock.mockResolvedValue(undefined)
    })

    it('returns nextUrl when present on the query string', async () => {
        const result = await authLoginLoader(
            new Request('http://t/auth/login?nextUrl=/dashboard')
        )
        expect(result).toEqual({ nextUrl: '/dashboard' })
    })

    it('returns nextUrl: null when the param is absent', async () => {
        const result = await authLoginLoader(
            new Request('http://t/auth/login')
        )
        expect(result.nextUrl).toBeNull()
    })

    it('calls redirectIfAuthenticated with /home as the success target', async () => {
        await authLoginLoader(new Request('http://t/auth/login'))
        expect(redirectIfAuthenticatedMock).toHaveBeenCalledWith(
            expect.any(Request),
            '/home'
        )
    })

    it('propagates the redirect when the user is already logged in', async () => {
        const redirect = new Response(null, {
            status: 302,
            headers: { Location: '/home' },
        })
        redirectIfAuthenticatedMock.mockRejectedValueOnce(redirect)
        await expect(
            authLoginLoader(new Request('http://t/auth/login'))
        ).rejects.toBe(redirect)
    })
})
