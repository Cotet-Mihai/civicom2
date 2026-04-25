import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import Link from "next/link";
import {buttonVariants} from "@/components/ui/button";

export function FaqSection() {
    const faqItems = [
        {
            question: "Cine poate crea evenimente și inițiative pe CIVICOM?",
            answer: "Orice utilizator autentificat poate crea evenimente, petiții sau boicoturi. Nu este obligatoriu să fii reprezentantul unui ONG. Totuși, dacă faci parte dintr-o organizație aprobată, poți alege să creezi și să gestionezi acțiunile direct în numele acelui ONG."
        },
        {
            question: "Ce tipuri de acțiuni civice pot găsi și organiza?",
            answer: "Platforma standardizează 5 tipuri principale de acțiuni: Proteste (adunări, marșuri, pichete), Boicoturi, Petiții, Activități Comunitare (donații, workshop-uri, acțiuni în aer liber) și Evenimente Caritabile. Cele care au o locație fizică pot fi găsite ușor prin harta noastră interactivă."
        },
        {
            question: "Am creat o acțiune. De ce nu apare imediat pe platformă?",
            answer: "Toate acțiunile nou create intră automat în starea de „În așteptare” (Pending) pentru a fi verificate de un administrator. Acest proces asigură calitatea și siguranța platformei. Imediat ce inițiativa primește statusul „Aprobat”, va deveni vizibilă public pentru toți utilizatorii."
        },
        {
            question: "Ce se întâmplă dacă evenimentul meu este respins?",
            answer: "Ai mereu dreptul la replică. Dacă moderatorii noștri resping o inițiativă, poți depune o contestație direct din Panoul tău de control (Dashboard). Un administrator va reanaliza detaliile și va lua o decizie finală."
        },
        {
            question: "Dacă semnez o petiție, identitatea mea este publică?",
            answer: "Nu. Pentru a semna o petiție trebuie să ai un cont (pentru a garanta principiul „un utilizator, o singură semnătură”), însă datele tale personale nu sunt afișate public pe pagina evenimentului. Pe site va fi vizibil doar contorul total al semnăturilor."
        },
        {
            question: "Cum funcționează implicarea ca ONG?",
            answer: "Statutul de ONG nu este un cont separat, ci o apartenență. Din contul tău de utilizator poți solicita aprobarea unei organizații. Odată aprobată, poți adăuga alți utilizatori ca membri și puteți gestiona împreună evenimentele pe care le organizați, beneficiind de un panou de control dedicat."
        }
    ]

    return (
        <section className="relative overflow-hidden bg-background pb-20 lg:pb-28">
            {/* Efect de glow subtil asimetric */}
            <div className="absolute left-0 top-1/4 -translate-x-1/2 blur-[100px] opacity-10 pointer-events-none">
                <div className="h-[400px] w-[400px] rounded-full bg-primary" />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">

                    {/* Coloana Stângă - Header-ul (Sticky pe Desktop) */}
                    <div className="lg:col-span-5">
                        <div className="sticky top-24 flex flex-col items-start gap-4 pr-8">

                            <h2 className="mt-2 text-4xl font-black tracking-tight text-foreground lg:text-5xl font-heading text-balance">
                                Răspunsuri la întrebări <span className="text-primary">frecvente</span>
                            </h2>

                            <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                                Platforma <strong>CIVICOM</strong> este spațiul unde inițiativele tale prind viață. Află cum poți organiza evenimente, cum funcționează sistemul nostru de moderare și cum construim împreună o comunitate sigură, deschisă tuturor.
                            </p>

                            <Link
                                href="/contact"
                                className={buttonVariants({ variant: "outline" }) + " mt-2 w-full group transition-all hover:border-primary/50"}
                            >
                                Ai o altă întrebare?
                            </Link>
                        </div>
                    </div>

                    {/* Coloana Dreaptă - Lista de FAQ minimalistă */}
                    <div className="lg:col-span-7">
                        <Accordion className="w-full">
                            {faqItems.map((item, index) => (
                                <AccordionItem
                                    key={index}
                                    value={`item-${index}`}
                                    className="group border-b border-border/60 first:border-t-0 py-2 transition-colors hover:border-primary/30"
                                >
                                    <AccordionTrigger className="text-left text-base font-semibold tracking-tight text-foreground hover:no-underline hover:text-primary sm:text-lg [&[data-state=open]]:text-primary transition-all duration-300">
                                        <span className="pr-4">{item.question}</span>
                                    </AccordionTrigger>
                                    <AccordionContent className="text-base leading-relaxed text-muted-foreground pb-6 pt-2 md:pr-12">
                                        {item.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>

                </div>
            </div>
        </section>
    )
}