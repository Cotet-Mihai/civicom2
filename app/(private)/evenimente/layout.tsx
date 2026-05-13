import { Navbar } from '@/components/layout/Navbar'

export default function EvenimentePrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col pt-16">{children}</main>
    </>
  )
}
