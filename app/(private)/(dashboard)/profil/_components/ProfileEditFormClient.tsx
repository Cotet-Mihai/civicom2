'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CalendarIcon, Loader2 } from 'lucide-react'
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
import { updateUserProfile } from '@/services/user.service'
import type { UserProfile } from '@/services/user.service'
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

function parsePhoneDigits(stored: string | null): string {
  if (!stored) return ''
  // stored as +40XXXXXXXXX → strip +40
  const digits = stored.replace(/\D/g, '')
  return digits.startsWith('40') ? digits.slice(2) : digits
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 9)
  const parts: string[] = []
  if (digits.length > 0) parts.push(digits.slice(0, 3))
  if (digits.length > 3) parts.push(digits.slice(3, 6))
  if (digits.length > 6) parts.push(digits.slice(6, 9))
  return parts.join(' ')
}

export function ProfileEditFormClient({ profile }: { profile: UserProfile }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const [name, setName] = useState(profile.name)
  const [phone, setPhone] = useState(formatPhone(parsePhoneDigits(profile.phone)))
  const [birthDate, setBirthDate] = useState<Date | undefined>(
    profile.birth_date ? new Date(profile.birth_date) : undefined
  )
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [county, setCounty] = useState(profile.county ?? '')
  const [city, setCity] = useState(profile.city ?? '')
  const [gender, setGender] = useState(profile.gender ?? '')
  const [biologicalSex, setBiologicalSex] = useState(profile.biological_sex ?? '')
  const [sexualOrientation, setSexualOrientation] = useState(profile.sexual_orientation ?? '')
  const [educationLevel, setEducationLevel] = useState(profile.education_level ?? '')

  const isBucharest = county === 'București'
  const cityLabel = isBucharest ? 'Sector' : 'Oraș'
  const cityPlaceholder = isBucharest ? 'Sector 1, 2, 3...' : 'Cluj-Napoca'

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(formatPhone(e.target.value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim().length < 2) { toast.error('Numele trebuie să aibă minim 2 caractere'); return }
    setIsLoading(true)

    const phoneDigits = phone.replace(/\s/g, '')
    const result = await updateUserProfile({
      name: name.trim(),
      phone: phoneDigits ? `+40${phoneDigits}` : undefined,
      birth_date: birthDate ? birthDate.toISOString().split('T')[0] : undefined,
      county: county || undefined,
      city: city || undefined,
      gender: gender || undefined,
      biological_sex: biologicalSex || undefined,
      sexual_orientation: sexualOrientation || undefined,
      education_level: educationLevel || undefined,
    })

    setIsLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Profil actualizat')
    router.push('/profil')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      <section className="flex flex-col gap-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Informații personale
        </h3>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nume complet <span className="text-destructive">*</span></Label>
          <Input
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
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
          <Label>
            Data nașterii <span className="text-muted-foreground text-xs">(opțional)</span>
          </Label>
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

      <section className="flex flex-col gap-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Locație
        </h3>

        <div className="flex flex-col gap-1.5">
          <Label>Județ <span className="text-muted-foreground text-xs">(opțional)</span></Label>
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
          <Label htmlFor="city">
            {cityLabel} <span className="text-muted-foreground text-xs">(opțional)</span>
          </Label>
          <Input
            id="city"
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder={cityPlaceholder}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Identitate
        </h3>

        <div className="flex flex-col gap-1.5">
          <Label>Sex biologic <span className="text-muted-foreground text-xs">(opțional)</span></Label>
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

      <section className="flex flex-col gap-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Educație
        </h3>

        <div className="flex flex-col gap-1.5">
          <Label>Nivel de studii <span className="text-muted-foreground text-xs">(opțional)</span></Label>
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

      <Button type="submit" disabled={isLoading} className="w-full gap-2">
        {isLoading && <Loader2 className="size-4 animate-spin" />}
        Salvează modificările
      </Button>
    </form>
  )
}
