"use client"

import { useState } from "react"
import { ScanSearch } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useI18n } from "@/lib/i18n"
import { parsePost } from "@/lib/social-parser"
import { IMPORT_PLATFORMS, type ImportPlatform } from "@/lib/types"
import { PLATFORM_I18N_KEY } from "@/lib/platform-meta"

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-input/30 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export interface AnalyzedInput {
  text: string
  platform: ImportPlatform
  url: string
  postedAt: number
}

export function ImportForm({ onAnalyzed }: { onAnalyzed: (input: AnalyzedInput) => void }) {
  const { t } = useI18n()
  const [text, setText] = useState("")
  const [platform, setPlatform] = useState<ImportPlatform>("whatsapp")
  const [url, setUrl] = useState("")
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))

  function handleAnalyze(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    onAnalyzed({
      text: text.trim(),
      platform,
      url: url.trim(),
      postedAt: new Date(`${date}T00:00:00`).getTime() || Date.now(),
    })
  }

  return (
    <form onSubmit={handleAnalyze} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="post-text">
          {t("pastePost")} <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="post-text"
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("pastePlaceholder")}
          required
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="post-platform">{t("platform")}</Label>
          <select
            id="post-platform"
            className={selectClass}
            value={platform}
            onChange={(e) => setPlatform(e.target.value as ImportPlatform)}
          >
            {IMPORT_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {t(PLATFORM_I18N_KEY[p] as never)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="post-date">{t("postDate")}</Label>
          <Input id="post-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="post-url">{t("postUrl")}</Label>
        <Input
          id="post-url"
          type="url"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://"
        />
      </div>

      <Button type="submit" disabled={!text.trim()} className="w-full sm:w-auto sm:justify-self-start">
        <ScanSearch />
        {t("analyze")}
      </Button>
    </form>
  )
}
