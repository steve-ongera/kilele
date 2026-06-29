from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from django.db.models import Sum, Q
from decimal import Decimal
import re


# ─────────────────────────────────────────────
# OTP
# ─────────────────────────────────────────────

def send_otp_email(user, token):
    """
    Sends the OTP email via whatever EMAIL_BACKEND is configured in settings.

    NOTE: fail_silently is now False on purpose. With the default
    `console.EmailBackend`, the OTP only ever prints to the runserver
    terminal — it never reaches a real inbox. To actually deliver email,
    set EMAIL_BACKEND to 'django.core.mail.backends.smtp.EmailBackend'
    (or a provider backend like SendGrid/Mailgun/Brevo) in settings.py,
    along with EMAIL_HOST, EMAIL_PORT, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD,
    EMAIL_USE_TLS, and DEFAULT_FROM_EMAIL.

    Raising on failure (instead of fail_silently=True) means the calling
    view's request-OTP endpoint will surface a real error to the frontend
    instead of returning a false "OTP sent" success when delivery fails.
    Make sure the view that calls this wraps it in try/except and returns
    a proper error response — see request_otp view.
    """
    subject = 'Your Kilele Ridge Login OTP'
    message = (
        f'Hello {user.full_name},\n\n'
        f'Your one-time login code is: {token}\n\n'
        f'This code expires in 10 minutes.\n\n'
        f'If you did not request this, please ignore this email.\n\n'
        f'— Kilele Ridge Group'
    )
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


# ─────────────────────────────────────────────
# AUDIT LOGGING
# ─────────────────────────────────────────────

def log_audit(user, action, model_name='', object_id='', old_value=None,
              new_value=None, reason='', ip_address=None, device='', branch=None):
    from .models import AuditLog
    try:
        AuditLog.objects.create(
            user=user,
            role=user.role if user else '',
            branch=branch or (user.branch if user else None),
            action=action,
            model_name=model_name,
            object_id=str(object_id),
            old_value=old_value,
            new_value=new_value,
            reason=reason,
            ip_address=ip_address,
            device=device or '',
        )
    except Exception:
        pass  # Never let audit logging crash the main request


# ─────────────────────────────────────────────
# MPESA ALLOCATION ENGINE
# ─────────────────────────────────────────────

# Confidence thresholds (read from SystemRule if available, else defaults)
AUTO_THRESHOLD = 90       # >= 90%  → AUTO allocate
REVIEW_THRESHOLD = 70     # 70–89%  → REVIEW queue
# < 70% → EXCEPTION queue


def _get_confidence_thresholds(branch=None):
    from .models import SystemRule
    auto = AUTO_THRESHOLD
    review = REVIEW_THRESHOLD
    try:
        if branch:
            rule_auto = SystemRule.objects.filter(
                branch=branch, key='MPESA_AUTO_CONFIDENCE'
            ).order_by('-version').first()
            rule_review = SystemRule.objects.filter(
                branch=branch, key='MPESA_REVIEW_CONFIDENCE'
            ).order_by('-version').first()
            if rule_auto:
                auto = int(rule_auto.value)
            if rule_review:
                review = int(rule_review.value)
    except Exception:
        pass
    return auto, review


def _score_match(txn, member):
    """
    Returns a confidence score 0–100 for how likely `member` matches `txn`.
    Factors: phone match, account_ref match, sender name match.
    """
    score = 0

    # Phone match (strongest signal)
    txn_phone = re.sub(r'\D', '', txn.phone)
    member_phone = re.sub(r'\D', '', member.phone)
    if txn_phone and member_phone:
        if txn_phone == member_phone:
            score += 60
        elif txn_phone[-9:] == member_phone[-9:]:
            score += 50

    # Account reference match (member number)
    if txn.account_ref:
        ref = txn.account_ref.strip().upper()
        mn = member.member_number.strip().upper()
        if ref == mn or ref.endswith(mn) or mn in ref:
            score += 30

    # Sender name fuzzy match
    if txn.sender_name and member.full_name:
        sender_parts = set(txn.sender_name.upper().split())
        member_parts = set(member.full_name.upper().split())
        common = sender_parts & member_parts
        if common:
            score += min(10, len(common) * 5)

    return min(score, 100)


def allocate_mpesa_transaction(txn):
    """
    Try to match an MPESATransaction to a Member and set confidence level.
    If confidence >= AUTO_THRESHOLD, create a Payment and allocate.
    """
    from .models import Member, MPESAConfidence

    auto_threshold, review_threshold = _get_confidence_thresholds(txn.branch)

    # 1. Exact phone match
    candidates = Member.objects.filter(is_active=True)
    if txn.branch:
        candidates = candidates.filter(branch=txn.branch)

    best_member = None
    best_score = 0

    for member in candidates:
        score = _score_match(txn, member)
        if score > best_score:
            best_score = score
            best_member = member

    # Set confidence
    if best_score >= auto_threshold:
        txn.confidence = MPESAConfidence.AUTO
        txn.matched_member = best_member
    elif best_score >= review_threshold:
        txn.confidence = MPESAConfidence.REVIEW
        txn.matched_member = best_member
    else:
        txn.confidence = MPESAConfidence.EXCEPTION

    txn.save(update_fields=['confidence', 'matched_member'])

    # Auto-allocate if high confidence
    if txn.confidence == MPESAConfidence.AUTO and best_member:
        try:
            allocate_payment_to_member(txn, best_member)
        except Exception:
            pass


@transaction.atomic
def allocate_payment_to_member(txn, member):
    """
    Allocation order (per spec):
    Interest → MPESA Charges → Penalties → Loan Principal → Contribution → Arrears → Shares → Advance Credit
    """
    from .models import (
        Payment, PaymentAllocation, Loan, Contribution, Penalty,
        LoanRepayment, LoanStatus
    )

    # Avoid double-allocation
    if txn.is_allocated:
        return

    remaining = txn.amount
    sequence = 0

    payment = Payment.objects.create(
        branch=txn.branch or member.branch,
        member=member,
        mpesa_ref=txn.mpesa_ref,
        amount=txn.amount,
        phone=txn.phone,
        payment_date=txn.transaction_date,
        notes=f'Auto-allocated from MPESA ref {txn.mpesa_ref}',
        created_by=None,
    )

    def allocate_line(line_type, amount, reference=None):
        nonlocal sequence
        if amount <= 0:
            return
        PaymentAllocation.objects.create(
            payment=payment,
            line_type=line_type,
            reference=reference,
            amount=amount,
            sequence=sequence,
            created_by=None,
        )
        sequence += 1

    # 1. Interest on active loans
    active_loans = Loan.objects.filter(
        member=member,
        status__in=[LoanStatus.PERFORMING, LoanStatus.DISBURSED,
                    LoanStatus.WATCHLIST, LoanStatus.OVERDUE]
    ).order_by('disbursement_date')

    for loan in active_loans:
        if remaining <= 0:
            break
        interest_due = loan.interest_amount  # simplified; ideally track separately
        interest_pay = min(remaining, interest_due)
        if interest_pay > 0:
            allocate_line('INTEREST', interest_pay, loan.id)
            remaining -= interest_pay

    # 2. MPESA charges (flat KES 0 for C2B — placeholder for future rule)
    mpesa_charge = Decimal('0')
    if mpesa_charge > 0:
        pay = min(remaining, mpesa_charge)
        allocate_line('MPESA_CHARGE', pay)
        remaining -= pay

    # 3. Penalties
    penalties = Penalty.objects.filter(
        member=member, is_waived=False
    ).order_by('created_at')
    for penalty in penalties:
        if remaining <= 0:
            break
        pay = min(remaining, penalty.amount)
        allocate_line('PENALTY', pay, penalty.id)
        remaining -= pay

    # 4. Loan principal
    for loan in active_loans:
        if remaining <= 0:
            break
        principal_pay = min(remaining, loan.balance)
        if principal_pay > 0:
            allocate_line('LOAN_PRINCIPAL', principal_pay, loan.id)
            loan.balance -= principal_pay
            if loan.balance <= 0:
                loan.status = LoanStatus.CLOSED
                loan.balance = Decimal('0')
            loan.save(update_fields=['balance', 'status'])

            LoanRepayment.objects.create(
                loan=loan,
                payment=payment,
                principal_paid=principal_pay,
                interest_paid=Decimal('0'),
                penalty_paid=Decimal('0'),
                balance_after=loan.balance,
                repayment_date=txn.transaction_date.date(),
                created_by=None,
            )
            remaining -= principal_pay

    # 5. Current month contribution
    from django.utils import timezone
    now = timezone.now()
    contribution = Contribution.objects.filter(
        member=member,
        period_year=now.year,
        period_month=now.month,
        status='PENDING',
    ).first()
    if contribution and remaining > 0:
        contrib_pay = min(remaining, contribution.expected - contribution.paid)
        if contrib_pay > 0:
            allocate_line('CONTRIBUTION', contrib_pay, contribution.id)
            contribution.paid += contrib_pay
            if contribution.paid >= contribution.expected:
                contribution.status = 'POSTED'
            contribution.save()
            remaining -= contrib_pay

    # 6. Arrears (past unpaid contributions)
    arrear_contribs = Contribution.objects.filter(
        member=member, arrears__gt=0
    ).exclude(period_year=now.year, period_month=now.month).order_by('period_year', 'period_month')
    for contrib in arrear_contribs:
        if remaining <= 0:
            break
        arrear_pay = min(remaining, contrib.arrears)
        allocate_line('ARREARS', arrear_pay, contrib.id)
        contrib.paid += arrear_pay
        contrib.arrears = max(contrib.expected - contrib.paid, Decimal('0'))
        if contrib.arrears == 0:
            contrib.status = 'POSTED'
        contrib.save()
        remaining -= arrear_pay

    # 7. Shares (simplified — not tracked separately here)
    # 8. Advance credit — remainder goes to member wallet
    if remaining > 0:
        allocate_line('ADVANCE_CREDIT', remaining)
        member.advance_credit += remaining
        member.save(update_fields=['advance_credit'])
        payment.advance_credit = remaining
        payment.save(update_fields=['advance_credit'])

    payment.is_allocated = True
    payment.save(update_fields=['is_allocated'])

    txn.is_allocated = True
    txn.matched_member = member
    txn.save(update_fields=['is_allocated', 'matched_member'])