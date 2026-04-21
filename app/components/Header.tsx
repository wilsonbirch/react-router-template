import {
    Avatar,
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    Link,
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
} from '@heroui/react'
import { ThemeSwitcher } from './themeSwitcher'
import { useAuth } from '~/providers'

export type MenuItem = { label: string; key: string; to: any }

export function Header() {
    // const navigate = useNavigate()
    const { account, logout } = useAuth()
    const loggedOutMenuItems: MenuItem[] = [
        { label: 'Sign Up', key: 'sign-up', to: '/auth/signup' },
        { label: 'Log In', key: 'log-in', to: '/auth/login' },
    ]

    return (
        <Navbar isBordered>
            <NavbarContent>
                <NavbarBrand>
                    <Link className="font-bold text-inherit" href="/">
                        react-router-template
                    </Link>
                </NavbarBrand>
            </NavbarContent>

            <NavbarContent className="hidden sm:flex gap-4" justify="center">
                {/* <NavbarItem>
					<Link color='foreground' href='#'>
						Features
					</Link>
				</NavbarItem>
				<NavbarItem isActive>
					<Link href='#' aria-current='page'>
						Customers
					</Link>
				</NavbarItem>
				<NavbarItem>
					<Link color='foreground' href='#'>
						Integrations
					</Link>
				</NavbarItem> */}
            </NavbarContent>
            <NavbarContent as="div" justify="end">
                <NavbarItem>
                    <ThemeSwitcher />
                </NavbarItem>
                {account ? (
                    <Dropdown placement="bottom-end">
                        <DropdownTrigger>
                            <Avatar
                                isBordered
                                as="button"
                                className="transition-transform"
                                color="secondary"
                                // name='Jason Hughes'
                                size="sm"
                                // src='https://i.pravatar.cc/150?u=a042581f4e29026704d'
                            />
                        </DropdownTrigger>

                        <DropdownMenu
                            aria-label="Profile Actions"
                            variant="flat"
                        >
                            {account.role === 'ADMIN' ? (
                                <DropdownItem key={'admin'}>
                                    {' '}
                                    <Link
                                        className="w-full"
                                        color={'primary'}
                                        href={'/admin'}
                                    >
                                        {'Admin'}
                                    </Link>
                                </DropdownItem>
                            ) : (
                                <></>
                            )}
                            <DropdownItem key={'settings'}>
                                {' '}
                                <Link
                                    className="w-full"
                                    color={'primary'}
                                    href={'/settings'}
                                >
                                    {'Settings'}
                                </Link>
                            </DropdownItem>
                            <DropdownItem key={'log-out'}>
                                {' '}
                                <Link
                                    as={'button'}
                                    className="w-full"
                                    color={'danger'}
                                    onClick={() => {
                                        logout()
                                    }}
                                >
                                    {'Log Out'}
                                </Link>
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                ) : (
                    loggedOutMenuItems.map((item, i) => {
                        return (
                            <NavbarItem key={i}>
                                <Button
                                    as={Link}
                                    color={
                                        i === 0
                                            ? 'default'
                                            : i === 1
                                            ? 'primary'
                                            : 'secondary'
                                    }
                                    href={item.to}
                                    variant="flat"
                                >
                                    {item.label}
                                </Button>
                            </NavbarItem>
                        )
                    })
                )}
            </NavbarContent>
        </Navbar>
    )
}
