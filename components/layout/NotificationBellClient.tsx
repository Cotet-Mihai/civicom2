'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { toast } from 'sonner'
import { deleteNotification, markAllNotificationsAsRead, markNotificationAsRead, type Notification } from '@/services/notification.service'

type Props = {
    notifications: Notification[]
    unreadCount: number
}

const TYPE_FALLBACK_URL: Record<string, string> = {
    event_approved: '/panou/evenimente',
    event_rejected: '/panou/evenimente',
    appeal_approved: '/panou/contestatii',
    appeal_rejected: '/panou/contestatii',
    org_approved: '/panou',
    org_rejected: '/panou',
    org_appeal_approved: '/panou',
    org_appeal_rejected: '/panou',
    event_completed: '/panou/participari',
    org_edited: '/admin/organizatii',
}

function getEffectiveLink(n: Notification): string | null {
    return n.link ?? (n.type ? (TYPE_FALLBACK_URL[n.type] ?? null) : null)
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
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
    const router = useRouter()

    const visible = notifications.filter(n => !dismissedIds.has(n.id))
    const effectiveUnread = allRead ? 0 : Math.max(0, unreadCount - [...dismissedIds].filter(id => {
        const n = notifications.find(n => n.id === id)
        return n && !n.read
    }).length)

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

    async function handleDismiss(n: Notification) {
        setDismissedIds(prev => new Set([...prev, n.id]))
        await deleteNotification(n.id)
    }

    function handleTitleClick(n: Notification) {
        const link = getEffectiveLink(n)
        if (!link) return
        setOpen(false)
        router.push(link)
    }

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="relative"
                aria-label="Notificări"
                onClick={() => setOpen(true)}
            >
                <Bell className="size-5" />
                {effectiveUnread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white leading-none">
                        {effectiveUnread > 9 ? '9+' : effectiveUnread}
                    </span>
                )}
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-sm">
                    <SheetHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3 pr-10">
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
                        {visible.length === 0 ? (
                            <div className="flex h-full items-center justify-center py-16 text-sm text-muted-foreground">
                                Nu ai notificări noi
                            </div>
                        ) : (
                            <ul className="divide-y divide-border">
                                {visible.map((n) => {
                                    const isRead = allRead || n.read
                                    const hasLink = !!getEffectiveLink(n)
                                    return (
                                        <li
                                            key={n.id}
                                            className={`relative flex gap-3 px-4 py-3 pr-8 transition-colors ${isRead ? '' : 'bg-primary/5'}`}
                                        >
                                            <span className={`mt-1.5 size-2 shrink-0 rounded-full ${isRead ? 'bg-muted-foreground/40' : 'bg-primary'}`} />
                                            <div className="min-w-0 flex-1">
                                                <p
                                                    onClick={() => handleTitleClick(n)}
                                                    className={`text-sm leading-tight ${isRead ? 'font-medium' : 'font-bold'} ${hasLink ? 'cursor-pointer hover:underline hover:text-primary' : 'cursor-default'}`}
                                                >
                                                    {n.title}
                                                </p>
                                                <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                                                    {n.message}
                                                </p>
                                                <p className="mt-1 text-[10px] text-muted-foreground/70">
                                                    {formatRelativeTime(n.created_at)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDismiss(n)}
                                                className="absolute top-2 right-2 rounded-md p-1 text-muted-foreground/40 transition-colors hover:bg-muted hover:text-muted-foreground"
                                                aria-label="Șterge notificarea"
                                            >
                                                <X size={13} />
                                            </button>
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
