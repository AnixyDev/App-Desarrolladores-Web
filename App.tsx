import React, { useState, useEffect, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAppStore } from './hooks/useAppStore';
import { supabase } from './lib/supabaseClient';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import ToastContainer from './components/ui/Toast';
import CookieBanner from './components/ui/CookieBanner';

// Auth & Public
import AuthLayout from './pages/auth/AuthLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfService from './pages/TermsOfService';

// Lazy Loaded Components
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
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

const PortalLayout = lazy(() => import('./pages/portal/PortalLayout'));
const PortalLoginPage = lazy(() => import('./pages/portal/PortalLoginPage'));
const PortalDashboardPage = lazy(() => import('./pages/portal/PortalDashboardPage'));
const PortalInvoiceViewPage = lazy(() => import('./pages/portal/PortalInvoiceViewPage'));

const LoadingFallback = () => (
    <div className="flex h-screen w-full items-center justify-center bg-gray-950">
        <div className="relative flex flex-col items-center">
            <div className="w-8 h-8 border-[2px] border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
            <div className="absolute top-0 w-8 h-8 border-[2px] border-transparent border-b-purple-500 rounded-full animate-spin-slow"></div>
        </div>
    </div>
);

const AuthListener = () => {
    const { refreshProfile } = useAppStore();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
                await refreshProfile();
                if (location.pathname.startsWith('/auth/')) {
                    navigate('/', { replace: true });
                }
            } else if (event === 'SIGNED_OUT') {
                navigate('/auth/login', { replace: true });
            }
        });
        return () => subscription.unsubscribe();
    }, [refreshProfile, navigate, location.pathname]);

    return null;
};

const PrivateRoute = () => {
    const { isAuthenticated, isProfileLoading } = useAppStore();
    if (isProfileLoading) return <LoadingFallback />;
    return isAuthenticated ? <MainLayout /> : <Navigate to="/auth/login" replace />;
};

const AdminRoute = () => {
    const { isAuthenticated, profile, isProfileLoading } = useAppStore();
    if (isProfileLoading) return <LoadingFallback />;
    
    const isAdmin = profile?.role?.toLowerCase() === 'admin';
    if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
    if (!isAdmin) return <Navigate to="/" replace />;
    
    return <Outlet />;
};

const MainLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return (
        <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden font-sans selection:bg-primary-500/30">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header setSidebarOpen={setSidebarOpen} />
                <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 animate-fade-in">
                    <Suspense fallback={<LoadingFallback />}>
                        <Outlet />
                    </Suspense>
                    <footer className="mt-12 py-8 border-t border-gray-900/50 text-center">
                        <div className="flex justify-center gap-8 text-[11px] font-bold uppercase tracking-widest text-gray-600">
                             <Link to="/politica-de-privacidad" className="hover:text-primary-400 transition-colors">Privacidad</Link>
                             <Link to="/condiciones-de-servicio" className="hover:text-primary-400 transition-colors">Condiciones</Link>
                             <span className="cursor-default">© 2025 DevFreelancer</span>
                        </div>
                    </footer>
                </main>
            </div>
        </div>
    );
};

function App() {
    const { initializeAuth } = useAppStore();
    
    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    return (
        <GoogleOAuthProvider clientId="457438236235-n2s8q6nvcjm32u0o3ut2lksd8po8gfqf.apps.googleusercontent.com">
            <HashRouter>
                <AuthListener />
                <ToastContainer />
                <CookieBanner />
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
                    
                    <Route path="/" element={<PrivateRoute />}>
                        <Route index element={<DashboardPage />} />
                        <Route path="clients" element={<ClientsPage />} />
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

                        <Route path="admin" element={<AdminRoute />}>
                            <Route index element={<AdminDashboard />} />
                        </Route>
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </HashRouter>
            <style>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(-360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 2s linear infinite;
                }
            `}</style>
        </GoogleOAuthProvider>
    );
}

export default App;