import type { Metadata } from 'next'
import { Lightbulb } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { getSuggestions } from '@/services/suggestion.service'
import { AdminTabsClient } from '../_components/AdminTabsClient'

export const metadata: Metadata = { title: 'Admin — Sugestii' }

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default async function AdminSugestiiPage() {
    const suggestions = await getSuggestions()

    return (
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8 space-y-6">
            <h1 className="text-2xl font-black tracking-tight text-foreground">Admin</h1>
            <AdminTabsClient />

            <div className="space-y-4">
                {suggestions.length === 0 ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">Nicio sugestie primită încă.</p>
                ) : (
                    suggestions.map(s => (
                        <Card key={s.id} className="shadow-sm shadow-black/5 border-border">
                            <CardContent className="p-5 space-y-3">
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                            <Lightbulb size={14} className="text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-foreground">{s.user_name}</p>
                                            <p className="text-xs text-muted-foreground">{s.user_email}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground shrink-0">{formatDate(s.created_at)}</span>
                                </div>

                                <div className="rounded-lg bg-muted/50 border border-border p-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Sugestie</p>
                                    <p className="text-sm text-foreground whitespace-pre-wrap">{s.content}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
