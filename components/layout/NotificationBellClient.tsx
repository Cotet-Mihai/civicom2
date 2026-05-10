'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { toast } from 'sonner'
import { markAllNotificationsAsRead, type Notification } from '@/services/notification.service'

type Props = {
    notifications: Notification[]
    unreadCount: number
}

function formatRelativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'acum'
    if (minutes < 60) return `acum ${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `acum ${hours}h`
    const days = Math.floor(hours / 24)
    return `acum ${days}z`
}

export function NotificationBellClient({ notifications, unreadCount }: Props) {
    const [open, setOpen] = useState(false)
    const [allRead, setAllRead] = useState(false)
    const router = useRouter()

    const effectiveUnread = allRead ? 0 : unreadCount

    async function handleMarkAllRead() {
        setAllRead(true)
        try {
            await markAllNotificationsAsRead()
            router.refresh()
        } catch {
            setAllRead(false)
            toast.error('Nu s-a putut marca ca citit')
        }
    }

    return (
        <>
            <button
                className={`${buttonVariants({ variant: 'ghost', size: 'icon' })} relative`}
                aria-label="Notificări"
                onClick={() => setOpen(true)}
            >
                <Bell className="size-5" />
                {effectiveUnread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white leading-none">
                        {effectiveUnread > 9 ? '9+' : effectiveUnread}
                    </span>
                )}
            </button>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-sm">
                    <SheetHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
                        <SheetTitle className="font-heading font-black">Notificări</SheetTitle>
                        {effectiveUnread > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-primary hover:bg-primary/5 hover:text-primary"
                                onClick={handleMarkAllRead}
                            >
                                Marchează toate ca citite
                            </Button>
                        )}
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="flex h-full items-center justify-center py-16 text-sm text-muted-foreground">
                                Nu ai notificări noi
                            </div>
                        ) : (
                            <ul className="divide-y divide-border">
                                {notifications.map((n) => {
                                    const isRead = allRead || n.read
                                    return (
                                        <li
                                            key={n.id}
                                            className={`flex gap-3 px-4 py-3 transition-colors ${isRead ? '' : 'bg-primary/5'}`}
                                        >
                                            <span className={`mt-1.5 size-2 shrink-0 rounded-full ${isRead ? 'bg-muted-foreground/40' : 'bg-primary'}`} />
                                            <div className="min-w-0 flex-1">
                                                <p className={`text-sm leading-tight ${isRead ? 'font-medium' : 'font-bold'}`}>
                                                    {n.title}
                                                </p>
                                                <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                                                    {n.message}
                                                </p>
                                                <p className="mt-1 text-[10px] text-muted-foreground/70">
                                                    {formatRelativeTime(n.created_at)}
                                                </p>
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </>
    )
}
