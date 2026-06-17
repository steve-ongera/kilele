from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.db.models import Sum
from .models import (
    User, OTPToken, Branch, SystemRule,
    Member, Contribution, Payment, PaymentAllocation,
    LoanProduct, Loan, LoanRepayment, Penalty,
    AnnualDistribution, DistributionEntry,
    Investor, AssetClass, InvestmentTransaction,
    DividendDeclaration, InvestorDividend, InvestorWithdrawal,
    Property, Unit, Tenant, Lease, RentCollection, MaintenanceRequest,
    MPESATransaction, ApprovalRequest, AuditLog,
    Notification, NotificationTemplate,
)


# ─────────────────────────────────────────────
# ADMIN SITE BRANDING
# ─────────────────────────────────────────────

admin.site.site_header = 'Kilele Ridge Group'
admin.site.site_title = 'Kilele Ridge Admin'
admin.site.index_title = 'Platform Administration'


# ─────────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────────

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'full_name', 'role', 'branch', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active', 'branch']
    search_fields = ['email', 'full_name', 'phone']
    ordering = ['-date_joined']
    readonly_fields = ['date_joined', 'last_login']

    fieldsets = (
        ('Account', {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('full_name', 'phone')}),
        ('Role & Branch', {'fields': ('role', 'branch')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Timestamps', {'fields': ('date_joined', 'last_login'), 'classes': ('collapse',)}),
    )
    add_fieldsets = (
        ('Create User', {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'phone', 'role', 'branch', 'password1', 'password2'),
        }),
    )


@admin.register(OTPToken)
class OTPTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'token', 'created_at', 'expires_at', 'is_used']
    list_filter = ['is_used']
    search_fields = ['user__email']
    readonly_fields = ['created_at']


# ─────────────────────────────────────────────
# BRANCH & RULES
# ─────────────────────────────────────────────

@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ['name', 'branch_type', 'is_active', 'member_count', 'created_at']
    list_filter = ['branch_type', 'is_active']
    search_fields = ['name']
    readonly_fields = ['created_at', 'updated_at']

    def member_count(self, obj):
        return obj.members.filter(is_active=True).count()
    member_count.short_description = 'Active Members'


@admin.register(SystemRule)
class SystemRuleAdmin(admin.ModelAdmin):
    list_display = ['key', 'branch', 'value', 'data_type', 'version', 'effective_date']
    list_filter = ['branch', 'data_type']
    search_fields = ['key', 'description']
    readonly_fields = ['version', 'created_at', 'updated_at']
    ordering = ['branch', 'key', '-version']


# ─────────────────────────────────────────────
# MEMBERS
# ─────────────────────────────────────────────

class ContributionInline(admin.TabularInline):
    model = Contribution
    extra = 0
    fields = ['period_year', 'period_month', 'expected', 'paid', 'arrears', 'status', 'due_date']
    readonly_fields = ['arrears']
    ordering = ['-period_year', '-period_month']
    show_change_link = True


class LoanInline(admin.TabularInline):
    model = Loan
    extra = 0
    fields = ['loan_number', 'principal', 'balance', 'status', 'disbursement_date']
    readonly_fields = ['loan_number', 'balance']
    show_change_link = True


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = [
        'member_number', 'full_name', 'branch', 'phone',
        'shares', 'status', 'total_contributions_display', 'date_joined',
    ]
    list_filter = ['branch', 'status', 'shares']
    search_fields = ['member_number', 'full_name', 'phone', 'email', 'id_number']
    readonly_fields = ['member_number', 'created_at', 'updated_at', 'total_contributions_display', 'loan_limit_display']
    ordering = ['-date_joined']
    inlines = [ContributionInline, LoanInline]

    fieldsets = (
        ('Identity', {'fields': ('member_number', 'branch', 'user', 'full_name', 'phone', 'email', 'id_number')}),
        ('Membership', {'fields': ('date_joined', 'shares', 'status', 'advance_credit')}),
        ('Computed', {'fields': ('total_contributions_display', 'loan_limit_display'), 'classes': ('collapse',)}),
        ('Meta', {'fields': ('created_at', 'updated_at', 'created_by', 'is_active'), 'classes': ('collapse',)}),
    )

    def total_contributions_display(self, obj):
        return f'KES {obj.total_contributions:,.2f}'
    total_contributions_display.short_description = 'Total Contributions'

    def loan_limit_display(self, obj):
        return f'KES {obj.loan_limit:,.2f}'
    loan_limit_display.short_description = 'Loan Limit'


@admin.register(Contribution)
class ContributionAdmin(admin.ModelAdmin):
    list_display = ['member', 'period_year', 'period_month', 'expected', 'paid', 'arrears', 'status']
    list_filter = ['status', 'period_year', 'period_month', 'member__branch']
    search_fields = ['member__full_name', 'member__member_number']
    readonly_fields = ['arrears', 'created_at', 'updated_at']
    ordering = ['-period_year', '-period_month']


class PaymentAllocationInline(admin.TabularInline):
    model = PaymentAllocation
    extra = 0
    fields = ['sequence', 'line_type', 'amount', 'reference']
    readonly_fields = ['sequence', 'line_type', 'amount', 'reference']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['mpesa_ref', 'member', 'amount', 'payment_date', 'is_allocated', 'advance_credit']
    list_filter = ['is_allocated', 'branch']
    search_fields = ['mpesa_ref', 'member__full_name', 'phone']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [PaymentAllocationInline]


# ─────────────────────────────────────────────
# LOANS
# ─────────────────────────────────────────────

class LoanRepaymentInline(admin.TabularInline):
    model = LoanRepayment
    extra = 0
    fields = ['repayment_date', 'principal_paid', 'interest_paid', 'penalty_paid', 'balance_after']
    readonly_fields = ['balance_after']


@admin.register(LoanProduct)
class LoanProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'branch', 'duration_months', 'interest_rate', 'is_active']
    list_filter = ['branch', 'is_active']
    search_fields = ['name']


@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = [
        'loan_number', 'member', 'product', 'principal', 'balance',
        'status', 'approval_status', 'disbursement_date',
    ]
    list_filter = ['status', 'approval_status', 'branch']
    search_fields = ['loan_number', 'member__full_name', 'member__member_number']
    readonly_fields = [
        'loan_number', 'interest_amount', 'total_repayment',
        'balance', 'monthly_installment', 'created_at', 'updated_at',
    ]
    ordering = ['-created_at']
    inlines = [LoanRepaymentInline]

    fieldsets = (
        ('Loan Info', {'fields': ('loan_number', 'branch', 'member', 'product', 'principal')}),
        ('Computed', {'fields': ('interest_amount', 'total_repayment', 'balance', 'monthly_installment')}),
        ('Schedule', {'fields': ('disbursement_date', 'maturity_date')}),
        ('Status', {'fields': ('status', 'approval_status', 'approved_by', 'notes')}),
        ('Meta', {'fields': ('created_at', 'updated_at', 'created_by', 'is_active'), 'classes': ('collapse',)}),
    )


@admin.register(Penalty)
class PenaltyAdmin(admin.ModelAdmin):
    list_display = ['member', 'penalty_type', 'amount', 'is_waived', 'period_year', 'period_month']
    list_filter = ['is_waived', 'penalty_type', 'branch']
    search_fields = ['member__full_name', 'member__member_number']
    readonly_fields = ['waived_at', 'created_at', 'updated_at']


# ─────────────────────────────────────────────
# ANNUAL DISTRIBUTION
# ─────────────────────────────────────────────

class DistributionEntryInline(admin.TabularInline):
    model = DistributionEntry
    extra = 0
    fields = [
        'member', 'contribution_value', 'interest_share',
        'outstanding_loans', 'penalties', 'net_distribution',
        'is_eligible', 'ineligibility_reason',
    ]
    readonly_fields = ['net_distribution']
    show_change_link = True


@admin.register(AnnualDistribution)
class AnnualDistributionAdmin(admin.ModelAdmin):
    list_display = ['branch', 'year', 'total_pool', 'status', 'approved_by']
    list_filter = ['branch', 'status', 'year']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [DistributionEntryInline]


# ─────────────────────────────────────────────
# WEALTH ALLIANCE
# ─────────────────────────────────────────────

class InvestmentTransactionInline(admin.TabularInline):
    model = InvestmentTransaction
    extra = 0
    fields = ['transaction_type', 'amount', 'transaction_date', 'approval_status', 'reference']
    show_change_link = True


@admin.register(AssetClass)
class AssetClassAdmin(admin.ModelAdmin):
    list_display = ['name', 'branch', 'risk_level', 'is_active']
    list_filter = ['branch', 'risk_level', 'is_active']


@admin.register(Investor)
class InvestorAdmin(admin.ModelAdmin):
    list_display = [
        'investor_number', 'full_name', 'branch', 'phone',
        'status', 'join_date', 'current_capital_display',
    ]
    list_filter = ['branch', 'status']
    search_fields = ['investor_number', 'full_name', 'phone', 'email']
    readonly_fields = ['investor_number', 'created_at', 'updated_at', 'current_capital_display']
    inlines = [InvestmentTransactionInline]

    def current_capital_display(self, obj):
        return f'KES {obj.current_capital:,.2f}'
    current_capital_display.short_description = 'Current Capital'


@admin.register(InvestmentTransaction)
class InvestmentTransactionAdmin(admin.ModelAdmin):
    list_display = ['investor', 'transaction_type', 'amount', 'transaction_date', 'approval_status']
    list_filter = ['transaction_type', 'approval_status', 'branch']
    search_fields = ['investor__full_name', 'investor__investor_number', 'reference']
    readonly_fields = ['created_at', 'updated_at']


class InvestorDividendInline(admin.TabularInline):
    model = InvestorDividend
    extra = 0
    fields = ['investor', 'investor_share_pct', 'dividend_amount', 'option', 'is_processed']
    readonly_fields = ['investor_share_pct', 'dividend_amount']


@admin.register(DividendDeclaration)
class DividendDeclarationAdmin(admin.ModelAdmin):
    list_display = ['branch', 'period', 'pool_amount', 'total_capital', 'status', 'declaration_date']
    list_filter = ['branch', 'status']
    readonly_fields = ['total_capital', 'created_at', 'updated_at']
    inlines = [InvestorDividendInline]


@admin.register(InvestorWithdrawal)
class InvestorWithdrawalAdmin(admin.ModelAdmin):
    list_display = ['investor', 'withdrawal_type', 'amount_requested', 'amount_paid', 'status']
    list_filter = ['status', 'withdrawal_type', 'branch']
    search_fields = ['investor__full_name', 'investor__investor_number']
    readonly_fields = ['created_at', 'updated_at']


# ─────────────────────────────────────────────
# RENTALS
# ─────────────────────────────────────────────

class UnitInline(admin.TabularInline):
    model = Unit
    extra = 0
    fields = ['unit_number', 'unit_type', 'monthly_rent', 'deposit_amount', 'occupancy_status']
    show_change_link = True


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = [
        'property_code', 'name', 'branch', 'property_type',
        'location', 'total_units', 'status', 'occupancy_rate_display',
    ]
    list_filter = ['branch', 'property_type', 'status']
    search_fields = ['property_code', 'name', 'location']
    readonly_fields = ['property_code', 'occupancy_rate_display', 'created_at', 'updated_at']
    inlines = [UnitInline]

    def occupancy_rate_display(self, obj):
        rate = obj.occupancy_rate
        color = 'green' if rate >= 80 else 'orange' if rate >= 50 else 'red'
        return format_html('<span style="color:{}">{:.1f}%</span>', color, rate)
    occupancy_rate_display.short_description = 'Occupancy Rate'


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ['unit_number', 'property', 'unit_type', 'monthly_rent', 'occupancy_status']
    list_filter = ['occupancy_status', 'property__branch']
    search_fields = ['unit_number', 'property__name', 'property__property_code']
    readonly_fields = ['created_at', 'updated_at']


class LeaseInline(admin.TabularInline):
    model = Lease
    extra = 0
    fields = ['unit', 'start_date', 'end_date', 'rent_amount', 'status']
    show_change_link = True


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ['tenant_number', 'full_name', 'branch', 'phone', 'unit', 'status', 'move_in_date']
    list_filter = ['branch', 'status']
    search_fields = ['tenant_number', 'full_name', 'phone', 'email', 'id_number']
    readonly_fields = ['tenant_number', 'created_at', 'updated_at']
    inlines = [LeaseInline]


@admin.register(Lease)
class LeaseAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'unit', 'start_date', 'end_date', 'rent_amount', 'status']
    list_filter = ['status']
    search_fields = ['tenant__full_name', 'unit__unit_number']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(RentCollection)
class RentCollectionAdmin(admin.ModelAdmin):
    list_display = [
        'tenant', 'unit', 'period_year', 'period_month',
        'expected', 'paid', 'arrears', 'payment_method',
    ]
    list_filter = ['period_year', 'period_month', 'payment_method']
    search_fields = ['tenant__full_name', 'mpesa_ref', 'unit__unit_number']
    readonly_fields = ['arrears', 'created_at', 'updated_at']


@admin.register(MaintenanceRequest)
class MaintenanceRequestAdmin(admin.ModelAdmin):
    list_display = ['title', 'unit', 'tenant', 'status', 'cost', 'contractor', 'completion_date']
    list_filter = ['status', 'unit__property__branch']
    search_fields = ['title', 'unit__unit_number', 'tenant__full_name', 'contractor']
    readonly_fields = ['created_at', 'updated_at']


# ─────────────────────────────────────────────
# MPESA ENGINE
# ─────────────────────────────────────────────

@admin.register(MPESATransaction)
class MPESATransactionAdmin(admin.ModelAdmin):
    list_display = [
        'mpesa_ref', 'phone', 'amount', 'sender_name',
        'confidence', 'matched_member', 'is_allocated', 'transaction_date',
    ]
    list_filter = ['confidence', 'is_allocated', 'is_duplicate', 'is_reversed', 'branch']
    search_fields = ['mpesa_ref', 'phone', 'sender_name', 'account_ref']
    readonly_fields = ['created_at', 'updated_at', 'raw_payload']
    ordering = ['-transaction_date']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('matched_member', 'branch')


# ─────────────────────────────────────────────
# APPROVALS
# ─────────────────────────────────────────────

@admin.register(ApprovalRequest)
class ApprovalRequestAdmin(admin.ModelAdmin):
    list_display = [
        'action_type', 'branch', 'requested_by', 'status',
        'reviewed_by', 'reviewed_at', 'created_at',
    ]
    list_filter = ['status', 'action_type', 'branch']
    search_fields = ['requested_by__full_name', 'reason']
    readonly_fields = ['reviewed_at', 'created_at', 'updated_at', 'payload']
    ordering = ['-created_at']


# ─────────────────────────────────────────────
# AUDIT LOG
# ─────────────────────────────────────────────

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['action', 'model_name', 'user', 'role', 'branch', 'ip_address', 'timestamp']
    list_filter = ['action', 'model_name', 'role', 'branch']
    search_fields = ['action', 'user__full_name', 'object_id', 'ip_address']
    readonly_fields = [
        'id', 'user', 'role', 'branch', 'action', 'model_name', 'object_id',
        'old_value', 'new_value', 'reason', 'ip_address', 'device',
        'timestamp', 'approval_ref',
    ]
    ordering = ['-timestamp']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


# ─────────────────────────────────────────────
# NOTIFICATIONS
# ─────────────────────────────────────────────

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'channel', 'is_read', 'is_sent', 'sent_at', 'created_at']
    list_filter = ['channel', 'is_read', 'is_sent']
    search_fields = ['user__full_name', 'title', 'message']
    readonly_fields = ['sent_at', 'created_at', 'updated_at']


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ['event_type', 'branch', 'channel', 'subject', 'is_active']
    list_filter = ['channel', 'is_active', 'branch']
    search_fields = ['event_type', 'subject', 'body']
    readonly_fields = ['created_at', 'updated_at']