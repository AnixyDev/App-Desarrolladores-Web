import React, { useState, Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from './hooks/useAppStore';
import { supabase, isConfigured } from './lib/supabaseClient';

import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import ToastContainer from './components/ui/Toast';
import PageLoader from './components/layout/PageLoader';
import { AlertTriangleIcon } from './components/icons/Icon';
import { useToast } from './hooks/useToast';

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

// Protected Route Guard
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

// Public Route Guard (for Login/Register)
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
  // NOTE: Removed the blocking '!isConfigured' check. 
  // If config is missing, the app will still load the Login screen, giving the user a chance to see the UI.
  // Auth attempts will simply fail if the keys are invalid.

  const { setSession, fetchInitialData, clearUserData, isLoading } = useAppStore();
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    if (!isConfigured) {
        console.error("App initialized with missing Supabase configuration.");
        addToast("Error de configuración: No se ha podido conectar con Supabase.", "error");
    }

    // Initial Session Check
    const initAuth = async () => {
        try {
            useAppStore.setState({ isLoading: true });
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) throw error;

            setSession(session); // Update Zustand store

            if (session?.user) {
                // Clean up OAuth URL hash if present
                if (window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('type=recovery'))) {
                     window.history.replaceState(null, '', window.location.pathname);
                     navigate('/', { replace: true });
                }

                // Fetch app data
                await fetchInitialData(session.user);
            }
        } catch (error) {
            console.error("Auth initialization error:", error);
            clearUserData();
        } finally {
            useAppStore.setState({ isLoading: false });
        }
    };

    initAuth();

    // Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
            setSession(session);
            // Fetch data only if not already loading (prevent double fetch on init)
            if (!useAppStore.getState().profile) {
                 useAppStore.setState({ isLoading: true });
                 await fetchInitialData(session.user);
                 useAppStore.setState({ isLoading: false });
            }
        } else if (event === 'SIGNED_OUT') {
            clearUserData();
            navigate('/auth/login', { replace: true });
        }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [setSession, fetchInitialData, clearUserData, navigate, addToast]);
  

  // If global loading is true (initial check), show loader
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