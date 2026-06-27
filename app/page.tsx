import { I18nProvider } from "@/lib/i18n"
import { RescueStoreProvider } from "@/lib/rescue-store"
import { RescueDashboard } from "@/components/rescue-dashboard"

export default function Page() {
  return (
    <I18nProvider>
      <RescueStoreProvider>
        <RescueDashboard />
      </RescueStoreProvider>
    </I18nProvider>
  )
}
