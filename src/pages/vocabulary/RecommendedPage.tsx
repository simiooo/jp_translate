import { useTranslation } from 'react-i18next'

export default function RecommendedPage() {
  const { t } = useTranslation()
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{t("Recommended Vocabulary")}</h1>
      <p>{t("Here shows the system recommended high-quality vocabulary lists.")}</p>
    </div>
  );
}