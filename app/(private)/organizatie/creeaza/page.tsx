import type { Metadata } from 'next'
import { CheckCircle2, Eye, Users, Settings, Mail, Info } from 'lucide-react'
import { OngCreateFormClient } from './_components/OngCreateFormClient'

export const metadata: Metadata = {
    title: 'Creează organizație — CIVICOM'
}

export default function OrganizatieCreeazaPage() {
    return (
        <div className="relative min-h-screen bg-background pb-20">

            {/* Efect de glow ambiental subtil pentru a păstra estetica CIVICOM */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-20">

                {/* Grid-ul principal: 1 coloană pe mobil, 2 coloane pe desktop (Formular + Sidebar) */}
                <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_360px] lg:gap-16">

                    {/* COLOANA STÂNGĂ - Formularul principal */}
                    <div className="animate-fade-in-up">
                        <div className="mb-10">
                            <h1 className="font-heading text-3xl font-black uppercase tracking-tighter text-foreground md:text-5xl">
                                Solicită crearea contului <span className="text-primary">ONG</span>
                            </h1>
                            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                                Completează datele de mai jos. Profilul organizației va fi analizat și aprobat de echipa noastră pentru a garanta integritatea comunității CIVICOM✨.
                            </p>
                        </div>

                        {/* Aici injectăm componenta formularului cu designul curat */}
                        <OngCreateFormClient />
                    </div>

                    {/* COLOANA DREAPTĂ - Sidebar informativ (Sticky) */}
                    <aside className="sticky top-24 hidden flex-col gap-8 lg:flex animate-fade-in-up" style={{ animationDelay: '100ms' }}>

                        {/* Box 1: Pașii următori */}
                        <div>
                            <h3 className="mb-6 font-heading text-xl font-bold tracking-tight text-foreground">
                                Pașii următori
                            </h3>
                            <div className="space-y-6">
                                {[
                                    { step: '1', title: 'Completezi formularul', desc: 'Furnizează informațiile despre organizația ta.' },
                                    { step: '2', title: 'Verificăm informațiile', desc: 'Echipa CIVICOM va analiza datele introduse.' },
                                    { step: '3', title: 'Contul este activat', desc: 'Vei primi un email când contul este aprobat.' },
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary ring-1 ring-primary/20">
                                            {item.step}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-foreground">{item.title}</h4>
                                            <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Box 2: Beneficii */}
                        <div className="mt-4 rounded-2xl border border-border bg-card/50 p-6 shadow-sm">
                            <h3 className="mb-6 font-heading text-lg font-bold tracking-tight text-foreground">
                                De ce să ai cont ONG?
                            </h3>
                            <div className="space-y-5">
                                <div className="flex gap-3">
                                    <div className="mt-0.5 text-primary"><Eye className="size-5" /></div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground">Vizibilitate</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">Organizația ta va fi vizibilă pentru mii de potențiali voluntari.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="mt-0.5 text-primary"><Users className="size-5" /></div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground">Comunitate</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">Fii parte dintr-o rețea activă de organizații și cetățeni implicați.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="mt-0.5 text-primary"><Settings className="size-5" /></div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground">Instrumente dedicate</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">Ai acces la unelte speciale pentru gestionarea inițiativelor.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Box 3: Ajutor */}
                        <div className="rounded-2xl bg-muted/50 p-6 border border-border/50">
                            <h3 className="mb-2 font-heading text-base font-bold text-foreground flex items-center gap-2">
                                <Info className="size-4 text-primary"/> Ai nevoie de ajutor?
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Ne poți scrie oricând dacă întâmpini probleme la înscriere.
                            </p>
                            <a href="mailto:contact@civicom.ro" className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                                <Mail className="size-4" /> contact@civicom.ro
                            </a>
                        </div>

                    </aside>
                </div>
            </div>
        </div>
    )
}