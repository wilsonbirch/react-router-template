import { indexLoader } from '~/loader/index.server'

import type { Route } from './+types/_index'

export const meta: Route.MetaFunction = () => {
    return [
        { title: 'remix-template' },
        { name: 'remix-template', content: 'index route for remix-template' },
    ]
}

export async function loader({ request }: Route.LoaderArgs) {
    return indexLoader(request)
}

export default function Index() {
    return (
        <div>
            <p>index</p>
        </div>
    )
}
