import { default as bcryptjs } from 'bcryptjs'
import { redirect } from 'react-router'
import { Authenticator } from 'remix-auth'
import { FormStrategy } from 'remix-auth-form'
import { db } from '~/lib/db.server'
import { logger } from '~/lib/logger.server'
import { parseEmail } from '~/utils/index.server'
import { sessionStorage } from './sessionStorage.server'

export type AuthAccount = {
    id: number
    uuid: string
    email: string
    role: 'ADMIN' | 'USER'
}

const USER_SESSION_KEY = 'user'

const fileName = 'auth/auth.server'

const sessionSecret = process.env.SESSION_SECRET

if (!sessionSecret) {
    throw new Error('SESSION_SECRET must be set')
}

const authenticator = new Authenticator<AuthAccount>()

const loginFormStrategy = new FormStrategy(async ({ form }) => {
    const email = form.get('email') as string
    const password = form.get('password') as string

    const account = await db.account.findUnique({
        where: { email: email },
    })
    if (!account) {
        logger.warn(fileName, `login failed email:${email} reason:account_not_found`)
        throw new Error('Incorrect credentials, please try again')
    }

    const passwordsMatch = await bcryptjs.compare(
        password,
        account.password as string
    )
    if (!passwordsMatch) {
        logger.warn(fileName, `login failed email:${email} reason:password_mismatch`)
        throw new Error('Incorrect credentials, please try again')
    }
    logger.info(fileName, `login success accountId:${account.id} email:${email}`)
    return {
        id: account.id,
        uuid: account.uuid,
        email: account.email,
        role: account.role as 'ADMIN' | 'USER',
    } satisfies AuthAccount
})

authenticator.use(loginFormStrategy, 'login')

const signUpFormStrategy = new FormStrategy(async ({ form }) => {
    const email = form.get('email') as string
    const password = form.get('password') as string

    const existingAccount = await db.account.findUnique({
        where: { email: email },
        select: {
            id: true,
            email: true,
            uuid: true,
            role: true,
        },
    })

    if (existingAccount) {
        logger.warn(fileName, `signup failed email:${email} reason:account_exists`)
        throw new Error('Account with that email already exists, login instead?')
    }

    const isEmail = parseEmail(email)

    if (isEmail.isErr) {
        logger.warn(fileName, `signup failed email:${email} reason:invalid_email`)
        throw new Error('Not a valid email, try a different one')
    }

    if (password.length <= 7) {
        logger.warn(fileName, `signup failed email:${email} reason:password_too_short`)
        throw new Error('Password must be 8 characters in length')
    }

    const salt = bcryptjs.genSaltSync(10)
    const passwordHash = bcryptjs.hashSync(password, salt)
    const account = await db.account.create({
        data: {
            email: email,
            password: passwordHash,
        },
    })

    if (!account) {
        logger.error(fileName, `signup failed email:${email} reason:account_create_returned_null`)
        throw new Error('Something went wrong creating account')
    }

    logger.info(fileName, `signup success accountId:${account.id} email:${email}`)
    return {
        id: account.id,
        uuid: account.uuid,
        email: account.email,
        role: account.role as 'ADMIN' | 'USER',
    } satisfies AuthAccount
})

authenticator.use(signUpFormStrategy, 'signup')

export async function getUser(request: Request): Promise<AuthAccount | null> {
    const session = await sessionStorage.getSession(
        request.headers.get('Cookie')
    )
    const user = session.get(USER_SESSION_KEY)
    return (user as AuthAccount) ?? null
}

export async function requireUser(
    request: Request,
    failureRedirect = '/auth/login'
): Promise<AuthAccount> {
    const user = await getUser(request)
    if (!user) throw redirect(failureRedirect)
    return user
}

export async function redirectIfAuthenticated(
    request: Request,
    successRedirect = '/home'
) {
    const user = await getUser(request)
    if (user) throw redirect(successRedirect)
}

export async function commitUserSession(
    request: Request,
    user: AuthAccount,
    redirectTo: string
) {
    const session = await sessionStorage.getSession(
        request.headers.get('Cookie')
    )
    session.set(USER_SESSION_KEY, user)
    return redirect(redirectTo, {
        headers: { 'Set-Cookie': await sessionStorage.commitSession(session) },
    })
}

export { authenticator }
