# NextGenCRM Internationalization Guide

## Overview

The NextGenCRM application now supports multiple languages using react-i18next. Currently supported languages:
- English (en) - Default
- Czech (cs)

## Setup Complete

The following has been implemented:

1. **i18n Configuration** (`src/i18n/config.ts`)
   - Automatic language detection from browser
   - Language persistence in localStorage
   - Fallback to English if translation missing

2. **Translation Files**
   - `src/i18n/locales/en.json` - English translations
   - `src/i18n/locales/cs.json` - Czech translations

3. **Language Switcher Component** (`src/components/LanguageSwitcher.tsx`)
   - Added to the main layout header
   - Shows current language flag
   - Dropdown to switch languages

4. **Locale Hook** (`src/hooks/useLocale.ts`)
   - Date formatting with locale support
   - Currency formatting (USD/CZK)
   - Number formatting

## How to Use Translations

### 1. Basic Translation

```tsx
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  
  return <h1>{t('dashboard.title')}</h1>
}
```

### 2. Translation with Variables

```tsx
// In translation file:
"welcome": "Welcome to {{appName}}"

// In component:
<p>{t('dashboard.welcome', { appName: 'NextGenCRM' })}</p>
```

### 3. Plural Translations

```tsx
// In translation file:
"items": "{{count}} item",
"items_plural": "{{count}} items"

// In component:
<p>{t('items', { count: itemCount })}</p>
```

### 4. Date/Currency Formatting

```tsx
import { useLocale } from '../hooks/useLocale'

function MyComponent() {
  const { formatDate, formatCurrency } = useLocale()
  
  return (
    <>
      <p>{formatDate(new Date())}</p>
      <p>{formatCurrency(1000)}</p>
    </>
  )
}
```

## Adding New Translations

1. Add the English text to `src/i18n/locales/en.json`
2. Add the Czech translation to `src/i18n/locales/cs.json`
3. Use the translation key in your component

Example:
```json
// en.json
{
  "myFeature": {
    "title": "My Feature",
    "description": "This is my new feature"
  }
}

// cs.json
{
  "myFeature": {
    "title": "Moje funkce",
    "description": "Toto je moje nová funkce"
  }
}
```

## Components Already Translated

- ✅ Layout/Navigation
- ✅ Login Page
- ✅ Dashboard
- ✅ Common UI elements

## Components Needing Translation

- [ ] Accounts pages
- [ ] Contacts pages
- [ ] Leads pages
- [ ] Opportunities pages
- [ ] Tasks pages
- [ ] All form components
- [ ] Data tables
- [ ] Modal dialogs
- [ ] Toast messages
- [ ] Error messages

## Best Practices

1. **Keep translation keys organized** - Use nested objects for related translations
2. **Use descriptive keys** - e.g., `forms.account.fields.name` not just `name`
3. **Don't hardcode strings** - Always use translation keys
4. **Handle missing translations** - Provide meaningful fallbacks
5. **Test in both languages** - Ensure UI doesn't break with longer Czech text

## Testing Language Switch

1. Start the dev server: `npm run dev`
2. Open the application
3. Look for the language switcher (globe icon) in the header
4. Click and select "Čeština" to switch to Czech
5. The UI should immediately update to Czech language

## Next Steps

To complete the internationalization:

1. Update all remaining components to use `useTranslation`
2. Extract all hardcoded strings to translation files
3. Add form validation messages in both languages
4. Consider adding more languages if needed