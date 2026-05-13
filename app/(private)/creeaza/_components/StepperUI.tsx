'use client'

import { CheckIcon, LoaderCircleIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
    Stepper,
    StepperNav,
    StepperItem,
    StepperTrigger,
    StepperIndicator,
    StepperTitle,
    StepperSeparator,
} from '@/components/ui/stepper'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type Step = {
    title: string
    description: string
    icon: React.ReactNode
}

type Props = {
    steps: Step[]
    currentStep: number
    onBack: () => void
    onNext: () => void
    onSubmit: () => void
    isSubmitting?: boolean
    nextDisabled?: boolean
    children: React.ReactNode
}

export function StepperUI({ steps, currentStep, onBack, onNext, onSubmit, isSubmitting, nextDisabled, children }: Props) {
    return (
        <Stepper
            value={currentStep}
            onValueChange={() => {}}
            indicators={{
                completed: <CheckIcon className="size-3.5" />,
                loading: <LoaderCircleIcon className="size-3.5 animate-spin" />,
            }}
            className="w-full space-y-5"
        >
            <StepperNav className="gap-3">
                {steps.map((step, index) => (
                    <StepperItem
                        key={index}
                        step={index + 1}
                        className="relative flex-1 items-start"
                    >
                        <StepperTrigger
                            className="flex grow flex-col items-start justify-center gap-2.5"
                            asChild
                        >
                            <StepperIndicator className={cn(
                                'transition-all duration-500 ease-in-out',
                                'data-[state=inactive]:border-border data-[state=inactive]:text-muted-foreground data-[state=inactive]:bg-transparent',
                                'data-[state=completed]:bg-primary data-[state=completed]:text-primary-foreground',
                                'data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground',
                                'size-8 border-2',
                            )}>
                                {step.icon}
                            </StepperIndicator>
                            <div className="flex flex-col items-start gap-1">
                                <div className="hidden sm:block text-muted-foreground text-[10px] font-semibold uppercase">
                                    Pasul {index + 1}
                                </div>
                                <StepperTitle className="group-data-[state=inactive]/step:text-muted-foreground text-start text-[11px] sm:text-base font-semibold">
                                    {step.title}
                                </StepperTitle>
                                <div className="hidden sm:block">
                                    <Badge className="hidden group-data-[state=active]/step:inline-flex px-2 h-auto py-0.5 bg-secondary/30 text-secondary-foreground border-0 text-[10px] rounded-full">
                                        În curs
                                    </Badge>
                                    <Badge className="hidden group-data-[state=completed]/step:inline-flex px-2 h-auto py-0.5 bg-primary/20 text-primary border-0 text-[10px] rounded-full">
                                        Finalizat
                                    </Badge>
                                    <Badge variant="outline" className="hidden group-data-[state=inactive]/step:inline-flex px-2 h-auto py-0.5 text-[10px] rounded-full">
                                        În așteptare
                                    </Badge>
                                </div>
                            </div>
                        </StepperTrigger>

                        {steps.length > index + 1 && (
                            <StepperSeparator className="transition-all duration-500 ease-in-out group-data-[state=completed]/step:bg-primary absolute inset-x-0 start-9 top-4 m-0 group-data-[orientation=horizontal]/stepper-nav:w-[calc(100%-2rem)] group-data-[orientation=horizontal]/stepper-nav:flex-none" />
                        )}
                    </StepperItem>
                ))}
            </StepperNav>

            <div className="text-sm mt-4 w-full">
                <section className="flex flex-col w-full">
                    {children}
                </section>
            </div>

            <div className="flex items-center justify-between gap-2.5 mb-10">
                <button
                    type="button"
                    className={buttonVariants({ variant: 'outline' })}
                    onClick={onBack}
                    disabled={currentStep === 1}
                    suppressHydrationWarning
                >
                    Anterior
                </button>
                <button
                    type="button"
                    className={buttonVariants({ variant: 'outline' })}
                    onClick={currentStep === steps.length ? onSubmit : onNext}
                    disabled={isSubmitting || nextDisabled}
                    suppressHydrationWarning
                >
                    {isSubmitting ? (
                        <span className="flex items-center gap-2">
                            <LoaderCircleIcon className="animate-spin size-4" />
                            Se trimite...
                        </span>
                    ) : currentStep === steps.length ? 'Trimite' : 'Următorul'}
                </button>
            </div>
        </Stepper>
    )
}
