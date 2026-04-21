import { beforeEach, describe, expect, it, vi } from 'vitest'

const getUserMock = vi.fn()

vi.mock('~/auth/auth.server', () => ({
    getUser: getUserMock,
}))

const { rootLoader } = await import('~/loader/root.server')

describe('rootLoader', () => {
    beforeEach(() => {
        getUserMock.mockReset()
    })

    it('returns { account: null } when not authenticated', async () => {
        getUserMock.mockResolvedValue(null)
        expect(await rootLoader(new Request('http://t/'))).toEqual({
            account: null,
        })
    })

    it('passes the request Cookie header to getUser', async () => {
        getUserMock.mockResolvedValue(null)
        const request = new Request('http://t/', {
            headers: { Cookie: '_session=abc' },
        })
        await rootLoader(request)
        expect(getUserMock).toHaveBeenCalledWith(request)
    })
})
