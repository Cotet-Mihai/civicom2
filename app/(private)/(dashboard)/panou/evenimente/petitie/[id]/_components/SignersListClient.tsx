'use client'

import { useState } from 'react'
import { Users, ChevronLeft, ChevronRight, Mail, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PetitionSigner } from '@/services/stats.service'

type Props = { signers: PetitionSigner[] }

const PAGE_SIZE = 20

export function SignersListClient({ signers }: Props) {
  const [page, setPage] = useState(0)
  const total = signers.length
  const pageCount = Math.ceil(total / PAGE_SIZE)
  const slice = signers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-border/50 pb-2">
        <Users className="size-5 text-primary" />
        <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
          Semnatari ({total.toLocaleString('ro-RO')})
        </h2>
      </div>

      {total === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Nu există semnatari momentan.</p>
      ) : (
        <>
          <div className="overflow-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground">#</th>
                  <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground">Nume</th>
                  <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground">Județ</th>
                  <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground">Data semnării</th>
                </tr>
              </thead>
              <tbody>
                {slice.map((signer, i) => (
                  <tr
                    key={signer.user_id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-muted-foreground">{page * PAGE_SIZE + i + 1}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{signer.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Mail className="size-3 shrink-0 text-primary/60" />
                        {signer.email}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {signer.county ? (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="size-3 shrink-0 text-primary/60" />
                          {signer.county}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(signer.signed_at).toLocaleDateString('ro-RO', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} din {total.toLocaleString('ro-RO')}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="px-3 text-sm font-medium">{page + 1} / {pageCount}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= pageCount - 1}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
