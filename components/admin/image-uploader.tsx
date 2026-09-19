"use client"

import { useCallback, useState } from "react"
import { X, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface ImageItem {
  id: string
  url: string
}

interface ImageUploaderProps {
  value: ImageItem[]
  onChange: (value: ImageItem[]) => void
  multiple?: boolean
  max?: number
  className?: string
  /** Unique id when several uploaders exist on the same page */
  inputId?: string
}

export function ImageUploader({
  value,
  onChange,
  multiple = true,
  max = 10,
  className,
  inputId = "image-uploader-input",
}: ImageUploaderProps) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Apenas imagens são permitidas.")
        return null
      }
      setError(null)
      setUploading(true)
      try {
        const formData = new FormData()
        formData.append("file", file)
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? "Falha no upload")
        return { id: data.id, url: data.url }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha no upload")
        return null
      } finally {
        setUploading(false)
      }
    },
    []
  )

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const files = Array.from(e.dataTransfer.files)
      if (!multiple && files.length > 0) {
        const file = files[0]
        const item = await uploadFile(file)
        if (item) onChange([item])
        return
      }
      const remaining = max - value.length
      const toUpload = files.slice(0, remaining)
      const newItems: ImageItem[] = []
      for (const file of toUpload) {
        const item = await uploadFile(file)
        if (item) newItems.push(item)
      }
      if (newItems.length) onChange([...value, ...newItems])
    },
    [value, multiple, max, onChange, uploadFile]
  )

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : []
      e.target.value = ""
      if (!multiple && files.length > 0) {
        const item = await uploadFile(files[0])
        if (item) onChange([item])
        return
      }
      const remaining = max - value.length
      const toUpload = files.slice(0, remaining)
      const newItems: ImageItem[] = []
      for (const file of toUpload) {
        const item = await uploadFile(file)
        if (item) newItems.push(item)
      }
      if (newItems.length) onChange([...value, ...newItems])
    },
    [value, multiple, max, onChange, uploadFile]
  )

  const removeImage = useCallback(
    async (item: ImageItem) => {
      const isUploadedImage = item.url.startsWith("/uploads/") || item.url.includes("/uploads/")
      if (isUploadedImage) {
        try {
          await fetch(`/api/upload/${item.id}`, { method: "DELETE", credentials: "include" })
        } catch {
          // ignora erro de rede; remove da lista mesmo assim
        }
      }
      onChange(value.filter((i) => i.id !== item.id))
    },
    [value, onChange]
  )

  const canAdd = value.length < max

  return (
    <div className={cn("space-y-2", className)}>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (canAdd) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-slate-200 dark:border-slate-700",
          !canAdd && "opacity-50 pointer-events-none"
        )}
      >
        <input
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          id={inputId}
          onChange={handleFileInput}
          disabled={!canAdd || uploading}
        />
        <label
          htmlFor={inputId}
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          <Upload className="h-8 w-8 text-slate-400" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {uploading ? "Enviando..." : "Arraste imagens ou clique para selecionar"}
          </span>
          {multiple && (
            <span className="text-xs text-slate-500">
              {value.length}/{max} fotos
            </span>
          )}
        </label>
      </div>
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {value.map((item) => (
            <div
              key={item.id}
              className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
            >
              <img
                src={item.url}
                alt=""
                className="w-full h-full object-cover"
              />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-1 right-1 h-7 w-7"
                onClick={() => removeImage(item)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
