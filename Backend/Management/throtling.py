from rest_framework.throttling import UserRateThrottle


class LoginRateThrottle(UserRateThrottle):
    scope = 'login'


class RegisterRateThrottle(UserRateThrottle):
    scope = 'register'


class PasswordResetRateThrottle(UserRateThrottle):
    scope = 'password-reset'


class VerificationRateThrottle(UserRateThrottle):
    scope = 'verification'
