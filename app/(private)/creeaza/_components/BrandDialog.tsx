'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Link as LinkIcon } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { checkURLAccessible } from '@/services/url.service'

export type Alternative = { name: string; link: string; reason: string }
export type Brand = { name: string; link: string; alternatives: Alternative[] }

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (brand: Brand) => void
    initialData?: Brand | null
}

function isValidURL(url: string) {
    try { new URL(url); return true } catch { return false }
}

export function BrandDialog({ open, onOpenChange, onSave, initialData }: Props) {
    const [name, setName] = useState('')
    const [link, setLink] = useState('')
    const [alternatives, setAlternatives] = useState<Alternative[]>([])
    const [checking, setChecking] = useState(false)

    const isSaveDisabled =
        !name.trim() ||
        !link.trim() ||
        alternatives.some(a => !a.name.trim() || !a.link.trim()) ||
        checking

    useEffect(() => {
        if (open) {
            setName(initialData?.name ?? '')
            setLink(initialData?.link ?? '')
            setAlternatives(initialData?.alternatives ?? [])
        }
    }, [open, initialData])

    function reset() { setName(''); setLink(''); setAlternatives([]) }

    function addAlternative() {
        setAlternatives(prev => [...prev, { name: '', link: '', reason: '' }])
    }

    function updateAlt(i: number, field: keyof Alternative, val: string) {
        setAlternatives(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: val } : a))
    }

    function removeAlt(i: number) {
        setAlternatives(prev => prev.filter((_, idx) => idx !== i))
    }

    async function handleSave() {
        if (!name.trim()) return

        const formatted = link.trim().startsWith('http://') || link.trim().startsWith('https://')
            ? link.trim()
            : `https://${link.trim()}`

        if (!isValidURL(formatted)) {
            toast.error('URL-ul introdus nu este valid!')
            return
        }

        setChecking(true)

        const mainOk = await checkURLAccessible(formatted)
        if (!mainOk) {
            setChecking(false)
            toast.error('Site-ul principal nu poate fi accesat!')
            return
        }

        for (const [idx, alt] of alternatives.entries()) {
            const altLink = alt.link.trim().startsWith('http://') || alt.link.trim().startsWith('https://')
                ? alt.link.trim()
                : `https://${alt.link.trim()}`

            if (!isValidURL(altLink)) {
                setChecking(false)
                toast.error(`URL-ul alternativei ${idx + 1} nu este valid!`)
                return
            }

            const altOk = await checkURLAccessible(altLink)
            if (!altOk) {
                setChecking(false)
                toast.error(`Site-ul alternativei ${idx + 1} nu poate fi accesat!`)
                return
            }

            alternatives[idx].link = altLink
        }

        setChecking(false)
        onSave({ name: name.trim(), link: formatted, alternatives })
        reset()
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={val => { if (!val) reset(); onOpenChange(val) }}>
            <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 shrink-0">
                    <DialogTitle>{initialData ? 'Editare brand' : 'Adăugare brand'}</DialogTitle>
                    <DialogDescription>
                        {initialData
                            ? 'Modifici datele brandului pe care vrei să îl boicotezi.'
                            : 'Completează datele brandului pe care vrei să îl boicotezi.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6">
                    <div className="flex flex-col gap-5 py-4">
                        {/* Nume brand */}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="brand-name">
                                Nume brand <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="brand-name"
                                placeholder="ex: FastFashion Corp"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>

                        {/* Link brand */}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="brand-link">
                                Link brand <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="brand-link"
                                    placeholder="https://www.exemplu.com"
                                    value={link}
                                    onChange={e => setLink(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Alternative */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Label>Alternative</Label>
                                    {alternatives.length > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                            {alternatives.length}
                                        </Badge>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addAlternative}
                                    className="gap-1.5 bg-transparent"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Adaugă alternativă
                                </Button>
                            </div>

                            {alternatives.length === 0 && (
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Nicio alternativă adăugată. Poți sugera alternative etice la acest brand.
                                </p>
                            )}

                            {alternatives.map((alt, idx) => (
                                <Card key={idx} className="relative border-border bg-muted/50">
                                    <CardContent className="flex flex-col gap-3 p-4">
                                        <div className="flex items-center justify-between">
                                            <Badge variant="outline" className="text-xs font-semibold uppercase tracking-wider">
                                                Alternativa {idx + 1}
                                            </Badge>
                                            <button
                                                type="button"
                                                onClick={() => removeAlt(idx)}
                                                className="h-8 w-8 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                aria-label={`Șterge alternativa ${idx + 1}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor={`alt-name-${idx}`}>
                                                Titlu <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id={`alt-name-${idx}`}
                                                placeholder="Nume alternativă"
                                                value={alt.name}
                                                onChange={e => updateAlt(idx, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor={`alt-link-${idx}`}>
                                                Link <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id={`alt-link-${idx}`}
                                                placeholder="https://www.alternativa.com"
                                                value={alt.link}
                                                onChange={e => updateAlt(idx, 'link', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor={`alt-reason-${idx}`}>
                                                De ce e o alternativă bună?{' '}
                                                <span className="font-normal text-muted-foreground">(opțional)</span>
                                            </Label>
                                            <Textarea
                                                id={`alt-reason-${idx}`}
                                                placeholder="Explică de ce recomanzi această alternativă..."
                                                value={alt.reason}
                                                onChange={e => updateAlt(idx, 'reason', e.target.value)}
                                                rows={2}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter className="shrink-0 gap-2 border-t px-6 py-4">
                    <Button variant="outline" onClick={() => { reset(); onOpenChange(false) }}>
                        Anulează
                    </Button>
                    <Button onClick={handleSave} disabled={isSaveDisabled}>
                        {checking ? 'Verific site...' : initialData ? 'Salvează' : 'Adaugă brand'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
