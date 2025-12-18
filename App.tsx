import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAppStore } from './hooks/useAppStore';
import { useToast } from './hooks/useToast';
import { STRIPE_ITEMS } from './services/stripeService';
import { supabase } from './lib/supabaseClient';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import ToastContainer from './components/ui/Toast';

// Layouts
import AuthLayout from './pages/auth/AuthLayout';
import PortalLayout from './pages/portal/PortalLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';

// Main App Pages
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
const JobApplicantsPage = lazy(() => import('./pages/JobApplicantsPage'));
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

// Portal Pages
const PortalLoginPage = lazy(() => import('./pages/portal/PortalLoginPage'));
const PortalDashboardPage = lazy(() => import('./pages/portal/PortalDashboardPage'));
const PortalInvoiceViewPage = lazy(() => import('./pages/portal/PortalInvoiceViewPage'));
const PortalBudgetViewPage = lazy(() => import('./pages/portal/PortalBudgetViewPage'));
const PortalProposalViewPage = lazy(() => import('./pages/portal/PortalProposalViewPage'));
const PortalContractViewPage = lazy(() => import('./pages/portal/PortalContractViewPage'));

const GOOGLE_CLIENT_ID = "457438236235-n2s8q6nvcjm32u0o3ut2lksd8po8gfqf.apps.googleusercontent.com";

/**
 * AuthListener: Gestiona el "handshake" final de la autenticación.
 * Limpia la URL de fragmentos de Google y fuerza la redirección al Dashboard.
 */
const AuthListener = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { initializeAuth } = useAppStore();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`Supabase Auth Event: ${event}`);
            
            if (session) {
                console.log("Sesión activa encontrada:", session.user?.email);
                
                // Si hay un access_token en la URL, lo limpiamos para evitar bucles
                if (window.location.hash.includes('access_token')) {
                    console.log("Limpiando fragmentos de URL de Google...");
                    window.history.replaceState(null, '', window.location.pathname);
                }

                // Si estamos en login o register pero ya tenemos sesión, forzamos salida al dashboard
                if (location.pathname.startsWith('/auth/')) {
                    await initializeAuth();
                    navigate('/', { replace: true });
                }
            }
        });

        // Manejo de errores de OAuth directos en la URL
        const params = new URLSearchParams(window.location.search);
        const error = params.get('error_description') || params.get('error');
        if (error) {
            console.error("Error de Autenticación detectado en URL:", error);
            // Limpiamos la URL de error y nos quedamos en login
            window.history.replaceState(null, '', '/auth/login');
        }

        return () => subscription.unsubscribe();
    }, [navigate, location.pathname, initializeAuth]);

    return null;
};

const PrivateRoute = () => {
    const isAuthenticated = useAppStore(state => state.isAuthenticated);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsCheckingAuth(false), 800);
        return () => clearTimeout(timer);
    }, []);

    if (isCheckingAuth) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-950">
                <div className="w-12 h-12 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
                <p className="mt-4 text-gray-400 font-medium">Cargando aplicación...</p>
            </div>
        );
    }

    return isAuthenticated ? <MainLayout /> : <Navigate to="/auth/login" replace />;
};

const MainLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return (
        <div className="flex h-screen bg-gray-950 text-gray-100">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header setSidebarOpen={setSidebarOpen} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <Suspense fallback={
                        <div className="flex flex-col items-center justify-center h-full min-h-[50vh]">
                            <div className="w-12 h-12 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
                        </div>
                    }>
                        <Outlet />
                    </Suspense>
                </main>
            </div>
        </div>
    );
};

const PaymentHandler = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { addToast } = useToast();
    const { upgradePlan, purchaseCredits, markInvoiceAsPaid } = useAppStore();

    useEffect(() => {
        const paymentStatus = searchParams.get('payment');
        const itemKey = searchParams.get('item') as keyof typeof STRIPE_ITEMS | null;
        const invoiceId = searchParams.get('invoice_id');

        if (paymentStatus === 'success') {
            if (itemKey) {
                const item = STRIPE_ITEMS[itemKey];
                if (item) {
                    if (item.mode === 'subscription') {
                        upgradePlan(itemKey.includes('teams') ? 'Teams' : 'Pro');
                        addToast(`¡Bienvenido al plan ${item.name}!`, 'success');
                    } else if (item.mode === 'payment' && 'credits' in item) {
                        purchaseCredits(item.credits);
                        addToast(`¡Has recargado ${item.credits} créditos con éxito!`, 'success');
                    }
                }
            } else if (invoiceId) {
                markInvoiceAsPaid(invoiceId);
                addToast('¡Factura pagada correctamente!', 'success');
            }
             searchParams.delete('payment');
             searchParams.delete('item');
             searchParams.delete('invoice_id');
             setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams, setSearchParams, addToast, upgradePlan, purchaseCredits, markInvoiceAsPaid]);

    return null;
}

function App() {
    const { isAuthenticated, checkInvoiceStatuses, initializeAuth } = useAppStore();

    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    useEffect(() => {
        if (isAuthenticated) {
            checkInvoiceStatuses();
        }
    }, [isAuthenticated, checkInvoiceStatuses]);

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
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
                        <Route path="budget/:budgetId" element={<PortalBudgetViewPage />} />
                        <Route path="proposal/:proposalId" element={<PortalProposalViewPage />} />
                        <Route path="contract/:contractId" element={<PortalContractViewPage />} />
                    </Route>
                    
                    <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                    
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
                        <Route path="my-job-posts/:jobId/applicants" element={<JobApplicantsPage />} />
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