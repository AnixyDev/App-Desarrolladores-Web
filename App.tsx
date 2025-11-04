

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useSearchParams } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAppStore } from './hooks/useAppStore';
import { useToast } from './hooks/useToast';
import { STRIPE_ITEMS } from './services/stripeService';
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


const GOOGLE_CLIENT_ID = "102738470388-s392h3093q9j7q3j9q3j9q3j9q3j9q3j.apps.googleusercontent.com"; // Placeholder Client ID

// FIX: Refactored PrivateRoute to be a self-contained layout route element, resolving a 'children' prop error.
const PrivateRoute = () => {
    const isAuthenticated = useAppStore(state => state.isAuthenticated);
    return isAuthenticated ? <MainLayout /> : <Navigate to="/auth/login" />;
};

const MainLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return (
        <div className="flex h-screen bg-gray-950 text-gray-100">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header setSidebarOpen={setSidebarOpen} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <Suspense fallback={<div className="text-center p-8">Cargando página...</div>}>
                        <Outlet />
                    </Suspense>
                </main>
            </div>
        </div>
    );
};

const PaymentHandler = () => {
    const [searchParams] = useSearchParams();
    const { addToast } = useToast();
    const { upgradePlan, purchaseCredits } = useAppStore();

    useEffect(() => {
        const paymentStatus = searchParams.get('payment');
        const itemKey = searchParams.get('item') as keyof typeof STRIPE_ITEMS | null;

        if (paymentStatus === 'success' && itemKey) {
            const item = STRIPE_ITEMS[itemKey];
            if (item) {
                if (item.mode === 'subscription') {
                    if (itemKey === 'proPlan') {
                        upgradePlan('Pro');
                        addToast('¡Felicidades! Has actualizado al Plan Pro.', 'success');
                    } else if (itemKey.includes('teams')) {
                        upgradePlan('Teams');
                        addToast('¡Bienvenido a Teams! Ya puedes invitar a tu equipo.', 'success');
                    }
                } else if (item.mode === 'payment' && 'credits' in item) {
                    purchaseCredits(item.credits);
                    addToast(`¡Has comprado ${item.credits} créditos de IA!`, 'success');
                } else if (itemKey === 'featuredJobPost') {
                    addToast('¡Tu oferta ha sido destacada y publicada con éxito!', 'success');
                }
            }
        } else if (paymentStatus === 'cancelled') {
            addToast('El proceso de pago fue cancelado.', 'info');
        }
        // This effect should only run once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}


function App() {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <HashRouter>
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
                        
                        <Route path="*" element={<Navigate to="/" />} />
                    </Route>
                </Routes>
            </HashRouter>
        </GoogleOAuthProvider>
    );
}

export default App;