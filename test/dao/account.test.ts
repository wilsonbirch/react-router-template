import bcrypt from 'bcryptjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createMock = vi.fn()

vi.mock('~/lib/db.server', () => ({
    db: {
        account: {
            create: createMock,
        },
    },
}))

const { accountCreate } = await import('~/dao/account.server')

describe('accountCreate', () => {
    beforeEach(() => {
        createMock.mockReset()
    })

    it('hashes the password before calling db.account.create', async () => {
        createMock.mockResolvedValue({
            id: 1,
            email: 'new@example.com',
            password: 'hashed',
            uuid: 'abc',
            role: 'USER',
        })

        await accountCreate('new@example.com', 'plain-password')

        expect(createMock).toHaveBeenCalledTimes(1)
        const passedArgs = createMock.mock.calls[0][0]
        expect(passedArgs.data.email).toBe('new@example.com')
        expect(passedArgs.data.password).not.toBe('plain-password')
        expect(
            bcrypt.compareSync('plain-password', passedArgs.data.password)
        ).toBe(true)
    })

    it('returns whatever db.account.create returns', async () => {
        const fakeAccount = {
            id: 7,
            email: 'x@y.com',
            password: 'hash',
            uuid: 'u',
            role: 'USER',
        }
        createMock.mockResolvedValue(fakeAccount)
        const result = await accountCreate('x@y.com', 'pw')
        expect(result).toBe(fakeAccount)
    })
})
