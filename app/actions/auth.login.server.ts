import { authenticator, commitUserSession } from '~/auth/auth.server'

export type ActionData = {
    message?: string
    code?: number
}

export const authLoginAction = async (request: Request) => {
    try {
        const user = await authenticator.authenticate('login', request)
        return await commitUserSession(request, user, '/home')
    } catch (exception) {
        if (exception instanceof Response) throw exception
        if (exception instanceof Error) {
            return { message: exception.message, code: 402 }
        }
        return { message: 'Something went wrong', code: 500 }
    }
}
