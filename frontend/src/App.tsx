import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { OrganizationsAdvanced as Organizations } from './pages/OrganizationsAdvanced'
import { Contacts } from './pages/Contacts'
import { Leads } from './pages/Leads'
import { Opportunities } from './pages/Opportunities'
import { Tasks } from './pages/Tasks'
import { Login } from './pages/Login'
import { TaskDetail } from './pages/TaskDetail'
import { OrganizationDetail } from './pages/OrganizationDetail'
import { ContactDetail } from './pages/ContactDetail'
import { LeadDetail } from './pages/LeadDetail'
import { OpportunityDetail } from './pages/OpportunityDetail'
// import './i18n/config' // Temporarily disabled for Docker - DO NOT UNCOMMENT

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <Router>
              <div className="min-h-screen bg-gray-50">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Dashboard />} />
                    <Route path="organizations" element={<Organizations />} />
                    <Route path="organizations/:id" element={<OrganizationDetail />} />
                    {/* Legacy routes for backward compatibility */}
                    <Route path="accounts" element={<Organizations />} />
                    <Route path="accounts/:id" element={<OrganizationDetail />} />
                    <Route path="contacts" element={<Contacts />} />
                    <Route path="contacts/:id" element={<ContactDetail />} />
                    <Route path="leads" element={<Leads />} />
                    <Route path="leads/:id" element={<LeadDetail />} />
                    <Route path="opportunities" element={<Opportunities />} />
                    <Route path="opportunities/:id" element={<OpportunityDetail />} />
                    <Route path="tasks" element={<Tasks />} />
                    <Route path="tasks/:id" element={<TaskDetail />} />
                  </Route>
                </Routes>
              </div>
            </Router>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
  )
}

export default App
