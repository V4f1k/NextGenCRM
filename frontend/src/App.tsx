import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { AccountsAdvanced as Accounts } from './pages/AccountsAdvanced'
import { Contacts } from './pages/Contacts'
import { Leads } from './pages/Leads'
import { Opportunities } from './pages/Opportunities'
import { Tasks } from './pages/Tasks'
import { Login } from './pages/Login'

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
                  <Route path="accounts" element={<Accounts />} />
                  <Route path="contacts" element={<Contacts />} />
                  <Route path="leads" element={<Leads />} />
                  <Route path="opportunities" element={<Opportunities />} />
                  <Route path="tasks" element={<Tasks />} />
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
