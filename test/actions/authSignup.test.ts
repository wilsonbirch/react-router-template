import { beforeEach, describe, expect, it, vi } from 'vitest'

const authenticateMock = vi.fn()
const commitUserSessionMock = vi.fn()

vi.mock('~/auth/auth.server', () => ({
    authenticator: {
        authenticate: authenticateMock,
    },
    commitUserSession: commitUserSessionMock,
}))

const { authSignupAction } = await import('~/actions/auth.signup.server')

describe('authSignupAction', () => {
    beforeEach(() => {
        authenticateMock.mockReset()
        commitUserSessionMock.mockReset()
    })

    it('authenticates with strategy "signup" and commits to /home', async () => {
        const user = { id: 2, uuid: 'u2', email: 'b@c.com', role: 'USER' }
        authenticateMock.mockResolvedValue(user)
        const response = new Response(null, { status: 302 })
        commitUserSessionMock.mockResolvedValue(response)

        const request = new Request('http://t/auth/signup', { method: 'POST' })
        const result = await authSignupAction(request)

        expect(authenticateMock).toHaveBeenCalledWith('signup', request)
        expect(commitUserSessionMock).toHaveBeenCalledWith(
            request,
            user,
            '/home'
        )
        expect(result).toBe(response)
    })

    it('returns { message, code: 402 } on thrown Error', async () => {
        authenticateMock.mockRejectedValue(new Error('Email already exists'))
        const request = new Request('http://t/auth/signup', { method: 'POST' })
        const result = await authSignupAction(request)
        expect(result).toEqual({ message: 'Email already exists', code: 402 })
    })

    it('re-throws when the underlying error is a Response', async () => {
        const thrown = new Response(null, { status: 302 })
        authenticateMock.mockRejectedValue(thrown)
        const request = new Request('http://t/auth/signup', { method: 'POST' })
        await expect(authSignupAction(request)).rejects.toBe(thrown)
    })

    it('returns a generic 500 for non-Error, non-Response thrown values', async () => {
        authenticateMock.mockRejectedValue({ weird: 'object' })
        const request = new Request('http://t/auth/signup', { method: 'POST' })
        const result = await authSignupAction(request)
        expect(result).toEqual({ message: 'Something went wrong', code: 500 })
    })
})
