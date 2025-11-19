import React, { useState, Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from './hooks/useAppStore';
import { supabase, isConfigured } from './lib/supabaseClient';

import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import ToastContainer from './components/ui/Toast';
import PageLoader from './components/layout/PageLoader';
import { AlertTriangleIcon } from './components/icons/Icon';

// Lazy load pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ClientsPage = lazy(() => import('./pages/ClientsPage'));
const ClientDetailPage = lazy(() => import('./pages/ClientDetailPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'));
const TimeTrackingPage = lazy(() => import('./pages/TimeTrackingPage'));
const BudgetsPage = lazy(() => import('./pages/BudgetsPage'));
const ProposalsPage = lazy(() => import('./pages/ProposalsPage'));
const ContractsPage = lazy(() => import('./pages/ContractsPage'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'));
const CreateInvoicePage = lazy(() => import('./pages/CreateInvoicePage'));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'));
const TaxLedgerPage = lazy(() => import('./pages/TaxLedgerPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const ProfitabilityReportPage = lazy(() => import('./pages/ProfitabilityReportPage'));
const ForecastingPage = lazy(() => import('./pages/ForecastingPage'));
const AIAssistantPage = lazy(() => import('./pages/AIAssistantPage'));
const TeamManagementDashboard = lazy(() => import('./pages/TeamManagementDashboard'));
const MyTeamTimesheet = lazy(() => import('./pages/MyTeamTimesheet'));
const RoleManagement = lazy(() => import('./pages/RoleManagement'));
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'));
const IntegrationsManager = lazy(() => import('./pages/IntegrationsManager'));
const JobMarketDashboard = lazy(() => import('./pages/JobMarketDashboard'));
const JobDetailPage = lazy(() => import('./pages/JobDetailPage'));
const SavedJobsPage = lazy(() => import('./pages/SavedJobsPage'));
const MyApplicationsPage = lazy(() => import('./pages/MyApplicationsPage'));
const PostJobForm = lazy(() => import('./pages/JobPostForm'));
const MyJobPostsPage = lazy(() => import('./pages/MyJobPostsPage'));
const JobApplicantsPage = lazy(() => import('./pages/JobApplicantsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage'));
const BillingPage = lazy(() => import('./pages/BillingPage'));
const TemplatesPage = lazy(() => import('./pages/TemplatesPage'));
const AffiliateProgramPage = lazy(() => import('./pages/AffiliateProgramPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const AuthLayout = lazy(() => import('./pages/auth/AuthLayout'));
const PortalLayout = lazy(() => import('./pages/portal/PortalLayout'));
const PortalLoginPage = lazy(() => import('./pages/portal/PortalLoginPage'));
const PortalDashboardPage = lazy(() => import('./pages/portal/PortalDashboardPage'));
const PortalInvoiceViewPage = lazy(() => import('./pages/portal/PortalInvoiceViewPage'));
const PortalBudgetViewPage = lazy(() => import('./pages/portal/PortalBudgetViewPage'));
const PortalProposalViewPage = lazy(() => import('./pages/portal/PortalProposalViewPage'));
const PortalContractViewPage = lazy(() => import('./pages/portal/PortalContractViewPage'));
const PortalProjectFilesPage = lazy(() => import('./pages/portal/PortalProjectFilesPage'));


const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen text-slate-100 main-app-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent p-4 sm:p-6 lg:p-8">
          <Suspense fallback={<PageLoader />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
};

// Protected Route Guard: Redirects to Login if not authenticated
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAppStore();
  const location = useLocation();

  if (isLoading) {
    return <div className="h-screen w-screen bg-slate-950 flex items-center justify-center"><PageLoader /></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Public Route Guard: Redirects to Dashboard if already authenticated
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAppStore();
    
    if (isLoading) {
        return <div className="h-screen w-screen bg-slate-950 flex items-center justify-center"><PageLoader /></div>;
    }

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};


function App() {
  // 1. Verificación Crítica de Configuración
  // Si Supabase no está configurado, detenemos el renderizado de la app para evitar crashes.
  if (!isConfigured) {
      return (
          <div className="h-screen w-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
              <div className="bg-red-500/10 p-6 rounded-full mb-6">
                  <AlertTriangleIcon className="w-16 h-16 text-red-500" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">Configuración Requerida</h1>
              <p className="text-slate-400 max-w-lg mb-8 text-lg">
                  La aplicación no puede conectarse a la base de datos. Parece que faltan las variables de entorno de Supabase.
              </p>
              <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 text-left w-full max-w-lg">
                  <p className="text-sm text-slate-500 mb-2 uppercase font-bold tracking-wider">Variables Faltantes:</p>
                  <code className="block text-red-400 font-mono text-sm mb-1">VITE_SUPABASE_URL</code>
                  <code className="block text-red-400 font-mono text-sm">VITE_SUPABASE_ANON_KEY</code>
              </div>
          </div>
      );
  }

  const { setSession, fetchInitialData, clearUserData, isLoading } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
        try {
            useAppStore.setState({ isLoading: true });
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) throw error;

            if (mounted) {
                setSession(session);
                if (session?.user) {
                    await fetchInitialData(session.user);
                }
            }
        } catch (error) {
            console.error("Error checking session:", error);
            if (mounted) clearUserData();
        } finally {
            if (mounted) useAppStore.setState({ isLoading: false });
        }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        // Actualizar estado de sesión
        setSession(session);

        if (event === 'SIGNED_IN' && session?.user) {
            // Limpiar hash de URL (OAuth)
            if (window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('type=recovery'))) {
                window.history.replaceState(null, '', window.location.pathname);
                navigate('/', { replace: true });
            }
            
            // Cargar datos
            useAppStore.setState({ isLoading: true });
            await fetchInitialData(session.user);
            useAppStore.setState({ isLoading: false });

        } else if (event === 'SIGNED_OUT') {
            clearUserData();
            navigate('/auth/login', { replace: true });
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [setSession, fetchInitialData, clearUserData, navigate]);
  

  if (isLoading) {
      return <div className="h-screen w-screen bg-slate-950 flex items-center justify-center"><PageLoader /></div>;
  }

  return (
    <>
      <Routes>
        {/* --- PUBLIC ROUTES (Auth) --- */}
        <Route path="/auth/*" element={
          <PublicRoute>
            <Suspense fallback={<div className="h-screen w-screen bg-[#0a0a0a]" />}>
                <AuthLayout>
                    <Routes>
                        <Route path="login" element={<LoginPage />} />
                        <Route path="register" element={<RegisterPage />} />
                        <Route path="*" element={<Navigate to="login" replace />} />
                    </Routes>
                </AuthLayout>
            </Suspense>
          </PublicRoute>
        } />

        {/* --- PORTAL ROUTES (Public/Semi-private) --- */}
        <Route path="/portal/*" element={
          <Suspense fallback={<div className="h-screen w-screen bg-slate-900" />}>
            <PortalLayout>
              <Routes>
                <Route path="login" element={<PortalLoginPage />} />
                <Route path="dashboard/:clientId" element={<PortalDashboardPage />} />
                <Route path="invoice/:invoiceId" element={<PortalInvoiceViewPage />} />
                <Route path="budget/:budgetId" element={<PortalBudgetViewPage />} />
                <Route path="proposal/:proposalId" element={<PortalProposalViewPage />} />
                <Route path="contract/:contractId" element={<PortalContractViewPage />} />
                <Route path="project/:projectId/files" element={<PortalProjectFilesPage />} />
                <Route path="*" element={<Navigate to="login" replace />} />
              </Routes>
            </PortalLayout>
          </Suspense>
        } />
        
        <Route path="/privacy-policy" element={
          <Suspense fallback={<div className="h-screen w-screen bg-slate-950" />}>
            <PrivacyPolicyPage />
          </Suspense>
        }/>

        {/* --- PROTECTED ROUTES (Main App) --- */}
        <Route path="/*" element={
            <ProtectedRoute>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="clients" element={<ClientsPage />} />
                  <Route path="clients/:clientId" element={<ClientDetailPage />} />
                  <Route path="projects" element={<ProjectsPage />} />
                  <Route path="projects/:projectId" element={<ProjectDetailPage />} />
                  <Route path="time-tracking" element={<TimeTrackingPage />} />
                  <Route path="budgets" element={<BudgetsPage />} />
                  <Route path="proposals" element={<ProposalsPage />} />
                  <Route path="contracts" element={<ContractsPage />} />
                  <Route path="invoices" element={<InvoicesPage />} />
                  <Route path="invoices/create" element={<CreateInvoicePage />} />
                  <Route path="expenses" element={<ExpensesPage />} />
                  <Route path="tax-ledger" element={<TaxLedgerPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="reports/profitability" element={<ProfitabilityReportPage />} />
                  <Route path="forecasting" element={<ForecastingPage />} />
                  <Route path="ai-assistant" element={<AIAssistantPage />} />
                  <Route path="team" element={<TeamManagementDashboard />} />
                  <Route path="my-timesheet" element={<MyTeamTimesheet />} />
                  <Route path="roles" element={<RoleManagement />} />
                  <Route path="knowledge-base" element={<KnowledgeBase />} />
                  <Route path="integrations" element={<IntegrationsManager />} />
                  <Route path="job-market" element={<JobMarketDashboard />} />
                  <Route path="job-market/:jobId" element={<JobDetailPage />} />
                  <Route path="saved-jobs" element={<SavedJobsPage />} />
                  <Route path="my-applications" element={<MyApplicationsPage />} />
                  <Route path="post-job" element={<PostJobForm />} />
                  <Route path="my-job-posts" element={<MyJobPostsPage />} />
                  <Route path="my-job-posts/:jobId/applicants" element={<JobApplicantsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="public-profile" element={<PublicProfilePage />} />
                  <Route path="billing" element={<BillingPage />} />
                  <Route path="templates" element={<TemplatesPage />} />
                  <Route path="affiliate" element={<AffiliateProgramPage />} />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
      <ToastContainer />
    </>
  );
}

export default App;