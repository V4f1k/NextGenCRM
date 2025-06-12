import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const resources = {
  en: {
    translation: {
      app: {
        title: "NextGenCRM",
        logout: "Logout"
      },
      nav: {
        dashboard: "Dashboard",
        organizations: "Organizations",
        contacts: "Contacts",
        leads: "Leads",
        opportunities: "Opportunities",
        tasks: "Tasks"
      },
      dashboard: {
        title: "Dashboard",
        welcome: "Welcome back, {{name}}!",
        stats: {
          organizations: "Organizations",
          contacts: "Contacts",
          leads: "Leads",
          opportunities: "Opportunities"
        },
        recentActivity: "Recent Activity",
        noActivity: "No recent activity",
        viewAll: "View all activities",
        createdNew: "created new",
        loading: "Loading dashboard data...",
        error: "Failed to load dashboard data"
      },
      login: {
        title: "Sign in to your account",
        email: "Email address",
        password: "Password",
        submit: "Sign in",
        submitting: "Signing in...",
        rememberMe: "Remember me",
        forgotPassword: "Forgot password?",
        errors: {
          invalidCredentials: "Invalid email or password",
          serverError: "Server error. Please try again later."
        }
      },
      common: {
        create: "Create",
        edit: "Edit",
        delete: "Delete",
        save: "Save",
        cancel: "Cancel",
        search: "Search",
        filter: "Filter",
        actions: "Actions",
        loading: "Loading...",
        error: "Error",
        success: "Success",
        noData: "No data found",
        confirmDelete: "Are you sure you want to delete this item?",
        new: "New",
        status: "Status",
        createdAt: "Created",
        updatedAt: "Updated"
      },
      entities: {
        organization: "Organization",
        organizations: "Organizations",
        contact: "Contact",
        contacts: "Contacts",
        lead: "Lead",
        leads: "Leads",
        opportunity: "Opportunity",
        opportunities: "Opportunities",
        task: "Task",
        tasks: "Tasks"
      },
      organizations: {
        title: "Organizations",
        subtitle: "Manage your business organizations and companies",
        newOrganization: "New Organization",
        noOrganizations: "No organizations",
        createFirst: "Get started by creating your first organization.",
        searchPlaceholder: "Search organizations...",
        form: {
          title: {
            create: "Create New Organization",
            edit: "Edit Organization"
          }
        }
      }
    }
  },
  cs: {
    translation: {
      app: {
        title: "NextGenCRM",
        logout: "Odhlásit"
      },
      nav: {
        dashboard: "Přehled",
        organizations: "Organizace",
        contacts: "Kontakty",
        leads: "Leady",
        opportunities: "Příležitosti",
        tasks: "Úkoly"
      },
      dashboard: {
        title: "Přehled",
        welcome: "Vítejte zpět, {{name}}!",
        stats: {
          organizations: "Organizace",
          contacts: "Kontakty",
          leads: "Leady",
          opportunities: "Příležitosti"
        },
        recentActivity: "Nedávná aktivita",
        noActivity: "Žádná nedávná aktivita",
        viewAll: "Zobrazit vše",
        createdNew: "vytvořil/a nový",
        loading: "Načítání dat...",
        error: "Nepodařilo se načíst data"
      },
      login: {
        title: "Přihlaste se do svého účtu",
        email: "E-mailová adresa",
        password: "Heslo",
        submit: "Přihlásit se",
        submitting: "Přihlašování...",
        rememberMe: "Zapamatovat si mě",
        forgotPassword: "Zapomněli jste heslo?",
        errors: {
          invalidCredentials: "Neplatný e-mail nebo heslo",
          serverError: "Chyba serveru. Zkuste to prosím později."
        }
      },
      common: {
        create: "Vytvořit",
        edit: "Upravit",
        delete: "Smazat",
        save: "Uložit",
        cancel: "Zrušit",
        search: "Hledat",
        filter: "Filtrovat",
        actions: "Akce",
        loading: "Načítání...",
        error: "Chyba",
        success: "Úspěch",
        noData: "Žádná data",
        confirmDelete: "Opravdu chcete smazat tuto položku?",
        new: "Nový",
        status: "Stav",
        createdAt: "Vytvořeno",
        updatedAt: "Upraveno"
      },
      entities: {
        organization: "Organizace",
        organizations: "Organizace",
        contact: "Kontakt",
        contacts: "Kontakty",
        lead: "Lead",
        leads: "Leady",
        opportunity: "Příležitost",
        opportunities: "Příležitosti",
        task: "Úkol",
        tasks: "Úkoly"
      },
      organizations: {
        title: "Organizace",
        subtitle: "Spravujte své obchodní organizace a společnosti",
        newOrganization: "Nová organizace",
        noOrganizations: "Žádné organizace",
        createFirst: "Začněte vytvořením první organizace.",
        searchPlaceholder: "Hledat organizace...",
        form: {
          title: {
            create: "Vytvořit novou organizaci",
            edit: "Upravit organizaci"
          }
        }
      }
    }
  }
}

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false // React already does escaping
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  })

export default i18n