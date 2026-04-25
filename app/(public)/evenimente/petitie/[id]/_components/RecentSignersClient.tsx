import { Card, CardContent } from '@/components/ui/card'
import { Users } from 'lucide-react'
import { getRecentSigners } from '@/services/petition.service'

type Props = { eventId: string }

function formatSignedAt(dateStr: string) {
    const d = new Date(dateStr)
    const date = d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })
    const time = d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
    return `${date} · ${time}`
}

export async function RecentSignersClient({ eventId }: Props) {
    const signers = await getRecentSigners(eventId)

    return (
        <Card className="shadow-lg shadow-black/5 border-border">
            <CardContent className="p-6 space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Users size={14} />
                    Semnatari recenți
                </h3>

                {signers.length === 0 ? (
                    <p className="text-sm italic text-muted-foreground">Fii primul care semnează</p>
                ) : (
                    <ul className="space-y-3">
                        {signers.map((signer) => (
                            <li key={signer.id} className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-xs text-primary shrink-0">
                                    {signer.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                        {signer.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatSignedAt(signer.signed_at)}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    )
}
