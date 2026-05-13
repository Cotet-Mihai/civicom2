# components/ui/

Design system CIVICOM — componente primitive shadcn/ui + componente custom. Nicio logică de business aici, doar prezentare și interactivitate UI de bază.

## Componente shadcn/ui standard (instalate via `shadcn add`)

Acestea sunt componente shadcn standard, nemodificate (sau cu modificări minime de stil). Nu se documentează în detaliu — consulta docs.shadcn.com.

| Fișier | Componentă principală | Utilizare în proiect |
|---|---|---|
| `accordion.tsx` | `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` | FAQ homepage |
| `alert-dialog.tsx` | `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel` etc. | Confirmare signout în navbar/sidebar |
| `avatar.tsx` | `Avatar`, `AvatarImage`, `AvatarFallback` | NavbarActionsClient, DashboardContextSwitcherClient, FeedbackSection |
| `badge.tsx` | `Badge` | Category labels, status labels pe carduri și rânduri |
| `button.tsx` | `Button`, `buttonVariants` | Buton CTA principal în toată aplicația |
| `button-group.tsx` | `ButtonGroup` | Grupuri de butoane în shadcn-map |
| `calendar.tsx` | `Calendar` | Date picker în formulare creare eveniment |
| `card.tsx` | `Card`, `CardContent`, `CardHeader`, `CardFooter` | Carduri eveniment, sidebar participare, dashboard |
| `carousel.tsx` | `Carousel`, `CarouselContent`, `CarouselItem` etc. | Carusel orgs homepage, carusel events homepage |
| `checkbox.tsx` | `Checkbox` | Filtre categorii |
| `command.tsx` | `Command`, `CommandInput` etc. | Autocomplete componente |
| `dialog.tsx` | `Dialog`, `DialogContent` etc. | Modals diverse |
| `dropdown-menu.tsx` | `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem` etc. | Navbar user menu, context switcher |
| `hover-card.tsx` | `HoverCard`, `HoverCardTrigger`, `HoverCardContent` | Tooltip forta parolă în InputPasswordStrength |
| `input.tsx` | `Input` | Input-uri în formulare |
| `input-group.tsx` | `InputGroup` | Grupuri de input-uri |
| `label.tsx` | `Label` | Labels pentru câmpuri formular |
| `popover.tsx` | `Popover`, `PopoverTrigger`, `PopoverContent` | Selector popover în charts dashboard |
| `progress.tsx` | `Progress` | Progress bar participare și semnături |
| `radio-group.tsx` | `RadioGroup`, `RadioGroupItem` | Selecție subtip în stepper-uri creare eveniment |
| `select.tsx` | `Select`, `SelectContent`, `SelectItem` etc. | Selecție categorii, sortare |
| `separator.tsx` | `Separator` | Linii separatoare în meniuri |
| `sheet.tsx` | `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle` | Drawer mobil navbar și dashboard |
| `skeleton.tsx` | `Skeleton` | Loading skeletons — **mereu folosit pentru loading state** (niciodată div manual cu animate-pulse) |
| `sonner.tsx` | `Toaster` | Container notificări toast (montat în root layout) |
| `textarea.tsx` | `Textarea` | Câmpuri text multiline în formulare |
| `toggle.tsx` | `Toggle` | Butoane toggle filtre |
| `toggle-group.tsx` | `ToggleGroup`, `ToggleGroupItem` | Grup de toggle-uri (filtre categorii) |
| `tooltip.tsx` | `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` | Tooltip-uri diverse; `TooltipProvider` montat în root layout |

## Componente Custom (create specific pentru CIVICOM)

### InputPassword.tsx
- **Scop:** Input de parolă cu buton toggle show/hide — extinde `Input` shadcn cu icon Eye/EyeOff
- **Tip:** Client Component (`'use client'` — useState pentru visibility)
- **Exporturi principale:** `InputPassword`
- **Props:** Toate props de `<input>` standard + `className?`
- **Importat in:** `SignInFormClient`, `ResetPasswordFormClient`, `InputPasswordStrength`

### InputPasswordStrength.tsx
- **Scop:** Input de parolă cu indicator vizual de forță — 5 bare colorate + HoverCard cu lista cerințelor, afișează check/x per criteriu
- **Tip:** Client Component
- **Exporturi principale:** `InputPasswordStrength`
- **Props:** Toate props de `<input>` + `label?: string`
- **Apelează:** `InputPassword`, `HoverCard` din shadcn
- **Importat in:** `SignUpFormClient`
- **Note:** Excepție de la regula token-uri shadcn — foloseste `bg-green-500`, `bg-blue-500`, `bg-yellow-500` etc. ca indicatori semantici de forță, nu ca identitate vizuală

### spinner.tsx
- **Scop:** Spinner de loading — `Loader2Icon` din lucide-react cu `animate-spin`
- **Tip:** Server Component (nu are interactivitate)
- **Exporturi principale:** `Spinner`
- **Props:** `className?` + orice SVG props
- **Importat in:** Butoane cu loading state, pagini cu loading

### chart.tsx
- **Scop:** Wrapper shadcn pentru Recharts — `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`; gestionează config culori + theme (light/dark)
- **Tip:** Client Component
- **Exporturi principale:** `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`, `ChartConfig` (tip)
- **Importat in:** `EventsChartsSection`, `EventsEvolutionChartClient`

### map.tsx
- **Scop:** Wrapper shadcn-map pentru Leaflet — `Map`, `MapMarker`, `MapPopup`, `MapTileLayer`, `MapZoomControl`, `PlaceAutocomplete`; wrapper `ButtonGroup` pentru controale hartă
- **Tip:** Client Component (Leaflet necesită browser)
- **Exporturi principale:** `Map`, `MapMarker`, `MapTileLayer`, `MapZoomControl`, `MapPopup` (re-exporturi din shadcn-map + componente locale)
- **Importat in:** `LocationMapClient`, `LocationPickerClient`, `RoutePickerClient`

### place-autocomplete.tsx
- **Scop:** Input autocomplete pentru locații (Nominatim/OpenStreetMap) — folosit în map.tsx
- **Tip:** Client Component
- **Exporturi principale:** `PlaceAutocomplete`
- **Importat in:** `map.tsx`

## Patterns & Conventii
- Componentele shadcn standard NU se modifică — dacă e nevoie de variante, se creează componente wrapper
- `Skeleton` din shadcn este OBLIGATORIU pentru loading states — niciodată `<div className="animate-pulse">`
- Toate componentele din `ui/` sunt fără logică de business
- `InputPassword` și `InputPasswordStrength` sunt singurele componente custom non-shadcn în `ui/` — create deoarece shadcn nu le include implicit

## Dependente
- **Importa din:** `@/lib/utils` (cn), `lucide-react`, `recharts`, `@shadcn-map/map`, `@radix-ui/*`
- **Este importat de:** Toată aplicația — componente, pagini, hooks
