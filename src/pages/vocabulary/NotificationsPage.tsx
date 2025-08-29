import { useTranslation } from 'react-i18next'

export default function NotificationsPage() {
  const { t } = useTranslation()
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{t("Notifications")}</h1>
      <p>{t("Here shows your system notifications and messages.")}</p>
    </div>
  );
}