import bcrypt from 'bcryptjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const findUniqueMock = vi.fn()
const createMock = vi.fn()

vi.mock('~/lib/db.server', () => ({
    db: {
        account: {
            findUnique: findUniqueMock,
            create: createMock,
        },
    },
}))

const {
    getUser,
    requireUser,
    redirectIfAuthenticated,
    commitUserSession,
    authenticator,
} = await import('~/auth/auth.server')
const { sessionStorage } = await import('~/auth/sessionStorage.server')

async function makeAuthedRequest(user: unknown, url = 'http://t/') {
    const session = await sessionStorage.getSession()
    session.set('user', user)
    const setCookie = await sessionStorage.commitSession(session)
    const cookie = setCookie.split(';')[0]
    return new Request(url, { headers: { Cookie: cookie } })
}

function formRequest(fields: Record<string, string>, url = 'http://t/') {
    const body = new URLSearchParams(fields).toString()
    return new Request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
    })
}

const adminUser = {
    id: 1,
    uuid: 'u-1',
    email: 'a@b.com',
    role: 'ADMIN' as const,
}

describe('getUser', () => {
    it('returns null when no session cookie is present', async () => {
        const request = new Request('http://t/')
        expect(await getUser(request)).toBeNull()
    })

    it('returns the user when a valid session cookie is present', async () => {
        const request = await makeAuthedRequest(adminUser)
        expect(await getUser(request)).toEqual(adminUser)
    })
})

describe('requireUser', () => {
    it('returns the user when authenticated', async () => {
        const request = await makeAuthedRequest(adminUser)
        expect(await requireUser(request)).toEqual(adminUser)
    })

    it('throws a redirect Response to /auth/login by default when unauthenticated', async () => {
        const request = new Request('http://t/')
        await expect(requireUser(request)).rejects.toSatisfy((thrown) => {
            if (!(thrown instanceof Response)) return false
            return (
                thrown.status === 302 &&
                thrown.headers.get('Location') === '/auth/login'
            )
        })
    })

    it('honors a custom failureRedirect', async () => {
        const request = new Request('http://t/')
        await expect(
            requireUser(request, '/somewhere-else')
        ).rejects.toSatisfy((thrown) => {
            return (
                thrown instanceof Response &&
                thrown.headers.get('Location') === '/somewhere-else'
            )
        })
    })
})

describe('redirectIfAuthenticated', () => {
    it('does nothing when no user is in the session', async () => {
        const request = new Request('http://t/')
        await expect(redirectIfAuthenticated(request)).resolves.toBeUndefined()
    })

    it('throws a redirect when a user is in the session', async () => {
        const request = await makeAuthedRequest(adminUser)
        await expect(redirectIfAuthenticated(request, '/home')).rejects.toSatisfy(
            (thrown) =>
                thrown instanceof Response &&
                thrown.headers.get('Location') === '/home'
        )
    })
})

describe('commitUserSession', () => {
    it('sets user on the session and returns a redirect with Set-Cookie', async () => {
        const request = new Request('http://t/')
        const response = await commitUserSession(request, adminUser, '/home')
        expect(response).toBeInstanceOf(Response)
        expect(response.status).toBe(302)
        expect(response.headers.get('Location')).toBe('/home')
        const setCookie = response.headers.get('Set-Cookie')
        expect(setCookie).toContain('_session=')
    })

    it('stores the user so a later getUser can read it', async () => {
        const request = new Request('http://t/')
        const response = await commitUserSession(request, adminUser, '/home')
        const setCookie = response.headers.get('Set-Cookie')!
        const cookie = setCookie.split(';')[0]
        const nextRequest = new Request('http://t/', {
            headers: { Cookie: cookie },
        })
        expect(await getUser(nextRequest)).toEqual(adminUser)
    })
})

describe('authenticator.authenticate("login")', () => {
    beforeEach(() => {
        findUniqueMock.mockReset()
    })

    it('returns the account on valid credentials', async () => {
        const salt = bcrypt.genSaltSync(4)
        const passwordHash = bcrypt.hashSync('correct-password', salt)
        findUniqueMock.mockResolvedValue({
            id: 9,
            uuid: 'uuid-9',
            email: 'ok@t.com',
            role: 'USER',
            password: passwordHash,
        })

        const request = formRequest({
            email: 'ok@t.com',
            password: 'correct-password',
        })
        const result = await authenticator.authenticate('login', request)
        expect(result).toEqual({
            id: 9,
            uuid: 'uuid-9',
            email: 'ok@t.com',
            role: 'USER',
        })
    })

    it('throws when account does not exist', async () => {
        findUniqueMock.mockResolvedValue(null)
        const request = formRequest({
            email: 'missing@t.com',
            password: 'any',
        })
        await expect(
            authenticator.authenticate('login', request)
        ).rejects.toThrow(/incorrect credentials/i)
    })

    it('throws on password mismatch', async () => {
        const passwordHash = bcrypt.hashSync('right', bcrypt.genSaltSync(4))
        findUniqueMock.mockResolvedValue({
            id: 1,
            uuid: 'u',
            email: 'u@t.com',
            role: 'USER',
            password: passwordHash,
        })
        const request = formRequest({ email: 'u@t.com', password: 'wrong' })
        await expect(
            authenticator.authenticate('login', request)
        ).rejects.toThrow(/incorrect credentials/i)
    })
})

describe('authenticator.authenticate("signup")', () => {
    beforeEach(() => {
        findUniqueMock.mockReset()
        createMock.mockReset()
    })

    it('rejects when an account with the email already exists', async () => {
        findUniqueMock.mockResolvedValue({
            id: 1,
            uuid: 'u',
            email: 'dup@t.com',
            role: 'USER',
        })
        const request = formRequest({
            email: 'dup@t.com',
            password: 'password123',
        })
        await expect(
            authenticator.authenticate('signup', request)
        ).rejects.toThrow(/already exists/i)
    })

    it('rejects on invalid email format', async () => {
        findUniqueMock.mockResolvedValue(null)
        const request = formRequest({
            email: 'not-an-email',
            password: 'password123',
        })
        await expect(
            authenticator.authenticate('signup', request)
        ).rejects.toThrow(/valid email/i)
    })

    it('rejects on short password', async () => {
        findUniqueMock.mockResolvedValue(null)
        const request = formRequest({
            email: 'new@t.com',
            password: 'short',
        })
        await expect(
            authenticator.authenticate('signup', request)
        ).rejects.toThrow(/8 characters/i)
    })

    it('creates the account on valid input and returns its AuthAccount shape', async () => {
        findUniqueMock.mockResolvedValue(null)
        createMock.mockResolvedValue({
            id: 10,
            uuid: 'uuid-10',
            email: 'new@t.com',
            role: 'USER',
            password: 'hash',
        })
        const request = formRequest({
            email: 'new@t.com',
            password: 'longenough',
        })
        const result = await authenticator.authenticate('signup', request)
        expect(result).toEqual({
            id: 10,
            uuid: 'uuid-10',
            email: 'new@t.com',
            role: 'USER',
        })
        expect(createMock).toHaveBeenCalledTimes(1)
    })
})
