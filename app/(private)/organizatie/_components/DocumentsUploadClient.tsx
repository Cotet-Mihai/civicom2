'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Upload, X, FileIcon } from 'lucide-react'
import { addOrgDocument, removeOrgDocument, type OrgDocument } from '@/services/organization.service'
import { uploadOrgDocument } from '@/lib/upload'
import { ORG_DOC_TYPE_LABELS } from '@/lib/constants'

type Props = {
  orgId: string
  documents: OrgDocument[]
  onDocumentsChange: (docs: OrgDocument[]) => void
}

export function DocumentsUploadClient({ orgId, documents, onDocumentsChange }: Props) {
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  async function handleUpload(docType: string, file: File) {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Fișierul depășește 10MB')
      return
    }

    setUploading(prev => ({ ...prev, [docType]: true }))

    try {
      const path = await uploadOrgDocument(file, orgId)
      if (!path) {
        toast.error('Eroare la upload')
        return
      }

      const result = await addOrgDocument(orgId, docType, file.name, path)
      if ('error' in result) {
        toast.error(result.error)
        return
      }

      onDocumentsChange([...documents.filter(d => d.doc_type !== docType), result.doc])
    } finally {
      setUploading(prev => ({ ...prev, [docType]: false }))
      // Reset the input so the same file can be re-uploaded if needed
      const input = inputRefs.current[docType]
      if (input) input.value = ''
    }
  }

  async function handleRemove(doc: OrgDocument) {
    const result = await removeOrgDocument(doc.id, orgId)
    if ('error' in result) {
      toast.error(result.error)
      return
    }
    onDocumentsChange(documents.filter(d => d.id !== doc.id))
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        Documente organizație
      </p>

      {Object.entries(ORG_DOC_TYPE_LABELS).map(([docType, label]) => {
        const doc = documents.find(d => d.doc_type === docType)

        return (
          <div
            key={docType}
            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 px-4 py-3"
          >
            <span className="text-sm font-semibold text-foreground">{label}</span>

            {doc ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  <FileIcon size={12} />
                  <span className="max-w-[180px] truncate">{doc.file_name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleRemove(doc)}
                >
                  <X size={12} className="mr-1" /> Șterge
                </Button>
              </div>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => inputRefs.current[docType]?.click()}
                  disabled={uploading[docType]}
                >
                  {uploading[docType] ? (
                    <Upload size={12} className="animate-pulse" />
                  ) : (
                    <Upload size={12} />
                  )}
                  {uploading[docType] ? 'Se încarcă...' : 'Încarcă'}
                </Button>
                <input
                  ref={el => { inputRefs.current[docType] = el }}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleUpload(docType, file)
                  }}
                />
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
