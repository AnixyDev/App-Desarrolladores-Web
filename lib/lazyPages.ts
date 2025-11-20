
import { lazy } from 'react';

// Main App Pages
export const DashboardPage = lazy(() => import('../pages/DashboardPage'));
export const ClientsPage = lazy(() => import('../pages/ClientsPage'));
export const ClientDetailPage = lazy(() => import('../pages/ClientDetailPage'));
export const ProjectsPage = lazy(() => import('../pages/ProjectsPage'));
export const ProjectDetailPage = lazy(() => import('../pages/ProjectDetailPage'));
export const TimeTrackingPage = lazy(() => import('../pages/TimeTrackingPage'));
export const BudgetsPage = lazy(() => import('../pages/BudgetsPage'));
export const ProposalsPage = lazy(() => import('../pages/ProposalsPage'));
export const ContractsPage = lazy(() => import('../pages/ContractsPage'));
export const InvoicesPage = lazy(() => import('../pages/InvoicesPage'));
export const CreateInvoicePage = lazy(() => import('../pages/CreateInvoicePage'));
export const ExpensesPage = lazy(() => import('../pages/ExpensesPage'));
export const TaxLedgerPage = lazy(() => import('../pages/TaxLedgerPage'));
export const ReportsPage = lazy(() => import('../pages/ReportsPage'));
export const ProfitabilityReportPage = lazy(() => import('../pages/ProfitabilityReportPage'));
export const ForecastingPage = lazy(() => import('../pages/ForecastingPage'));
export const AIAssistantPage = lazy(() => import('../pages/AIAssistantPage'));
export const TeamManagementDashboard = lazy(() => import('../pages/TeamManagementDashboard'));
export const MyTeamTimesheet = lazy(() => import('../pages/MyTeamTimesheet'));
export const RoleManagement = lazy(() => import('../pages/RoleManagement'));
export const KnowledgeBase = lazy(() => import('../pages/KnowledgeBase'));
export const IntegrationsManager = lazy(() => import('../pages/IntegrationsManager'));
export const JobMarketDashboard = lazy(() => import('../pages/JobMarketDashboard'));
export const JobDetailPage = lazy(() => import('../pages/JobDetailPage'));
export const SavedJobsPage = lazy(() => import('../pages/SavedJobsPage'));
export const MyApplicationsPage = lazy(() => import('../pages/MyApplicationsPage'));
export const PostJobForm = lazy(() => import('../pages/JobPostForm'));
export const MyJobPostsPage = lazy(() => import('../pages/MyJobPostsPage'));
export const JobApplicantsPage = lazy(() => import('../pages/JobApplicantsPage'));
export const SettingsPage = lazy(() => import('../pages/SettingsPage'));
export const PublicProfilePage = lazy(() => import('../pages/PublicProfilePage'));
export const BillingPage = lazy(() => import('../pages/BillingPage'));
export const TemplatesPage = lazy(() => import('../pages/TemplatesPage'));
export const AffiliateProgramPage = lazy(() => import('../pages/AffiliateProgramPage'));
export const PrivacyPolicyPage = lazy(() => import('../pages/PrivacyPolicyPage'));

// Portal Pages
export const PortalLayout = lazy(() => import('../pages/portal/PortalLayout'));
export const PortalLoginPage = lazy(() => import('../pages/portal/PortalLoginPage'));
export const PortalDashboardPage = lazy(() => import('../pages/portal/PortalDashboardPage'));
export const PortalInvoiceViewPage = lazy(() => import('../pages/portal/PortalInvoiceViewPage'));
export const PortalBudgetViewPage = lazy(() => import('../pages/portal/PortalBudgetViewPage'));
export const PortalProposalViewPage = lazy(() => import('../pages/portal/PortalProposalViewPage'));
export const PortalContractViewPage = lazy(() => import('../pages/portal/PortalContractViewPage'));
export const PortalProjectFilesPage = lazy(() => import('../pages/portal/PortalProjectFilesPage'));
