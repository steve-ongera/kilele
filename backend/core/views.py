from django.utils import timezone
from django.db import transaction
from django.db.models import Sum, Q, Count, DecimalField
from django.db.models.functions import Coalesce
from rest_framework import generics, status, views
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from decimal import Decimal
import csv, io, datetime
from dateutil.relativedelta import relativedelta

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
    BranchType, LoanStatus, ApprovalStatus, MPESAConfidence, UserRole,OccupancyStatus,
)
from .serializers import (
    RequestOTPSerializer, VerifyOTPSerializer,
    UserSerializer, UserCreateSerializer, UserProfileSerializer,
    BranchSerializer, SystemRuleSerializer,
    MemberListSerializer, MemberDetailSerializer, MemberCreateSerializer,
    ContributionSerializer, ContributionCreateSerializer,
    PaymentSerializer,
    LoanProductSerializer, LoanListSerializer, LoanDetailSerializer,
    LoanCreateSerializer, LoanApproveSerializer, LoanDisburseSerializer,
    LoanRepaymentSerializer,
    PenaltySerializer, PenaltyWaiveSerializer,
    AnnualDistributionSerializer,
    InvestorListSerializer, InvestorDetailSerializer, InvestorCreateSerializer,
    AssetClassSerializer, InvestmentTransactionSerializer,
    DividendDeclarationSerializer, InvestorWithdrawalSerializer,
    TableBankingMemberSerializer, TableBankingLendingFundSerializer,
    PropertySerializer, UnitSerializer,
    TenantListSerializer, TenantDetailSerializer, TenantCreateSerializer,
    LeaseSerializer, RentCollectionSerializer, MaintenanceRequestSerializer,
    MPESATransactionSerializer, MPESACallbackSerializer, MPESAUploadSerializer,
    MPESAManualAllocateSerializer,
    ApprovalRequestSerializer, ApprovalActionSerializer, ApprovalRejectSerializer,
    AuditLogSerializer,
    NotificationSerializer, NotificationTemplateSerializer,
    DashboardSerializer,
)
from .permissions import (
    IsSuperAdmin, IsBranchAdminOrAbove, IsFinanceOfficerOrAbove,
    IsAuditorOrAbove, IsMember, IsInvestor, IsTenant,
)
from .utils import send_otp_email, log_audit


# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def get_client_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    return x_forwarded.split(',')[0] if x_forwarded else request.META.get('REMOTE_ADDR')


def get_device(request):
    return request.META.get('HTTP_USER_AGENT', '')[:300]


# ─────────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────────

class RequestOTPView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RequestOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            # Don't reveal whether the email exists
            return Response({'detail': 'If that email is registered, an OTP has been sent.'})

        import random, string
        token = ''.join(random.choices(string.digits, k=6))
        expires_at = timezone.now() + datetime.timedelta(minutes=10)
        OTPToken.objects.filter(user=user, is_used=False).update(is_used=True)
        OTPToken.objects.create(user=user, token=token, expires_at=expires_at)
        send_otp_email(user, token)
        return Response({'detail': 'If that email is registered, an OTP has been sent.'})


class VerifyOTPView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        token = serializer.validated_data['token']

        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        otp = OTPToken.objects.filter(user=user, token=token, is_used=False).first()
        if not otp or not otp.is_valid():
            return Response({'detail': 'Invalid or expired OTP.'}, status=status.HTTP_401_UNAUTHORIZED)

        otp.is_used = True
        otp.save()

        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        refresh = RefreshToken.for_user(user)
        log_audit(
            user=user, action='LOGIN', ip_address=get_client_ip(request),
            device=get_device(request)
        )
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })


class TokenRefreshView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'detail': 'Refresh token required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            refresh = RefreshToken(refresh_token)
            return Response({'access': str(refresh.access_token)})
        except Exception:
            return Response({'detail': 'Invalid or expired refresh token.'}, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass
        log_audit(user=request.user, action='LOGOUT', ip_address=get_client_ip(request))
        return Response({'detail': 'Logged out successfully.'})


# ─────────────────────────────────────────────
# DASHBOARD
# ─────────────────────────────────────────────

class DashboardView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = user.role
        branch = user.branch
        now = timezone.now()
        data = {'role': role, 'branch': branch.name if branch else None}

        if role == UserRole.SUPER_ADMIN:
            data.update(self._super_admin_kpis())
        elif role in [UserRole.BRANCH_ADMIN, UserRole.FINANCE_OFFICER]:
            data.update(self._branch_kpis(branch))
        elif role == UserRole.MEMBER:
            data.update(self._member_kpis(user))
        elif role == UserRole.INVESTOR:
            data.update(self._investor_kpis(user))
        elif role == UserRole.TENANT:
            data.update(self._tenant_kpis(user))
        elif role == UserRole.AUDITOR:
            data.update(self._super_admin_kpis())

        return Response(data)

    def _super_admin_kpis(self):
        now = timezone.now()
        return {
            'tujijenge_members': Member.objects.filter(
                branch__branch_type=BranchType.TUJIJENGE, status='ACTIVE'
            ).count(),
            'tujijenge_contributions_mtd': Contribution.objects.filter(
                period_year=now.year, period_month=now.month, status='POSTED'
            ).aggregate(t=Sum('paid'))['t'] or 0,
            'tujijenge_loans_outstanding': Loan.objects.filter(
                status__in=['PERFORMING', 'DISBURSED', 'WATCHLIST', 'OVERDUE']
            ).aggregate(t=Sum('balance'))['t'] or 0,
            'tujijenge_arrears': Contribution.objects.aggregate(t=Sum('arrears'))['t'] or 0,
            'wa_investors': Investor.objects.filter(status='ACTIVE').count(),
            'tb_members': Member.objects.filter(
                branch__branch_type=BranchType.TABLE_BANKING, status='ACTIVE'
            ).count(),
            'rentals_properties': Property.objects.filter(status='ACTIVE').count(),
            'mpesa_review_queue': MPESATransaction.objects.filter(
                confidence=MPESAConfidence.REVIEW, is_allocated=False
            ).count(),
            'mpesa_exception_queue': MPESATransaction.objects.filter(
                confidence=MPESAConfidence.EXCEPTION, is_allocated=False
            ).count(),
            'pending_approvals': ApprovalRequest.objects.filter(status='PENDING').count(),
        }

    def _branch_kpis(self, branch):
        if not branch:
            return {}
        now = timezone.now()
        return {
            'tujijenge_members': Member.objects.filter(branch=branch, status='ACTIVE').count(),
            'tujijenge_contributions_mtd': Contribution.objects.filter(
                member__branch=branch, period_year=now.year,
                period_month=now.month, status='POSTED'
            ).aggregate(t=Sum('paid'))['t'] or 0,
            'tujijenge_loans_outstanding': Loan.objects.filter(
                branch=branch, status__in=['PERFORMING', 'DISBURSED', 'WATCHLIST', 'OVERDUE']
            ).aggregate(t=Sum('balance'))['t'] or 0,
            'pending_approvals': ApprovalRequest.objects.filter(
                branch=branch, status='PENDING'
            ).count(),
            'mpesa_review_queue': MPESATransaction.objects.filter(
                branch=branch, confidence=MPESAConfidence.REVIEW, is_allocated=False
            ).count(),
        }

    def _member_kpis(self, user):
        try:
            member = user.member
        except Exception:
            return {}
        active_loan = member.loans.filter(
            status__in=['PERFORMING', 'DISBURSED']
        ).first()
        next_contribution = Contribution.objects.filter(
            member=member, status='PENDING'
        ).order_by('due_date').first()
        return {
            'my_balance': member.total_contributions,
            'my_loan_balance': active_loan.balance if active_loan else 0,
            'my_next_due': next_contribution.due_date if next_contribution else None,
        }

    def _investor_kpis(self, user):
        try:
            investor = user.investor
        except Exception:
            return {}
        return {
            'my_balance': investor.current_capital,
            'wa_pending_withdrawals': investor.withdrawals.filter(
                status__in=['PENDING', 'UNDER_REVIEW']
            ).count(),
        }

    def _tenant_kpis(self, user):
        try:
            tenant = user.tenant
        except Exception:
            return {}
        now = timezone.now()
        current_rent = RentCollection.objects.filter(
            tenant=tenant, period_year=now.year, period_month=now.month
        ).first()
        return {
            'my_balance': current_rent.paid if current_rent else 0,
            'my_next_due': current_rent.due_date if current_rent and hasattr(current_rent, 'due_date') else None,
        }


# ─────────────────────────────────────────────
# USERS (Super Admin)
# ─────────────────────────────────────────────

class UserListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]  # Remove IsSuperAdmin
    serializer_class = UserCreateSerializer

    def get_permissions(self):
        # For POST (create), check role-based permissions
        if self.request.method == 'POST':
            user = self.request.user
            # Super Admins can create any user
            if user.role == UserRole.SUPER_ADMIN:
                return [IsAuthenticated()]
            # Branch Admins can only create MEMBERS
            if user.role == UserRole.BRANCH_ADMIN:
                # Check if the user being created is a MEMBER
                role = self.request.data.get('role', 'MEMBER')
                if role != UserRole.MEMBER:
                    from rest_framework.permissions import BasePermission
                    class DenyCreateNonMember(BasePermission):
                        def has_permission(self, request, view):
                            return False
                    return [IsAuthenticated(), DenyCreateNonMember()]
                return [IsAuthenticated()]
            # Finance Officers cannot create users
            return [IsAuthenticated(), IsSuperAdmin()]
        # GET (list) requires Super Admin
        return [IsAuthenticated(), IsSuperAdmin()]

    def get_serializer_class(self):
        return UserCreateSerializer if self.request.method == 'POST' else UserSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        role = self.request.query_params.get('role')
        branch = self.request.query_params.get('branch')
        if role:
            qs = qs.filter(role=role)
        if branch:
            qs = qs.filter(branch__id=branch)
        return qs

    def perform_create(self, serializer):
        # Ensure Branch Admins can only create MEMBERS
        user = self.request.user
        if user.role == UserRole.BRANCH_ADMIN:
            # Force role to MEMBER
            serializer.save(role=UserRole.MEMBER, branch=user.branch)
        else:
            serializer.save()
        log_audit(user=self.request.user, action='CREATE_USER',
                  model_name='User', object_id=str(serializer.instance.id),
                  new_value={'email': serializer.instance.email, 'role': serializer.instance.role})

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    queryset = User.objects.all()
    serializer_class = UserSerializer


class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user


# ─────────────────────────────────────────────
# BRANCHES
# ─────────────────────────────────────────────

class BranchListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsBranchAdminOrAbove]
    serializer_class = BranchSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.SUPER_ADMIN:
            return Branch.objects.all().order_by('name')
        return Branch.objects.filter(id=user.branch_id)

    def perform_create(self, serializer):
        branch = serializer.save(created_by=self.request.user)
        log_audit(user=self.request.user, action='CREATE_BRANCH',
                  model_name='Branch', object_id=str(branch.id),
                  new_value={'name': branch.name})


class BranchDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsBranchAdminOrAbove]
    serializer_class = BranchSerializer
    queryset = Branch.objects.all()

    def perform_update(self, serializer):
        old = BranchSerializer(self.get_object()).data
        branch = serializer.save()
        log_audit(user=self.request.user, action='UPDATE_BRANCH',
                  model_name='Branch', object_id=str(branch.id),
                  old_value=old, new_value=BranchSerializer(branch).data)


# ─────────────────────────────────────────────
# SYSTEM RULES
# ─────────────────────────────────────────────

class SystemRuleListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsBranchAdminOrAbove]
    serializer_class = SystemRuleSerializer

    def get_queryset(self):
        user = self.request.user
        qs = SystemRule.objects.all().order_by('branch', 'key', '-version')
        if user.role != UserRole.SUPER_ADMIN and user.branch:
            qs = qs.filter(branch=user.branch)
        return qs


class SystemRuleUpdateView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    serializer_class = SystemRuleSerializer
    queryset = SystemRule.objects.all()
    lookup_field = 'key'

    def perform_update(self, serializer):
        old = SystemRuleSerializer(self.get_object()).data
        rule = serializer.save()
        log_audit(user=self.request.user, action='UPDATE_RULE',
                  model_name='SystemRule', object_id=str(rule.id),
                  old_value=old, new_value=SystemRuleSerializer(rule).data)


# ─────────────────────────────────────────────
# MEMBERS
# ─────────────────────────────────────────────

class MemberListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsFinanceOfficerOrAbove]

    def get_serializer_class(self):
        return MemberCreateSerializer if self.request.method == 'POST' else MemberListSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Member.objects.select_related('branch', 'user').order_by('-date_joined')
        if user.role != UserRole.SUPER_ADMIN and user.branch:
            qs = qs.filter(branch=user.branch)
        # Filters
        status_f = self.request.query_params.get('status')
        branch_f = self.request.query_params.get('branch')
        search = self.request.query_params.get('search')
        if status_f:
            qs = qs.filter(status=status_f)
        if branch_f:
            qs = qs.filter(branch__id=branch_f)
        if search:
            qs = qs.filter(
                Q(full_name__icontains=search) |
                Q(member_number__icontains=search) |
                Q(phone__icontains=search)
            )
        return qs

    def perform_create(self, serializer):
        member = serializer.save(created_by=self.request.user)
        log_audit(user=self.request.user, action='CREATE_MEMBER',
                  model_name='Member', object_id=str(member.id),
                  new_value={'member_number': member.member_number, 'name': member.full_name})


class MemberDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsFinanceOfficerOrAbove]
    queryset = Member.objects.select_related('branch', 'user')

    def get_serializer_class(self):
        return MemberCreateSerializer if self.request.method in ['PUT', 'PATCH'] else MemberDetailSerializer


class MemberStatementView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            member = Member.objects.get(pk=pk)
        except Member.DoesNotExist:
            return Response({'detail': 'Member not found.'}, status=404)

        # Permission: member can only see own statement
        if request.user.role == UserRole.MEMBER:
            if not hasattr(request.user, 'member') or request.user.member.id != member.id:
                return Response({'detail': 'Forbidden.'}, status=403)

        contributions = ContributionSerializer(
            member.contributions.order_by('-period_year', '-period_month'), many=True
        ).data
        loans = LoanListSerializer(
            member.loans.order_by('-created_at'), many=True
        ).data
        payments = PaymentSerializer(
            member.payments.order_by('-payment_date'), many=True
        ).data
        penalties = PenaltySerializer(
            member.penalties.order_by('-created_at'), many=True
        ).data

        summary = {
            'total_contributions': str(member.total_contributions),
            'loan_limit': str(member.loan_limit),
            'advance_credit': str(member.advance_credit),
            'active_loans': member.loans.filter(
                status__in=['PERFORMING', 'DISBURSED']
            ).count(),
            'total_arrears': str(
                member.contributions.aggregate(t=Sum('arrears'))['t'] or 0
            ),
        }

        return Response({
            'member': MemberDetailSerializer(member).data,
            'contributions': contributions,
            'loans': loans,
            'payments': payments,
            'penalties': penalties,
            'summary': summary,
        })


# ─────────────────────────────────────────────
# CONTRIBUTIONS
# ─────────────────────────────────────────────

class ContributionListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsFinanceOfficerOrAbove]

    def get_serializer_class(self):
        return ContributionCreateSerializer if self.request.method == 'POST' else ContributionSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Contribution.objects.select_related('member').order_by('-period_year', '-period_month')
        if user.role != UserRole.SUPER_ADMIN and user.branch:
            qs = qs.filter(member__branch=user.branch)
        member_id = self.request.query_params.get('member')
        year = self.request.query_params.get('year')
        month = self.request.query_params.get('month')
        if member_id:
            qs = qs.filter(member__id=member_id)
        if year:
            qs = qs.filter(period_year=year)
        if month:
            qs = qs.filter(period_month=month)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ContributionDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsFinanceOfficerOrAbove]
    serializer_class = ContributionSerializer
    queryset = Contribution.objects.select_related('member')


# ─────────────────────────────────────────────
# LOANS
# ─────────────────────────────────────────────

# LOANS - Updated to allow MEMBERS to view products
import logging
logger = logging.getLogger(__name__)

class LoanProductListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LoanProductSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsBranchAdminOrAbove()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        logger.info(f"=== Loan Products Request ===")
        logger.info(f"User: {user.email}, Role: {user.role}, Branch: {user.branch}")
        
        qs = LoanProduct.objects.filter(is_active=True)
        
        # MEMBERS can only see products from their branch
        if user.role == UserRole.MEMBER:
            try:
                member = user.member
                logger.info(f"Member found: {member.member_number}, Branch: {member.branch}")
                if member.branch:
                    qs = qs.filter(branch=member.branch)
                    logger.info(f"Filtering products for branch: {member.branch.name}")
                else:
                    logger.warning(f"Member {member.member_number} has no branch assigned!")
                    return qs.none()
            except Exception as e:
                logger.error(f"Error getting member: {e}")
                return qs.none()
        # Other non-super admins see only their branch products
        elif user.role != UserRole.SUPER_ADMIN and user.branch:
            qs = qs.filter(branch=user.branch)
            logger.info(f"Filtering products for user branch: {user.branch.name}")
        
        logger.info(f"Found {qs.count()} loan products")
        for product in qs:
            logger.info(f"  Product: {product.name}, Branch: {product.branch.name if product.branch else 'No Branch'}")
        
        return qs


class LoanListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]  # Allow any authenticated user

    def get_serializer_class(self):
        return LoanCreateSerializer if self.request.method == 'POST' else LoanListSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Loan.objects.select_related('member', 'product').order_by('-created_at')
        
        if user.role == UserRole.MEMBER:
            try:
                member = user.member
                qs = qs.filter(member=member)
            except:
                return qs.none()
        elif user.role != UserRole.SUPER_ADMIN and user.branch:
            qs = qs.filter(branch=user.branch)
            
        status_f = self.request.query_params.get('status')
        member_id = self.request.query_params.get('member')
        if status_f:
            qs = qs.filter(status=status_f)
        if member_id:
            qs = qs.filter(member__id=member_id)
        return qs

    def perform_create(self, serializer):
        import uuid
        user = self.request.user
        print(f"=== Creating Loan ===")
        print(f"User: {user.email}, Role: {user.role}")
        print(f"Validated data: {serializer.validated_data}")
        
        # Determine member - either from request data or from the authenticated user
        member = serializer.validated_data.get('member')
        
        # If user is a MEMBER, use their own member record
        if user.role == UserRole.MEMBER:
            try:
                member = user.member
                print(f"Using member from user: {member.member_number}")
            except Exception as e:
                print(f"Error getting member: {e}")
                from rest_framework import serializers
                raise serializers.ValidationError("No member profile found for this user.")
        elif not member:
            from rest_framework import serializers
            raise serializers.ValidationError("Member is required")
            
        # Auto-generate loan number
        loan_number = f"LN-{uuid.uuid4().hex[:8].upper()}"
        print(f"Generated loan number: {loan_number}")
        
        # Save the loan
        loan = serializer.save(
            created_by=user,
            status=LoanStatus.PENDING,
            branch=member.branch,
            loan_number=loan_number,
            member=member
        )
        print(f"Loan created: {loan.loan_number}")
        
        # Auto-create approval request
        ApprovalRequest.objects.create(
            branch=loan.branch,
            action_type='LOAN',
            reference_id=loan.id,
            reference_model='Loan',
            requested_by=user,
            reason=f'Loan application {loan.loan_number} for {loan.member.full_name}',
            payload={'loan_number': loan.loan_number, 'principal': str(loan.principal)},
        )
        log_audit(user=user, action='CREATE_LOAN',
                  model_name='Loan', object_id=str(loan.id),
                  new_value={'loan_number': loan.loan_number, 'principal': str(loan.principal)})
        
class LoanDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsFinanceOfficerOrAbove]
    queryset = Loan.objects.select_related('member', 'product', 'approved_by')

    def get_serializer_class(self):
        return LoanCreateSerializer if self.request.method in ['PUT', 'PATCH'] else LoanDetailSerializer


class LoanApproveView(views.APIView):
    permission_classes = [IsAuthenticated, IsBranchAdminOrAbove]

    def post(self, request, pk):
        try:
            loan = Loan.objects.get(pk=pk)
        except Loan.DoesNotExist:
            return Response({'detail': 'Loan not found.'}, status=404)

        if loan.approval_status != ApprovalStatus.PENDING:
            return Response({'detail': 'Loan is not in PENDING state.'}, status=400)

        serializer = LoanApproveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        loan.approval_status = ApprovalStatus.APPROVED
        loan.status = LoanStatus.APPROVED
        loan.approved_by = request.user
        loan.notes = serializer.validated_data.get('notes', loan.notes)
        loan.save()

        ApprovalRequest.objects.filter(
            reference_id=loan.id, action_type='LOAN', status='PENDING'
        ).update(
            status=ApprovalStatus.APPROVED,
            reviewed_by=request.user,
            reviewed_at=timezone.now(),
        )

        log_audit(user=request.user, action='APPROVE_LOAN',
                  model_name='Loan', object_id=str(loan.id))
        return Response(LoanDetailSerializer(loan).data)


class LoanDisburseView(views.APIView):
    permission_classes = [IsAuthenticated, IsBranchAdminOrAbove]

    def post(self, request, pk):
        try:
            loan = Loan.objects.get(pk=pk)
        except Loan.DoesNotExist:
            return Response({'detail': 'Loan not found.'}, status=404)

        if loan.status != LoanStatus.APPROVED:
            return Response({'detail': 'Loan must be APPROVED before disbursement.'}, status=400)

        serializer = LoanDisburseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        disbursement_date = serializer.validated_data['disbursement_date']
        from dateutil.relativedelta import relativedelta
        loan.status = LoanStatus.DISBURSED
        loan.disbursement_date = disbursement_date
        loan.maturity_date = disbursement_date + relativedelta(months=loan.product.duration_months)
        loan.save()

        log_audit(user=request.user, action='DISBURSE_LOAN',
                  model_name='Loan', object_id=str(loan.id),
                  new_value={'disbursement_date': str(disbursement_date)})
        return Response(LoanDetailSerializer(loan).data)


# ─────────────────────────────────────────────
# PENALTIES
# ─────────────────────────────────────────────

class PenaltyListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsFinanceOfficerOrAbove]
    serializer_class = PenaltySerializer

    def get_queryset(self):
        user = self.request.user
        qs = Penalty.objects.select_related('member', 'waived_by').order_by('-created_at')
        if user.role != UserRole.SUPER_ADMIN and user.branch:
            qs = qs.filter(branch=user.branch)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class PenaltyWaiveView(views.APIView):
    permission_classes = [IsAuthenticated, IsBranchAdminOrAbove]

    def post(self, request, pk):
        try:
            penalty = Penalty.objects.get(pk=pk)
        except Penalty.DoesNotExist:
            return Response({'detail': 'Penalty not found.'}, status=404)

        if penalty.is_waived:
            return Response({'detail': 'Penalty already waived.'}, status=400)

        serializer = PenaltyWaiveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        penalty.is_waived = True
        penalty.waived_by = request.user
        penalty.waived_at = timezone.now()
        penalty.waiver_reason = serializer.validated_data['waiver_reason']
        penalty.save()

        log_audit(user=request.user, action='WAIVE_PENALTY',
                  model_name='Penalty', object_id=str(penalty.id))
        return Response(PenaltySerializer(penalty).data)


# ─────────────────────────────────────────────
# ANNUAL DISTRIBUTION
# ─────────────────────────────────────────────

class AnnualDistributionListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsBranchAdminOrAbove]
    serializer_class = AnnualDistributionSerializer

    def get_queryset(self):
        user = self.request.user
        qs = AnnualDistribution.objects.order_by('-year')
        if user.role != UserRole.SUPER_ADMIN and user.branch:
            qs = qs.filter(branch=user.branch)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AnnualDistributionDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsBranchAdminOrAbove]
    serializer_class = AnnualDistributionSerializer
    queryset = AnnualDistribution.objects.prefetch_related('entries__member')


# ─────────────────────────────────────────────
# WEALTH ALLIANCE — INVESTORS
# ─────────────────────────────────────────────

class InvestorListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsFinanceOfficerOrAbove]

    def get_serializer_class(self):
        return InvestorCreateSerializer if self.request.method == 'POST' else InvestorListSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Investor.objects.select_related('branch').order_by('-join_date')
        if user.role != UserRole.SUPER_ADMIN and user.branch:
            qs = qs.filter(branch=user.branch)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(full_name__icontains=search) |
                Q(investor_number__icontains=search) |
                Q(phone__icontains=search)
            )
        return qs

    def perform_create(self, serializer):
        investor = serializer.save(created_by=self.request.user)
        log_audit(user=self.request.user, action='CREATE_INVESTOR',
                  model_name='Investor', object_id=str(investor.id))


class InvestorDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsFinanceOfficerOrAbove]
    queryset = Investor.objects.select_related('branch', 'user')

    def get_serializer_class(self):
        return InvestorCreateSerializer if self.request.method in ['PUT', 'PATCH'] else InvestorDetailSerializer


class InvestmentTransactionListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsFinanceOfficerOrAbove]
    serializer_class = InvestmentTransactionSerializer

    def get_queryset(self):
        user = self.request.user
        qs = InvestmentTransaction.objects.select_related('investor', 'asset_class').order_by('-transaction_date')
        if user.role != UserRole.SUPER_ADMIN and user.branch:
            qs = qs.filter(branch=user.branch)
        investor_id = self.request.query_params.get('investor')
        if investor_id:
            qs = qs.filter(investor__id=investor_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class DividendDeclarationListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsBranchAdminOrAbove]
    serializer_class = DividendDeclarationSerializer

    def get_queryset(self):
        user = self.request.user
        qs = DividendDeclaration.objects.order_by('-declaration_date')
        if user.role != UserRole.SUPER_ADMIN and user.branch:
            qs = qs.filter(branch=user.branch)
        return qs

    @transaction.atomic
    def perform_create(self, serializer):
        declaration = serializer.save(created_by=self.request.user)
        # Auto-compute per-investor dividends
        branch = declaration.branch
        investors = Investor.objects.filter(branch=branch, status='ACTIVE')
        total_capital = sum(inv.current_capital for inv in investors) or Decimal('1')
        declaration.total_capital = total_capital
        declaration.save(update_fields=['total_capital'])
        for investor in investors:
            cap = investor.current_capital
            share_pct = (cap / total_capital * 100) if total_capital else 0
            dividend_amount = declaration.pool_amount * (cap / total_capital) if total_capital else 0
            InvestorDividend.objects.create(
                declaration=declaration,
                investor=investor,
                investor_share_pct=share_pct,
                dividend_amount=dividend_amount,
                created_by=self.request.user,
            )


class DividendDeclarationDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsBranchAdminOrAbove]
    serializer_class = DividendDeclarationSerializer
    queryset = DividendDeclaration.objects.prefetch_related('investor_dividends__investor')


class InvestorWithdrawalListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsFinanceOfficerOrAbove]
    serializer_class = InvestorWithdrawalSerializer

    def get_queryset(self):
        user = self.request.user
        qs = InvestorWithdrawal.objects.select_related('investor').order_by('-created_at')
        if user.role != UserRole.SUPER_ADMIN and user.branch:
            qs = qs.filter(branch=user.branch)
        return qs

    def perform_create(self, serializer):
        withdrawal = serializer.save(created_by=self.request.user)
        ApprovalRequest.objects.create(
            branch=withdrawal.branch,
            action_type='WITHDRAWAL',
            reference_id=withdrawal.id,
            reference_model='InvestorWithdrawal',
            requested_by=self.request.user,
            reason=f'Withdrawal request by {withdrawal.investor.full_name}',
            payload={'amount': str(withdrawal.amount_requested), 'type': withdrawal.withdrawal_type},
        )


# ─────────────────────────────────────────────
# TABLE BANKING
# ─────────────────────────────────────────────

class TableBankingMemberListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsFinanceOfficerOrAbove]
    serializer_class = TableBankingMemberSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Member.objects.filter(
            branch__branch_type=BranchType.TABLE_BANKING
        ).select_related('branch')
        if user.role != UserRole.SUPER_ADMIN and user.branch:
            qs = qs.filter(branch=user.branch)
        return qs


class TableBankingLendingFundView(views.APIView):
    permission_classes = [IsAuthenticated, IsFinanceOfficerOrAbove]

    def get(self, request):
        user = request.user
        branches = Branch.objects.filter(branch_type=BranchType.TABLE_BANKING)
        if user.role != UserRole.SUPER_ADMIN and user.branch:
            branches = branches.filter(id=user.branch_id)

        results = []
        for branch in branches:
            members = Member.objects.filter(branch=branch)
            total_contrib = Contribution.objects.filter(
                member__in=members, status='POSTED'
            ).aggregate(t=Sum('paid'))['t'] or Decimal('0')

            total_interest = LoanRepayment.objects.filter(
                loan__branch=branch
            ).aggregate(t=Sum('interest_paid'))['t'] or Decimal('0')

            outstanding_loans = Loan.objects.filter(
                branch=branch,
                status__in=['PERFORMING', 'DISBURSED', 'WATCHLIST', 'OVERDUE']
            ).aggregate(t=Sum('balance'))['t'] or Decimal('0')

            total_withdrawals = InvestorWithdrawal.objects.filter(
                branch=branch, status='PAID'
            ).aggregate(t=Sum('amount_paid'))['t'] or Decimal('0')

            results.append({
                'branch_id': str(branch.id),
                'branch_name': branch.name,
                'total_contributions': total_contrib,
                'total_interest': total_interest,
                'outstanding_loans': outstanding_loans,
                'total_withdrawals': total_withdrawals,
                'total_charges': Decimal('0'),
                'available_fund': total_contrib + total_interest - outstanding_loans - total_withdrawals,
            })

        return Response(TableBankingLendingFundSerializer(results, many=True).data)


# ─────────────────────────────────────────────
# RENTALS
# ─────────────────────────────────────────────

class PropertyListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsFinanceOfficerOrAbove]
    serializer_class = PropertySerializer

    def get_queryset(self):
        user = self.request.user
        qs = Property.objects.select_related('branch', 'property_manager').order_by('name')
        if user.role != UserRole.SUPER_ADMIN and user.branch:
            qs = qs.filter(branch=user.branch)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class PropertyDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsBranchAdminOrAbove]
    serializer_class = PropertySerializer
    queryset = Property.objects.select_related('branch')


# RENTALS - Units (Updated to only show tenant's own unit)
class UnitListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UnitSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsFinanceOfficerOrAbove()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Unit.objects.select_related('property').order_by('property', 'unit_number')
        
        # TENANTS can only see their own unit
        if user.role == UserRole.TENANT:
            try:
                tenant = user.tenant
                # Only show the tenant's assigned unit
                if tenant.unit_id:
                    qs = qs.filter(id=tenant.unit_id)
                else:
                    # If tenant has no unit, return empty queryset
                    return qs.none()
            except:
                return qs.none()
        # MEMBERS and other roles can see all units (filtered by branch)
        elif user.role != UserRole.SUPER_ADMIN and user.branch:
            qs = qs.filter(property__branch=user.branch)
            
        # Additional filters
        property_id = self.request.query_params.get('property')
        if property_id:
            qs = qs.filter(property__id=property_id)
        occupancy = self.request.query_params.get('occupancy_status')
        if occupancy:
            qs = qs.filter(occupancy_status=occupancy)
            
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class UnitDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsFinanceOfficerOrAbove]
    serializer_class = UnitSerializer
    queryset = Unit.objects.select_related('property')


class TenantListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsFinanceOfficerOrAbove]

    def get_serializer_class(self):
        return TenantCreateSerializer if self.request.method == 'POST' else TenantListSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Tenant.objects.select_related('branch', 'unit').order_by('-move_in_date')
        if user.role != UserRole.SUPER_ADMIN and user.branch:
            qs = qs.filter(branch=user.branch)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(full_name__icontains=search) |
                Q(tenant_number__icontains=search) |
                Q(phone__icontains=search)
            )
        return qs

    def perform_create(self, serializer):
        tenant = serializer.save(created_by=self.request.user)
        if tenant.unit:
            tenant.unit.occupancy_status = 'OCCUPIED'
            tenant.unit.save(update_fields=['occupancy_status'])


class TenantDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsFinanceOfficerOrAbove]
    queryset = Tenant.objects.select_related('branch', 'unit')

    def get_serializer_class(self):
        return TenantCreateSerializer if self.request.method in ['PUT', 'PATCH'] else TenantDetailSerializer


class LeaseListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]  # Allow all authenticated users
    serializer_class = LeaseSerializer

    def get_permissions(self):
        # POST (create) requires Finance Officer or above
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsFinanceOfficerOrAbove()]
        # GET (list) is allowed for all authenticated users
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Lease.objects.select_related('tenant', 'unit').order_by('-start_date')
        
        # TENANTS can only see their own leases
        if user.role == UserRole.TENANT:
            try:
                tenant = user.tenant
                qs = qs.filter(tenant=tenant)
            except:
                return qs.none()
        # Other non-super admins see only their branch leases
        elif user.role != UserRole.SUPER_ADMIN and user.branch:
            qs = qs.filter(unit__property__branch=user.branch)
            
        # Additional filters
        tenant_id = self.request.query_params.get('tenant')
        unit_id = self.request.query_params.get('unit')
        if tenant_id:
            qs = qs.filter(tenant__id=tenant_id)
        if unit_id:
            qs = qs.filter(unit__id=unit_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class LeaseDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]  # Allow all authenticated users
    serializer_class = LeaseSerializer
    queryset = Lease.objects.select_related('tenant', 'unit')

    def get_permissions(self):
        # PUT/PATCH (update) requires Finance Officer or above
        if self.request.method in ['PUT', 'PATCH']:
            return [IsAuthenticated(), IsFinanceOfficerOrAbove()]
        # GET (retrieve) is allowed for all authenticated users
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        
        # TENANTS can only see their own leases
        if user.role == UserRole.TENANT:
            try:
                tenant = user.tenant
                qs = qs.filter(tenant=tenant)
            except:
                return qs.none()
        return qs


class RentCollectionDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]  # Allow all authenticated users
    serializer_class = RentCollectionSerializer
    queryset = RentCollection.objects.select_related('tenant', 'unit')

    def get_permissions(self):
        # PUT/PATCH (update) requires Finance Officer or above
        if self.request.method in ['PUT', 'PATCH']:
            return [IsAuthenticated(), IsFinanceOfficerOrAbove()]
        # GET (retrieve) is allowed for all authenticated users
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        
        # TENANTS can only see their own rent collections
        if user.role == UserRole.TENANT:
            try:
                tenant = user.tenant
                qs = qs.filter(tenant=tenant)
            except:
                return qs.none()
        return qs


class RentCollectionListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]  # Allow all authenticated users
    serializer_class = RentCollectionSerializer

    def get_permissions(self):
        # POST (create) requires Finance Officer or above
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsFinanceOfficerOrAbove()]
        # GET (list) is allowed for all authenticated users
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = RentCollection.objects.select_related('tenant', 'unit').order_by('-period_year', '-period_month')
        
        # TENANTS can only see their own rent collections
        if user.role == UserRole.TENANT:
            try:
                tenant = user.tenant
                qs = qs.filter(tenant=tenant)
            except:
                return qs.none()
        # Other non-super admins see only their branch rent collections
        elif user.role != UserRole.SUPER_ADMIN and user.branch:
            qs = qs.filter(tenant__branch=user.branch)
            
        # Additional filters
        tenant_id = self.request.query_params.get('tenant')
        year = self.request.query_params.get('year')
        month = self.request.query_params.get('month')
        if tenant_id:
            qs = qs.filter(tenant__id=tenant_id)
        if year:
            qs = qs.filter(period_year=year)
        if month:
            qs = qs.filter(period_month=month)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# RENTALS - Maintenance Requests (Updated for better tenant support)
# RENTALS - Maintenance Requests (Updated to not require unit in request for tenants)
class MaintenanceRequestListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MaintenanceRequestSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = MaintenanceRequest.objects.select_related('unit', 'tenant').order_by('-created_at')
        
        if user.role == UserRole.TENANT:
            try:
                qs = qs.filter(tenant=user.tenant)
            except Exception:
                return qs.none()
        elif user.role != UserRole.SUPER_ADMIN and user.branch:
            qs = qs.filter(unit__property__branch=user.branch)
            
        status_f = self.request.query_params.get('status')
        if status_f:
            qs = qs.filter(status=status_f)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == UserRole.TENANT:
            try:
                tenant = user.tenant
                # Always use the tenant's assigned unit
                if not tenant.unit_id:
                    from rest_framework import serializers
                    raise serializers.ValidationError({"unit": "No unit assigned to this tenant. Please contact property manager."})
                
                # Save with tenant's unit - ignore any unit sent in request
                serializer.save(
                    tenant=tenant,
                    unit=tenant.unit,  # Use the tenant's unit object
                    created_by=user
                )
            except Exception as e:
                from rest_framework import serializers
                raise serializers.ValidationError({"detail": f"Error: {str(e)}"})
        else:
            # For non-tenants, unit must be provided
            unit_id = self.request.data.get('unit')
            if not unit_id:
                from rest_framework import serializers
                raise serializers.ValidationError({"unit": "This field is required."})
            serializer.save(created_by=user)


class MaintenanceRequestDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsFinanceOfficerOrAbove]
    serializer_class = MaintenanceRequestSerializer
    queryset = MaintenanceRequest.objects.select_related('unit', 'tenant')


# ─────────────────────────────────────────────
# MPESA ENGINE
# ─────────────────────────────────────────────

class MPESACallbackView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.data
        try:
            self._process_callback(payload)
        except Exception as e:
            return Response({'ResultCode': 1, 'ResultDesc': str(e)})
        return Response({'ResultCode': 0, 'ResultDesc': 'Success'})

    def _process_callback(self, payload):
        from .utils import allocate_mpesa_transaction
        body = payload.get('Body', {})
        stk = body.get('stkCallback', body.get('C2BPayment', {}))

        result_code = stk.get('ResultCode', 1)
        if result_code != 0:
            return

        items = {
            item['Name']: item.get('Value')
            for item in stk.get('CallbackMetadata', {}).get('Item', [])
        }
        mpesa_ref = items.get('MpesaReceiptNumber') or stk.get('TransID', '')
        amount = Decimal(str(items.get('Amount', stk.get('TransAmount', 0))))
        phone = str(items.get('PhoneNumber', stk.get('MSISDN', ''))).lstrip('+')
        sender = items.get('Name', stk.get('FirstName', ''))
        account_ref = items.get('AccountReference', stk.get('BillRefNumber', ''))

        if MPESATransaction.objects.filter(mpesa_ref=mpesa_ref).exists():
            return

        txn = MPESATransaction.objects.create(
            mpesa_ref=mpesa_ref,
            phone=phone,
            amount=amount,
            transaction_date=timezone.now(),
            sender_name=sender,
            account_ref=account_ref,
            raw_payload=payload,
        )
        allocate_mpesa_transaction(txn)


class MPESAQueueView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsFinanceOfficerOrAbove]
    serializer_class = MPESATransactionSerializer

    def get_queryset(self):
        confidence = self.request.query_params.get('confidence', MPESAConfidence.REVIEW)
        qs = MPESATransaction.objects.filter(
            confidence=confidence, is_allocated=False
        ).order_by('-transaction_date')
        user = self.request.user
        if user.role != UserRole.SUPER_ADMIN and user.branch:
            qs = qs.filter(branch=user.branch)
        return qs


class MPESAExceptionView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsFinanceOfficerOrAbove]
    serializer_class = MPESATransactionSerializer

    def get_queryset(self):
        return MPESATransaction.objects.filter(
            confidence=MPESAConfidence.EXCEPTION, is_allocated=False
        ).order_by('-transaction_date')


class MPESAUploadView(views.APIView):
    permission_classes = [IsAuthenticated, IsFinanceOfficerOrAbove]

    def post(self, request):
        serializer = MPESAUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        branch_id = serializer.validated_data['branch']
        csv_file = serializer.validated_data['file']

        try:
            branch = Branch.objects.get(id=branch_id)
        except Branch.DoesNotExist:
            return Response({'detail': 'Branch not found.'}, status=404)

        decoded = csv_file.read().decode('utf-8')
        reader = csv.DictReader(io.StringIO(decoded))

        created, skipped = 0, 0
        from .utils import allocate_mpesa_transaction
        for row in reader:
            mpesa_ref = row.get('receipt', row.get('mpesa_ref', '')).strip()
            if not mpesa_ref:
                skipped += 1
                continue
            if MPESATransaction.objects.filter(mpesa_ref=mpesa_ref).exists():
                skipped += 1
                continue
            try:
                txn = MPESATransaction.objects.create(
                    branch=branch,
                    mpesa_ref=mpesa_ref,
                    phone=row.get('phone', '').strip(),
                    amount=Decimal(row.get('amount', '0').replace(',', '')),
                    transaction_date=timezone.now(),
                    sender_name=row.get('sender', row.get('name', '')).strip(),
                    account_ref=row.get('account_ref', row.get('ref', '')).strip(),
                    raw_payload=dict(row),
                )
                allocate_mpesa_transaction(txn)
                created += 1
            except Exception:
                skipped += 1

        return Response({'created': created, 'skipped': skipped})


class MPESAManualAllocateView(views.APIView):
    permission_classes = [IsAuthenticated, IsFinanceOfficerOrAbove]

    @transaction.atomic
    def post(self, request):
        serializer = MPESAManualAllocateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            txn = MPESATransaction.objects.get(id=serializer.validated_data['mpesa_transaction_id'])
            member = Member.objects.get(id=serializer.validated_data['member_id'])
        except (MPESATransaction.DoesNotExist, Member.DoesNotExist) as e:
            return Response({'detail': str(e)}, status=404)

        if txn.is_allocated:
            return Response({'detail': 'Transaction already allocated.'}, status=400)

        from .utils import allocate_payment_to_member
        allocate_payment_to_member(txn, member)

        txn.matched_member = member
        txn.is_allocated = True
        txn.allocation_notes = serializer.validated_data.get('notes', 'Manual allocation')
        txn.save()

        log_audit(user=request.user, action='MANUAL_ALLOCATE_MPESA',
                  model_name='MPESATransaction', object_id=str(txn.id),
                  new_value={'member': str(member.id), 'amount': str(txn.amount)})
        return Response({'detail': 'Allocated successfully.'})


# ─────────────────────────────────────────────
# APPROVALS
# ─────────────────────────────────────────────

class ApprovalListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsFinanceOfficerOrAbove]
    serializer_class = ApprovalRequestSerializer

    def get_queryset(self):
        user = self.request.user
        qs = ApprovalRequest.objects.select_related(
            'requested_by', 'reviewed_by', 'branch'
        ).order_by('-created_at')
        if user.role != UserRole.SUPER_ADMIN and user.branch:
            qs = qs.filter(branch=user.branch)
        status_f = self.request.query_params.get('status', 'PENDING')
        action_type = self.request.query_params.get('action_type')
        if status_f:
            qs = qs.filter(status=status_f)
        if action_type:
            qs = qs.filter(action_type=action_type)
        return qs


class ApprovalApproveView(views.APIView):
    permission_classes = [IsAuthenticated, IsBranchAdminOrAbove]

    def post(self, request, pk):
        try:
            approval = ApprovalRequest.objects.get(pk=pk, status='PENDING')
        except ApprovalRequest.DoesNotExist:
            return Response({'detail': 'Approval request not found or not pending.'}, status=404)

        approval.status = ApprovalStatus.APPROVED
        approval.reviewed_by = request.user
        approval.reviewed_at = timezone.now()
        approval.reason = request.data.get('notes', '')
        approval.save()

        log_audit(user=request.user, action='APPROVE_REQUEST',
                  model_name='ApprovalRequest', object_id=str(approval.id))
        return Response(ApprovalRequestSerializer(approval).data)


class ApprovalRejectView(views.APIView):
    permission_classes = [IsAuthenticated, IsBranchAdminOrAbove]

    def post(self, request, pk):
        try:
            approval = ApprovalRequest.objects.get(pk=pk, status='PENDING')
        except ApprovalRequest.DoesNotExist:
            return Response({'detail': 'Approval request not found or not pending.'}, status=404)

        serializer = ApprovalRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        approval.status = ApprovalStatus.REJECTED
        approval.reviewed_by = request.user
        approval.reviewed_at = timezone.now()
        approval.rejection_note = serializer.validated_data['rejection_note']
        approval.save()

        log_audit(user=request.user, action='REJECT_REQUEST',
                  model_name='ApprovalRequest', object_id=str(approval.id))
        return Response(ApprovalRequestSerializer(approval).data)


# ─────────────────────────────────────────────
# AUDIT LOG
# ─────────────────────────────────────────────

class AuditLogListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsAuditorOrAbove]
    serializer_class = AuditLogSerializer

    def get_queryset(self):
        user = self.request.user
        qs = AuditLog.objects.select_related('user', 'branch').order_by('-timestamp')
        if user.role != UserRole.SUPER_ADMIN and user.branch:
            qs = qs.filter(branch=user.branch)
        action = self.request.query_params.get('action')
        model = self.request.query_params.get('model')
        user_id = self.request.query_params.get('user')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if action:
            qs = qs.filter(action__icontains=action)
        if model:
            qs = qs.filter(model_name=model)
        if user_id:
            qs = qs.filter(user__id=user_id)
        if date_from:
            qs = qs.filter(timestamp__date__gte=date_from)
        if date_to:
            qs = qs.filter(timestamp__date__lte=date_to)
        return qs


# ─────────────────────────────────────────────
# REPORTS
# ─────────────────────────────────────────────

class ReportView(views.APIView):
    permission_classes = [IsAuthenticated, IsAuditorOrAbove]

    def get(self, request, report_type):
        fmt = request.query_params.get('format', 'json')
        branch_id = request.query_params.get('branch')
        year = request.query_params.get('year')
        month = request.query_params.get('month')

        generators = {
            'contributions': self._contributions_report,
            'loans': self._loans_report,
            'arrears': self._arrears_report,
            'members': self._members_report,
            'rent-collection': self._rent_collection_report,
        }

        if report_type not in generators:
            return Response({'detail': f'Unknown report type: {report_type}'}, status=400)

        data = generators[report_type](branch_id, year, month)

        if fmt == 'json':
            return Response(data)
        elif fmt == 'csv':
            return self._csv_response(data, report_type)
        else:
            return Response({'detail': 'Unsupported format. Use json or csv.'}, status=400)

    def _contributions_report(self, branch_id, year, month):
        qs = Contribution.objects.select_related('member__branch')
        if branch_id:
            qs = qs.filter(member__branch__id=branch_id)
        if year:
            qs = qs.filter(period_year=year)
        if month:
            qs = qs.filter(period_month=month)
        return ContributionSerializer(qs, many=True).data

    def _loans_report(self, branch_id, year, month):
        qs = Loan.objects.select_related('member', 'product')
        if branch_id:
            qs = qs.filter(branch__id=branch_id)
        return LoanListSerializer(qs, many=True).data

    def _arrears_report(self, branch_id, year, month):
        qs = Contribution.objects.filter(arrears__gt=0).select_related('member__branch')
        if branch_id:
            qs = qs.filter(member__branch__id=branch_id)
        return ContributionSerializer(qs, many=True).data

    def _members_report(self, branch_id, year, month):
        qs = Member.objects.select_related('branch')
        if branch_id:
            qs = qs.filter(branch__id=branch_id)
        return MemberListSerializer(qs, many=True).data

    def _rent_collection_report(self, branch_id, year, month):
        qs = RentCollection.objects.select_related('tenant', 'unit')
        if branch_id:
            qs = qs.filter(tenant__branch__id=branch_id)
        if year:
            qs = qs.filter(period_year=year)
        if month:
            qs = qs.filter(period_month=month)
        return RentCollectionSerializer(qs, many=True).data

    def _csv_response(self, data, report_type):
        from django.http import HttpResponse
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{report_type}.csv"'
        if not data:
            return response
        writer = csv.DictWriter(response, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
        return response


# ─────────────────────────────────────────────
# NOTIFICATIONS
# ─────────────────────────────────────────────

class NotificationListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(
            user=self.request.user
        ).order_by('-created_at')


class NotificationMarkReadView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response({'detail': 'Notification not found.'}, status=404)
        notif.is_read = True
        notif.save(update_fields=['is_read'])
        return Response({'detail': 'Marked as read.'})


class NotificationMarkAllReadView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'detail': 'All notifications marked as read.'})
    
# ─────────────────────────────────────────────
# DASHBOARD GRAPHS
# ─────────────────────────────────────────────

class DashboardGraphsView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()

        # ---- LINE GRAPH: contributions vs loans disbursed, last 6 months ----
        trend = []
        for i in range(5, -1, -1):
            m = today.replace(day=1) - relativedelta(months=i)

            contrib_qs = Contribution.objects.filter(
                period_year=m.year, period_month=m.month, status='POSTED'
            )
            loan_qs = Loan.objects.filter(
                disbursement_date__year=m.year, disbursement_date__month=m.month
            )
            if user.role != UserRole.SUPER_ADMIN and user.branch:
                contrib_qs = contrib_qs.filter(member__branch=user.branch)
                loan_qs = loan_qs.filter(branch=user.branch)

            trend.append({
                'month': m.strftime('%b %Y'),
                'contributions': float(contrib_qs.aggregate(t=Sum('paid'))['t'] or 0),
                'loans_disbursed': float(loan_qs.aggregate(t=Sum('principal'))['t'] or 0),
            })

        # ---- BAR GRAPH: members & contributions per branch ----
        branches_qs = Branch.objects.filter(is_active=True)
        if user.role != UserRole.SUPER_ADMIN and user.branch:
            branches_qs = branches_qs.filter(id=user.branch_id)

        branch_comparison = []
        for branch in branches_qs:
            member_count = Member.objects.filter(branch=branch, status='ACTIVE').count()
            total_contrib = Contribution.objects.filter(
                member__branch=branch, status='POSTED'
            ).aggregate(t=Sum('paid'))['t'] or 0
            branch_comparison.append({
                'branch_name': branch.name,
                'members': member_count,
                'contributions': float(total_contrib),
            })

        # ---- PIE CHART: active people per business unit ----
        distribution = [
            {'name': 'Tujijenge', 'value': Member.objects.filter(
                branch__branch_type=BranchType.TUJIJENGE, status='ACTIVE').count()},
            {'name': 'Table Banking', 'value': Member.objects.filter(
                branch__branch_type=BranchType.TABLE_BANKING, status='ACTIVE').count()},
            {'name': 'Wealth Alliance', 'value': Investor.objects.filter(status='ACTIVE').count()},
            {'name': 'Rentals', 'value': Tenant.objects.filter(status='ACTIVE').count()},
        ]

        return Response({
            'trend': trend,
            'branch_comparison': branch_comparison,
            'distribution': distribution,
        })
        
        

# ─────────────────────────────────────────────
# TUJIJENGE REPORT SUMMARY
# ─────────────────────────────────────────────

class TujijengeReportSummaryView(views.APIView):
    permission_classes = [IsAuthenticated, IsAuditorOrAbove]

    def get(self, request):
        user = request.user
        year = int(request.query_params.get('year', timezone.now().year))
        month = request.query_params.get('month')
        branch_id = request.query_params.get('branch')

        branch_qs = Branch.objects.filter(branch_type=BranchType.TUJIJENGE, is_active=True)
        if user.role != UserRole.SUPER_ADMIN and user.branch:
            branch_qs = branch_qs.filter(id=user.branch_id)
        if branch_id:
            branch_qs = branch_qs.filter(id=branch_id)

        members_qs = Member.objects.filter(branch__in=branch_qs)
        contrib_qs = Contribution.objects.filter(member__branch__in=branch_qs, period_year=year)
        loans_qs = Loan.objects.filter(branch__in=branch_qs)

        if month:
            contrib_qs = contrib_qs.filter(period_month=month)

        # ---- 4 STAT CARDS ----
        stats = {
            'total_members': members_qs.filter(status='ACTIVE').count(),
            'total_contributions': float(contrib_qs.filter(status='POSTED').aggregate(t=Sum('paid'))['t'] or 0),
            'total_loans_outstanding': float(loans_qs.filter(
                status__in=['PERFORMING', 'DISBURSED', 'WATCHLIST', 'OVERDUE']
            ).aggregate(t=Sum('balance'))['t'] or 0),
            'total_arrears': float(contrib_qs.aggregate(t=Sum('arrears'))['t'] or 0),
        }

        # ---- LINE GRAPH: contributions vs arrears across the year ----
        trend = []
        for m in range(1, 13):
            m_qs = Contribution.objects.filter(member__branch__in=branch_qs, period_year=year, period_month=m)
            trend.append({
                'month': datetime.date(year, m, 1).strftime('%b'),
                'contributions': float(m_qs.filter(status='POSTED').aggregate(t=Sum('paid'))['t'] or 0),
                'arrears': float(m_qs.aggregate(t=Sum('arrears'))['t'] or 0),
            })

        # ---- BAR GRAPH: loan portfolio by status ----
        loan_breakdown = []
        for st in LoanStatus.values:
            qs = loans_qs.filter(status=st)
            count = qs.count()
            if count:
                loan_breakdown.append({
                    'status': st,
                    'count': count,
                    'amount': float(qs.aggregate(t=Sum('balance'))['t'] or 0),
                })

        # ---- PIE: active members per branch ----
        branch_distribution = []
        for b in branch_qs:
            c = Member.objects.filter(branch=b, status='ACTIVE').count()
            if c:
                branch_distribution.append({'name': b.name, 'value': c})

        # ---- DETAIL TABLES ----
        contributions_table = ContributionSerializer(
            contrib_qs.select_related('member').order_by('-period_month')[:300], many=True
        ).data
        loans_table = LoanListSerializer(
            loans_qs.select_related('member', 'product').order_by('-created_at')[:300], many=True
        ).data
        arrears_table = ContributionSerializer(
            contrib_qs.filter(arrears__gt=0).select_related('member').order_by('-arrears')[:300], many=True
        ).data

        return Response({
            'stats': stats,
            'trend': trend,
            'loan_breakdown': loan_breakdown,
            'branch_distribution': branch_distribution,
            'contributions_table': contributions_table,
            'loans_table': loans_table,
            'arrears_table': arrears_table,
        })
        
        

# ─────────────────────────────────────────────
# RENTALS REPORT SUMMARY
# ─────────────────────────────────────────────

class RentalsReportSummaryView(views.APIView):
    permission_classes = [IsAuthenticated, IsAuditorOrAbove]

    def get(self, request):
        user = request.user
        year = int(request.query_params.get('year', timezone.now().year))
        month = request.query_params.get('month')
        property_id = request.query_params.get('property')

        prop_qs = Property.objects.filter(status='ACTIVE')
        if user.role != UserRole.SUPER_ADMIN and user.branch:
            prop_qs = prop_qs.filter(branch=user.branch)
        if property_id:
            prop_qs = prop_qs.filter(id=property_id)

        units_qs = Unit.objects.filter(property__in=prop_qs)
        rent_qs = RentCollection.objects.filter(unit__property__in=prop_qs, period_year=year)
        maint_qs = MaintenanceRequest.objects.filter(unit__property__in=prop_qs)

        if month:
            rent_qs = rent_qs.filter(period_month=month)

        # ---- 4 STAT CARDS ----
        total_units = units_qs.count()
        occupied_units = units_qs.filter(occupancy_status='OCCUPIED').count()
        occupancy_rate = round((occupied_units / total_units) * 100, 2) if total_units else 0

        stats = {
            'total_properties': prop_qs.count(),
            'occupancy_rate': occupancy_rate,
            'rent_collected': float(rent_qs.aggregate(t=Sum('paid'))['t'] or 0),
            'total_arrears': float(rent_qs.aggregate(t=Sum('arrears'))['t'] or 0),
        }

        # ---- LINE GRAPH: rent expected vs collected across the year ----
        trend = []
        for m in range(1, 13):
            m_qs = RentCollection.objects.filter(unit__property__in=prop_qs, period_year=year, period_month=m)
            trend.append({
                'month': datetime.date(year, m, 1).strftime('%b'),
                'expected': float(m_qs.aggregate(t=Sum('expected'))['t'] or 0),
                'collected': float(m_qs.aggregate(t=Sum('paid'))['t'] or 0),
            })

        # ---- BAR GRAPH: income vs maintenance cost per property ----
        profitability = []
        for p in prop_qs:
            income = RentCollection.objects.filter(
                unit__property=p, period_year=year
            ).aggregate(t=Sum('paid'))['t'] or 0
            cost = MaintenanceRequest.objects.filter(
                unit__property=p, status='COMPLETED'
            ).aggregate(t=Sum('cost'))['t'] or 0
            profitability.append({
                'property_name': p.name,
                'income': float(income),
                'maintenance_cost': float(cost),
                'net': float(income) - float(cost),
            })

        # ---- PIE: occupancy status distribution ----
        occupancy_distribution = []
        for st, label in OccupancyStatus.choices:
            c = units_qs.filter(occupancy_status=st).count()
            if c:
                occupancy_distribution.append({'name': label, 'value': c})

        # ---- DETAIL TABLES ----
        rent_collection_table = RentCollectionSerializer(
            rent_qs.select_related('tenant', 'unit').order_by('-period_month')[:300], many=True
        ).data
        arrears_table = RentCollectionSerializer(
            rent_qs.filter(arrears__gt=0).select_related('tenant', 'unit').order_by('-arrears')[:300], many=True
        ).data
        occupancy_table = UnitSerializer(
            units_qs.select_related('property').order_by('property', 'unit_number')[:300], many=True
        ).data
        maintenance_table = MaintenanceRequestSerializer(
            maint_qs.select_related('unit', 'tenant').order_by('-created_at')[:300], many=True
        ).data

        return Response({
            'stats': stats,
            'trend': trend,
            'profitability': profitability,
            'occupancy_distribution': occupancy_distribution,
            'rent_collection_table': rent_collection_table,
            'arrears_table': arrears_table,
            'occupancy_table': occupancy_table,
            'maintenance_table': maintenance_table,
        })
        
        

# ─────────────────────────────────────────────
# TABLE BANKING REPORT SUMMARY
# ─────────────────────────────────────────────

class TBReportSummaryView(views.APIView):
    permission_classes = [IsAuthenticated, IsAuditorOrAbove]

    def get(self, request):
        user = request.user
        year = int(request.query_params.get('year', timezone.now().year))
        month = request.query_params.get('month')
        branch_id = request.query_params.get('branch')

        branch_qs = Branch.objects.filter(branch_type=BranchType.TABLE_BANKING, is_active=True)
        if user.role != UserRole.SUPER_ADMIN and user.branch:
            branch_qs = branch_qs.filter(id=user.branch_id)
        if branch_id:
            branch_qs = branch_qs.filter(id=branch_id)

        members_qs = Member.objects.filter(branch__in=branch_qs)
        contrib_qs = Contribution.objects.filter(member__branch__in=branch_qs, period_year=year)
        loans_qs = Loan.objects.filter(branch__in=branch_qs)

        if month:
            contrib_qs = contrib_qs.filter(period_month=month)

        # ---- 4 STAT CARDS ----
        total_contrib = contrib_qs.filter(status='POSTED').aggregate(t=Sum('paid'))['t'] or 0
        total_interest = LoanRepayment.objects.filter(
            loan__branch__in=branch_qs
        ).aggregate(t=Sum('interest_paid'))['t'] or 0
        outstanding_loans = loans_qs.filter(
            status__in=['PERFORMING', 'DISBURSED', 'WATCHLIST', 'OVERDUE']
        ).aggregate(t=Sum('balance'))['t'] or 0
        lending_fund = float(total_contrib) + float(total_interest) - float(outstanding_loans)

        stats = {
            'total_members': members_qs.filter(status='ACTIVE').count(),
            'total_contributions': float(total_contrib),
            'loans_outstanding': float(outstanding_loans),
            'lending_fund': lending_fund,
        }

        # ---- LINE GRAPH: contributions vs loans disbursed across the year ----
        trend = []
        for m in range(1, 13):
            c_qs = Contribution.objects.filter(member__branch__in=branch_qs, period_year=year, period_month=m)
            l_qs = Loan.objects.filter(
                branch__in=branch_qs, disbursement_date__year=year, disbursement_date__month=m
            )
            trend.append({
                'month': datetime.date(year, m, 1).strftime('%b'),
                'contributions': float(c_qs.filter(status='POSTED').aggregate(t=Sum('paid'))['t'] or 0),
                'loans_disbursed': float(l_qs.aggregate(t=Sum('principal'))['t'] or 0),
            })

        # ---- BAR GRAPH: members & contributions per branch ----
        branch_comparison = []
        for b in branch_qs:
            branch_comparison.append({
                'branch_name': b.name,
                'members': Member.objects.filter(branch=b, status='ACTIVE').count(),
                'contributions': float(Contribution.objects.filter(
                    member__branch=b, period_year=year, status='POSTED'
                ).aggregate(t=Sum('paid'))['t'] or 0),
            })

        # ---- PIE: loan status distribution ----
        loan_distribution = []
        for st, label in LoanStatus.choices:
            c = loans_qs.filter(status=st).count()
            if c:
                loan_distribution.append({'name': label, 'value': c})

        # ---- DETAIL TABLES ----
        contributions_table = ContributionSerializer(
            contrib_qs.select_related('member').order_by('-period_month')[:300], many=True
        ).data
        loans_table = LoanListSerializer(
            loans_qs.select_related('member', 'product').order_by('-created_at')[:300], many=True
        ).data
        arrears_table = ContributionSerializer(
            contrib_qs.filter(arrears__gt=0).select_related('member').order_by('-arrears')[:300], many=True
        ).data
        members_table = MemberListSerializer(
            members_qs.select_related('branch').order_by('-date_joined')[:300], many=True
        ).data

        return Response({
            'stats': stats,
            'trend': trend,
            'branch_comparison': branch_comparison,
            'loan_distribution': loan_distribution,
            'contributions_table': contributions_table,
            'loans_table': loans_table,
            'arrears_table': arrears_table,
            'members_table': members_table,
        })