'use server'

export async function checkURLAccessible(url: string): Promise<boolean> {
    try {
        const res = await fetch(url, { method: 'HEAD', redirect: 'follow' })
        return res.ok
    } catch {
        return false
    }
}
