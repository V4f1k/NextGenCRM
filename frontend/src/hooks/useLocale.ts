import { useTranslation } from 'react-i18next'
import { format as dateFnsFormat } from 'date-fns'
import { cs, enUS } from 'date-fns/locale'

const locales = {
  en: enUS,
  cs: cs
}

export function useLocale() {
  const { i18n } = useTranslation()
  
  const locale = locales[i18n.language as keyof typeof locales] || enUS
  
  const formatDate = (date: Date | string, format: string = 'PPP') => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateFnsFormat(dateObj, format, { locale })
  }
  
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    const currencyOptions: Record<string, { locale: string; currency: string }> = {
      en: { locale: 'en-US', currency: 'USD' },
      cs: { locale: 'cs-CZ', currency: 'CZK' }
    }
    
    const options = currencyOptions[i18n.language] || currencyOptions.en
    
    return new Intl.NumberFormat(options.locale, {
      style: 'currency',
      currency: currency === 'USD' || currency === 'CZK' ? currency : options.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }
  
  const formatNumber = (num: number) => {
    const locale = i18n.language === 'cs' ? 'cs-CZ' : 'en-US'
    return new Intl.NumberFormat(locale).format(num)
  }
  
  return {
    locale,
    language: i18n.language,
    formatDate,
    formatCurrency,
    formatNumber
  }
}