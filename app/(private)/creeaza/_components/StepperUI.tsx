import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Send } from 'lucide-react'

type Props = {
  steps: string[]           // step labels, e.g. ['Info', 'Locație', 'Logistică', 'Media']
  currentStep: number       // 1-indexed
  onBack: () => void
  onNext: () => void
  onSubmit: () => void
  isSubmitting?: boolean
  children: React.ReactNode // the current step's form content
}

export function StepperUI({ steps, currentStep, onBack, onNext, onSubmit, isSubmitting, children }: Props) {
  const isFirst = currentStep === 1
  const isLast = currentStep === steps.length

  return (
    <div className="flex flex-col h-full">
      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((label, i) => {
          const idx = i + 1
          const isActive = idx === currentStep
          const isDone = idx < currentStep
          return (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center justify-center size-7 rounded-full text-xs font-black transition-colors
                ${isActive ? 'bg-primary text-primary-foreground' : isDone ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {isDone ? '✓' : idx}
              </div>
              <span className={`text-xs font-semibold hidden sm:block
                ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                {label}
              </span>
              {i < steps.length - 1 && (
                <div className={`h-px w-6 sm:w-10 transition-colors ${isDone ? 'bg-primary/40' : 'bg-border'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto space-y-6">
        {children}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 mt-6 border-t border-border">
        <Button variant="ghost" onClick={onBack} disabled={isFirst} className="gap-1">
          <ChevronLeft size={16} />
          Înapoi
        </Button>
        {isLast ? (
          <Button onClick={onSubmit} disabled={isSubmitting} className="gap-1">
            <Send size={16} />
            {isSubmitting ? 'Se trimite...' : 'Creează eveniment'}
          </Button>
        ) : (
          <Button onClick={onNext} className="gap-1">
            Continuă
            <ChevronRight size={16} />
          </Button>
        )}
      </div>
    </div>
  )
}
