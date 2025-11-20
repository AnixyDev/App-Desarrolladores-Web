
import React, { useEffect, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAppStore } from './hooks/useAppStore';
import { supabase } from './lib/supabaseClient';

import ToastContainer from './components/ui/Toast';
import PageLoader from './components/layout/PageLoader';
import { useToast } from './hooks/useToast';

// Layouts & Guards
import MainLayout from './components/layout/MainLayout';
import { ProtectedRoute, PublicRoute } from './components/auth/RouteGuards';

// Static imports for critical Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AuthLayout from './pages/auth/AuthLayout';

// Lazy Pages
import * as Pages from './lib/lazyPages';

function App() {
  const { setSession, fetchInitialData, clearUserData, isLoading } = useAppStore();
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    // Initial Session Check
    const initAuth = async () => {
        try {
            useAppStore.setState({ isLoading: true });
            
            // Check session - this is fast
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;

            if (session?.user) {
                setSession(session); // Update Zustand store
                
                // Clean up OAuth URL hash if present
                if (window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('type=recovery'))) {
                     window.history.replaceState(null, '', window.location.pathname);
                     navigate('/', { replace: true });
                }

                // CRITICAL OPTIMIZATION:
                // Release the loading state *IMMEDIATELY* so the Dashboard structure renders.
                useAppStore.setState({ isLoading: false });

                // Fetch app data in background (Hydration)
                fetchInitialData(session.user).catch(console.error);
            } else {
                // No session, stop loading immediately to show Login page
                useAppStore.setState({ isLoading: false });
            }

        } catch (error) {
            console.error("Auth initialization error:", error);
            clearUserData();
            useAppStore.setState({ isLoading: false });
        }
    };

    initAuth();

    // Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
            setSession(session);
            useAppStore.setState({ isLoading: false });
            
            if (!useAppStore.getState().profile) {
                 await fetchInitialData(session.user);
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
  
  if (isLoading) {
      return <div className="h-screen w-screen bg-[#020617] flex items-center justify-center"><PageLoader /></div>;
  }

  return (
    <>
      <Routes>
        {/* --- PUBLIC ROUTES (Auth) --- */}
        <Route path="/auth/*" element={
          <PublicRoute>
            <AuthLayout>
                <Routes>
                    <Route path="login" element={<LoginPage />} />
                    <Route path="register" element={<RegisterPage />} />
                    <Route path="*" element={<Navigate to="login" replace />} />
                </Routes>
            </AuthLayout>
          </PublicRoute>
        } />

        {/* --- PORTAL ROUTES (Public/Semi-private) --- */}
        <Route path="/portal/*" element={
          <Suspense fallback={<div className="h-screen w-screen bg-slate-900 flex items-center justify-center text-gray-500">Cargando portal...</div>}>
            <Pages.PortalLayout>
              <Routes>
                <Route path="login" element={<Pages.PortalLoginPage />} />
                <Route path="dashboard/:clientId" element={<Pages.PortalDashboardPage />} />
                <Route path="invoice/:invoiceId" element={<Pages.PortalInvoiceViewPage />} />
                <Route path="budget/:budgetId" element={<Pages.PortalBudgetViewPage />} />
                <Route path="proposal/:proposalId" element={<Pages.PortalProposalViewPage />} />
                <Route path="contract/:contractId" element={<Pages.PortalContractViewPage />} />
                <Route path="project/:projectId/files" element={<Pages.PortalProjectFilesPage />} />
                <Route path="*" element={<Navigate to="login" replace />} />
              </Routes>
            </Pages.PortalLayout>
          </Suspense>
        } />
        
        <Route path="/privacy-policy" element={
          <Suspense fallback={<div className="h-screen w-screen bg-slate-950" />}>
            <Pages.PrivacyPolicyPage />
          </Suspense>
        }/>

        {/* --- PROTECTED ROUTES (Main App) --- */}
        <Route element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
        }>
            <Route path="/" element={<Pages.DashboardPage />} />
            
            <Route path="clients">
                <Route index element={<Pages.ClientsPage />} />
                <Route path=":clientId" element={<Pages.ClientDetailPage />} />
            </Route>

            <Route path="projects">
                <Route index element={<Pages.ProjectsPage />} />
                <Route path=":projectId" element={<Pages.ProjectDetailPage />} />
            </Route>

            <Route path="time-tracking" element={<Pages.TimeTrackingPage />} />
            <Route path="budgets" element={<Pages.BudgetsPage />} />
            <Route path="proposals" element={<Pages.ProposalsPage />} />
            <Route path="contracts" element={<Pages.ContractsPage />} />
            
            <Route path="invoices">
                <Route index element={<Pages.InvoicesPage />} />
                <Route path="create" element={<Pages.CreateInvoicePage />} />
            </Route>

            <Route path="expenses" element={<Pages.ExpensesPage />} />
            <Route path="tax-ledger" element={<Pages.TaxLedgerPage />} />
            
            <Route path="reports">
                <Route index element={<Pages.ReportsPage />} />
                <Route path="profitability" element={<Pages.ProfitabilityReportPage />} />
            </Route>

            <Route path="forecasting" element={<Pages.ForecastingPage />} />
            <Route path="ai-assistant" element={<Pages.AIAssistantPage />} />
            <Route path="team" element={<Pages.TeamManagementDashboard />} />
            <Route path="my-timesheet" element={<Pages.MyTeamTimesheet />} />
            <Route path="roles" element={<Pages.RoleManagement />} />
            <Route path="knowledge-base" element={<Pages.KnowledgeBase />} />
            <Route path="integrations" element={<Pages.IntegrationsManager />} />
            
            <Route path="job-market">
                <Route index element={<Pages.JobMarketDashboard />} />
                <Route path=":jobId" element={<Pages.JobDetailPage />} />
            </Route>

            <Route path="saved-jobs" element={<Pages.SavedJobsPage />} />
            <Route path="my-applications" element={<Pages.MyApplicationsPage />} />
            <Route path="post-job" element={<Pages.PostJobForm />} />
            
            <Route path="my-job-posts">
                <Route index element={<Pages.MyJobPostsPage />} />
                <Route path=":jobId/applicants" element={<Pages.JobApplicantsPage />} />
            </Route>

            <Route path="settings" element={<Pages.SettingsPage />} />
            <Route path="public-profile" element={<Pages.PublicProfilePage />} />
            <Route path="billing" element={<Pages.BillingPage />} />
            <Route path="templates" element={<Pages.TemplatesPage />} />
            <Route path="affiliate" element={<Pages.AffiliateProgramPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <ToastContainer />
    </>
  );
}

export default App;
