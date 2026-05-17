import { ShoppingBag, ExternalLink, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { BoycottStatsData } from '@/services/stats.service'

type Props = { data: BoycottStatsData }

export function BoycottInfoCard({ data }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-border/50 pb-2">
        <ShoppingBag className="size-5 text-primary" />
        <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
          Branduri vizate ({data.brands.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.brands.map(brand => (
          <Card key={brand.id} className="overflow-hidden rounded-2xl border border-border bg-card/50 transition-all hover:border-primary/30">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-foreground">{brand.name}</p>
                {brand.link && (
                  <a href={brand.link} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                    <ExternalLink className="size-3.5" />
                    Site
                  </a>
                )}
              </div>

              {brand.alternatives.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Alternative</p>
                  {brand.alternatives.map((alt, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2">
                      <ArrowRight className="size-3.5 text-primary mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{alt.name}</p>
                        {alt.reason && <p className="text-[10px] text-muted-foreground mt-0.5">{alt.reason}</p>}
                      </div>
                      {alt.link && (
                        <a href={alt.link} target="_blank" rel="noopener noreferrer" className="ml-auto shrink-0 text-muted-foreground hover:text-primary transition-colors">
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
