import { redirectIfAuthenticated } from '~/auth/auth.server'

export type LoaderData = {
    error: boolean
}

export const authSignupLoader = async (request: Request) => {
    await redirectIfAuthenticated(request, '/home')
    const url = new URL(request.url)
    const error = url.searchParams.get('error')
    return { error: error === 'true' }
}
