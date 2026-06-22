from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.utils import timezone
from django.db.models import Sum
from .models import (
    User, OTPToken,
    Branch, SystemRule,
    Member, Contribution, Payment, PaymentAllocation,
    LoanProduct, Loan, LoanRepayment, Penalty,
    AnnualDistribution, DistributionEntry,
    Investor, AssetClass, InvestmentTransaction, DividendDeclaration,
    InvestorDividend, InvestorWithdrawal,
    Property, Unit, Tenant, Lease, RentCollection, MaintenanceRequest,
    MPESATransaction,
    ApprovalRequest,
    AuditLog,
    Notification, NotificationTemplate,
)

admin.site.site_header = "Kilele ERP Administration"
admin.site.site_title = "Kilele ERP"
admin.site.index_title = "Welcome to Kilele ERP"


# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def status_badge(value, color_map):
    """Render a coloured badge for choice fields."""
    color = color_map.get(value, "#6c757d")
    return format_html(
        '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;">{}</span>',
        color, value,
    )


LOAN_STATUS_COLORS = {
    "DRAFT": "#adb5bd", "PENDING": "#fd7e14", "APPROVED": "#0d6efd",
    "DISBURSED": "#6f42c1", "PERFORMING": "#198754", "WATCHLIST": "#ffc107",
    "OVERDUE": "#dc3545", "DEFAULTED": "#6c0000", "CLOSED": "#495057",
    "WRITTEN_OFF": "#212529",
}
APPROVAL_STATUS_COLORS = {
    "DRAFT": "#adb5bd", "PENDING": "#fd7e14", "APPROVED": "#198754",
    "REJECTED": "#dc3545", "POSTED": "#0d6efd",
}
MEMBER_STATUS_COLORS = {
    "ACTIVE": "#198754", "INACTIVE": "#adb5bd", "SUSPENDED": "#fd7e14",
    "EXITED": "#495057", "DECEASED": "#212529",
}
WITHDRAWAL_STATUS_COLORS = {
    "DRAFT": "#adb5bd", "PENDING": "#fd7e14", "UNDER_REVIEW": "#6f42c1",
    "APPROVED": "#198754", "REJECTED": "#dc3545",
    "PROCESSING": "#0d6efd", "PAID": "#20c997", "CLOSED": "#495057",
}
MPESA_CONFIDENCE_COLORS = {
    "AUTO": "#198754", "REVIEW": "#fd7e14", "EXCEPTION": "#dc3545",
}


# ─────────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────────

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ("full_name", "email", "role", "branch", "is_active", "date_joined")
    list_filter   = ("role", "branch", "is_active", "is_staff")
    search_fields = ("full_name", "email", "phone")
    ordering      = ("-date_joined",)
    readonly_fields = ("date_joined", "last_login")

    fieldsets = (
        ("Identity", {"fields": ("email", "full_name", "phone", "password")}),
        ("Role & Branch", {"fields": ("role", "branch")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Timestamps", {"fields": ("date_joined", "last_login")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "full_name", "phone", "role", "branch", "password1", "password2")}),
    )


@admin.register(OTPToken)
class OTPTokenAdmin(admin.ModelAdmin):
    list_display  = ("user", "token", "created_at", "expires_at", "is_used")
    list_filter   = ("is_used",)
    search_fields = ("user__email", "token")
    readonly_fields = ("created_at",)


# ─────────────────────────────────────────────
# BRANCH & RULES
# ─────────────────────────────────────────────

class SystemRuleInline(admin.TabularInline):
    model  = SystemRule
    extra  = 1
    fields = ("key", "value", "data_type", "version", "effective_date", "description")


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display  = ("name", "branch_type", "is_active", "created_at")
    list_filter   = ("branch_type", "is_active")
    search_fields = ("name",)
    inlines       = [SystemRuleInline]

    def logo_preview(self, obj):
        if obj.logo:
            return format_html('<img src="{}" height="40" />', obj.logo.url)
        return "—"
    logo_preview.short_description = "Logo"


@admin.register(SystemRule)
class SystemRuleAdmin(admin.ModelAdmin):
    list_display  = ("branch", "key", "value", "data_type", "version", "effective_date")
    list_filter   = ("branch", "data_type")
    search_fields = ("key", "value")
    ordering      = ("branch", "key", "-version")


# ─────────────────────────────────────────────
# MEMBERS
# ─────────────────────────────────────────────

class ContributionInline(admin.TabularInline):
    model   = Contribution
    extra   = 0
    fields  = ("period_year", "period_month", "expected", "paid", "arrears", "penalty", "status", "due_date")
    readonly_fields = ("arrears",)


class LoanInline(admin.TabularInline):
    model   = Loan
    extra   = 0
    fields  = ("loan_number", "product", "principal", "balance", "status", "disbursement_date")
    readonly_fields = ("loan_number", "balance")
    show_change_link = True


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display  = ("member_number", "full_name", "branch", "phone", "shares", "status_badge_display", "date_joined")
    list_filter   = ("branch", "status")
    search_fields = ("member_number", "full_name", "phone", "email", "id_number")
    ordering      = ("branch", "member_number")
    readonly_fields = ("total_contributions_display", "loan_limit_display")
    inlines       = [ContributionInline, LoanInline]

    fieldsets = (
        ("Identity", {"fields": ("branch", "user", "member_number", "full_name", "phone", "email", "id_number")}),
        ("Membership", {"fields": ("date_joined", "shares", "status", "advance_credit")}),
        ("Computed", {"fields": ("total_contributions_display", "loan_limit_display")}),
    )

    def status_badge_display(self, obj):
        return status_badge(obj.status, MEMBER_STATUS_COLORS)
    status_badge_display.short_description = "Status"

    def total_contributions_display(self, obj):
        return f"KES {obj.total_contributions:,.2f}"
    total_contributions_display.short_description = "Total Contributions"

    def loan_limit_display(self, obj):
        return f"KES {obj.loan_limit:,.2f}"
    loan_limit_display.short_description = "Loan Limit"


@admin.register(Contribution)
class ContributionAdmin(admin.ModelAdmin):
    list_display  = ("member", "period_year", "period_month", "expected", "paid", "arrears", "status", "due_date")
    list_filter   = ("status", "period_year", "member__branch")
    search_fields = ("member__full_name", "member__member_number")
    readonly_fields = ("arrears",)


class PaymentAllocationInline(admin.TabularInline):
    model  = PaymentAllocation
    extra  = 0
    fields = ("sequence", "line_type", "amount", "reference")
    readonly_fields = ("sequence",)


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display  = ("branch", "member", "mpesa_ref", "amount", "payment_date", "is_allocated", "advance_credit")
    list_filter   = ("branch", "is_allocated")
    search_fields = ("mpesa_ref", "member__full_name", "phone")
    ordering      = ("-payment_date",)
    inlines       = [PaymentAllocationInline]


# ─────────────────────────────────────────────
# LOANS
# ─────────────────────────────────────────────

class LoanRepaymentInline(admin.TabularInline):
    model   = LoanRepayment
    extra   = 0
    fields  = ("repayment_date", "principal_paid", "interest_paid", "penalty_paid", "balance_after")
    readonly_fields = ("balance_after",)


@admin.register(LoanProduct)
class LoanProductAdmin(admin.ModelAdmin):
    list_display  = ("name", "branch", "duration_months", "interest_rate", "is_active")
    list_filter   = ("branch", "is_active")
    search_fields = ("name",)


@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display  = (
        "loan_number", "member", "branch", "principal", "balance",
        "loan_status_badge", "approval_status_badge", "disbursement_date", "maturity_date",
    )
    list_filter   = ("branch", "status", "approval_status", "product")
    search_fields = ("loan_number", "member__full_name", "member__member_number")
    ordering      = ("-created_at",)
    readonly_fields = ("interest_amount", "total_repayment", "balance", "monthly_installment")
    inlines       = [LoanRepaymentInline]

    fieldsets = (
        ("Loan Details", {"fields": ("branch", "member", "product", "loan_number", "principal")}),
        ("Calculated Amounts", {"fields": ("interest_amount", "total_repayment", "monthly_installment", "balance")}),
        ("Timeline", {"fields": ("disbursement_date", "maturity_date")}),
        ("Status", {"fields": ("status", "approval_status", "approved_by", "notes")}),
    )

    def loan_status_badge(self, obj):
        return status_badge(obj.status, LOAN_STATUS_COLORS)
    loan_status_badge.short_description = "Loan Status"

    def approval_status_badge(self, obj):
        return status_badge(obj.approval_status, APPROVAL_STATUS_COLORS)
    approval_status_badge.short_description = "Approval"

    actions = ["mark_approved", "mark_disbursed"]

    @admin.action(description="Mark selected loans as Approved")
    def mark_approved(self, request, queryset):
        queryset.update(approval_status="APPROVED", status="APPROVED")

    @admin.action(description="Mark selected loans as Disbursed")
    def mark_disbursed(self, request, queryset):
        queryset.update(status="DISBURSED", disbursement_date=timezone.now().date())


@admin.register(Penalty)
class PenaltyAdmin(admin.ModelAdmin):
    list_display  = ("member", "branch", "penalty_type", "amount", "is_waived", "period_year", "period_month")
    list_filter   = ("branch", "is_waived", "penalty_type")
    search_fields = ("member__full_name", "member__member_number")
    readonly_fields = ("waived_at",)


# ─────────────────────────────────────────────
# ANNUAL DISTRIBUTION
# ─────────────────────────────────────────────

class DistributionEntryInline(admin.TabularInline):
    model   = DistributionEntry
    extra   = 0
    fields  = ("member", "contribution_value", "interest_share", "bonus",
               "outstanding_loans", "penalties", "charges", "net_distribution", "is_eligible")
    readonly_fields = ("net_distribution",)


@admin.register(AnnualDistribution)
class AnnualDistributionAdmin(admin.ModelAdmin):
    list_display  = ("branch", "year", "total_pool", "status", "approved_by")
    list_filter   = ("branch", "status", "year")
    inlines       = [DistributionEntryInline]

    def total_pool_display(self, obj):
        return f"KES {obj.total_pool:,.2f}"
    total_pool_display.short_description = "Total Pool"


# ─────────────────────────────────────────────
# WEALTH ALLIANCE
# ─────────────────────────────────────────────

class InvestmentTransactionInline(admin.TabularInline):
    model   = InvestmentTransaction
    extra   = 0
    fields  = ("transaction_date", "transaction_type", "asset_class", "amount", "approval_status", "reference")
    readonly_fields = ("approval_status",)


@admin.register(Investor)
class InvestorAdmin(admin.ModelAdmin):
    list_display  = ("investor_number", "full_name", "branch", "phone", "status", "join_date", "current_capital_display")
    list_filter   = ("branch", "status")
    search_fields = ("investor_number", "full_name", "phone", "email", "id_number")
    inlines       = [InvestmentTransactionInline]

    def current_capital_display(self, obj):
        return f"KES {obj.current_capital:,.2f}"
    current_capital_display.short_description = "Current Capital"


@admin.register(AssetClass)
class AssetClassAdmin(admin.ModelAdmin):
    list_display  = ("name", "branch", "risk_level", "is_active")
    list_filter   = ("branch", "risk_level", "is_active")


@admin.register(InvestmentTransaction)
class InvestmentTransactionAdmin(admin.ModelAdmin):
    list_display  = ("investor", "branch", "transaction_type", "asset_class", "amount", "transaction_date", "approval_status")
    list_filter   = ("branch", "transaction_type", "approval_status")
    search_fields = ("investor__full_name", "investor__investor_number", "reference")
    ordering      = ("-transaction_date",)


class InvestorDividendInline(admin.TabularInline):
    model   = InvestorDividend
    extra   = 0
    fields  = ("investor", "investor_share_pct", "dividend_amount", "option", "is_processed")


@admin.register(DividendDeclaration)
class DividendDeclarationAdmin(admin.ModelAdmin):
    list_display  = ("branch", "period", "pool_amount", "total_capital", "declaration_date", "status", "approved_by")
    list_filter   = ("branch", "status")
    inlines       = [InvestorDividendInline]


@admin.register(InvestorWithdrawal)
class InvestorWithdrawalAdmin(admin.ModelAdmin):
    list_display  = ("investor", "branch", "withdrawal_type", "amount_requested", "amount_paid",
                     "exit_fee", "charges", "withdrawal_status_badge", "approved_by")
    list_filter   = ("branch", "status", "withdrawal_type")
    search_fields = ("investor__full_name", "investor__investor_number")

    def withdrawal_status_badge(self, obj):
        return status_badge(obj.status, WITHDRAWAL_STATUS_COLORS)
    withdrawal_status_badge.short_description = "Status"


# ─────────────────────────────────────────────
# RENTALS
# ─────────────────────────────────────────────

class UnitInline(admin.TabularInline):
    model   = Unit
    extra   = 1
    fields  = ("unit_number", "unit_type", "monthly_rent", "deposit_amount", "occupancy_status")


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display   = ("property_code", "name", "branch", "property_type", "location",
                      "total_units", "occupancy_rate_display", "status")
    list_filter    = ("branch", "property_type", "status")
    search_fields  = ("property_code", "name", "location")
    readonly_fields = ("occupancy_rate_display",)
    inlines        = [UnitInline]

    def occupancy_rate_display(self, obj):
        rate = obj.occupancy_rate
        color = "#198754" if rate >= 80 else "#fd7e14" if rate >= 50 else "#dc3545"
        return format_html('<span style="color:{}; font-weight:bold;">{:.1f}%</span>', color, rate)
    occupancy_rate_display.short_description = "Occupancy Rate"


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display  = ("__str__", "unit_type", "monthly_rent", "deposit_amount", "occupancy_status", "vacated_date")
    list_filter   = ("occupancy_status", "property__branch")
    search_fields = ("unit_number", "property__name", "property__property_code")


class LeaseInline(admin.TabularInline):
    model   = Lease
    extra   = 0
    fields  = ("unit", "start_date", "end_date", "rent_amount", "deposit", "status")


class RentCollectionInline(admin.TabularInline):
    model   = RentCollection
    extra   = 0
    fields  = ("period_year", "period_month", "expected", "paid", "arrears", "penalty", "payment_date", "mpesa_ref")
    readonly_fields = ("arrears",)


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display  = ("tenant_number", "full_name", "unit", "branch", "phone", "status", "move_in_date", "deposit_paid")
    list_filter   = ("branch", "status")
    search_fields = ("tenant_number", "full_name", "phone", "email", "id_number")
    inlines       = [LeaseInline, RentCollectionInline]


@admin.register(RentCollection)
class RentCollectionAdmin(admin.ModelAdmin):
    list_display  = ("tenant", "unit", "period_year", "period_month", "expected", "paid",
                     "arrears", "penalty", "payment_method", "payment_date")
    list_filter   = ("unit__property__branch", "period_year", "payment_method")
    search_fields = ("tenant__full_name", "mpesa_ref", "unit__unit_number")
    readonly_fields = ("arrears",)


@admin.register(MaintenanceRequest)
class MaintenanceRequestAdmin(admin.ModelAdmin):
    list_display  = ("title", "unit", "tenant", "status", "cost", "contractor", "completion_date")
    list_filter   = ("status", "unit__property__branch")
    search_fields = ("title", "contractor", "unit__unit_number")


# ─────────────────────────────────────────────
# MPESA ENGINE
# ─────────────────────────────────────────────

@admin.register(MPESATransaction)
class MPESATransactionAdmin(admin.ModelAdmin):
    list_display  = (
        "mpesa_ref", "phone", "sender_name", "amount", "transaction_date",
        "branch", "matched_member", "confidence_badge", "is_allocated", "is_duplicate", "is_reversed",
    )
    list_filter   = ("branch", "confidence", "is_allocated", "is_duplicate", "is_reversed")
    search_fields = ("mpesa_ref", "phone", "sender_name", "account_ref", "matched_member__full_name")
    ordering      = ("-transaction_date",)
    readonly_fields = ("raw_payload", "mpesa_ref")

    fieldsets = (
        ("Transaction Info", {"fields": ("mpesa_ref", "phone", "sender_name", "amount", "transaction_date", "account_ref")}),
        ("Routing", {"fields": ("branch", "matched_member", "confidence", "allocation_notes")}),
        ("Flags", {"fields": ("is_allocated", "is_duplicate", "is_reversed")}),
        ("Raw Data", {"fields": ("raw_payload",), "classes": ("collapse",)}),
    )

    def confidence_badge(self, obj):
        return status_badge(obj.confidence, MPESA_CONFIDENCE_COLORS)
    confidence_badge.short_description = "Confidence"

    actions = ["mark_exception", "mark_review"]

    @admin.action(description="Move selected to Exception Queue")
    def mark_exception(self, request, queryset):
        queryset.update(confidence="EXCEPTION")

    @admin.action(description="Move selected to Review Queue")
    def mark_review(self, request, queryset):
        queryset.update(confidence="REVIEW")


# ─────────────────────────────────────────────
# APPROVAL ENGINE
# ─────────────────────────────────────────────

@admin.register(ApprovalRequest)
class ApprovalRequestAdmin(admin.ModelAdmin):
    list_display  = ("action_type", "branch", "requested_by", "reviewed_by", "approval_status_badge", "reviewed_at")
    list_filter   = ("branch", "status", "action_type")
    search_fields = ("requested_by__email", "reviewed_by__email", "reference_model")
    readonly_fields = ("reviewed_at", "payload")

    def approval_status_badge(self, obj):
        return status_badge(obj.status, APPROVAL_STATUS_COLORS)
    approval_status_badge.short_description = "Status"

    actions = ["approve_requests", "reject_requests"]

    @admin.action(description="Approve selected requests")
    def approve_requests(self, request, queryset):
        queryset.update(status="APPROVED", reviewed_by=request.user, reviewed_at=timezone.now())

    @admin.action(description="Reject selected requests")
    def reject_requests(self, request, queryset):
        queryset.update(status="REJECTED", reviewed_by=request.user, reviewed_at=timezone.now())


# ─────────────────────────────────────────────
# AUDIT ENGINE
# ─────────────────────────────────────────────

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display  = ("timestamp", "user", "role", "branch", "action", "model_name", "object_id", "ip_address")
    list_filter   = ("branch", "role", "model_name")
    search_fields = ("user__email", "action", "model_name", "object_id", "ip_address")
    ordering      = ("-timestamp",)
    readonly_fields = (
        "user", "role", "branch", "action", "model_name", "object_id",
        "old_value", "new_value", "reason", "ip_address", "device", "timestamp", "approval_ref",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser


# ─────────────────────────────────────────────
# NOTIFICATIONS
# ─────────────────────────────────────────────

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display  = ("user", "title", "channel", "is_sent", "is_read", "sent_at")
    list_filter   = ("channel", "is_sent", "is_read")
    search_fields = ("user__email", "title")
    ordering      = ("-created_at",)

    actions = ["mark_as_sent"]

    @admin.action(description="Mark selected notifications as sent")
    def mark_as_sent(self, request, queryset):
        queryset.update(is_sent=True, sent_at=timezone.now())


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display  = ("event_type", "branch", "channel", "subject", "is_active")
    list_filter   = ("branch", "channel", "is_active")
    search_fields = ("event_type", "subject")