import { addToast, Button, Input } from '@heroui/react'
import { useEffect, useState } from 'react'
import { Form, useNavigation } from 'react-router'
import { authLoginAction } from '~/actions/auth.login.server'
import { authLoginLoader } from '~/loader/auth.login.server'

import type { Route } from './+types/auth.login'

export const meta: Route.MetaFunction = () => {
    return [
        { title: 'react-router-template | Login' },
        {
            name: 'auth/login',
            content: 'Login page for react-router-template application',
        },
    ]
}

export async function loader({ request }: Route.LoaderArgs) {
    return authLoginLoader(request)
}

export async function action({ request }: Route.ActionArgs) {
    return authLoginAction(request)
}

export default function Login({
    loaderData,
    actionData,
}: Route.ComponentProps) {
    const navigation = useNavigation()
    const { nextUrl } = loaderData
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        hidePassword: true,
    })
    const [error, setError] = useState({
        email: false,
        password: false,
    })

    const inputClass = 'my-2'

    useEffect(() => {
        if (actionData) {
            if (actionData.message) {
                setError({
                    email: true,
                    password: true,
                })
                addToast({
                    title: actionData.message,
                    description: `${formData.email}`,
                    color: 'danger',
                })
            }
        }
    }, [actionData])

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        formDataField: string
    ) => {
        setError({
            email: false,
            password: false,
        })
        setFormData((form) => ({ ...form, [formDataField]: e.target.value }))
    }

    return (
        <div className="mt-40 mx-auto max-w-80">
            <h1 className="mx-auto w-fit">Login</h1>
            <Form
                method="post"
                action={`/auth/login${nextUrl ? `?nextUrl=${nextUrl}` : ''}`}
            >
                <Input
                    className={inputClass}
                    variant="bordered"
                    type="email"
                    name="email"
                    label="Email"
                    color={error.email ? 'danger' : 'default'}
                    value={formData.email}
                    onChange={(e) => handleInputChange(e, 'email')}
                />
                <Input
                    className={inputClass}
                    variant="bordered"
                    type={formData.hidePassword ? 'password' : 'text'}
                    label="Password"
                    name="password"
                    value={formData.password}
                    color={error.password ? 'danger' : 'default'}
                    onChange={(e) => handleInputChange(e, 'password')}
                    endContent={
                        <button
                            onClick={(e) => {
                                e.preventDefault()
                                setFormData({
                                    ...formData,
                                    hidePassword: !formData.hidePassword,
                                })
                            }}
                        >
                            {formData.hidePassword ? (
                                <i className="ri-eye-line ri-lg"></i>
                            ) : (
                                <i className="ri-eye-off-line ri-lg"></i>
                            )}
                        </button>
                    }
                />
                <div className="mx-auto w-fit">
                    <Button
                        color="default"
                        isDisabled={
                            navigation.state !== 'idle' ||
                            formData.password.length === 0 ||
                            formData.email.length === 0
                        }
                        isLoading={navigation.state !== 'idle'}
                        type="submit"
                    >
                        Sign in
                    </Button>
                </div>
            </Form>
        </div>
    )
}
