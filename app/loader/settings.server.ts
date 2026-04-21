import { requireUser } from '~/auth/auth.server'

import type { AuthAccount } from '~/auth/auth.server'

export type LoaderData = {
    account: AuthAccount
}

export const settingsLoader = async (request: Request) => {
    const account = await requireUser(request, '/auth/login')
    return { account }
}
