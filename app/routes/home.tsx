import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { homeLoader } from '~/loader/home.server'
import { useAuth } from '~/providers'

import type { Route } from './+types/home'

export const meta: Route.MetaFunction = () => {
    return [
        { title: 'remix-template | Home' },
        { name: 'home', content: 'Home page for remix-template application' },
    ]
}

export async function loader({ request }: Route.LoaderArgs) {
    return homeLoader(request)
}

export default function Home({ loaderData }: Route.ComponentProps) {
    const navigate = useNavigate()
    const { account, nextUrl } = loaderData
    const { account: authAccount, setAccount } = useAuth()

    useEffect(() => {
        if (!authAccount) {
            setAccount({
                id: account.id,
                email: account.email,
                role: account.role,
            })
        }
        if (nextUrl) {
            navigate(nextUrl)
        }
    }, [])

    return (
        <div className="my-2">
            <p>Home</p>
        </div>
    )
}
