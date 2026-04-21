import { Button } from '@heroui/react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeSwitcher() {
    const [mounted, setMounted] = useState(false)
    const { resolvedTheme, setTheme } = useTheme()

    useEffect(() => {
        setMounted(true)
    }, [])

    const isDark = mounted && resolvedTheme === 'dark'

    return (
        <Button
            isIconOnly
            variant="light"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            onPress={() => setTheme(isDark ? 'light' : 'dark')}
        >
            {mounted ? (
                <i
                    className={`ri-lg ${
                        isDark ? 'ri-moon-line' : 'ri-sun-line'
                    }`}
                />
            ) : (
                <i className="ri-lg ri-moon-line opacity-0" />
            )}
        </Button>
    )
}
