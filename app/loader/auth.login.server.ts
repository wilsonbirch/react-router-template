import { redirectIfAuthenticated } from '~/auth/auth.server'

export type LoaderData = {
    nextUrl?: string
}

export const authLoginLoader = async (request: Request) => {
    await redirectIfAuthenticated(request, '/home')
    const url = new URL(request.url)
    const nextUrl = url.searchParams.get('nextUrl')
    return { nextUrl }
}
