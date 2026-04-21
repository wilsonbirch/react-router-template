import { beforeEach, describe, expect, it, vi } from 'vitest'

const authenticateMock = vi.fn()
const commitUserSessionMock = vi.fn()

vi.mock('~/auth/auth.server', () => ({
    authenticator: {
        authenticate: authenticateMock,
    },
    commitUserSession: commitUserSessionMock,
}))

const { authLoginAction } = await import('~/actions/auth.login.server')

describe('authLoginAction', () => {
    beforeEach(() => {
        authenticateMock.mockReset()
        commitUserSessionMock.mockReset()
    })

    it('authenticates with strategy "login" and commits the session to /home', async () => {
        const user = { id: 1, uuid: 'u', email: 'a@b.com', role: 'USER' }
        authenticateMock.mockResolvedValue(user)
        const response = new Response(null, { status: 302 })
        commitUserSessionMock.mockResolvedValue(response)

        const request = new Request('http://t/auth/login', { method: 'POST' })
        const result = await authLoginAction(request)

        expect(authenticateMock).toHaveBeenCalledWith('login', request)
        expect(commitUserSessionMock).toHaveBeenCalledWith(request, user, '/home')
        expect(result).toBe(response)
    })

    it('returns { message, code: 402 } on thrown Error', async () => {
        authenticateMock.mockRejectedValue(new Error('Bad credentials'))
        const request = new Request('http://t/auth/login', { method: 'POST' })
        const result = await authLoginAction(request)
        expect(result).toEqual({ message: 'Bad credentials', code: 402 })
    })

    it('re-throws when the underlying error is a Response', async () => {
        const thrown = new Response(null, {
            status: 302,
            headers: { Location: '/elsewhere' },
        })
        authenticateMock.mockRejectedValue(thrown)
        const request = new Request('http://t/auth/login', { method: 'POST' })
        await expect(authLoginAction(request)).rejects.toBe(thrown)
    })

    it('returns a generic 500 for non-Error, non-Response thrown values', async () => {
        authenticateMock.mockRejectedValue('oops')
        const request = new Request('http://t/auth/login', { method: 'POST' })
        const result = await authLoginAction(request)
        expect(result).toEqual({ message: 'Something went wrong', code: 500 })
    })
})
