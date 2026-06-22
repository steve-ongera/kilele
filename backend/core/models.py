from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
import uuid


# ─────────────────────────────────────────────
# CHOICES
# ─────────────────────────────────────────────

class UserRole(models.TextChoices):
    SUPER_ADMIN     = 'SUPER_ADMIN', 'Super Admin'
    BRANCH_ADMIN    = 'BRANCH_ADMIN', 'Branch Admin'
    FINANCE_OFFICER = 'FINANCE_OFFICER', 'Finance Officer'
    AUDITOR         = 'AUDITOR', 'Auditor'
    MEMBER          = 'MEMBER', 'Member'
    INVESTOR        = 'INVESTOR', 'Investor'
    TENANT          = 'TENANT', 'Tenant'


class BranchType(models.TextChoices):
    TUJIJENGE      = 'TUJIJENGE', 'Tujijenge Savings Circle'
    WEALTH_ALLIANCE = 'WEALTH_ALLIANCE', 'Wealth Alliance'
    TABLE_BANKING  = 'TABLE_BANKING', 'Table Banking'
    RENTALS        = 'RENTALS', 'Rentals'
    CUSTOM         = 'CUSTOM', 'Custom'


class MemberStatus(models.TextChoices):
    ACTIVE    = 'ACTIVE', 'Active'
    INACTIVE  = 'INACTIVE', 'Inactive'
    SUSPENDED = 'SUSPENDED', 'Suspended'
    EXITED    = 'EXITED', 'Exited'
    DECEASED  = 'DECEASED', 'Deceased'


class LoanStatus(models.TextChoices):
    DRAFT      = 'DRAFT', 'Draft'
    PENDING    = 'PENDING', 'Pending'
    APPROVED   = 'APPROVED', 'Approved'
    DISBURSED  = 'DISBURSED', 'Disbursed'
    PERFORMING = 'PERFORMING', 'Performing'
    WATCHLIST  = 'WATCHLIST', 'Watchlist'
    OVERDUE    = 'OVERDUE', 'Overdue'
    DEFAULTED  = 'DEFAULTED', 'Defaulted'
    CLOSED     = 'CLOSED', 'Closed'
    WRITTEN_OFF = 'WRITTEN_OFF', 'Written Off'


class ApprovalStatus(models.TextChoices):
    DRAFT    = 'DRAFT', 'Draft'
    PENDING  = 'PENDING', 'Pending'
    APPROVED = 'APPROVED', 'Approved'
    REJECTED = 'REJECTED', 'Rejected'
    POSTED   = 'POSTED', 'Posted'


class WithdrawalStatus(models.TextChoices):
    DRAFT      = 'DRAFT', 'Draft'
    PENDING    = 'PENDING', 'Pending'
    UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
    APPROVED   = 'APPROVED', 'Approved'
    REJECTED   = 'REJECTED', 'Rejected'
    PROCESSING = 'PROCESSING', 'Processing'
    PAID       = 'PAID', 'Paid'
    CLOSED     = 'CLOSED', 'Closed'


class MPESAConfidence(models.TextChoices):
    AUTO      = 'AUTO', 'Auto Allocated'
    REVIEW    = 'REVIEW', 'Review Queue'
    EXCEPTION = 'EXCEPTION', 'Exception Queue'


class PropertyStatus(models.TextChoices):
    ACTIVE             = 'ACTIVE', 'Active'
    UNDER_MAINTENANCE  = 'UNDER_MAINTENANCE', 'Under Maintenance'
    UNDER_DEVELOPMENT  = 'UNDER_DEVELOPMENT', 'Under Development'
    SOLD               = 'SOLD', 'Sold'
    INACTIVE           = 'INACTIVE', 'Inactive'


class OccupancyStatus(models.TextChoices):
    OCCUPIED          = 'OCCUPIED', 'Occupied'
    VACANT            = 'VACANT', 'Vacant'
    RESERVED          = 'RESERVED', 'Reserved'
    UNDER_MAINTENANCE = 'UNDER_MAINTENANCE', 'Under Maintenance'


class MaintenanceStatus(models.TextChoices):
    NEW        = 'NEW', 'New'
    ASSIGNED   = 'ASSIGNED', 'Assigned'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    COMPLETED  = 'COMPLETED', 'Completed'
    CLOSED     = 'CLOSED', 'Closed'


class LeaseStatus(models.TextChoices):
    ACTIVE        = 'ACTIVE', 'Active'
    EXPIRING_SOON = 'EXPIRING_SOON', 'Expiring Soon'
    RENEWED       = 'RENEWED', 'Renewed'
    TERMINATED    = 'TERMINATED', 'Terminated'
    EXPIRED       = 'EXPIRED', 'Expired'


class DistributionStatus(models.TextChoices):
    DRAFT     = 'DRAFT', 'Draft'
    SIMULATED = 'SIMULATED', 'Simulated'
    REVIEWED  = 'REVIEWED', 'Reviewed'
    APPROVED  = 'APPROVED', 'Approved'
    POSTED    = 'POSTED', 'Posted'
    COMPLETED = 'COMPLETED', 'Completed'


# ─────────────────────────────────────────────
# BASE MODEL
# ─────────────────────────────────────────────

class BaseModel(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'User', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='%(class)s_created'
    )
    is_active  = models.BooleanField(default=True)

    class Meta:
        abstract = True


# ─────────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────────

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role', UserRole.SUPER_ADMIN)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        user = self.create_user(email, **extra_fields)
        if password:
            user.set_password(password)
            user.save()
        return user


class User(AbstractBaseUser, PermissionsMixin):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email      = models.EmailField(unique=True)
    full_name  = models.CharField(max_length=200)
    phone      = models.CharField(max_length=20, blank=True)
    role       = models.CharField(max_length=30, choices=UserRole.choices, default=UserRole.MEMBER)
    branch     = models.ForeignKey('Branch', null=True, blank=True, on_delete=models.SET_NULL, related_name='users')
    is_staff   = models.BooleanField(default=False)
    is_active  = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['full_name']
    objects = UserManager()

    def __str__(self):
        return f'{self.full_name} ({self.email})'


class OTPToken(models.Model):
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otps')
    token      = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used    = models.BooleanField(default=False)

    def is_valid(self):
        return not self.is_used and timezone.now() < self.expires_at


# ─────────────────────────────────────────────
# BRANCH & RULES
# ─────────────────────────────────────────────

class Branch(BaseModel):
    name        = models.CharField(max_length=200)
    branch_type = models.CharField(max_length=30, choices=BranchType.choices)
    description = models.TextField(blank=True)
    logo        = models.ImageField(upload_to='branch_logos/', null=True, blank=True)
    is_active   = models.BooleanField(default=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Branches'


class SystemRule(BaseModel):
    """All configurable business rules stored as key-value pairs."""
    branch      = models.ForeignKey(Branch, null=True, blank=True, on_delete=models.CASCADE, related_name='rules')
    key         = models.CharField(max_length=100)
    value       = models.TextField()
    data_type   = models.CharField(max_length=20, default='string')  # string, number, boolean, json
    description = models.TextField(blank=True)
    version     = models.PositiveIntegerField(default=1)
    effective_date = models.DateField(default=timezone.now)

    class Meta:
        unique_together = ('branch', 'key', 'version')

    def __str__(self):
        return f'{self.branch} | {self.key} = {self.value}'


# ─────────────────────────────────────────────
# MEMBERS (Tujijenge + Table Banking)
# ─────────────────────────────────────────────

class Member(BaseModel):
    branch        = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='members')
    user          = models.OneToOneField(User, null=True, blank=True, on_delete=models.SET_NULL)
    member_number = models.CharField(max_length=50, unique=True)
    full_name     = models.CharField(max_length=200)
    phone         = models.CharField(max_length=20)
    email         = models.EmailField(blank=True)
    id_number     = models.CharField(max_length=30, blank=True)
    date_joined   = models.DateField()
    shares        = models.PositiveIntegerField(default=1)
    status        = models.CharField(max_length=20, choices=MemberStatus.choices, default=MemberStatus.ACTIVE)
    advance_credit = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    def __str__(self):
        return f'{self.member_number} – {self.full_name}'

    @property
    def total_contributions(self):
        return self.contributions.filter(status='POSTED').aggregate(
            total=models.Sum('paid')
        )['total'] or 0

    @property
    def loan_limit(self):
        from decimal import Decimal
        multiplier = Decimal(self._get_rule('LOAN_MULTIPLIER', '3'))
        return self.total_contributions * multiplier

    def _get_rule(self, key, default):
        rule = SystemRule.objects.filter(branch=self.branch, key=key).order_by('-version').first()
        return rule.value if rule else default


class Contribution(BaseModel):
    member       = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='contributions')
    period_year  = models.PositiveIntegerField()
    period_month = models.PositiveIntegerField()
    expected     = models.DecimalField(max_digits=15, decimal_places=2)
    paid         = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    arrears      = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    interest     = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    penalty      = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    status       = models.CharField(max_length=20, default='PENDING')
    due_date     = models.DateField()

    class Meta:
        unique_together = ('member', 'period_year', 'period_month')

    def save(self, *args, **kwargs):
        self.arrears = max(self.expected - self.paid, 0)
        super().save(*args, **kwargs)


class Payment(BaseModel):
    """Generic payment record — covers contributions, loans, rent, etc."""
    branch          = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='payments')
    member          = models.ForeignKey(Member, null=True, blank=True, on_delete=models.SET_NULL, related_name='payments')
    mpesa_ref       = models.CharField(max_length=100, blank=True)
    amount          = models.DecimalField(max_digits=15, decimal_places=2)
    phone           = models.CharField(max_length=20, blank=True)
    payment_date    = models.DateTimeField()
    notes           = models.TextField(blank=True)
    is_allocated    = models.BooleanField(default=False)
    advance_credit  = models.DecimalField(max_digits=15, decimal_places=2, default=0)


class PaymentAllocation(BaseModel):
    """Tracks how a payment is allocated per the configured order."""
    payment    = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='allocations')
    line_type  = models.CharField(max_length=50)  # INTEREST, PENALTY, LOAN_PRINCIPAL, CONTRIBUTION, etc.
    reference  = models.UUIDField(null=True, blank=True)  # FK to the target record
    amount     = models.DecimalField(max_digits=15, decimal_places=2)
    sequence   = models.PositiveIntegerField()


# ─────────────────────────────────────────────
# LOANS (Tujijenge + Table Banking)
# ─────────────────────────────────────────────

class LoanProduct(BaseModel):
    branch          = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='loan_products')
    name            = models.CharField(max_length=100)
    duration_months = models.PositiveIntegerField()
    interest_rate   = models.DecimalField(max_digits=5, decimal_places=2)
    is_active       = models.BooleanField(default=True)

    def __str__(self):
        return f'{self.name} ({self.duration_months}m @ {self.interest_rate}%)'


class Loan(BaseModel):
    branch          = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='loans')
    member          = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='loans')
    product         = models.ForeignKey(LoanProduct, on_delete=models.PROTECT)
    loan_number     = models.CharField(max_length=50, unique=True)
    principal       = models.DecimalField(max_digits=15, decimal_places=2)
    interest_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_repayment = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    balance         = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    monthly_installment = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    disbursement_date = models.DateField(null=True, blank=True)
    maturity_date   = models.DateField(null=True, blank=True)
    status          = models.CharField(max_length=20, choices=LoanStatus.choices, default=LoanStatus.DRAFT)
    approval_status = models.CharField(max_length=20, choices=ApprovalStatus.choices, default=ApprovalStatus.DRAFT)
    approved_by     = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='approved_loans')
    notes           = models.TextField(blank=True)

    def calculate(self):
        from decimal import Decimal
        rate = self.product.interest_rate / Decimal(100)
        self.interest_amount = self.principal * rate
        self.total_repayment = self.principal + self.interest_amount
        self.balance = self.total_repayment
        self.monthly_installment = self.total_repayment / self.product.duration_months
        return self

    def __str__(self):
        return f'{self.loan_number} – {self.member.full_name}'


class LoanRepayment(BaseModel):
    loan           = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='repayments')
    payment        = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='loan_repayments')
    principal_paid = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    interest_paid  = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    penalty_paid   = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    balance_after  = models.DecimalField(max_digits=15, decimal_places=2)
    repayment_date = models.DateField()


class Penalty(BaseModel):
    branch       = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='penalties')
    member       = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='penalties')
    penalty_type = models.CharField(max_length=50)
    amount       = models.DecimalField(max_digits=15, decimal_places=2)
    description  = models.TextField(blank=True)
    is_waived    = models.BooleanField(default=False)
    waived_by    = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='waivers')
    waived_at    = models.DateTimeField(null=True, blank=True)
    waiver_reason = models.TextField(blank=True)
    period_year  = models.PositiveIntegerField(null=True, blank=True)
    period_month = models.PositiveIntegerField(null=True, blank=True)


# ─────────────────────────────────────────────
# ANNUAL DISTRIBUTION (Tujijenge)
# ─────────────────────────────────────────────

class AnnualDistribution(BaseModel):
    branch              = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='distributions')
    year                = models.PositiveIntegerField()
    total_pool          = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    status              = models.CharField(max_length=20, choices=DistributionStatus.choices, default=DistributionStatus.DRAFT)
    eligibility_rules   = models.JSONField(default=dict)
    approved_by         = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='approved_distributions')


class DistributionEntry(BaseModel):
    distribution       = models.ForeignKey(AnnualDistribution, on_delete=models.CASCADE, related_name='entries')
    member             = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='distribution_entries')
    contribution_value = models.DecimalField(max_digits=15, decimal_places=2)
    interest_share     = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    bonus              = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    outstanding_loans  = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    penalties          = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    charges            = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    net_distribution   = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    is_eligible        = models.BooleanField(default=True)
    ineligibility_reason = models.TextField(blank=True)

    def calculate_net(self):
        self.net_distribution = (
            self.contribution_value + self.interest_share + self.bonus
            - self.outstanding_loans - self.penalties - self.charges
        )
        return self


# ─────────────────────────────────────────────
# WEALTH ALLIANCE
# ─────────────────────────────────────────────

class Investor(BaseModel):
    branch          = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='investors')
    user            = models.OneToOneField(User, null=True, blank=True, on_delete=models.SET_NULL)
    investor_number = models.CharField(max_length=50, unique=True)
    full_name       = models.CharField(max_length=200)
    phone           = models.CharField(max_length=20)
    email           = models.EmailField(blank=True)
    id_number       = models.CharField(max_length=30, blank=True)
    join_date       = models.DateField()
    status          = models.CharField(max_length=20, choices=MemberStatus.choices, default=MemberStatus.ACTIVE)

    @property
    def current_capital(self):
        return self.capital_transactions.aggregate(
            net=models.Sum(
                models.Case(
                    models.When(transaction_type__in=['DEPOSIT', 'REINVESTMENT', 'DIVIDEND_CREDIT'], then='amount'),
                    models.When(transaction_type__in=['WITHDRAWAL'], then=models.F('amount') * -1),
                    output_field=models.DecimalField()
                )
            )
        )['net'] or 0

    def __str__(self):
        return f'{self.investor_number} – {self.full_name}'


class AssetClass(BaseModel):
    branch      = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='asset_classes')
    name        = models.CharField(max_length=100)
    risk_level  = models.CharField(max_length=20, choices=[
        ('LOW','Low'), ('MEDIUM','Medium'), ('HIGH','High'), ('VERY_HIGH','Very High')
    ], default='MEDIUM')
    is_active   = models.BooleanField(default=True)


class InvestmentTransaction(BaseModel):
    branch           = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='investment_transactions')
    investor         = models.ForeignKey(Investor, on_delete=models.CASCADE, related_name='capital_transactions')
    asset_class      = models.ForeignKey(AssetClass, null=True, blank=True, on_delete=models.SET_NULL)
    transaction_type = models.CharField(max_length=30)  # DEPOSIT, REINVESTMENT, DIVIDEND_CREDIT, WITHDRAWAL, ADJUSTMENT
    amount           = models.DecimalField(max_digits=15, decimal_places=2)
    transaction_date = models.DateField()
    notes            = models.TextField(blank=True)
    approval_status  = models.CharField(max_length=20, choices=ApprovalStatus.choices, default=ApprovalStatus.PENDING)
    reference        = models.CharField(max_length=100, blank=True)


class DividendDeclaration(BaseModel):
    branch          = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='dividend_declarations')
    pool_amount     = models.DecimalField(max_digits=15, decimal_places=2)
    declaration_date = models.DateField()
    period          = models.CharField(max_length=50)  # e.g. "Q1 2025"
    total_capital   = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    status          = models.CharField(max_length=20, choices=ApprovalStatus.choices, default=ApprovalStatus.DRAFT)
    approved_by     = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='approved_dividends')


class InvestorDividend(BaseModel):
    declaration    = models.ForeignKey(DividendDeclaration, on_delete=models.CASCADE, related_name='investor_dividends')
    investor       = models.ForeignKey(Investor, on_delete=models.CASCADE, related_name='dividends')
    investor_share_pct = models.DecimalField(max_digits=8, decimal_places=4)
    dividend_amount = models.DecimalField(max_digits=15, decimal_places=2)
    option         = models.CharField(max_length=20, choices=[('CASH','Cash'), ('REINVEST','Reinvest')], default='CASH')
    is_processed   = models.BooleanField(default=False)


class InvestorWithdrawal(BaseModel):
    branch           = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='investor_withdrawals')
    investor         = models.ForeignKey(Investor, on_delete=models.CASCADE, related_name='withdrawals')
    withdrawal_type  = models.CharField(max_length=30)  # DIVIDEND, PARTIAL_CAPITAL, FULL_EXIT, EMERGENCY
    amount_requested = models.DecimalField(max_digits=15, decimal_places=2)
    amount_paid      = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    charges          = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    exit_fee         = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    status           = models.CharField(max_length=20, choices=WithdrawalStatus.choices, default=WithdrawalStatus.DRAFT)
    approved_by      = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='approved_investor_withdrawals')
    notes            = models.TextField(blank=True)


# ─────────────────────────────────────────────
# RENTALS
# ─────────────────────────────────────────────

class Property(BaseModel):
    branch          = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='properties')
    property_code   = models.CharField(max_length=50, unique=True)
    name            = models.CharField(max_length=200)
    property_type   = models.CharField(max_length=30)  # RESIDENTIAL, COMMERCIAL, MIXED_USE, LAND, etc.
    location        = models.CharField(max_length=300)
    total_units     = models.PositiveIntegerField(default=0)
    property_manager = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='managed_properties')
    purchase_value  = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    current_value   = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    status          = models.CharField(max_length=30, choices=PropertyStatus.choices, default=PropertyStatus.ACTIVE)

    @property
    def occupancy_rate(self):
        total = self.units.count()
        if not total:
            return 0
        occupied = self.units.filter(occupancy_status=OccupancyStatus.OCCUPIED).count()
        return round((occupied / total) * 100, 2)

    def __str__(self):
        return f'{self.property_code} – {self.name}'


class Unit(BaseModel):
    property         = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='units')
    unit_number      = models.CharField(max_length=50)
    unit_type        = models.CharField(max_length=50, blank=True)
    monthly_rent     = models.DecimalField(max_digits=15, decimal_places=2)
    deposit_amount   = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    occupancy_status = models.CharField(max_length=30, choices=OccupancyStatus.choices, default=OccupancyStatus.VACANT)
    vacated_date     = models.DateField(null=True, blank=True)

    class Meta:
        unique_together = ('property', 'unit_number')

    def __str__(self):
        return f'{self.property.property_code} / {self.unit_number}'


class Tenant(BaseModel):
    branch        = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='tenants')
    user          = models.OneToOneField(User, null=True, blank=True, on_delete=models.SET_NULL)
    tenant_number = models.CharField(max_length=50, unique=True)
    full_name     = models.CharField(max_length=200)
    phone         = models.CharField(max_length=20)
    email         = models.EmailField(blank=True)
    id_number     = models.CharField(max_length=30, blank=True)
    move_in_date  = models.DateField()
    unit          = models.ForeignKey(Unit, null=True, blank=True, on_delete=models.SET_NULL, related_name='tenants')
    deposit_paid  = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    status        = models.CharField(max_length=20, choices=[
        ('ACTIVE','Active'), ('NOTICE_GIVEN','Notice Given'), ('EXITED','Exited'), ('EVICTED','Evicted')
    ], default='ACTIVE')

    def __str__(self):
        return f'{self.tenant_number} – {self.full_name}'


class Lease(BaseModel):
    tenant       = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='leases')
    unit         = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='leases')
    start_date   = models.DateField()
    end_date     = models.DateField()
    rent_amount  = models.DecimalField(max_digits=15, decimal_places=2)
    deposit      = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    renewal_date = models.DateField(null=True, blank=True)
    notice_period_days = models.PositiveIntegerField(default=30)
    status       = models.CharField(max_length=20, choices=LeaseStatus.choices, default=LeaseStatus.ACTIVE)


class RentCollection(BaseModel):
    tenant          = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='rent_collections')
    unit            = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='rent_collections')
    period_year     = models.PositiveIntegerField()
    period_month    = models.PositiveIntegerField()
    expected        = models.DecimalField(max_digits=15, decimal_places=2)
    paid            = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    arrears         = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    penalty         = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    payment_method  = models.CharField(max_length=30, default='MPESA')
    mpesa_ref       = models.CharField(max_length=100, blank=True)
    payment_date    = models.DateField(null=True, blank=True)

    class Meta:
        unique_together = ('unit', 'period_year', 'period_month')

    def save(self, *args, **kwargs):
        self.arrears = max(self.expected - self.paid, 0)
        super().save(*args, **kwargs)


class MaintenanceRequest(BaseModel):
    unit           = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='maintenance_requests')
    tenant         = models.ForeignKey(Tenant, null=True, blank=True, on_delete=models.SET_NULL, related_name='maintenance_requests')
    title          = models.CharField(max_length=200)
    description    = models.TextField()
    cost           = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    contractor     = models.CharField(max_length=200, blank=True)
    status         = models.CharField(max_length=20, choices=MaintenanceStatus.choices, default=MaintenanceStatus.NEW)
    completion_date = models.DateField(null=True, blank=True)


# ─────────────────────────────────────────────
# MPESA ENGINE
# ─────────────────────────────────────────────

class MPESATransaction(BaseModel):
    branch           = models.ForeignKey(Branch, null=True, blank=True, on_delete=models.SET_NULL, related_name='mpesa_transactions')
    mpesa_ref        = models.CharField(max_length=100, unique=True)
    phone            = models.CharField(max_length=20)
    amount           = models.DecimalField(max_digits=15, decimal_places=2)
    transaction_date = models.DateTimeField()
    sender_name      = models.CharField(max_length=200, blank=True)
    account_ref      = models.CharField(max_length=100, blank=True)
    confidence       = models.CharField(max_length=20, choices=MPESAConfidence.choices, default=MPESAConfidence.EXCEPTION)
    matched_member   = models.ForeignKey(Member, null=True, blank=True, on_delete=models.SET_NULL, related_name='mpesa_transactions')
    is_allocated     = models.BooleanField(default=False)
    is_duplicate     = models.BooleanField(default=False)
    is_reversed      = models.BooleanField(default=False)
    allocation_notes = models.TextField(blank=True)
    raw_payload      = models.JSONField(default=dict)


# ─────────────────────────────────────────────
# APPROVAL ENGINE
# ─────────────────────────────────────────────

class ApprovalRequest(BaseModel):
    branch          = models.ForeignKey(Branch, null=True, blank=True, on_delete=models.CASCADE, related_name='approval_requests')
    action_type     = models.CharField(max_length=50)  # LOAN, WITHDRAWAL, WAIVER, EXIT, RULE_CHANGE, etc.
    reference_id    = models.UUIDField(null=True, blank=True)
    reference_model = models.CharField(max_length=100, blank=True)
    requested_by    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='approval_requests')
    reviewed_by     = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='reviewed_approvals')
    status          = models.CharField(max_length=20, choices=ApprovalStatus.choices, default=ApprovalStatus.PENDING)
    reason          = models.TextField(blank=True)
    rejection_note  = models.TextField(blank=True)
    reviewed_at     = models.DateTimeField(null=True, blank=True)
    payload         = models.JSONField(default=dict)


# ─────────────────────────────────────────────
# AUDIT ENGINE
# ─────────────────────────────────────────────

class AuditLog(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user         = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='audit_logs')
    role         = models.CharField(max_length=30, blank=True)
    branch       = models.ForeignKey(Branch, null=True, blank=True, on_delete=models.SET_NULL, related_name='audit_logs')
    action       = models.CharField(max_length=200)
    model_name   = models.CharField(max_length=100, blank=True)
    object_id    = models.CharField(max_length=100, blank=True)
    old_value    = models.JSONField(null=True, blank=True)
    new_value    = models.JSONField(null=True, blank=True)
    reason       = models.TextField(blank=True)
    ip_address   = models.GenericIPAddressField(null=True, blank=True)
    device       = models.CharField(max_length=300, blank=True)
    timestamp    = models.DateTimeField(auto_now_add=True)
    approval_ref = models.UUIDField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f'{self.action} by {self.user} at {self.timestamp}'


# ─────────────────────────────────────────────
# NOTIFICATIONS
# ─────────────────────────────────────────────

class Notification(BaseModel):
    user         = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title        = models.CharField(max_length=200)
    message      = models.TextField()
    channel      = models.CharField(max_length=20)  # WHATSAPP, SMS, EMAIL, IN_APP
    is_read      = models.BooleanField(default=False)
    sent_at      = models.DateTimeField(null=True, blank=True)
    is_sent      = models.BooleanField(default=False)


class NotificationTemplate(BaseModel):
    branch       = models.ForeignKey(Branch, null=True, blank=True, on_delete=models.CASCADE, related_name='notification_templates')
    event_type   = models.CharField(max_length=100)  # CONTRIBUTION_DUE, LOAN_OVERDUE, etc.
    channel      = models.CharField(max_length=20)
    subject      = models.CharField(max_length=200, blank=True)
    body         = models.TextField()
    is_active    = models.BooleanField(default=True)