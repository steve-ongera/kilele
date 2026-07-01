from django.urls import path
from . import views

urlpatterns = [

    # ── AUTH ──────────────────────────────────────────────────────────────
    path('auth/request-otp/', views.RequestOTPView.as_view(), name='request-otp'),
    path('auth/verify-otp/', views.VerifyOTPView.as_view(), name='verify-otp'),
    path('auth/refresh/', views.TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),

    # ── DASHBOARD ─────────────────────────────────────────────────────────
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('dashboard/graphs/', views.DashboardGraphsView.as_view(), name='dashboard-graphs'),
    path('tujijenge/reports/summary/', views.TujijengeReportSummaryView.as_view(), name='tujijenge-report-summary'),
    path('rentals/reports/summary/', views.RentalsReportSummaryView.as_view(), name='rentals-report-summary'),
    path('table-banking/reports/summary/', views.TBReportSummaryView.as_view(), name='tb-report-summary'),

    # ── USERS ─────────────────────────────────────────────────────────────
    path('users/', views.UserListCreateView.as_view(), name='user-list'),
    path('users/<uuid:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('users/<uuid:pk>/set-password/', views.UserSetPasswordView.as_view(), name='user-set-password'),

    # ── BRANCHES ──────────────────────────────────────────────────────────
    path('branches/', views.BranchListCreateView.as_view(), name='branch-list'),
    path('branches/<uuid:pk>/', views.BranchDetailView.as_view(), name='branch-detail'),

    # ── SYSTEM RULES ──────────────────────────────────────────────────────
    path('rules/', views.SystemRuleListView.as_view(), name='rule-list'),
    path('rules/<str:key>/', views.SystemRuleUpdateView.as_view(), name='rule-update'),

    # ── MEMBERS ───────────────────────────────────────────────────────────
    path('members/', views.MemberListCreateView.as_view(), name='member-list'),
    path('members/<uuid:pk>/', views.MemberDetailView.as_view(), name='member-detail'),
    path('members/<uuid:pk>/statement/', views.MemberStatementView.as_view(), name='member-statement'),

    # ── CONTRIBUTIONS ─────────────────────────────────────────────────────
    path('contributions/', views.ContributionListCreateView.as_view(), name='contribution-list'),
    path('contributions/<uuid:pk>/', views.ContributionDetailView.as_view(), name='contribution-detail'),

    # ── LOANS ─────────────────────────────────────────────────────────────
    path('loan-products/', views.LoanProductListCreateView.as_view(), name='loan-product-list'),
    path('loans/', views.LoanListCreateView.as_view(), name='loan-list'),
    path('loans/<uuid:pk>/', views.LoanDetailView.as_view(), name='loan-detail'),
    path('loans/<uuid:pk>/approve/', views.LoanApproveView.as_view(), name='loan-approve'),
    path('loans/<uuid:pk>/disburse/', views.LoanDisburseView.as_view(), name='loan-disburse'),

    # ── PENALTIES ─────────────────────────────────────────────────────────
    path('penalties/', views.PenaltyListCreateView.as_view(), name='penalty-list'),
    path('penalties/<uuid:pk>/waive/', views.PenaltyWaiveView.as_view(), name='penalty-waive'),

    # ── DISTRIBUTION ──────────────────────────────────────────────────────
    path('distributions/', views.AnnualDistributionListCreateView.as_view(), name='distribution-list'),
    path('distributions/<uuid:pk>/', views.AnnualDistributionDetailView.as_view(), name='distribution-detail'),

    # ── WEALTH ALLIANCE ───────────────────────────────────────────────────
    path('investors/', views.InvestorListCreateView.as_view(), name='investor-list'),
    path('investors/<uuid:pk>/', views.InvestorDetailView.as_view(), name='investor-detail'),
    path('investments/', views.InvestmentTransactionListCreateView.as_view(), name='investment-list'),
    path('investments/<uuid:pk>/declare-dividend/', views.DividendDeclarationDetailView.as_view(), name='dividend-detail'),
    path('dividends/', views.DividendDeclarationListCreateView.as_view(), name='dividend-list'),
    path('investor-withdrawals/', views.InvestorWithdrawalListCreateView.as_view(), name='investor-withdrawal-list'),

    # ── TABLE BANKING ─────────────────────────────────────────────────────
    path('table-banking/members/', views.TableBankingMemberListView.as_view(), name='tb-member-list'),
    path('table-banking/lending-fund/', views.TableBankingLendingFundView.as_view(), name='tb-lending-fund'),

    # ── RENTALS ───────────────────────────────────────────────────────────
    path('properties/', views.PropertyListCreateView.as_view(), name='property-list'),
    path('properties/<uuid:pk>/', views.PropertyDetailView.as_view(), name='property-detail'),
    path('units/', views.UnitListCreateView.as_view(), name='unit-list'),
    path('units/<uuid:pk>/', views.UnitDetailView.as_view(), name='unit-detail'),
    path('tenants/', views.TenantListCreateView.as_view(), name='tenant-list'),
    path('tenants/<uuid:pk>/', views.TenantDetailView.as_view(), name='tenant-detail'),
    path('leases/', views.LeaseListCreateView.as_view(), name='lease-list'),
    path('leases/<uuid:pk>/', views.LeaseDetailView.as_view(), name='lease-detail'),
    path('rent-collections/', views.RentCollectionListCreateView.as_view(), name='rent-collection-list'),
    path('maintenance/', views.MaintenanceRequestListCreateView.as_view(), name='maintenance-list'),
    path('maintenance/<uuid:pk>/', views.MaintenanceRequestDetailView.as_view(), name='maintenance-detail'),

    # ── MPESA ─────────────────────────────────────────────────────────────
    path('mpesa/callback/', views.MPESACallbackView.as_view(), name='mpesa-callback'),
    path('mpesa/queue/', views.MPESAQueueView.as_view(), name='mpesa-queue'),
    path('mpesa/exceptions/', views.MPESAExceptionView.as_view(), name='mpesa-exceptions'),
    path('mpesa/upload-csv/', views.MPESAUploadView.as_view(), name='mpesa-upload'),
    path('mpesa/allocate/', views.MPESAManualAllocateView.as_view(), name='mpesa-manual-allocate'),

    # ── APPROVALS ─────────────────────────────────────────────────────────
    path('approvals/', views.ApprovalListView.as_view(), name='approval-list'),
    path('approvals/<uuid:pk>/approve/', views.ApprovalApproveView.as_view(), name='approval-approve'),
    path('approvals/<uuid:pk>/reject/', views.ApprovalRejectView.as_view(), name='approval-reject'),

    # ── AUDIT LOG ─────────────────────────────────────────────────────────
    path('audit-logs/', views.AuditLogListView.as_view(), name='audit-log-list'),

    # ── REPORTS ───────────────────────────────────────────────────────────
    path('reports/<str:report_type>/', views.ReportView.as_view(), name='reports'),

    # ── NOTIFICATIONS ─────────────────────────────────────────────────────
    path('notifications/', views.NotificationListView.as_view(), name='notification-list'),
    path('notifications/<uuid:pk>/read/', views.NotificationMarkReadView.as_view(), name='notification-read'),
    path('notifications/read-all/', views.NotificationMarkAllReadView.as_view(), name='notification-read-all'),
]