import { describe, expect, it } from 'vitest'
import { sessionStorage } from '~/auth/sessionStorage.server'

describe('sessionStorage', () => {
    it('commits a new session and returns a Set-Cookie header value', async () => {
        const session = await sessionStorage.getSession()
        session.set('user', { id: 1, email: 'u@example.com' })
        const cookie = await sessionStorage.commitSession(session)
        expect(typeof cookie).toBe('string')
        expect(cookie).toContain('_session=')
    })

    it('round-trips session data through a Cookie header', async () => {
        const session = await sessionStorage.getSession()
        session.set('user', { id: 42, email: 'round@trip.com' })
        const cookie = await sessionStorage.commitSession(session)

        const cookieHeader = cookie.split(';')[0]
        const restored = await sessionStorage.getSession(cookieHeader)
        expect(restored.get('user')).toEqual({
            id: 42,
            email: 'round@trip.com',
        })
    })

    it('destroys a session and returns a clearing Set-Cookie', async () => {
        const session = await sessionStorage.getSession()
        session.set('user', { id: 1 })
        const destroyed = await sessionStorage.destroySession(session)
        expect(destroyed).toContain('_session=')
        expect(destroyed.toLowerCase()).toMatch(/max-age=0|expires=/)
    })
})
