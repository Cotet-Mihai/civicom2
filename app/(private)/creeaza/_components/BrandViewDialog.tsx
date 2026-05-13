'use client'

import { ExternalLink, Pencil, ArrowRightLeft, Trash2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import type { Brand } from './BrandDialog'

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    brand: Brand | null
    onEdit: () => void
    onDelete: () => void
}

export function BrandViewDialog({ open, onOpenChange, brand, onEdit, onDelete }: Props) {
    if (!brand) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg p-0">
                <DialogHeader className="px-6 pt-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground shrink-0">
                            {brand.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <DialogTitle>{brand.name}</DialogTitle>
                            <DialogDescription>Detaliile brandului boicotat</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6">
                    <div className="flex flex-col gap-4 py-4">
                        {brand.link && (
                            <div className="flex flex-col gap-1.5">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Link brand
                                </span>
                                <a
                                    href={brand.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-sm text-foreground underline underline-offset-4 transition-colors hover:text-primary"
                                >
                                    {brand.link}
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                            </div>
                        )}

                        <Separator />

                        {brand.alternatives.length > 0 ? (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Alternative
                                    </span>
                                    <Badge variant="secondary" className="text-xs">
                                        {brand.alternatives.length}
                                    </Badge>
                                </div>
                                {brand.alternatives.map((alt, idx) => (
                                    <Card key={idx} className="border-border bg-muted/50">
                                        <CardContent className="flex flex-col gap-1.5 p-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-foreground">{alt.name}</span>
                                                <Badge variant="outline" className="text-[10px]">Alternativă</Badge>
                                            </div>
                                            {alt.link && (
                                                <a
                                                    href={alt.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                                                >
                                                    {alt.link}
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            )}
                                            {alt.reason && (
                                                <p className="text-sm text-muted-foreground leading-relaxed">{alt.reason}</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Nicio alternativă adăugată pentru acest brand.
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2 border-t border-border px-6 py-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Închide
                    </Button>
                    <div className="flex gap-2 ml-auto">
                        <Button
                            variant="outline"
                            onClick={onDelete}
                            className="gap-1.5 border-destructive text-destructive hover:bg-destructive/10"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Șterge
                        </Button>
                        <Button onClick={onEdit} className="gap-1.5">
                            <Pencil className="h-3.5 w-3.5" />
                            Editează
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
