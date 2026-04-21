import { requireUser } from '~/auth/auth.server'

import type { AuthAccount } from '~/auth/auth.server'

export type LoaderData = {
    account: AuthAccount
    nextUrl?: string
}

export const homeLoader = async (request: Request) => {
    const account = await requireUser(request, '/auth/login')
    const url = new URL(request.url)
    const nextUrl = url.searchParams.get('nextUrl')
    return { account, nextUrl }
}
