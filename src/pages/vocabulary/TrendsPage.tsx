import { useTranslation } from 'react-i18next'

export default function TrendsPage() {
  const { t } = useTranslation()
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{t("Current Trends")}</h1>
      <p>{t("Here shows current popular word and topic trends.")}</p>
    </div>
  );
}