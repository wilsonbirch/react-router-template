import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'
import {
    ErrorBoundary as ErrorBoundaryComponent,
    Header,
    Loading,
} from '~/components'
import { rootLoader } from '~/loader/root.server'
import { Providers } from '~/providers'

import type { Route } from './+types/root'

import 'remixicon/fonts/remixicon.css'
import '~/styles/loading.css'
import '~/styles/main.css'
import '~/styles/tailwind.css'

export type RootContextAccount = {
    id: number
    email: string
    role: string
}

export type RootContext = {
    setToast: React.Dispatch<
        React.SetStateAction<{ message: null | string; error?: boolean }>
    >
}

export async function loader({ request }: Route.LoaderArgs) {
    return rootLoader(request)
}

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <Meta />
                <Links />
            </head>
            <body>
                {children}
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    )
}

export default function App({ loaderData }: Route.ComponentProps) {
    const { account } = loaderData

    return (
        <Providers initialAccount={account}>
            <main className="min-h-screen text-foreground bg-background">
                <Header />
                <div className="container mx-auto md:px-0 px-2">
                    <Outlet />
                    <Loading overlay={true} />
                </div>
            </main>
        </Providers>
    )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    let errorMessage: string = 'An unknown error occurred'

    if (error instanceof Error) {
        errorMessage = error.message
    } else if (typeof error === 'object' && error !== null) {
        if ('data' in error && error.data && typeof error.data === 'object') {
            // @ts-ignore
            errorMessage = error.data.message || JSON.stringify(error.data)
        } else if ('statusText' in error) {
            // @ts-ignore
            errorMessage = error.statusText
        } else if ('message' in error) {
            // @ts-ignore
            errorMessage = error.message
        } else {
            errorMessage = JSON.stringify(error)
        }
    } else if (typeof error === 'string') {
        errorMessage = error
    }

    return (
        <html>
            <head>
                <title>Oh no!</title>
                <Meta />
                <Links />
            </head>
            <body>
                <ErrorBoundaryComponent code={500} message={errorMessage} />
                <Scripts />
            </body>
        </html>
    )
}
