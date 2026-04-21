import { getUser } from '~/auth/auth.server'

import type { AuthAccount } from '~/auth/auth.server'

export type LoaderData = {
    account: AuthAccount | null
}

export const rootLoader = async (request: Request) => {
    const account = await getUser(request)
    return { account }
}
