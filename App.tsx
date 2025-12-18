import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAppStore } from './hooks/useAppStore';
import { useToast } from './hooks/useToast';
import { STRIPE_ITEMS } from './services/stripeService';
import { supabase } from './lib/supabaseClient';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import ToastContainer from './components/ui/Toast';

// Auth & Public
import AuthLayout from './pages/auth/AuthLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfService from './pages/TermsOfService';

// Lazy Loaded Components (Performance optimization)
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ClientsPage = lazy(() => import('./pages/ClientsPage'));
const ClientDetailPage = lazy(() => import('./pages/ClientDetailPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'));
const CreateInvoicePage = lazy(() => import('./pages/CreateInvoicePage'));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'));
const BudgetsPage = lazy(() => import('./pages/BudgetsPage'));
const ProposalsPage = lazy(() => import('./pages/ProposalsPage'));
const ContractsPage = lazy(() => import('./pages/ContractsPage'));
const TimeTrackingPage = lazy(() => import('./pages/TimeTrackingPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const ProfitabilityReportPage = lazy(() => import('./pages/ProfitabilityReportPage'));
const TaxLedgerPage = lazy(() => import('./pages/TaxLedgerPage'));
const AIAssistantPage = lazy(() => import('./pages/AIAssistantPage'));
const JobMarketDashboard = lazy(() => import('./pages/JobMarketDashboard'));
const JobDetailPage = lazy(() => import('./pages/JobDetailPage'));
const JobPostForm = lazy(() => import('./pages/JobPostForm'));
const MyJobPostsPage = lazy(() => import('./pages/MyJobPostsPage'));
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage'));
const MyApplicationsPage = lazy(() => import('./pages/MyApplicationsPage'));
const SavedJobsPage = lazy(() => import('./pages/SavedJobsPage'));
const TeamManagementDashboard = lazy(() => import('./pages/TeamManagementDashboard'));
const MyTeamTimesheet = lazy(() => import('./pages/MyTeamTimesheet'));
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'));
const RoleManagement = lazy(() => import('./pages/RoleManagement'));
const IntegrationsManager = lazy(() => import('./pages/IntegrationsManager'));
const ForecastingPage = lazy(() => import('./pages/ForecastingPage'));
const AffiliateProgramPage = lazy(() => import('./pages/AffiliateProgramPage'));
const BillingPage = lazy(() => import('./pages/BillingPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// Client Portal Pages
const PortalLayout = lazy(() => import('./pages/portal/PortalLayout'));
const PortalLoginPage = lazy(() => import('./pages/portal/PortalLoginPage'));
const PortalDashboardPage = lazy(() => import('./pages/portal/PortalDashboardPage'));
const PortalInvoiceViewPage = lazy(() => import('./pages/portal/PortalInvoiceViewPage'));

const LoadingFallback = () => (
    <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="w-12 h-12 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
    </div>
);

const AuthListener = () => {
    const navigate = useNavigate();
    const { initializeAuth } = useAppStore();
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                if (window.location.hash.includes('access_token')) {
                    window.history.replaceState(null, '', window.location.pathname);
                }
                await initializeAuth();
            }
        });
        return () => subscription.unsubscribe();
    }, [initializeAuth]);
    return null;
};

const PaymentHandler = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { addToast } = useToast();
    const { refreshProfile } = useAppStore();

    useEffect(() => {
        const status = searchParams.get('payment');
        if (status === 'success') {
            refreshProfile().then(() => {
                addToast('¡Pago procesado con éxito! Tu cuenta ha sido actualizada.', 'success');
            });
            searchParams.delete('payment');
            searchParams.delete('item');
            searchParams.delete('session_id');
            setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams, setSearchParams, addToast, refreshProfile]);

    return null;
}

const PrivateRoute = () => {
    const isAuthenticated = useAppStore(state => state.isAuthenticated);
    return isAuthenticated ? <MainLayout /> : <Navigate to="/auth/login" replace />;
};

const MainLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return (
        <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header setSidebarOpen={setSidebarOpen} />
                <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 animate-fade-in">
                    <Suspense fallback={<LoadingFallback />}>
                        <Outlet />
                    </Suspense>
                    {/* Public Footer inside private layout for convenience */}
                    <footer className="mt-12 py-8 border-t border-gray-900 text-center">
                        <div className="flex justify-center gap-6 text-sm text-gray-500">
                             {/* Added missing Link import to fix module errors */}
                             <Link to="/politica-de-privacidad" className="hover:text-gray-300">Privacidad</Link>
                             <Link to="/condiciones-de-servicio" className="hover:text-gray-300">Condiciones</Link>
                             <span>© 2024 DevFreelancer</span>
                        </div>
                    </footer>
                </main>
            </div>
        </div>
    );
};

function App() {
    const { initializeAuth } = useAppStore();
    useEffect(() => { initializeAuth(); }, [initializeAuth]);

    return (
        <GoogleOAuthProvider clientId="457438236235-n2s8q6nvcjm32u0o3ut2lksd8po8gfqf.apps.googleusercontent.com">
            <BrowserRouter>
                <AuthListener />
                <ToastContainer />
                <PaymentHandler />
                <Routes>
                    <Route path="/auth" element={<AuthLayout />}>
                        <Route path="login" element={<LoginPage />} />
                        <Route path="register" element={<RegisterPage />} />
                    </Route>
                    <Route path="/portal" element={<PortalLayout />}>
                        <Route path="login" element={<PortalLoginPage />} />
                        <Route path="dashboard/:clientId" element={<PortalDashboardPage />} />
                        <Route path="invoice/:invoiceId" element={<PortalInvoiceViewPage />} />
                    </Route>
                    <Route path="/politica-de-privacidad" element={<PrivacyPolicyPage />} />
                    <Route path="/condiciones-de-servicio" element={<TermsOfService />} />
                    <Route path="/privacy-policy" element={<Navigate to="/politica-de-privacidad" replace />} />
                    <Route path="/" element={<PrivateRoute />}>
                        <Route index element={<DashboardPage />} />
                        <Route path="clients/*" element={<ClientsPage />} />
                        <Route path="clients/:clientId" element={<ClientDetailPage />} />
                        <Route path="projects" element={<ProjectsPage />} />
                        <Route path="projects/:projectId" element={<ProjectDetailPage />} />
                        <Route path="invoices" element={<InvoicesPage />} />
                        <Route path="invoices/create" element={<CreateInvoicePage />} />
                        <Route path="expenses" element={<ExpensesPage />} />
                        <Route path="budgets" element={<BudgetsPage />} />
                        <Route path="proposals" element={<ProposalsPage />} />
                        <Route path="contracts" element={<ContractsPage />} />
                        <Route path="time-tracking" element={<TimeTrackingPage />} />
                        <Route path="reports" element={<ReportsPage />} />
                        <Route path="reports/profitability" element={<ProfitabilityReportPage />} />
                        <Route path="tax-ledger" element={<TaxLedgerPage />} />
                        <Route path="ai-assistant" element={<AIAssistantPage />} />
                        <Route path="job-market" element={<JobMarketDashboard />} />
                        <Route path="job-market/:jobId" element={<JobDetailPage />} />
                        <Route path="post-job" element={<JobPostForm />} />
                        <Route path="my-job-posts" element={<MyJobPostsPage />} />
                        <Route path="public-profile" element={<PublicProfilePage />} />
                        <Route path="my-applications" element={<MyApplicationsPage />} />
                        <Route path="saved-jobs" element={<SavedJobsPage />} />
                        <Route path="team" element={<TeamManagementDashboard />} />
                        <Route path="my-timesheet" element={<MyTeamTimesheet />} />
                        <Route path="knowledge-base" element={<KnowledgeBase />} />
                        <Route path="roles" element={<RoleManagement />} />
                        <Route path="integrations" element={<IntegrationsManager />} />
                        <Route path="forecasting" element={<ForecastingPage />} />
                        <Route path="affiliate" element={<AffiliateProgramPage />} />
                        <Route path="billing" element={<BillingPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </GoogleOAuthProvider>
    );
}

export default App;