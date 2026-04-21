import { Spinner } from '@heroui/react'
import { useNavigation } from 'react-router'

interface Props {
    overlay?: boolean
    isLoading?: boolean
}

export function Loading({ overlay, isLoading }: Props) {
    const navigation = useNavigation()
    const isWorking = Boolean(navigation.state !== 'idle')

    return (isWorking || isLoading) && overlay ? (
        <>
            <div className="overlay"></div>
            <div className="flex flex-row justify-center">
                <Spinner size="lg" />
            </div>
        </>
    ) : (isWorking || isLoading) && !overlay ? (
        <Spinner size="lg" />
    ) : (
        <></>
    )
}
