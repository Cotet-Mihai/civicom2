'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowRight, CalendarIcon, Loader2 } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { AvatarUploadClient } from '@/app/(private)/(dashboard)/profil/_components/AvatarUploadClient'
import { completeProfile } from '@/services/user.service'
import { cn } from '@/lib/utils'

const ROMANIAN_COUNTIES = [
  'Alba', 'Arad', 'Argeș', 'Bacău', 'Bihor', 'Bistrița-Năsăud', 'Botoșani',
  'Brașov', 'Brăila', 'București', 'Buzău', 'Caraș-Severin', 'Călărași', 'Cluj',
  'Constanța', 'Covasna', 'Dâmbovița', 'Dolj', 'Galați', 'Giurgiu', 'Gorj',
  'Harghita', 'Hunedoara', 'Ialomița', 'Iași', 'Ilfov', 'Maramureș', 'Mehedinți',
  'Mureș', 'Neamț', 'Olt', 'Prahova', 'Satu Mare', 'Sălaj', 'Sibiu', 'Suceava',
  'Teleorman', 'Timiș', 'Tulcea', 'Vaslui', 'Vâlcea', 'Vrancea',
]

const BIO_SEX_LABELS: Record<string, string> = {
  male: 'Masculin', female: 'Feminin', intersex: 'Intersex', prefer_not_to_say: 'Prefer să nu spun',
}
const GENDER_LABELS: Record<string, string> = {
  male: 'Bărbat', female: 'Femeie', non_binary: 'Non-binar', other: 'Altul', prefer_not_to_say: 'Prefer să nu spun',
}
const ORIENTATION_LABELS: Record<string, string> = {
  heterosexual: 'Heterosexual/ă', gay: 'Gay', lesbian: 'Lesbiană', bisexual: 'Bisexual/ă',
  pansexual: 'Pansexual/ă', asexual: 'Asexual/ă', other: 'Altă orientare', prefer_not_to_say: 'Prefer să nu spun',
}
const EDUCATION_LABELS: Record<string, string> = {
  none: 'Fără studii', middle_school: 'Gimnaziu', high_school: 'Liceu',
  bachelor: 'Licență', master: 'Masterat', doctorate: 'Doctorat',
}

const currentYear = new Date().getFullYear()

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 9)
  const parts: string[] = []
  if (digits.length > 0) parts.push(digits.slice(0, 3))
  if (digits.length > 3) parts.push(digits.slice(3, 6))
  if (digits.length > 6) parts.push(digits.slice(6, 9))
  return parts.join(' ')
}

type Props = {
  userId: string
  name: string
  avatarUrl: string | null
}

export function CompleteazaProfilFormClient({ userId, name, avatarUrl }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const [formName, setFormName] = useState(name)
  const [phone, setPhone] = useState('')
  const [birthDate, setBirthDate] = useState<Date | undefined>()
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [county, setCounty] = useState('')
  const [city, setCity] = useState('')
  const [gender, setGender] = useState('')
  const [biologicalSex, setBiologicalSex] = useState('')
  const [sexualOrientation, setSexualOrientation] = useState('')
  const [educationLevel, setEducationLevel] = useState('')

  const isBucharest = county === 'București'
  const cityLabel = isBucharest ? 'Sector' : 'Oraș'
  const cityPlaceholder = isBucharest ? 'Sector 1, 2, 3...' : 'Cluj-Napoca'

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(formatPhone(e.target.value))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!birthDate) { toast.error('Data nașterii este obligatorie'); return }
    if (!county) { toast.error('Județul este obligatoriu'); return }
    if (!biologicalSex) { toast.error('Sexul biologic este obligatoriu'); return }
    if (!educationLevel) { toast.error('Nivelul de studii este obligatoriu'); return }
    setIsLoading(true)

    const phoneDigits = phone.replace(/\s/g, '')
    const result = await completeProfile({
      name: formName,
      phone: phoneDigits ? `+40${phoneDigits}` : undefined,
      birth_date: birthDate.toISOString().split('T')[0],
      county,
      city: city || undefined,
      gender: gender || undefined,
      biological_sex: biologicalSex,
      sexual_orientation: sexualOrientation || undefined,
      education_level: educationLevel,
    })

    if ('error' in result) {
      toast.error(result.error)
      setIsLoading(false)
      return
    }

    toast.success('Profil completat!')
    router.push('/panou')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-md animate-fade-in-up">

        <div className="mb-8 text-center">
          <p className="font-heading text-2xl font-black tracking-tight text-primary">CIVICOM✨</p>
          <h1 className="mt-3 text-xl font-bold text-foreground">Completează-ți profilul</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aceste informații ne ajută să înțelegem mai bine comunitatea
          </p>
        </div>

        <div className="mb-8 flex justify-center">
          <AvatarUploadClient currentAvatarUrl={avatarUrl} name={formName} userId={userId} />
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-6">

          {/* Informații personale */}
          <section className="flex flex-col gap-4">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Informații personale
            </h2>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Nume complet <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="Ion Popescu"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">
                Telefon <span className="text-muted-foreground text-xs">(opțional)</span>
              </Label>
              <InputGroup>
                <InputGroupAddon>
                  <Badge variant="secondary" className="text-xs">+40</Badge>
                </InputGroupAddon>
                <InputGroupInput
                  id="phone"
                  inputMode="numeric"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="700 000 000"
                />
              </InputGroup>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Data nașterii <span className="text-destructive">*</span></Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'w-full justify-start text-left font-normal',
                    !birthDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {birthDate ? formatDisplayDate(birthDate) : 'Selectează data nașterii'}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={birthDate}
                    onSelect={(date) => { setBirthDate(date); setCalendarOpen(false) }}
                    captionLayout="dropdown"
                    fromYear={currentYear - 100}
                    toYear={currentYear}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </section>

          {/* Locație */}
          <section className="flex flex-col gap-4">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Locație
            </h2>

            <div className="flex flex-col gap-1.5">
              <Label>Județ <span className="text-destructive">*</span></Label>
              <Select value={county} onValueChange={v => { setCounty(v); setCity('') }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selectează județul...">
                    {county || undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {ROMANIAN_COUNTIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">{cityLabel} <span className="text-muted-foreground text-xs">(opțional)</span></Label>
              <Input
                id="city"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder={cityPlaceholder}
              />
            </div>
          </section>

          {/* Identitate */}
          <section className="flex flex-col gap-4">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Identitate
            </h2>

            <div className="flex flex-col gap-1.5">
              <Label>Sex biologic <span className="text-destructive">*</span></Label>
              <Select value={biologicalSex} onValueChange={setBiologicalSex}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selectează...">
                    {BIO_SEX_LABELS[biologicalSex]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectItem value="male">Masculin</SelectItem>
                  <SelectItem value="female">Feminin</SelectItem>
                  <SelectItem value="intersex">Intersex</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer să nu spun</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Gen <span className="text-muted-foreground text-xs">(opțional)</span></Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selectează genul...">
                    {GENDER_LABELS[gender]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectItem value="male">Bărbat</SelectItem>
                  <SelectItem value="female">Femeie</SelectItem>
                  <SelectItem value="non_binary">Non-binar</SelectItem>
                  <SelectItem value="other">Altul</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer să nu spun</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Orientare sexuală <span className="text-muted-foreground text-xs">(opțional)</span></Label>
              <Select value={sexualOrientation} onValueChange={setSexualOrientation}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selectează...">
                    {ORIENTATION_LABELS[sexualOrientation]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectItem value="heterosexual">Heterosexual/ă</SelectItem>
                  <SelectItem value="gay">Gay</SelectItem>
                  <SelectItem value="lesbian">Lesbiană</SelectItem>
                  <SelectItem value="bisexual">Bisexual/ă</SelectItem>
                  <SelectItem value="pansexual">Pansexual/ă</SelectItem>
                  <SelectItem value="asexual">Asexual/ă</SelectItem>
                  <SelectItem value="other">Altă orientare</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer să nu spun</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* Educație */}
          <section className="flex flex-col gap-4">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Educație
            </h2>

            <div className="flex flex-col gap-1.5">
              <Label>Nivel de studii <span className="text-destructive">*</span></Label>
              <Select value={educationLevel} onValueChange={setEducationLevel}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selectează nivelul...">
                    {EDUCATION_LABELS[educationLevel]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectItem value="none">Fără studii</SelectItem>
                  <SelectItem value="middle_school">Gimnaziu</SelectItem>
                  <SelectItem value="high_school">Liceu</SelectItem>
                  <SelectItem value="bachelor">Licență</SelectItem>
                  <SelectItem value="master">Masterat</SelectItem>
                  <SelectItem value="doctorate">Doctorat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          <Button type="submit" disabled={isLoading} className="w-full gap-2 mt-2">
            {isLoading
              ? <><Loader2 className="size-4 animate-spin" /> Se salvează...</>
              : <>Continuă <ArrowRight className="size-4" /></>
            }
          </Button>
        </form>
      </div>
    </div>
  )
}
