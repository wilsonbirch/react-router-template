import { Button, Link } from '@heroui/react'
import { useLocation, useNavigate } from 'react-router'

interface ErrorBoundaryProps {
    message: string
    code: number
}
export function ErrorBoundary({ message, code }: ErrorBoundaryProps) {
    const navigate = useNavigate()
    const location = useLocation()

    console.log(`${code} error: ${message}`)
    console.log(`${location.pathname}`)

    return (
        <div className="w-fit mx-auto">
            <div className="mt-20">
                <div className="flex flex-col mx-auto">
                    <h1 className="mx-auto">3DF</h1>
                    <h2 className="mx-auto">{message}</h2>
                    <p>Sorry about that ... </p>
                    <div className="flex flex-row mx-auto mt-4">
                        <Button onPress={() => navigate(-1)} color="default">
                            Back
                        </Button>
                        <Button href="/home" as={Link} color="primary">
                            Home
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
