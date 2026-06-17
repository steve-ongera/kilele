from rest_framework.permissions import BasePermission
from .models import UserRole


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == UserRole.SUPER_ADMIN
        )


class IsBranchAdminOrAbove(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in [
                UserRole.SUPER_ADMIN,
                UserRole.BRANCH_ADMIN,
            ]
        )


class IsFinanceOfficerOrAbove(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in [
                UserRole.SUPER_ADMIN,
                UserRole.BRANCH_ADMIN,
                UserRole.FINANCE_OFFICER,
            ]
        )


class IsAuditorOrAbove(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in [
                UserRole.SUPER_ADMIN,
                UserRole.BRANCH_ADMIN,
                UserRole.FINANCE_OFFICER,
                UserRole.AUDITOR,
            ]
        )


class IsMember(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == UserRole.MEMBER
        )


class IsInvestor(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == UserRole.INVESTOR
        )


class IsTenant(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == UserRole.TENANT
        )