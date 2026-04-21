import { authenticator, commitUserSession } from '~/auth/auth.server'
import { logger } from '~/lib/logger.server'

const fileName = 'actions/auth.signup.server'

export type ActionData = {
    message?: string
    code?: number
}

export const authSignupAction = async (request: Request) => {
    logger.info(fileName, 'START')
    try {
        const user = await authenticator.authenticate('signup', request)
        const response = await commitUserSession(request, user, '/home')
        logger.info(fileName, `END accountId:${user.id}`)
        return response
    } catch (exception) {
        if (exception instanceof Response) throw exception
        if (exception instanceof Error) {
            logger.error(fileName, `END error message:${exception.message}`)
            return { message: exception.message, code: 402 }
        }
        logger.error(fileName, 'END error reason:unknown')
        return { message: 'Something went wrong', code: 500 }
    }
}
