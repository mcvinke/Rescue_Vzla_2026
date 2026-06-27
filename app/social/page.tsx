import { I18nProvider } from "@/lib/i18n"
import { RescueStoreProvider } from "@/lib/rescue-store"
import { SocialMonitor } from "@/components/social/social-monitor"

export const metadata = {
  title: "Social — RescateVzla",
  description: "Monitoreo de redes sociales para coordinadores de rescate",
}

export default function SocialPage() {
  return (
    <I18nProvider>
      <RescueStoreProvider>
        <div className="min-h-dvh bg-background">
          <SocialMonitor />
        </div>
      </RescueStoreProvider>
    </I18nProvider>
  )
}
