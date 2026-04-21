import { addToast, HeroUIProvider, ToastProvider } from '@heroui/react'
import { useNavigate } from 'react-router'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { createContext, useContext, useEffect, useRef, useState } from 'react'

import type { ReactNode } from 'react'
import type { RootContextAccount } from './root'

// Create Auth Context
const AuthContext = createContext<{
    account: RootContextAccount | null
    setAccount: (account: RootContextAccount | null) => void
    logout: () => void
}>(null!)

export const useAuth = () => useContext(AuthContext)

export function Providers({
    children,
    initialAccount,
}: {
    children: ReactNode
    initialAccount: RootContextAccount | null
}) {
    const navigate = useNavigate()
    const loggedIn = useRef(false)
    const [account, setAccount] = useState<RootContextAccount | null>(
        initialAccount
    )
    const [toastPlacement, setToastPlacement] = useState<
        | 'top-left'
        | 'bottom-center'
        | 'top-center'
        | 'top-right'
        | 'bottom-left'
        | 'bottom-right'
    >('bottom-center')

    const logout = () => {
        if (account) {
            addToast({
                title: `User Signed out: `,
                description: account.email,
                color: 'default',
            })
            setAccount(null)
            loggedIn.current = false
            navigate('/auth/logout')
        }
    }

    useEffect(() => {
        if (!loggedIn.current && account) {
            addToast({
                title: 'Authenticated:',
                description: account.email,
                color: 'default',
            })
            loggedIn.current = true
        }
    }, [account, loggedIn])

    return (
        <AuthContext.Provider value={{ account, setAccount, logout }}>
            <HeroUIProvider navigate={navigate}>
                <NextThemesProvider attribute="class" defaultTheme="dark">
                    <ToastProvider placement={toastPlacement} />
                    {children}
                </NextThemesProvider>
            </HeroUIProvider>
        </AuthContext.Provider>
    )
}
