
import React, { useState, lazy, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAppStore } from './hooks/useAppStore.tsx';
import Sidebar from './components/layout/Sidebar.tsx';
import Header from './components/layout/Header.tsx';
import AuthLayout from './pages/auth/AuthLayout.tsx';
import PortalLayout from './pages/portal/PortalLayout.tsx';
import ToastContainer from './components/ui/Toast.tsx';
import { useToast } from './hooks/useToast.ts';


// Lazy load pages for better performance
const DashboardPage = lazy(() => import('./pages/DashboardPage.tsx'));
const ClientsPage = lazy(() => import('./pages/ClientsPage.tsx'));
const ClientDetailPage = lazy(() => import('./pages/ClientDetailPage.tsx'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage.tsx'));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage.tsx'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage.tsx'));
const CreateInvoicePage = lazy(() => import('./pages/CreateInvoicePage.tsx'));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage.tsx'));
const BudgetsPage = lazy(() => import('./pages/BudgetsPage.tsx'));
const ProposalsPage = lazy(() => import('./pages/ProposalsPage.tsx'));
const ContractsPage = lazy(() => import('./pages/ContractsPage.tsx'));
const TimeTrackingPage = lazy(() => import('./pages/TimeTrackingPage.tsx'));
const ReportsPage = lazy(() => import('./pages/ReportsPage.tsx'));
const TaxLedgerPage = lazy(() => import('./pages/TaxLedgerPage.tsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.tsx'));
const AIAssistantPage = lazy(() => import('./pages/AIAssistantPage.tsx'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage.tsx'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage.tsx'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage.tsx'));
const JobMarketDashboard = lazy(() => import('./pages/JobMarketDashboard.tsx'));
const JobPostForm = lazy(() => import('./pages/JobPostForm.tsx'));
const TeamManagementDashboard = lazy(() => import('./pages/TeamManagementDashboard.tsx'));
const MyTeamTimesheet = lazy(() => import('./pages/MyTeamTimesheet.tsx'));
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase.tsx'));
const IntegrationsManager = lazy(() => import('./pages/IntegrationsManager.tsx'));
const RoleManagement = lazy(() => import('./pages/RoleManagement.tsx'));
const BillingPage = lazy(() => import('./pages/BillingPage.tsx'));
const AffiliateProgramPage = lazy(() => import('./pages/AffiliateProgramPage.tsx'));
const ForecastingPage = lazy(() => import('./pages/ForecastingPage.tsx'));

// Portal Pages
const PortalLoginPage = lazy(() => import('./pages/portal/PortalLoginPage.tsx'));
const PortalDashboardPage = lazy(() => import('./pages/portal/PortalDashboardPage.tsx'));
const PortalInvoiceViewPage = lazy(() => import('./pages/portal/PortalInvoiceViewPage.tsx'));
const PortalBudgetViewPage = lazy(() => import('./pages/portal/PortalBudgetViewPage.tsx'));
const PortalProposalViewPage = lazy(() => import('./pages/portal/PortalProposalViewPage.tsx'));
const PortalContractViewPage = lazy(() => import('./pages/portal/PortalContractViewPage.tsx'));


const MainLayout: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return (
        <div className="flex h-screen bg-gray-950 text-gray-100">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header setSidebarOpen={setSidebarOpen} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-4 sm:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

const PrivateRoute: React.FC = () => {
    const isAuthenticated = useAppStore(state => state.isAuthenticated);
    const profile = useAppStore(state => state.profile);
    return isAuthenticated && profile ? <MainLayout /> : <Navigate to="/auth/login" />;
};

const HandlePaymentRedirects: React.FC = () => {
    const { addToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Stripe success redirect will have search params on the root URL
        const rootParams = new URLSearchParams(window.location.search);
        if (rootParams.get('payment') === 'success') {
            addToast('¡Pago completado con éxito!', 'success');
            // Clean URL by navigating to the current hash path without search params
            navigate(location.pathname, { replace: true });
        }

        // Stripe cancel redirect will have search params inside the hash
        const hashParams = new URLSearchParams(location.search);
        if (hashParams.get('payment') === 'cancelled') {
            addToast('El pago fue cancelado.', 'info');
            // Clean URL
            navigate(location.pathname, { replace: true });
        }
    }, [addToast, navigate, location]);

    return null; // This component doesn't render anything
};


const App: React.FC = () => {
    return (
        <>
            <Router>
                <HandlePaymentRedirects />
                <Routes>
                    {/* Main Application Routes */}
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
                        <Route path="tax-ledger" element={<TaxLedgerPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                        <Route path="ai-assistant" element={<AIAssistantPage />} />
                        <Route path="job-market" element={<JobMarketDashboard />} />
                        <Route path="post-job" element={<JobPostForm />} />
                        <Route path="team" element={<TeamManagementDashboard />} />
                        <Route path="my-timesheet" element={<MyTeamTimesheet />} />
                        <Route path="knowledge-base" element={<KnowledgeBase />} />
                        <Route path="integrations" element={<IntegrationsManager />} />
                        <Route path="roles" element={<RoleManagement />} />
                        <Route path="billing" element={<BillingPage />} />
                        <Route path="affiliate" element={<AffiliateProgramPage />} />
                        <Route path="forecasting" element={<ForecastingPage />} />
                    </Route>

                    {/* Auth Routes */}
                    <Route path="/auth" element={<AuthLayout />}>
                        <Route path="login" element={<LoginPage />} />
                        <Route path="register" element={<RegisterPage />} />
                    </Route>
                    
                    {/* Public Routes */}
                    <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                    
                    {/* Client Portal Routes */}
                    <Route path="/portal" element={<PortalLayout />}>
                        <Route path="login" element={<PortalLoginPage />} />
                        <Route path="dashboard/:clientId" element={<PortalDashboardPage />} />
                        <Route path="invoice/:invoiceId" element={<PortalInvoiceViewPage />} />
                        <Route path="budget/:budgetId" element={<PortalBudgetViewPage />} />
                        <Route path="proposal/:proposalId" element={<PortalProposalViewPage />} />
                        <Route path="contract/:contractId" element={<PortalContractViewPage />} />
                    </Route>

                    {/* Redirect root to dashboard if authenticated, else to login */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Router>
            <ToastContainer />
        </>
    );
};

export default App;