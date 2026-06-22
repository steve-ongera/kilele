"""
Management command to seed Kilele Ridge Group with realistic Kenyan demo data.

Usage:
    python manage.py seed_data
    python manage.py seed_data --flush   # wipes existing data first
"""

import random
import uuid
from datetime import date, timedelta, datetime
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from core.models import (
    User, UserRole, Branch, BranchType, SystemRule,
    Member, MemberStatus, Contribution, Payment, PaymentAllocation,
    LoanProduct, Loan, LoanStatus, LoanRepayment, Penalty,
    AnnualDistribution, DistributionEntry, DistributionStatus,
    Investor, AssetClass, InvestmentTransaction,
    DividendDeclaration, InvestorDividend, InvestorWithdrawal, WithdrawalStatus,
    Property, PropertyStatus, Unit, OccupancyStatus,
    Tenant, Lease, LeaseStatus, RentCollection, MaintenanceRequest, MaintenanceStatus,
    MPESATransaction, MPESAConfidence,
    ApprovalRequest, ApprovalStatus,
    AuditLog, Notification, NotificationTemplate,
)


# ─────────────────────────────────────────────
# KENYAN REFERENCE DATA
# ─────────────────────────────────────────────

FIRST_NAMES_M = [
    'James', 'John', 'Peter', 'David', 'Samuel', 'Daniel', 'Joseph', 'Michael',
    'Stephen', 'Paul', 'George', 'Patrick', 'Dennis', 'Kevin', 'Brian', 'Erick',
    'Felix', 'Anthony', 'Charles', 'Francis', 'Joshua', 'Moses', 'Vincent',
    'Wycliffe', 'Collins', 'Edwin', 'Geoffrey', 'Hillary', 'Isaac', 'Kennedy',
]

FIRST_NAMES_F = [
    'Mary', 'Jane', 'Grace', 'Faith', 'Joyce', 'Esther', 'Mercy', 'Catherine',
    'Susan', 'Agnes', 'Beatrice', 'Caroline', 'Diana', 'Eunice', 'Florence',
    'Gladys', 'Irene', 'Jacinta', 'Lucy', 'Margaret', 'Naomi', 'Patricia',
    'Rose', 'Sarah', 'Teresa', 'Veronica', 'Winnie', 'Yvonne', 'Brenda', 'Dorcas',
]

LAST_NAMES = [
    'Mwangi', 'Kamau', 'Kariuki', 'Njoroge', 'Maina', 'Otieno', 'Odinga', 'Owino',
    'Omondi', 'Were', 'Kipchoge', 'Kiprop', 'Cheruiyot', 'Korir', 'Wanjiru',
    'Wairimu', 'Akinyi', 'Adhiambo', 'Nyong\'o', 'Mutua', 'Kilonzo', 'Mwende',
    'Ochieng', 'Onyango', 'Wafula', 'Wekesa', 'Barasa', 'Simiyu', 'Chebet',
    'Jepkemboi', 'Kamande', 'Nderitu', 'Gathoni', 'Wambui', 'Njeri', 'Muthoni',
    'Hassan', 'Abdi', 'Mohamed', 'Said', 'Ali', 'Omar', 'Yusuf',
]

NAIROBI_AREAS = [
    'Westlands', 'Kilimani', 'Kileleshwa', 'Lavington', 'Karen', 'Runda',
    'South B', 'South C', 'Langata', 'Embakasi', 'Donholm', 'Buruburu',
    'Eastleigh', 'Pangani', 'Pumwani', 'Kasarani', 'Roysambu', 'Ruaka',
    'Kahawa West', 'Githurai', 'Umoja', 'Kayole', 'Dandora', 'Imara Daima',
    'Syokimau', 'Mlolongo', 'Ngong Road', 'Hurlingham', 'Upper Hill', 'CBD',
]

OTHER_TOWNS = ['Nakuru', 'Mombasa', 'Kisumu', 'Eldoret', 'Thika', 'Nyeri',
               'Machakos', 'Kitengela', 'Ruiru', 'Kiambu']

PROPERTY_NAMES = [
    'Riverside Apartments', 'Greenwood Court', 'Sunrise Villas', 'Palm Gardens',
    'Acacia Heights', 'Cedar Park Apartments', 'Jacaranda Court', 'Maple Residences',
    'Baobab Towers', 'Silver Springs', 'Garden City Flats', 'Mountain View Apartments',
]

CONTRACTORS = [
    'Jenga Fix Services', 'Quickfix Plumbing Ltd', 'Mzizi Electricals',
    'Safi Cleaning Co.', 'Bora Builders', 'Reliable Repairs Kenya',
]


def random_kenyan_name(gender=None):
    gender = gender or random.choice(['M', 'F'])
    first = random.choice(FIRST_NAMES_M if gender == 'M' else FIRST_NAMES_F)
    last = random.choice(LAST_NAMES)
    return f'{first} {last}', gender


def random_phone():
    prefix = random.choice(['0700', '0701', '0702', '0710', '0711', '0720',
                             '0721', '0722', '0723', '0733', '0740', '0741',
                             '0750', '0780', '0790', '0110', '0111', '0112'])
    return f'{prefix}{random.randint(100000, 999999)}'


def random_id_number():
    return str(random.randint(20000000, 39999999))


def random_location():
    if random.random() < 0.7:
        return f'{random.choice(NAIROBI_AREAS)}, Nairobi'
    return f'{random.choice(OTHER_TOWNS)}'


def email_from_name(name, domain='example.com'):
    slug = name.lower().replace(' ', '.').replace("'", '')
    return f'{slug}{random.randint(1, 999)}@{domain}'


# ─────────────────────────────────────────────
# COMMAND
# ─────────────────────────────────────────────

class Command(BaseCommand):
    help = 'Seed Kilele Ridge Group with realistic Kenyan demo data.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--flush', action='store_true',
            help='Delete existing seeded data before reseeding.'
        )

    def handle(self, *args, **options):
        if options['flush']:
            self.flush_data()

        self.stdout.write(self.style.WARNING('🌱 Seeding Kilele Ridge Group data...\n'))

        with transaction.atomic():
            self.users = {}
            self.branches = {}

            self.seed_users_and_branches()
            self.seed_system_rules()
            self.seed_tujijenge()
            self.seed_table_banking()
            self.seed_wealth_alliance()
            self.seed_rentals()
            self.seed_mpesa_transactions()
            self.seed_approvals()
            self.seed_notifications()
            self.seed_audit_logs()

        self.stdout.write(self.style.SUCCESS('\n✅ Seed complete! Kilele Ridge Group is ready.\n'))
        self.print_summary()

    # ─────────────────────────────────────────
    # FLUSH
    # ─────────────────────────────────────────

    def flush_data(self):
        self.stdout.write(self.style.WARNING('🗑  Flushing existing data...'))
        models_to_flush = [
            AuditLog, Notification, NotificationTemplate, ApprovalRequest,
            MPESATransaction, MaintenanceRequest, RentCollection, Lease, Unit,
            Tenant, Property, InvestorWithdrawal, InvestorDividend,
            DividendDeclaration, InvestmentTransaction, AssetClass, Investor,
            DistributionEntry, AnnualDistribution, Penalty, LoanRepayment,
            Loan, LoanProduct, PaymentAllocation, Payment, Contribution,
            Member, SystemRule, Branch,
        ]
        for model in models_to_flush:
            model.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()

    # ─────────────────────────────────────────
    # USERS & BRANCHES
    # ─────────────────────────────────────────

    def seed_users_and_branches(self):
        self.stdout.write('👥 Creating branches and staff users...')

        branch_defs = [
            ('Tujijenge Nairobi Central', BranchType.TUJIJENGE,
             'Main savings circle branch serving Nairobi CBD and environs.'),
            ('Tujijenge Eastlands', BranchType.TUJIJENGE,
             'Savings circle branch covering Eastlands estates.'),
            ('Wealth Alliance Capital', BranchType.WEALTH_ALLIANCE,
             'Investment management arm of Kilele Ridge Group.'),
            ('Table Banking Umoja Circle', BranchType.TABLE_BANKING,
             'Group lending and table banking for Umoja & Kayole members.'),
            ('Kilele Ridge Rentals', BranchType.RENTALS,
             'Property management and rental collection unit.'),
        ]
        for name, btype, desc in branch_defs:
            branch = Branch.objects.create(
                name=name, branch_type=btype, description=desc, is_active=True
            )
            self.branches[btype] = self.branches.get(btype, [])
            self.branches[btype].append(branch)

        # Super Admin
        super_admin = User.objects.create(
            email='admin@kileleridge.co.ke', full_name='Wanjiru Kamau',
            phone=random_phone(), role=UserRole.SUPER_ADMIN,
            is_staff=True, is_superuser=True, is_active=True,
        )
        super_admin.set_unusable_password()
        super_admin.save()
        self.users['super_admin'] = super_admin

        # Branch Admins (one per branch)
        self.users['branch_admins'] = []
        for btype, branches in self.branches.items():
            for branch in branches:
                name, _ = random_kenyan_name()
                admin = User.objects.create(
                    email=email_from_name(name, 'kileleridge.co.ke'),
                    full_name=name, phone=random_phone(),
                    role=UserRole.BRANCH_ADMIN, branch=branch,
                    is_staff=True, is_active=True,
                )
                admin.set_unusable_password()
                admin.save()
                self.users['branch_admins'].append(admin)

        # Finance Officers
        self.users['finance_officers'] = []
        for branch in self.branches[BranchType.TUJIJENGE] + self.branches[BranchType.TABLE_BANKING]:
            name, _ = random_kenyan_name()
            officer = User.objects.create(
                email=email_from_name(name, 'kileleridge.co.ke'),
                full_name=name, phone=random_phone(),
                role=UserRole.FINANCE_OFFICER, branch=branch,
                is_staff=True, is_active=True,
            )
            officer.set_unusable_password()
            officer.save()
            self.users['finance_officers'].append(officer)

        # Auditor
        name, _ = random_kenyan_name()
        auditor = User.objects.create(
            email=email_from_name(name, 'kileleridge.co.ke'),
            full_name=name, phone=random_phone(),
            role=UserRole.AUDITOR, is_staff=True, is_active=True,
        )
        auditor.set_unusable_password()
        auditor.save()
        self.users['auditor'] = auditor

        self.stdout.write(f'   ✓ {Branch.objects.count()} branches, '
                           f'{User.objects.filter(is_staff=True).count()} staff users')

    # ─────────────────────────────────────────
    # SYSTEM RULES
    # ─────────────────────────────────────────

    def seed_system_rules(self):
        self.stdout.write('⚙️  Creating business rules...')

        global_rules = [
            ('CONTRIBUTION_PER_SHARE', '2000', 'number', 'Contribution amount per share (KES)'),
            ('CONTRIBUTION_DEADLINE', '10', 'number', 'Day of month contributions are due'),
            ('INTEREST_RATE', '10', 'number', 'Monthly interest rate (%)'),
            ('LOAN_MULTIPLIER', '3', 'number', 'Loan eligibility multiplier on contributions'),
            ('REGISTRATION_FEE', '2000', 'number', 'One-time registration fee (KES)'),
            ('TABLE_BANKING_DEADLINE', '15', 'number', 'Day of month table banking dues are due'),
            ('EXIT_NOTICE_PERIOD', '60', 'number', 'Exit notice period in days'),
            ('MPESA_AUTO_CONFIDENCE', '90', 'number', 'Auto-allocation confidence threshold (%)'),
            ('MPESA_REVIEW_CONFIDENCE', '70', 'number', 'Review queue confidence threshold (%)'),
            ('MPESA_EXCEPTION_THRESHOLD', '70', 'number', 'Below this goes to exception queue (%)'),
        ]
        for key, value, dtype, desc in global_rules:
            SystemRule.objects.create(
                branch=None, key=key, value=value, data_type=dtype,
                description=desc, version=1, effective_date=date.today() - timedelta(days=180),
            )

        # Branch-specific overrides (Eastlands has slightly different rates)
        eastlands = self.branches[BranchType.TUJIJENGE][1]
        SystemRule.objects.create(
            branch=eastlands, key='CONTRIBUTION_PER_SHARE', value='1500',
            data_type='number', description='Lower contribution tier for Eastlands',
            version=1, effective_date=date.today() - timedelta(days=90),
        )

        self.stdout.write(f'   ✓ {SystemRule.objects.count()} business rules')

    # ─────────────────────────────────────────
    # TUJIJENGE
    # ─────────────────────────────────────────

    def seed_tujijenge(self):
        self.stdout.write('💰 Seeding Tujijenge Savings Circle...')

        # Loan products
        products = []
        for branch in self.branches[BranchType.TUJIJENGE]:
            for name, months, rate in [
                ('Short-Term Loan', 3, Decimal('8.00')),
                ('Standard Loan', 6, Decimal('10.00')),
                ('Development Loan', 12, Decimal('12.00')),
            ]:
                p = LoanProduct.objects.create(
                    branch=branch, name=name, duration_months=months,
                    interest_rate=rate, is_active=True,
                )
                products.append(p)

        members = []
        for branch in self.branches[BranchType.TUJIJENGE]:
            for i in range(25):
                name, _ = random_kenyan_name()
                join_date = date.today() - timedelta(days=random.randint(60, 900))
                member = Member.objects.create(
                    branch=branch,
                    member_number=f'TJ-{branch.id.hex[:4].upper()}-{i+1:04d}',
                    full_name=name,
                    phone=random_phone(),
                    email=email_from_name(name) if random.random() > 0.3 else '',
                    id_number=random_id_number(),
                    date_joined=join_date,
                    shares=random.choice([1, 1, 2, 2, 3, 5]),
                    status=random.choices(
                        [MemberStatus.ACTIVE, MemberStatus.INACTIVE, MemberStatus.SUSPENDED],
                        weights=[88, 8, 4]
                    )[0],
                    advance_credit=Decimal(random.choice([0, 0, 0, 500, 1200])),
                )
                members.append(member)

                # Contributions for last 6 months
                rate = Decimal('2000') if branch == self.branches[BranchType.TUJIJENGE][0] else Decimal('1500')
                expected = rate * member.shares
                for m_offset in range(6, 0, -1):
                    period_date = date.today().replace(day=1) - timedelta(days=30 * m_offset)
                    paid_fully = random.random() > 0.15
                    paid = expected if paid_fully else expected * Decimal(random.choice(['0', '0.5', '0.75']))
                    Contribution.objects.create(
                        member=member,
                        period_year=period_date.year,
                        period_month=period_date.month,
                        expected=expected,
                        paid=paid,
                        interest=Decimal('0'),
                        penalty=Decimal(0 if paid_fully else random.choice([0, 100, 200])),
                        status='POSTED' if paid_fully else 'PENDING',
                        due_date=period_date.replace(day=10),
                    )

        # Loans — about 40% of members have a loan
        for member in random.sample(members, k=int(len(members) * 0.4)):
            product = random.choice([p for p in products if p.branch == member.branch])
            principal = Decimal(random.choice([5000, 10000, 15000, 20000, 30000, 50000]))
            loan = Loan(
                branch=member.branch, member=member, product=product,
                loan_number=f'LN-{uuid.uuid4().hex[:8].upper()}',
                principal=principal,
                status=random.choices(
                    [LoanStatus.PERFORMING, LoanStatus.DISBURSED, LoanStatus.PENDING,
                     LoanStatus.OVERDUE, LoanStatus.CLOSED, LoanStatus.WATCHLIST],
                    weights=[35, 15, 15, 10, 20, 5]
                )[0],
                approval_status=ApprovalStatus.APPROVED,
                notes='Business expansion' if random.random() > 0.5 else 'School fees',
            )
            loan.calculate()
            if loan.status not in [LoanStatus.PENDING, LoanStatus.DRAFT]:
                loan.disbursement_date = date.today() - timedelta(days=random.randint(10, 300))
                loan.maturity_date = loan.disbursement_date + timedelta(days=30 * product.duration_months)
                if loan.status == LoanStatus.CLOSED:
                    loan.balance = Decimal('0')
                elif loan.status in [LoanStatus.PERFORMING, LoanStatus.DISBURSED]:
                    loan.balance = loan.total_repayment * Decimal(str(round(random.uniform(0.3, 0.9), 2)))
                elif loan.status == LoanStatus.OVERDUE:
                    loan.balance = loan.total_repayment * Decimal(str(round(random.uniform(0.5, 1.0), 2)))
            loan.save()

        # Penalties
        for member in random.sample(members, k=int(len(members) * 0.15)):
            Penalty.objects.create(
                branch=member.branch, member=member,
                penalty_type=random.choice(['LATE_CONTRIBUTION', 'LATE_LOAN_REPAYMENT', 'MISSED_MEETING']),
                amount=Decimal(random.choice([100, 200, 300, 500])),
                description='Penalty for late submission',
                is_waived=random.random() > 0.7,
            )

        # Annual distribution (last year, completed)
        for branch in self.branches[BranchType.TUJIJENGE]:
            dist = AnnualDistribution.objects.create(
                branch=branch, year=date.today().year - 1,
                total_pool=Decimal(random.choice([500000, 750000, 1000000])),
                status=DistributionStatus.COMPLETED,
                eligibility_rules={'min_months_active': 6},
            )
            for member in [m for m in members if m.branch == branch][:15]:
                entry = DistributionEntry(
                    distribution=dist, member=member,
                    contribution_value=Decimal(random.randint(8000, 24000)),
                    interest_share=Decimal(random.randint(200, 1500)),
                    bonus=Decimal(random.choice([0, 0, 500])),
                    outstanding_loans=Decimal(random.choice([0, 0, 5000])),
                    penalties=Decimal(random.choice([0, 0, 200])),
                    is_eligible=True,
                )
                entry.calculate_net()
                entry.save()

        self.tujijenge_members = members
        self.stdout.write(f'   ✓ {Member.objects.filter(branch__branch_type=BranchType.TUJIJENGE).count()} members, '
                           f'{Loan.objects.filter(branch__branch_type=BranchType.TUJIJENGE).count()} loans')

    # ─────────────────────────────────────────
    # TABLE BANKING
    # ─────────────────────────────────────────

    def seed_table_banking(self):
        self.stdout.write('🏦 Seeding Table Banking...')
        branch = self.branches[BranchType.TABLE_BANKING][0]

        product = LoanProduct.objects.create(
            branch=branch, name='Group Lending Fund', duration_months=4,
            interest_rate=Decimal('9.00'), is_active=True,
        )

        members = []
        for i in range(20):
            name, _ = random_kenyan_name()
            member = Member.objects.create(
                branch=branch,
                member_number=f'TB-{i+1:04d}',
                full_name=name, phone=random_phone(),
                email=email_from_name(name) if random.random() > 0.4 else '',
                id_number=random_id_number(),
                date_joined=date.today() - timedelta(days=random.randint(30, 600)),
                shares=random.choice([1, 1, 2, 3]),
                status=MemberStatus.ACTIVE,
            )
            members.append(member)

            expected = Decimal('1000') * member.shares
            for m_offset in range(4, 0, -1):
                period_date = date.today().replace(day=1) - timedelta(days=30 * m_offset)
                paid = expected if random.random() > 0.1 else expected * Decimal('0.6')
                Contribution.objects.create(
                    member=member, period_year=period_date.year, period_month=period_date.month,
                    expected=expected, paid=paid, status='POSTED' if paid == expected else 'PENDING',
                    due_date=period_date.replace(day=15),
                )

        for member in random.sample(members, k=8):
            principal = Decimal(random.choice([3000, 5000, 8000, 10000]))
            loan = Loan(
                branch=branch, member=member, product=product,
                loan_number=f'LN-{uuid.uuid4().hex[:8].upper()}',
                principal=principal,
                status=random.choice([LoanStatus.PERFORMING, LoanStatus.DISBURSED, LoanStatus.CLOSED]),
                approval_status=ApprovalStatus.APPROVED,
            )
            loan.calculate()
            loan.disbursement_date = date.today() - timedelta(days=random.randint(10, 120))
            loan.maturity_date = loan.disbursement_date + timedelta(days=30 * product.duration_months)
            if loan.status == LoanStatus.CLOSED:
                loan.balance = Decimal('0')
            else:
                loan.balance = loan.total_repayment * Decimal('0.5')
            loan.save()

        self.stdout.write(f'   ✓ {len(members)} table banking members')

    # ─────────────────────────────────────────
    # WEALTH ALLIANCE
    # ─────────────────────────────────────────

    def seed_wealth_alliance(self):
        self.stdout.write('📈 Seeding Wealth Alliance...')
        branch = self.branches[BranchType.WEALTH_ALLIANCE][0]

        asset_classes = []
        for name, risk in [
            ('Money Market Fund', 'LOW'),
            ('Nairobi Securities Exchange Equities', 'HIGH'),
            ('Government Treasury Bonds', 'LOW'),
            ('Real Estate Fund', 'MEDIUM'),
            ('Private Equity', 'VERY_HIGH'),
        ]:
            ac = AssetClass.objects.create(branch=branch, name=name, risk_level=risk, is_active=True)
            asset_classes.append(ac)

        investors = []
        for i in range(15):
            name, _ = random_kenyan_name()
            investor = Investor.objects.create(
                branch=branch,
                investor_number=f'INV-{i+1:04d}',
                full_name=name, phone=random_phone(),
                email=email_from_name(name),
                id_number=random_id_number(),
                join_date=date.today() - timedelta(days=random.randint(60, 700)),
                status=MemberStatus.ACTIVE,
            )
            investors.append(investor)

            # Initial deposit
            initial = Decimal(random.choice([50000, 100000, 250000, 500000, 1000000]))
            InvestmentTransaction.objects.create(
                branch=branch, investor=investor, asset_class=random.choice(asset_classes),
                transaction_type='DEPOSIT', amount=initial,
                transaction_date=investor.join_date,
                notes='Initial capital deposit',
                approval_status=ApprovalStatus.APPROVED,
                reference=f'DEP-{uuid.uuid4().hex[:6].upper()}',
            )
            # Some have a second deposit
            if random.random() > 0.5:
                InvestmentTransaction.objects.create(
                    branch=branch, investor=investor, asset_class=random.choice(asset_classes),
                    transaction_type='DEPOSIT',
                    amount=Decimal(random.choice([20000, 50000, 75000])),
                    transaction_date=investor.join_date + timedelta(days=random.randint(30, 200)),
                    notes='Top-up deposit',
                    approval_status=ApprovalStatus.APPROVED,
                    reference=f'DEP-{uuid.uuid4().hex[:6].upper()}',
                )

        # Dividend declaration (last quarter)
        total_capital = sum(inv.current_capital for inv in investors) or Decimal('1')
        pool = Decimal('250000')
        declaration = DividendDeclaration.objects.create(
            branch=branch, pool_amount=pool,
            declaration_date=date.today() - timedelta(days=45),
            period=f'Q{((date.today().month - 1) // 3) or 4} {date.today().year}',
            total_capital=total_capital,
            status=ApprovalStatus.POSTED,
        )
        for investor in investors:
            cap = investor.current_capital
            share_pct = (cap / total_capital * 100) if total_capital else Decimal('0')
            dividend_amount = pool * (cap / total_capital) if total_capital else Decimal('0')
            InvestorDividend.objects.create(
                declaration=declaration, investor=investor,
                investor_share_pct=share_pct, dividend_amount=dividend_amount,
                option=random.choice(['CASH', 'REINVEST']),
                is_processed=True,
            )
            if random.random() > 0.5:
                InvestmentTransaction.objects.create(
                    branch=branch, investor=investor, transaction_type='DIVIDEND_CREDIT',
                    amount=dividend_amount, transaction_date=declaration.declaration_date,
                    notes=f'Dividend for {declaration.period}',
                    approval_status=ApprovalStatus.APPROVED,
                )

        # A couple of pending withdrawals
        for investor in random.sample(investors, k=3):
            InvestorWithdrawal.objects.create(
                branch=branch, investor=investor,
                withdrawal_type=random.choice(['DIVIDEND', 'PARTIAL_CAPITAL', 'EMERGENCY']),
                amount_requested=Decimal(random.choice([10000, 20000, 50000])),
                status=random.choice([WithdrawalStatus.PENDING, WithdrawalStatus.UNDER_REVIEW]),
                notes='Requested via member portal',
            )

        self.stdout.write(f'   ✓ {len(investors)} investors, {len(asset_classes)} asset classes')

    # ─────────────────────────────────────────
    # RENTALS
    # ─────────────────────────────────────────

    def seed_rentals(self):
        self.stdout.write('🏠 Seeding Rentals...')
        branch = self.branches[BranchType.RENTALS][0]
        manager = self.users['branch_admins'][-1]

        properties = []
        for name in random.sample(PROPERTY_NAMES, k=6):
            prop = Property.objects.create(
                branch=branch,
                property_code=f'PROP-{uuid.uuid4().hex[:6].upper()}',
                name=name,
                property_type=random.choice(['RESIDENTIAL', 'RESIDENTIAL', 'MIXED_USE', 'COMMERCIAL']),
                location=random_location(),
                total_units=random.choice([8, 12, 16, 20, 24]),
                property_manager=manager,
                purchase_value=Decimal(random.choice([8000000, 15000000, 25000000, 40000000])),
                current_value=Decimal(random.choice([10000000, 18000000, 30000000, 48000000])),
                status=PropertyStatus.ACTIVE,
            )
            properties.append(prop)

        all_units = []
        for prop in properties:
            base_rent = Decimal(random.choice([15000, 20000, 25000, 35000, 45000]))
            for u in range(1, prop.total_units + 1):
                floor = (u - 1) // 4 + 1
                unit_letter = chr(65 + ((u - 1) % 4))
                unit = Unit.objects.create(
                    property=prop,
                    unit_number=f'{floor}{unit_letter}',
                    unit_type=random.choice(['1BR', '2BR', '3BR', 'Studio']),
                    monthly_rent=base_rent + Decimal(random.choice([0, 0, 2000, -2000])),
                    deposit_amount=base_rent,
                    occupancy_status=OccupancyStatus.VACANT,
                )
                all_units.append(unit)

        # Tenants for ~75% of units
        occupied_units = random.sample(all_units, k=int(len(all_units) * 0.75))
        tenants = []
        for i, unit in enumerate(occupied_units):
            name, _ = random_kenyan_name()
            move_in = date.today() - timedelta(days=random.randint(30, 500))
            tenant = Tenant.objects.create(
                branch=branch,
                tenant_number=f'TN-{i+1:04d}',
                full_name=name, phone=random_phone(),
                email=email_from_name(name) if random.random() > 0.4 else '',
                id_number=random_id_number(),
                move_in_date=move_in,
                unit=unit,
                deposit_paid=unit.deposit_amount,
                status='ACTIVE',
            )
            unit.occupancy_status = OccupancyStatus.OCCUPIED
            unit.save(update_fields=['occupancy_status'])
            tenants.append(tenant)

            Lease.objects.create(
                tenant=tenant, unit=unit,
                start_date=move_in, end_date=move_in + timedelta(days=365),
                rent_amount=unit.monthly_rent, deposit=unit.deposit_amount,
                notice_period_days=30, status=LeaseStatus.ACTIVE,
            )

            # Rent collection history — last 4 months
            for m_offset in range(4, 0, -1):
                period_date = date.today().replace(day=1) - timedelta(days=30 * m_offset)
                if period_date < move_in.replace(day=1):
                    continue
                paid_fully = random.random() > 0.12
                paid = unit.monthly_rent if paid_fully else unit.monthly_rent * Decimal('0.5')
                RentCollection.objects.create(
                    tenant=tenant, unit=unit,
                    period_year=period_date.year, period_month=period_date.month,
                    expected=unit.monthly_rent, paid=paid,
                    payment_method='MPESA',
                    mpesa_ref=f'R{uuid.uuid4().hex[:8].upper()}' if paid_fully else '',
                    payment_date=period_date.replace(day=random.randint(1, 10)) if paid_fully else None,
                )

        # Maintenance requests
        for unit in random.sample(occupied_units, k=min(10, len(occupied_units))):
            tenant = next((t for t in tenants if t.unit_id == unit.id), None)
            MaintenanceRequest.objects.create(
                unit=unit, tenant=tenant,
                title=random.choice([
                    'Leaking kitchen tap', 'Broken window pane', 'Faulty electrical socket',
                    'Blocked drainage', 'Door lock replacement', 'Ceiling water damage',
                ]),
                description='Reported via tenant portal, requires contractor visit.',
                cost=Decimal(random.choice([1500, 3000, 5000, 8000])),
                contractor=random.choice(CONTRACTORS),
                status=random.choice([MaintenanceStatus.NEW, MaintenanceStatus.ASSIGNED,
                                       MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.COMPLETED]),
            )

        self.stdout.write(f'   ✓ {len(properties)} properties, {len(all_units)} units, {len(tenants)} tenants')

    # ─────────────────────────────────────────
    # MPESA TRANSACTIONS
    # ─────────────────────────────────────────

    def seed_mpesa_transactions(self):
        self.stdout.write('📱 Seeding M-Pesa transactions...')
        members = list(Member.objects.filter(branch__branch_type=BranchType.TUJIJENGE)[:20])

        count = 0
        for member in members:
            for _ in range(random.randint(1, 3)):
                confidence_roll = random.random()
                if confidence_roll < 0.6:
                    confidence = MPESAConfidence.AUTO
                    matched = member
                    is_allocated = True
                elif confidence_roll < 0.85:
                    confidence = MPESAConfidence.REVIEW
                    matched = member
                    is_allocated = False
                else:
                    confidence = MPESAConfidence.EXCEPTION
                    matched = None
                    is_allocated = False

                MPESATransaction.objects.create(
                    branch=member.branch,
                    mpesa_ref=f'R{uuid.uuid4().hex[:9].upper()}',
                    phone=member.phone if confidence != MPESAConfidence.EXCEPTION else random_phone(),
                    amount=Decimal(random.choice([1000, 1500, 2000, 3000, 5000])),
                    transaction_date=timezone.now() - timedelta(days=random.randint(0, 14), hours=random.randint(0, 23)),
                    sender_name=member.full_name if confidence != MPESAConfidence.EXCEPTION else random_kenyan_name()[0],
                    account_ref=member.member_number if confidence == MPESAConfidence.AUTO else '',
                    confidence=confidence,
                    matched_member=matched,
                    is_allocated=is_allocated,
                )
                count += 1

        self.stdout.write(f'   ✓ {count} M-Pesa transactions '
                           f'({MPESATransaction.objects.filter(confidence="REVIEW").count()} in review, '
                           f'{MPESATransaction.objects.filter(confidence="EXCEPTION").count()} exceptions)')

    # ─────────────────────────────────────────
    # APPROVALS
    # ─────────────────────────────────────────

    def seed_approvals(self):
        self.stdout.write('✅ Seeding approval requests...')
        officer = self.users['finance_officers'][0] if self.users['finance_officers'] else self.users['super_admin']

        pending_loans = Loan.objects.filter(approval_status=ApprovalStatus.APPROVED)[:5]
        for loan in pending_loans:
            ApprovalRequest.objects.create(
                branch=loan.branch, action_type='LOAN',
                reference_id=loan.id, reference_model='Loan',
                requested_by=officer,
                status=ApprovalStatus.APPROVED,
                reason=f'Loan application {loan.loan_number} for {loan.member.full_name}',
                reviewed_by=self.users['branch_admins'][0],
                reviewed_at=timezone.now() - timedelta(days=random.randint(1, 20)),
                payload={'loan_number': loan.loan_number, 'principal': str(loan.principal)},
            )

        withdrawals = InvestorWithdrawal.objects.all()
        for w in withdrawals:
            ApprovalRequest.objects.create(
                branch=w.branch, action_type='WITHDRAWAL',
                reference_id=w.id, reference_model='InvestorWithdrawal',
                requested_by=officer,
                status=ApprovalStatus.PENDING,
                reason=f'Withdrawal request by {w.investor.full_name}',
                payload={'amount': str(w.amount_requested), 'type': w.withdrawal_type},
            )

        # A pending rule change for good measure
        ApprovalRequest.objects.create(
            branch=None, action_type='RULE_CHANGE',
            requested_by=self.users['super_admin'],
            status=ApprovalStatus.PENDING,
            reason='Proposal to increase loan multiplier from 3x to 3.5x',
            payload={'rule_key': 'LOAN_MULTIPLIER', 'proposed_value': '3.5'},
        )

        self.stdout.write(f'   ✓ {ApprovalRequest.objects.count()} approval requests')

    # ─────────────────────────────────────────
    # NOTIFICATIONS
    # ─────────────────────────────────────────

    def seed_notifications(self):
        self.stdout.write('🔔 Seeding notifications...')

        templates = [
            ('CONTRIBUTION_DUE', 'IN_APP', 'Contribution Reminder',
             'Your monthly contribution is due on the 10th. Please pay via M-Pesa to avoid penalties.'),
            ('LOAN_OVERDUE', 'IN_APP', 'Loan Repayment Overdue',
             'Your loan repayment is overdue. Please clear the balance to avoid further penalties.'),
            ('RENT_DUE', 'IN_APP', 'Rent Payment Reminder',
             'Your rent payment for this month is due. Pay via M-Pesa Paybill to settle your account.'),
            ('DIVIDEND_DECLARED', 'IN_APP', 'Dividend Declared',
             'A new dividend has been declared for your investment portfolio. Check your statement for details.'),
        ]
        for event_type, channel, subject, body in templates:
            NotificationTemplate.objects.get_or_create(
                branch=None, event_type=event_type, channel=channel,
                defaults={'subject': subject, 'body': body, 'is_active': True},
            )

        staff_users = list(User.objects.filter(is_staff=True))
        for user in staff_users[:8]:
            for title, message in [
                ('M-Pesa Review Queue', 'You have new transactions awaiting confirmation in the review queue.'),
                ('Approval Pending', 'A loan application requires your approval.'),
                ('Monthly Report Ready', 'The monthly contributions report has been generated.'),
            ]:
                Notification.objects.create(
                    user=user, title=title, message=message,
                    channel='IN_APP', is_read=random.random() > 0.6,
                    is_sent=True, sent_at=timezone.now() - timedelta(days=random.randint(0, 10)),
                )

        self.stdout.write(f'   ✓ {Notification.objects.count()} notifications, '
                           f'{NotificationTemplate.objects.count()} templates')

    # ─────────────────────────────────────────
    # AUDIT LOGS
    # ─────────────────────────────────────────

    def seed_audit_logs(self):
        self.stdout.write('📋 Seeding audit trail...')

        actions = [
            ('LOGIN', 'User', ''),
            ('CREATE_MEMBER', 'Member', ''),
            ('CREATE_LOAN', 'Loan', ''),
            ('APPROVE_LOAN', 'Loan', ''),
            ('DISBURSE_LOAN', 'Loan', ''),
            ('WAIVE_PENALTY', 'Penalty', ''),
            ('UPDATE_RULE', 'SystemRule', ''),
            ('MANUAL_ALLOCATE_MPESA', 'MPESATransaction', ''),
        ]
        staff_users = list(User.objects.filter(is_staff=True))
        for _ in range(60):
            action, model_name, _ = random.choice(actions)
            user = random.choice(staff_users)
            AuditLog.objects.create(
                user=user, role=user.role, branch=user.branch,
                action=action, model_name=model_name,
                object_id=str(uuid.uuid4()),
                old_value={'status': 'PENDING'} if 'APPROVE' in action else None,
                new_value={'status': 'APPROVED'} if 'APPROVE' in action else {'created': True},
                ip_address=f'41.90.{random.randint(0,255)}.{random.randint(0,255)}',
                device='Mozilla/5.0 (Windows NT 10.0; Win64; x64) Kilele Ridge Web',
                timestamp=timezone.now() - timedelta(days=random.randint(0, 60), hours=random.randint(0, 23)),
            )

        self.stdout.write(f'   ✓ {AuditLog.objects.count()} audit log entries')

    # ─────────────────────────────────────────
    # SUMMARY
    # ─────────────────────────────────────────

    def print_summary(self):
        self.stdout.write(self.style.SUCCESS('─' * 50))
        self.stdout.write(self.style.SUCCESS('SUMMARY'))
        self.stdout.write(self.style.SUCCESS('─' * 50))
        self.stdout.write(f'Branches:              {Branch.objects.count()}')
        self.stdout.write(f'Staff Users:           {User.objects.filter(is_staff=True).count()}')
        self.stdout.write(f'Members (all types):   {Member.objects.count()}')
        self.stdout.write(f'Loans:                 {Loan.objects.count()}')
        self.stdout.write(f'Investors:             {Investor.objects.count()}')
        self.stdout.write(f'Properties:            {Property.objects.count()}')
        self.stdout.write(f'Units:                 {Unit.objects.count()}')
        self.stdout.write(f'Tenants:               {Tenant.objects.count()}')
        self.stdout.write(f'M-Pesa Transactions:   {MPESATransaction.objects.count()}')
        self.stdout.write(f'Approval Requests:     {ApprovalRequest.objects.count()}')
        self.stdout.write(f'Audit Log Entries:     {AuditLog.objects.count()}')
        self.stdout.write(self.style.SUCCESS('─' * 50))
        self.stdout.write(self.style.WARNING(
            '\n🔑 Super Admin login: admin@kileleridge.co.ke '
            '(use OTP flow — check console email backend for codes)\n'
        ))