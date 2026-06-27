"use client"

import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function LanguageToggle() {
  const { lang, setLang } = useI18n()
  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center rounded-lg border border-border bg-card p-0.5 text-xs font-medium"
    >
      {(["es", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={cn(
            "rounded-md px-2 py-1 uppercase transition-colors",
            lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
