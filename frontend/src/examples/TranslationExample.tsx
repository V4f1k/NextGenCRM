import { useTranslation } from 'react-i18next'
import { useLocale } from '../hooks/useLocale'

/**
 * Example component showing how to use translations in the NextGenCRM app
 */
export function TranslationExample() {
  const { t } = useTranslation()
  const { formatDate, formatCurrency, formatNumber } = useLocale()
  
  // Example data
  const account = {
    name: 'Acme Corp',
    revenue: 5000000,
    employees: 150,
    createdAt: new Date()
  }
  
  return (
    <div className="space-y-4">
      {/* Simple translation */}
      <h1>{t('dashboard.title')}</h1>
      
      {/* Translation with interpolation */}
      <p>{t('dashboard.welcome', { appName: t('app.name') })}</p>
      
      {/* Plural translation */}
      <p>{t('dashboard.stats.thisMonth', { count: 5 })}</p>
      
      {/* Using entity translations */}
      <p>{t('entities.account')}: {account.name}</p>
      
      {/* Formatted dates with locale */}
      <p>{t('common.createdAt')}: {formatDate(account.createdAt)}</p>
      
      {/* Formatted currency */}
      <p>{t('forms.account.fields.annualRevenue')}: {formatCurrency(account.revenue)}</p>
      
      {/* Formatted numbers */}
      <p>{t('forms.account.fields.numberOfEmployees')}: {formatNumber(account.employees)}</p>
      
      {/* Form validation messages */}
      <div className="text-red-600 text-sm">
        <p>{t('forms.validation.required')}</p>
        <p>{t('forms.validation.minLength', { min: 3 })}</p>
      </div>
      
      {/* Common actions */}
      <div className="flex gap-2">
        <button className="btn-primary">{t('common.save')}</button>
        <button className="btn-secondary">{t('common.cancel')}</button>
      </div>
    </div>
  )
}