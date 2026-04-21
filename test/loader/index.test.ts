import { beforeEach, describe, expect, it, vi } from 'vitest'

const getUserMock = vi.fn()

vi.mock('~/auth/auth.server', () => ({
    getUser: getUserMock,
}))

const { indexLoader } = await import('~/loader/index.server')

describe('indexLoader', () => {
    beforeEach(() => {
        getUserMock.mockReset()
    })

    it('returns { account: null } when no user', async () => {
        getUserMock.mockResolvedValue(null)
        const result = await indexLoader(new Request('http://t/'))
        expect(result).toEqual({ account: null })
    })

    it('returns the user when authenticated', async () => {
        const user = { id: 1, uuid: 'u', email: 'a@b.com', role: 'USER' }
        getUserMock.mockResolvedValue(user)
        const result = await indexLoader(new Request('http://t/'))
        expect(result).toEqual({ account: user })
    })
})
