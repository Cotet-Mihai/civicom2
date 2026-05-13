"use client"

import { useState, useTransition } from "react"
import { Lightbulb, ArrowRight } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { createEventSuggestion } from "@/services/suggestion.service"

export function SuggestEventCardClient() {
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState("")
    const [isPending, startTransition] = useTransition()

    function handleSubmit() {
        startTransition(async () => {
            const { error } = await createEventSuggestion(value)
            if (error) {
                toast.error("Ceva nu a mers. Încearcă din nou.")
                return
            }
            setOpen(false)
            setValue("")
            toast.success("Mulțumim! Vom analiza sugestia ta.")
        })
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="group col-span-1 sm:col-span-2 lg:col-span-3 relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 overflow-hidden rounded-3xl border border-dashed border-border bg-card/50 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-muted-foreground/40 hover:shadow-lg"
            >
                <div className="flex items-center gap-5">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground transition-colors duration-300 group-hover:bg-muted/60">
                        <Lightbulb size={26} className="transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <div>
                        <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                            Nu ai găsit ce căutai?
                        </h2>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            Sugerează-ne un nou tip de eveniment pe care ai vrea să îl poți crea.
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center text-xs font-bold text-muted-foreground transition-colors group-hover:text-foreground sm:pr-2">
                    Trimite o sugestie
                    <ArrowRight size={14} className="ml-1.5 transition-transform group-hover:translate-x-1" />
                </div>
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sugerează un tip de eveniment</DialogTitle>
                        <DialogDescription>
                            Spune-ne ce tip de acțiune civică îți lipsește — vom lua în considerare sugestia ta.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-1">
                        <Textarea
                            placeholder="Descrie pe scurt tipul de eveniment pe care l-ai dori..."
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            rows={4}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {value.trim().length}/10 caractere minim
                        </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Anulează</Button>
                        <Button onClick={handleSubmit} disabled={value.trim().length < 10 || isPending}>
                            {isPending ? "Se trimite..." : "Trimite sugestia"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
