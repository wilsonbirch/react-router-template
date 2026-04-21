import { useEffect } from 'react'
import { settingsLoader } from '~/loader/settings.server'
import { useAuth } from '~/providers'

import type { Route } from './+types/settings'

export const meta: Route.MetaFunction = () => {
    return [
        { title: 'react-router-template | Settings' },
        {
            name: 'settings',
            content: 'Settings page for react-router-template application',
        },
    ]
}

export async function loader({ request }: Route.LoaderArgs) {
    return settingsLoader(request)
}

export default function Settings({ loaderData }: Route.ComponentProps) {
    const { account } = loaderData
    const { account: authAccount, setAccount } = useAuth()

    useEffect(() => {
        if (!authAccount) {
            setAccount({
                id: account.id,
                email: account.email,
                role: account.role,
            })
        }
    }, [])

    return (
        <div className="my-2">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="mt-2">Signed in as {account.email}</p>
        </div>
    )
}
