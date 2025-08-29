import { useTranslation } from 'react-i18next'

export default function FollowersPage() {
  const { t } = useTranslation()
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{t("Followers List")}</h1>
      <p>{t("Here shows the list of users who follow you.")}</p>
    </div>
  );
}