import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireUserMock = vi.fn()

vi.mock('~/auth/auth.server', () => ({
    requireUser: requireUserMock,
}))

const { homeLoader } = await import('~/loader/home.server')

describe('homeLoader', () => {
    beforeEach(() => {
        requireUserMock.mockReset()
    })

    it('returns the account and parses nextUrl from the query string', async () => {
        const account = { id: 1, uuid: 'u', email: 'a@b.com', role: 'USER' }
        requireUserMock.mockResolvedValue(account)

        const result = await homeLoader(
            new Request('http://t/home?nextUrl=/settings')
        )
        expect(result).toEqual({ account, nextUrl: '/settings' })
    })

    it('returns nextUrl: null when the query param is absent', async () => {
        const account = { id: 1, uuid: 'u', email: 'a@b.com', role: 'USER' }
        requireUserMock.mockResolvedValue(account)

        const result = await homeLoader(new Request('http://t/home'))
        expect(result.nextUrl).toBeNull()
    })

    it('propagates a requireUser redirect', async () => {
        const redirect = new Response(null, {
            status: 302,
            headers: { Location: '/auth/login' },
        })
        requireUserMock.mockRejectedValue(redirect)

        await expect(homeLoader(new Request('http://t/home'))).rejects.toBe(
            redirect
        )
    })
})
