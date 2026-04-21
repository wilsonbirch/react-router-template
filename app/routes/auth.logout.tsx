import { redirect } from 'react-router'
import { sessionStorage } from '~/auth/sessionStorage.server'

import type { Route } from './+types/auth.logout'

export async function loader({ request }: Route.LoaderArgs) {
    const session = await sessionStorage.getSession(
        request.headers.get('Cookie')
    )

    return redirect('/auth/login', {
        headers: {
            'Set-Cookie': await sessionStorage.destroySession(session),
        },
    })
}

export default function Logout() {
    return null
}
