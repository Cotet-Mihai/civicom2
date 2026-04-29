type Props = { total: number }

export function ResultsCount({ total }: Props) {
  if (total === 0) return null
  return (
    <p className="text-sm text-muted-foreground">
      {total === 1 ? '1 eveniment găsit' : `${total.toLocaleString('ro-RO')} evenimente găsite`}
    </p>
  )
}
