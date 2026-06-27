import { Camera, Globe, Hash, MessageCircle, Music2, Newspaper, Send, ThumbsUp, type LucideIcon } from "lucide-react"
import type { ImportPlatform } from "./types"

// Generic (non-brand) icons per platform so we never depend on deprecated brand marks.
export const PLATFORM_ICON: Record<ImportPlatform, LucideIcon> = {
  twitter: Hash,
  instagram: Camera,
  tiktok: Music2,
  telegram: Send,
  whatsapp: MessageCircle,
  facebook: ThumbsUp,
  news: Newspaper,
  other: Globe,
}

export const PLATFORM_I18N_KEY: Record<ImportPlatform, string> = {
  twitter: "pf_twitter",
  instagram: "pf_instagram",
  tiktok: "pf_tiktok",
  telegram: "pf_telegram",
  whatsapp: "pf_whatsapp",
  facebook: "pf_facebook",
  news: "pf_news",
  other: "pf_other",
}

/** Deep links for manual hashtag/keyword monitoring (no scraping, just search URLs). */
export const MONITOR_LINKS: { label: string; url: string }[] = [
  { label: "#LaGuaira", url: "https://twitter.com/search?q=%23LaGuaira&f=live" },
  { label: "#Sismo Venezuela", url: "https://twitter.com/search?q=%23Sismo%20Venezuela&f=live" },
  { label: "#PlayaGrande", url: "https://twitter.com/search?q=%23PlayaGrande&f=live" },
  { label: "desaparecido La Guaira", url: "https://twitter.com/search?q=desaparecido%20La%20Guaira&f=live" },
  { label: "atrapado Venezuela", url: "https://twitter.com/search?q=atrapado%20Venezuela&f=live" },
]
