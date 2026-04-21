import { getUser } from '~/auth/auth.server'

export const indexLoader = async (request: Request) => {
    const account = await getUser(request)
    return { account }
}
