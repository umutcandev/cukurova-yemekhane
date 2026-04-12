"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSession } from "next-auth/react"

import { ThemeToggle } from "@/components/theme-toggle"
import { AuthButton } from "@/components/auth-button"
import { MobileMenu } from "@/components/mobile-menu"
import { MenuSearchCommand } from "@/components/menu-search-command"
import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { NotificationPanel } from "@/components/notifications/notification-panel"
import { useNotifications } from "@/hooks/use-notifications"

function NotifPopover({
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
}: {
    notifications: ReturnType<typeof useNotifications>["notifications"]
    unreadCount: number
    loading: boolean
    fetchNotifications: () => void
    markAsRead: (ids: number[]) => void
    markAllAsRead: () => void
}) {
    const [open, setOpen] = useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon-sm" className="relative">
                    <svg data-testid="bell-icon" height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16" style={{ color: 'currentcolor' }}>
                        <path fillRule="evenodd" clipRule="evenodd" d="M7.9925 0C4.95079 0 2.485 2.46579 2.485 5.5075V8.22669C2.485 8.77318 2.21321 9.28388 1.75992 9.58912L1.33108 9.8779L1 10.1009V10.5V11.25V12H1.75H14.25H15V11.25V10.5V10.0986L14.666 9.87596L14.2306 9.58565C13.7741 9.28137 13.5 8.76913 13.5 8.22059V5.5075C13.5 2.46579 11.0342 0 7.9925 0ZM3.985 5.5075C3.985 3.29422 5.77922 1.5 7.9925 1.5C10.2058 1.5 12 3.29422 12 5.5075V8.22059C12 9.09029 12.36 9.91233 12.9801 10.5H3.01224C3.62799 9.91235 3.985 9.09303 3.985 8.22669V5.5075ZM10.7486 13.5H9.16778L9.16337 13.5133C9.09591 13.716 8.94546 13.9098 8.72067 14.0501C8.52343 14.1732 8.27577 14.25 8.00002 14.25C7.72426 14.25 7.47661 14.1732 7.27936 14.0501C7.05458 13.9098 6.90412 13.716 6.83666 13.5133L6.83225 13.5H5.25143L5.41335 13.9867C5.60126 14.5516 5.99263 15.0152 6.48523 15.3226C6.92164 15.5949 7.44461 15.75 8.00002 15.75C8.55542 15.75 9.07839 15.5949 9.5148 15.3226C10.0074 15.0152 10.3988 14.5516 10.5867 13.9867L10.7486 13.5Z" fill="currentColor" />
                    </svg>
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                sideOffset={8}
                className="p-0 w-auto"
                collisionPadding={16}
            >
                <NotificationPanel
                    notifications={notifications}
                    loading={loading}
                    unreadCount={unreadCount}
                    onFetch={fetchNotifications}
                    onMarkAsRead={markAsRead}
                    onMarkAllAsRead={markAllAsRead}
                    onClose={() => setOpen(false)}
                />
            </PopoverContent>
        </Popover>
    )
}

export function Header() {

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const { data: session } = useSession()
    const isAuthenticated = !!session?.user?.id
    const {
        notifications,
        unreadCount,
        loading: notifLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
    } = useNotifications(isAuthenticated)

    return (
        <>
            <header className="dark text-foreground sticky top-0 z-50 border-b border-border bg-background">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="relative h-9 w-40 md:w-48 block">
                            <Image
                                src="/logo-cu.svg"
                                alt="ÇÜ Yemekhane"
                                fill
                                className="object-contain object-left"
                                priority
                            />
                        </Link>

                        {/* Desktop actions */}
                        <div className="hidden md:flex items-center gap-2">
                            <MenuSearchCommand />
                            {isAuthenticated && (
                                <NotifPopover
                                    notifications={notifications}
                                    unreadCount={unreadCount}
                                    loading={notifLoading}
                                    fetchNotifications={fetchNotifications}
                                    markAsRead={markAsRead}
                                    markAllAsRead={markAllAsRead}
                                />
                            )}
                            <Button variant="outline" size="icon-sm" asChild>
                                <Link href="https://github.com/umutcandev/cukurova-yemekhane" target="_blank" rel="noopener noreferrer">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                        <path d="M12.001 2C6.47598 2 2.00098 6.475 2.00098 12C2.00098 16.425 4.86348 20.1625 8.83848 21.4875C9.33848 21.575 9.52598 21.275 9.52598 21.0125C9.52598 20.775 9.51348 19.9875 9.51348 19.15C7.00098 19.6125 6.35098 18.5375 6.15098 17.975C6.03848 17.6875 5.55098 16.8 5.12598 16.5625C4.77598 16.375 4.27598 15.9125 5.11348 15.9C5.90098 15.8875 6.46348 16.625 6.65098 16.925C7.55098 18.4375 8.98848 18.0125 9.56348 17.75C9.65098 17.1 9.91348 16.6625 10.201 16.4125C7.97598 16.1625 5.65098 15.3 5.65098 11.475C5.65098 10.3875 6.03848 9.4875 6.67598 8.7875C6.57598 8.5375 6.22598 7.5125 6.77598 6.1375C6.77598 6.1375 7.61348 5.875 9.52598 7.1625C10.326 6.9375 11.176 6.825 12.026 6.825C12.876 6.825 13.726 6.9375 14.526 7.1625C16.4385 5.8625 17.276 6.1375 17.276 6.1375C17.826 7.5125 17.476 8.5375 17.376 8.7875C18.0135 9.4875 18.401 10.375 18.401 11.475C18.401 15.3125 16.0635 16.1625 13.8385 16.4125C14.201 16.725 14.5135 17.325 14.5135 18.2625C14.5135 19.6 14.501 20.675 14.501 21.0125C14.501 21.275 14.6885 21.5875 15.1885 21.4875C19.259 20.1133 21.9999 16.2963 22.001 12C22.001 6.475 17.526 2 12.001 2Z" />
                                    </svg>
                                </Link>
                            </Button>
                            <AuthButton />
                            <div className="h-4 w-px bg-border/60 mx-1" aria-hidden="true" />
                            <ThemeToggle />
                        </div>

                        {/* Mobile: Search + hamburger */}
                        <div className="flex md:hidden items-center gap-2">
                            <MenuSearchCommand compact />
                            {isAuthenticated && (
                                <NotifPopover
                                    notifications={notifications}
                                    unreadCount={unreadCount}
                                    loading={notifLoading}
                                    fetchNotifications={fetchNotifications}
                                    markAsRead={markAsRead}
                                    markAllAsRead={markAllAsRead}
                                />
                            )}
                            <Button
                                variant="outline"
                                size="icon-sm"
                                onClick={() => setMobileMenuOpen(true)}
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" strokeLinejoin="round" style={{ color: 'currentcolor' }}>
                                    <path fillRule="evenodd" clipRule="evenodd" d="M1.75 4H1V5.5H1.75H14.25H15V4H14.25H1.75ZM1.75 10.5H1V12H1.75H14.25H15V10.5H14.25H1.75Z" />
                                </svg>
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile full-screen menu */}
            <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        </>
    )
}
