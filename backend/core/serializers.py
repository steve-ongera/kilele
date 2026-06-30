from rest_framework import serializers
from django.utils import timezone
from .models import (
    User, OTPToken, Branch, SystemRule,
    Member, Contribution, Payment, PaymentAllocation,
    LoanProduct, Loan, LoanRepayment, Penalty,
    AnnualDistribution, DistributionEntry,
    Investor, AssetClass, InvestmentTransaction, DividendDeclaration,
    InvestorDividend, InvestorWithdrawal,
    Property, Unit, Tenant, Lease, RentCollection, MaintenanceRequest,
    MPESATransaction, ApprovalRequest, AuditLog,
    Notification, NotificationTemplate,
)


# ─────────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────────

class RequestOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    token = serializers.CharField(max_length=6, min_length=6)


class UserSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    member_id = serializers.SerializerMethodField()
    investor_id = serializers.SerializerMethodField()
    tenant_id = serializers.SerializerMethodField()
    unit_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'phone', 'role',
            'branch', 'branch_name', 'is_active', 'date_joined', 'last_login',
            'member_id', 'investor_id', 'tenant_id', 'unit_id',
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']

    def get_member_id(self, obj):
        try:
            return obj.member.id if hasattr(obj, 'member') and obj.member else None
        except:
            return None

    def get_investor_id(self, obj):
        try:
            return obj.investor.id if hasattr(obj, 'investor') and obj.investor else None
        except:
            return None

    def get_tenant_id(self, obj):
        try:
            return obj.tenant.id if hasattr(obj, 'tenant') and obj.tenant else None
        except:
            return None

    def get_unit_id(self, obj):
        """Return the tenant's unit ID if the user is a TENANT"""
        try:
            if obj.role == 'TENANT' and hasattr(obj, 'tenant') and obj.tenant:
                return str(obj.tenant.unit_id) if obj.tenant.unit else None
            return None
        except:
            return None

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['email', 'full_name', 'phone', 'role', 'branch', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'phone']
        read_only_fields = ['id', 'email']


# ─────────────────────────────────────────────
# BRANCH & RULES
# ─────────────────────────────────────────────

class BranchSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Branch
        fields = [
            'id', 'name', 'branch_type', 'description',
            'logo', 'is_active', 'member_count', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_member_count(self, obj):
        return obj.members.filter(is_active=True).count()


class SystemRuleSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = SystemRule
        fields = [
            'id', 'branch', 'branch_name', 'key', 'value',
            'data_type', 'description', 'version', 'effective_date',
        ]
        read_only_fields = ['id', 'version']

    def update(self, instance, validated_data):
        # Bump version on every update
        instance.version += 1
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


# ─────────────────────────────────────────────
# MEMBERS
# ─────────────────────────────────────────────

class MemberListSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    total_contributions = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True
    )
    loan_limit = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True
    )

    class Meta:
        model = Member
        fields = [
            'id', 'member_number', 'full_name', 'phone', 'email',
            'branch', 'branch_name', 'shares', 'status',
            'total_contributions', 'loan_limit', 'date_joined',
        ]
        read_only_fields = ['id', 'member_number']


class MemberDetailSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    total_contributions = serializers.SerializerMethodField()
    loan_limit = serializers.SerializerMethodField()
    active_loans = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()  # Add this

    class Meta:
        model = Member
        fields = [
            'id', 'branch', 'branch_name', 'user', 'user_email',  # Add user_email
            'member_number', 'full_name', 'phone', 'email', 'id_number', 
            'date_joined', 'shares', 'status', 'advance_credit',
            'total_contributions', 'loan_limit', 'active_loans',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'member_number', 'created_at', 'updated_at']

    def get_total_contributions(self, obj):
        return str(obj.total_contributions)

    def get_loan_limit(self, obj):
        return str(obj.loan_limit)

    def get_active_loans(self, obj):
        return obj.loans.filter(
            status__in=['PERFORMING', 'DISBURSED', 'WATCHLIST', 'OVERDUE']
        ).count()

    def get_user_email(self, obj):
        """Return the user's email if associated, else None"""
        return obj.user.email if obj.user else None


class MemberCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    create_user = serializers.BooleanField(write_only=True, required=False, default=True)

    class Meta:
        model = Member
        fields = [
            'branch', 'user', 'full_name', 'phone', 'email',
            'id_number', 'date_joined', 'shares', 'password', 'create_user',
        ]
        extra_kwargs = {
            'user': {'required': False, 'allow_null': True},
            'email': {'required': False, 'allow_blank': True},
        }

    def validate(self, data):
        # If create_user is True, email and password are required
        if data.get('create_user', True):
            if not data.get('email'):
                raise serializers.ValidationError({"email": "Email is required to create a user account."})
            if not data.get('password'):
                raise serializers.ValidationError({"password": "Password is required to create a user account."})
            if User.objects.filter(email=data['email']).exists():
                raise serializers.ValidationError({"email": "A user with this email already exists."})
        return data

    def create(self, validated_data):
        import uuid
        from django.contrib.auth.hashers import make_password
        
        # Extract user-related fields
        password = validated_data.pop('password', None)
        create_user = validated_data.pop('create_user', True)
        email = validated_data.get('email', '')
        
        # Generate member number
        validated_data['member_number'] = f"TJ-{uuid.uuid4().hex[:6].upper()}"
        
        # Remove user field if present (we'll set it after creating the user)
        validated_data.pop('user', None)
        
        # Create member
        member = super().create(validated_data)
        
        # Create user account if requested
        if create_user and email and password:
            from .models import User, UserRole
            
            # Check if user already exists (just in case)
            existing_user = User.objects.filter(email=email).first()
            if existing_user:
                # If user exists, associate it with the member
                member.user = existing_user
                member.save(update_fields=['user'])
                return member
            
            # Create the user
            user = User.objects.create(
                email=email,
                full_name=validated_data.get('full_name', ''),
                phone=validated_data.get('phone', ''),
                role=UserRole.MEMBER,
                branch=validated_data.get('branch'),
                is_active=True,
                is_staff=False,
            )
            user.set_password(password)  # Hash the password
            user.save()
            
            # Associate user with member
            member.user = user
            member.save(update_fields=['user'])
            
            print(f"✅ User '{email}' created and associated with member '{member.member_number}'")
            
        return member


class MemberStatementSerializer(serializers.Serializer):
    member = MemberDetailSerializer()
    contributions = serializers.ListField()
    loans = serializers.ListField()
    payments = serializers.ListField()
    penalties = serializers.ListField()
    summary = serializers.DictField()


# ─────────────────────────────────────────────
# CONTRIBUTIONS
# ─────────────────────────────────────────────

class ContributionSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    member_number = serializers.CharField(source='member.member_number', read_only=True)

    class Meta:
        model = Contribution
        fields = [
            'id', 'member', 'member_name', 'member_number',
            'period_year', 'period_month', 'expected', 'paid',
            'arrears', 'interest', 'penalty', 'status', 'due_date',
            'created_at',
        ]
        read_only_fields = ['id', 'arrears', 'created_at']


class ContributionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contribution
        fields = [
            'member', 'period_year', 'period_month',
            'expected', 'paid', 'interest', 'penalty', 'due_date',
        ]

    def validate(self, data):
        if Contribution.objects.filter(
            member=data['member'],
            period_year=data['period_year'],
            period_month=data['period_month'],
        ).exists():
            raise serializers.ValidationError(
                "Contribution for this member and period already exists."
            )
        return data


# ─────────────────────────────────────────────
# PAYMENTS
# ─────────────────────────────────────────────

class PaymentAllocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentAllocation
        fields = ['id', 'line_type', 'reference', 'amount', 'sequence']


class PaymentSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    allocations = PaymentAllocationSerializer(many=True, read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'branch', 'member', 'member_name', 'mpesa_ref',
            'amount', 'phone', 'payment_date', 'notes',
            'is_allocated', 'advance_credit', 'allocations', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


# ─────────────────────────────────────────────
# LOANS
# ─────────────────────────────────────────────

class LoanProductSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = LoanProduct
        fields = [
            'id', 'branch', 'branch_name', 'name',
            'duration_months', 'interest_rate', 'is_active',
        ]
        read_only_fields = ['id']


class LoanRepaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanRepayment
        fields = [
            'id', 'loan', 'payment', 'principal_paid', 'interest_paid',
            'penalty_paid', 'balance_after', 'repayment_date', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class LoanListSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    member_number = serializers.CharField(source='member.member_number', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = Loan
        fields = [
            'id', 'loan_number', 'member', 'member_name', 'member_number',
            'product_name', 'principal', 'balance', 'monthly_installment',
            'status', 'approval_status', 'disbursement_date', 'maturity_date',
        ]
        read_only_fields = ['id', 'loan_number']


class LoanDetailSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    repayments = LoanRepaymentSerializer(many=True, read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.full_name', read_only=True)

    class Meta:
        model = Loan
        fields = [
            'id', 'branch', 'member', 'member_name', 'product', 'product_name',
            'loan_number', 'principal', 'interest_amount', 'total_repayment',
            'balance', 'monthly_installment', 'disbursement_date', 'maturity_date',
            'status', 'approval_status', 'approved_by', 'approved_by_name',
            'notes', 'repayments', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'loan_number', 'interest_amount', 'total_repayment',
            'balance', 'monthly_installment', 'created_at', 'updated_at',
        ]


class LoanCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Loan
        fields = ['member', 'product', 'principal', 'notes']

    def validate(self, data):
        member = data['member']
        if data['principal'] > member.loan_limit:
            raise serializers.ValidationError(
                f"Principal exceeds member loan limit of {member.loan_limit}."
            )
        active = member.loans.filter(
            status__in=['PERFORMING', 'DISBURSED', 'WATCHLIST', 'OVERDUE']
        )
        if active.exists():
            raise serializers.ValidationError(
                "Member has an active loan. Cannot create a new one."
            )
        return data

class LoanApproveSerializer(serializers.Serializer):
    notes = serializers.CharField(required=False, allow_blank=True)


class LoanDisburseSerializer(serializers.Serializer):
    disbursement_date = serializers.DateField()
    notes = serializers.CharField(required=False, allow_blank=True)


# ─────────────────────────────────────────────
# PENALTIES
# ─────────────────────────────────────────────

class PenaltySerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    waived_by_name = serializers.CharField(source='waived_by.full_name', read_only=True)

    class Meta:
        model = Penalty
        fields = [
            'id', 'branch', 'member', 'member_name', 'penalty_type',
            'amount', 'description', 'is_waived', 'waived_by', 'waived_by_name',
            'waived_at', 'waiver_reason', 'period_year', 'period_month', 'created_at',
        ]
        read_only_fields = ['id', 'waived_by', 'waived_at', 'created_at']


class PenaltyWaiveSerializer(serializers.Serializer):
    waiver_reason = serializers.CharField()


# ─────────────────────────────────────────────
# DISTRIBUTION
# ─────────────────────────────────────────────

class DistributionEntrySerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    member_number = serializers.CharField(source='member.member_number', read_only=True)

    class Meta:
        model = DistributionEntry
        fields = [
            'id', 'member', 'member_name', 'member_number',
            'contribution_value', 'interest_share', 'bonus',
            'outstanding_loans', 'penalties', 'charges',
            'net_distribution', 'is_eligible', 'ineligibility_reason',
        ]
        read_only_fields = ['id', 'net_distribution']


class AnnualDistributionSerializer(serializers.ModelSerializer):
    entries = DistributionEntrySerializer(many=True, read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.full_name', read_only=True)

    class Meta:
        model = AnnualDistribution
        fields = [
            'id', 'branch', 'year', 'total_pool', 'status',
            'eligibility_rules', 'approved_by', 'approved_by_name',
            'entries', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


# ─────────────────────────────────────────────
# WEALTH ALLIANCE
# ─────────────────────────────────────────────

class AssetClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetClass
        fields = ['id', 'branch', 'name', 'risk_level', 'is_active']
        read_only_fields = ['id']


class InvestorListSerializer(serializers.ModelSerializer):
    current_capital = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = Investor
        fields = [
            'id', 'investor_number', 'full_name', 'phone', 'email',
            'branch', 'branch_name', 'status', 'join_date', 'current_capital',
        ]
        read_only_fields = ['id', 'investor_number']

    def get_current_capital(self, obj):
        return str(obj.current_capital)


class InvestorDetailSerializer(serializers.ModelSerializer):
    current_capital = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = Investor
        fields = [
            'id', 'branch', 'branch_name', 'user', 'investor_number',
            'full_name', 'phone', 'email', 'id_number', 'join_date',
            'status', 'current_capital', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'investor_number', 'created_at', 'updated_at']

    def get_current_capital(self, obj):
        return str(obj.current_capital)


class InvestorCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Investor
        fields = ['branch', 'user', 'full_name', 'phone', 'email', 'id_number', 'join_date']

    def create(self, validated_data):
        import uuid
        validated_data['investor_number'] = f"INV-{uuid.uuid4().hex[:6].upper()}"
        return super().create(validated_data)


class InvestmentTransactionSerializer(serializers.ModelSerializer):
    investor_name = serializers.CharField(source='investor.full_name', read_only=True)
    asset_class_name = serializers.CharField(source='asset_class.name', read_only=True)

    class Meta:
        model = InvestmentTransaction
        fields = [
            'id', 'branch', 'investor', 'investor_name', 'asset_class',
            'asset_class_name', 'transaction_type', 'amount',
            'transaction_date', 'notes', 'approval_status', 'reference', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class DividendDeclarationSerializer(serializers.ModelSerializer):
    investor_dividends = serializers.SerializerMethodField()
    approved_by_name = serializers.CharField(source='approved_by.full_name', read_only=True)

    class Meta:
        model = DividendDeclaration
        fields = [
            'id', 'branch', 'pool_amount', 'declaration_date', 'period',
            'total_capital', 'status', 'approved_by', 'approved_by_name',
            'investor_dividends', 'created_at',
        ]
        read_only_fields = ['id', 'total_capital', 'created_at']

    def get_investor_dividends(self, obj):
        return InvestorDividendSerializer(
            obj.investor_dividends.all(), many=True
        ).data


class InvestorDividendSerializer(serializers.ModelSerializer):
    investor_name = serializers.CharField(source='investor.full_name', read_only=True)

    class Meta:
        model = InvestorDividend
        fields = [
            'id', 'investor', 'investor_name', 'investor_share_pct',
            'dividend_amount', 'option', 'is_processed',
        ]
        read_only_fields = ['id', 'investor_share_pct', 'dividend_amount']


class InvestorWithdrawalSerializer(serializers.ModelSerializer):
    investor_name = serializers.CharField(source='investor.full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.full_name', read_only=True)

    class Meta:
        model = InvestorWithdrawal
        fields = [
            'id', 'branch', 'investor', 'investor_name', 'withdrawal_type',
            'amount_requested', 'amount_paid', 'charges', 'exit_fee',
            'status', 'approved_by', 'approved_by_name', 'notes', 'created_at',
        ]
        read_only_fields = ['id', 'amount_paid', 'approved_by', 'created_at']


# ─────────────────────────────────────────────
# TABLE BANKING
# ─────────────────────────────────────────────

class TableBankingMemberSerializer(serializers.ModelSerializer):
    """Reuses Member model — filtered to TABLE_BANKING branch type."""
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    total_contributions = serializers.SerializerMethodField()

    class Meta:
        model = Member
        fields = [
            'id', 'member_number', 'full_name', 'phone', 'email',
            'branch', 'branch_name', 'shares', 'status',
            'total_contributions', 'date_joined',
        ]
        read_only_fields = ['id', 'member_number']

    def get_total_contributions(self, obj):
        return str(obj.total_contributions)


class TableBankingLendingFundSerializer(serializers.Serializer):
    branch_id = serializers.UUIDField()
    branch_name = serializers.CharField()
    total_contributions = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_interest = serializers.DecimalField(max_digits=15, decimal_places=2)
    outstanding_loans = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_withdrawals = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_charges = serializers.DecimalField(max_digits=15, decimal_places=2)
    available_fund = serializers.DecimalField(max_digits=15, decimal_places=2)


# ─────────────────────────────────────────────
# RENTALS
# ─────────────────────────────────────────────

class PropertySerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    occupancy_rate = serializers.SerializerMethodField()
    manager_name = serializers.CharField(source='property_manager.full_name', read_only=True)

    class Meta:
        model = Property
        fields = [
            'id', 'branch', 'branch_name', 'property_code', 'name',
            'property_type', 'location', 'total_units',
            'property_manager', 'manager_name', 'purchase_value',
            'current_value', 'status', 'occupancy_rate', 'created_at',
        ]
        read_only_fields = ['id', 'property_code', 'occupancy_rate', 'created_at']

    def get_occupancy_rate(self, obj):
        return obj.occupancy_rate

    def create(self, validated_data):
        import uuid
        validated_data['property_code'] = f"PROP-{uuid.uuid4().hex[:6].upper()}"
        return super().create(validated_data)


class UnitSerializer(serializers.ModelSerializer):
    property_name = serializers.CharField(source='property.name', read_only=True)
    property_code = serializers.CharField(source='property.property_code', read_only=True)

    class Meta:
        model = Unit
        fields = [
            'id', 'property', 'property_name', 'property_code',
            'unit_number', 'unit_type', 'monthly_rent', 'deposit_amount',
            'occupancy_status', 'vacated_date', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class TenantListSerializer(serializers.ModelSerializer):
    unit_number = serializers.CharField(source='unit.unit_number', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = Tenant
        fields = [
            'id', 'tenant_number', 'full_name', 'phone', 'email',
            'branch', 'branch_name', 'unit', 'unit_number', 'status', 'move_in_date',
        ]
        read_only_fields = ['id', 'tenant_number']


class TenantDetailSerializer(serializers.ModelSerializer):
    unit_number = serializers.CharField(source='unit.unit_number', read_only=True)
    unit_id = serializers.UUIDField(source='unit.id', read_only=True)  # Add this
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    active_lease = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()

    class Meta:
        model = Tenant
        fields = [
            'id', 'branch', 'branch_name', 'user', 'user_email',
            'tenant_number', 'full_name', 'phone', 'email', 'id_number', 
            'move_in_date', 'unit', 'unit_id', 'unit_number',  # Add unit_id
            'deposit_paid', 'status', 'active_lease', 
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'tenant_number', 'created_at', 'updated_at']

    def get_active_lease(self, obj):
        lease = obj.leases.filter(status='ACTIVE').first()
        return LeaseSerializer(lease).data if lease else None

    def get_user_email(self, obj):
        return obj.user.email if obj.user else None


class TenantCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    create_user = serializers.BooleanField(write_only=True, required=False, default=True)

    class Meta:
        model = Tenant
        fields = [
            'branch', 'user', 'full_name', 'phone', 'email',
            'id_number', 'move_in_date', 'unit', 'deposit_paid',
            'password', 'create_user',
        ]
        extra_kwargs = {
            'user': {'required': False, 'allow_null': True},
            'email': {'required': False, 'allow_blank': True},
        }

    def validate(self, data):
        # If create_user is True, email and password are required
        if data.get('create_user', True):
            if not data.get('email'):
                raise serializers.ValidationError({"email": "Email is required to create a user account."})
            if not data.get('password'):
                raise serializers.ValidationError({"password": "Password is required to create a user account."})
            if User.objects.filter(email=data['email']).exists():
                raise serializers.ValidationError({"email": "A user with this email already exists."})
        return data

    def create(self, validated_data):
        import uuid
        from django.contrib.auth.hashers import make_password
        
        # Extract user-related fields
        password = validated_data.pop('password', None)
        create_user = validated_data.pop('create_user', True)
        email = validated_data.get('email', '')
        
        # Generate tenant number
        validated_data['tenant_number'] = f"TN-{uuid.uuid4().hex[:6].upper()}"
        
        # Remove user field if present (we'll set it after creating the user)
        validated_data.pop('user', None)
        
        # Create tenant
        tenant = super().create(validated_data)
        
        # Create user account if requested
        if create_user and email and password:
            from .models import User, UserRole
            
            # Check if user already exists
            existing_user = User.objects.filter(email=email).first()
            if existing_user:
                # If user exists, associate it with the tenant
                tenant.user = existing_user
                tenant.save(update_fields=['user'])
                return tenant
            
            # Create the user
            user = User.objects.create(
                email=email,
                full_name=validated_data.get('full_name', ''),
                phone=validated_data.get('phone', ''),
                role=UserRole.TENANT,
                branch=validated_data.get('branch'),
                is_active=True,
                is_staff=False,
            )
            user.set_password(password)  # Hash the password
            user.save()
            
            # Associate user with tenant
            tenant.user = user
            tenant.save(update_fields=['user'])
            
            print(f"✅ User '{email}' created and associated with tenant '{tenant.tenant_number}'")
            
        return tenant


class LeaseSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source='tenant.full_name', read_only=True)
    unit_number = serializers.CharField(source='unit.unit_number', read_only=True)

    class Meta:
        model = Lease
        fields = [
            'id', 'tenant', 'tenant_name', 'unit', 'unit_number',
            'start_date', 'end_date', 'rent_amount', 'deposit',
            'renewal_date', 'notice_period_days', 'status', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class RentCollectionSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source='tenant.full_name', read_only=True)
    unit_number = serializers.CharField(source='unit.unit_number', read_only=True)

    class Meta:
        model = RentCollection
        fields = [
            'id', 'tenant', 'tenant_name', 'unit', 'unit_number',
            'period_year', 'period_month', 'expected', 'paid',
            'arrears', 'penalty', 'payment_method', 'mpesa_ref',
            'payment_date', 'created_at',
        ]
        read_only_fields = ['id', 'arrears', 'created_at']


class MaintenanceRequestSerializer(serializers.ModelSerializer):
    unit_number = serializers.CharField(source='unit.unit_number', read_only=True)
    tenant_name = serializers.CharField(source='tenant.full_name', read_only=True)

    class Meta:
        model = MaintenanceRequest
        fields = [
            'id', 'unit', 'unit_number', 'tenant', 'tenant_name',
            'title', 'description', 'cost', 'contractor',
            'status', 'completion_date', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {
            'unit': {'required': False}  # Make unit optional for tenants
        }


# ─────────────────────────────────────────────
# MPESA ENGINE
# ─────────────────────────────────────────────

class MPESATransactionSerializer(serializers.ModelSerializer):
    matched_member_name = serializers.CharField(
        source='matched_member.full_name', read_only=True
    )
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = MPESATransaction
        fields = [
            'id', 'branch', 'branch_name', 'mpesa_ref', 'phone', 'amount',
            'transaction_date', 'sender_name', 'account_ref',
            'confidence', 'matched_member', 'matched_member_name',
            'is_allocated', 'is_duplicate', 'is_reversed',
            'allocation_notes', 'created_at',
        ]
        read_only_fields = ['id', 'confidence', 'is_duplicate', 'created_at']


class MPESACallbackSerializer(serializers.Serializer):
    """Daraja STK Push / C2B callback payload."""
    Body = serializers.DictField()


class MPESAUploadSerializer(serializers.Serializer):
    branch = serializers.UUIDField()
    file = serializers.FileField()


class MPESAManualAllocateSerializer(serializers.Serializer):
    mpesa_transaction_id = serializers.UUIDField()
    member_id = serializers.UUIDField()
    notes = serializers.CharField(required=False, allow_blank=True)


# ─────────────────────────────────────────────
# APPROVALS
# ─────────────────────────────────────────────

class ApprovalRequestSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.CharField(source='requested_by.full_name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.full_name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = ApprovalRequest
        fields = [
            'id', 'branch', 'branch_name', 'action_type', 'reference_id',
            'reference_model', 'requested_by', 'requested_by_name',
            'reviewed_by', 'reviewed_by_name', 'status', 'reason',
            'rejection_note', 'reviewed_at', 'payload', 'created_at',
        ]
        read_only_fields = [
            'id', 'requested_by', 'reviewed_by', 'reviewed_at', 'created_at',
        ]


class ApprovalActionSerializer(serializers.Serializer):
    notes = serializers.CharField(required=False, allow_blank=True)


class ApprovalRejectSerializer(serializers.Serializer):
    rejection_note = serializers.CharField()


# ─────────────────────────────────────────────
# AUDIT LOG
# ─────────────────────────────────────────────

class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_name', 'role', 'branch', 'branch_name',
            'action', 'model_name', 'object_id', 'old_value', 'new_value',
            'reason', 'ip_address', 'device', 'timestamp', 'approval_ref',
        ]
        read_only_fields = fields


# ─────────────────────────────────────────────
# NOTIFICATIONS
# ─────────────────────────────────────────────

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'channel',
            'is_read', 'sent_at', 'is_sent', 'created_at',
        ]
        read_only_fields = ['id', 'sent_at', 'is_sent', 'created_at']


class NotificationTemplateSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = NotificationTemplate
        fields = [
            'id', 'branch', 'branch_name', 'event_type', 'channel',
            'subject', 'body', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


# ─────────────────────────────────────────────
# DASHBOARD
# ─────────────────────────────────────────────

class DashboardSerializer(serializers.Serializer):
    """Role-aware KPI payload — fields populated dynamically in view."""
    role = serializers.CharField()
    branch = serializers.CharField(allow_null=True)

    # Tujijenge KPIs
    tujijenge_members = serializers.IntegerField(required=False)
    tujijenge_contributions_mtd = serializers.DecimalField(
        max_digits=15, decimal_places=2, required=False
    )
    tujijenge_loans_outstanding = serializers.DecimalField(
        max_digits=15, decimal_places=2, required=False
    )
    tujijenge_arrears = serializers.DecimalField(
        max_digits=15, decimal_places=2, required=False
    )

    # Wealth Alliance KPIs
    wa_investors = serializers.IntegerField(required=False)
    wa_total_capital = serializers.DecimalField(
        max_digits=15, decimal_places=2, required=False
    )
    wa_pending_withdrawals = serializers.IntegerField(required=False)

    # Table Banking KPIs
    tb_members = serializers.IntegerField(required=False)
    tb_lending_fund = serializers.DecimalField(
        max_digits=15, decimal_places=2, required=False
    )

    # Rentals KPIs
    rentals_properties = serializers.IntegerField(required=False)
    rentals_occupancy_rate = serializers.FloatField(required=False)
    rentals_rent_collected_mtd = serializers.DecimalField(
        max_digits=15, decimal_places=2, required=False
    )

    # M-Pesa
    mpesa_review_queue = serializers.IntegerField(required=False)
    mpesa_exception_queue = serializers.IntegerField(required=False)

    # Approvals
    pending_approvals = serializers.IntegerField(required=False)

    # Member self-portal
    my_balance = serializers.DecimalField(
        max_digits=15, decimal_places=2, required=False
    )
    my_loan_balance = serializers.DecimalField(
        max_digits=15, decimal_places=2, required=False
    )
    my_next_due = serializers.DateField(required=False, allow_null=True)