

from pathlib import Path
from datetime import timedelta
import environ

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
env.read_env(BASE_DIR / '.env')


SECRET_KEY = env('SECRET_KEY', default='django-insecure-pekc0$loj-k$^-m1(4ouk%jln)z)u66^_1x1q@6wo(g0@z#jg^')

DEV = env.bool('DEV', default=True)

DEBUG = env.bool('DEBUG', default=True)

ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

CORS_ALLOWED_ORIGINS = env.list(
    'CORS_ALLOWED_ORIGINS',
    default=[
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ]
)

CSRF_TRUSTED_ORIGINS = env.list(
    'CSRF_TRUSTED_ORIGINS',
    default=[
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ]
)




# Application definition

INSTALLED_APPS = [

     "jazzmin",

    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # 3rd-party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'drf_spectacular',
    'anymail',

    # Local
    'Management.apps.ManagementConfig',
    
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware', #CORS
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# Database
# https://docs.djangoproject.com/en/6.0/ref/settings/#databases

DATABASES = {
    'default': env.db(
        'DATABASE_URL',
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}"
    )
}


# Password validation
# https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/6.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Asia/Dhaka'

USE_I18N = True

USE_TZ = True



# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.0/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'mediafiles'

AUTH_USER_MODEL = 'Management.User'



REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],

    'DEFAULT_THROTTLE_RATES': {
        'login': '100/hour',
        'verification': '100/hour',
        'register': '100/hour',
        'password-reset': '100/hour',
    },

    'DEFAULT_RENDERER_CLASSES': [
        # 'rest_framework.renderers.BrowsableAPIRenderer',
        # 'rest_framework.renderers.JSONRenderer',
        'Management.renderers.CustomJSONRenderer',
    ],

    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema', # swagger


}


# swagger
SPECTACULAR_SETTINGS = {
    'TITLE': 'University Management System API',
    'DESCRIPTION': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzg1Mjk2NzkwLCJpYXQiOjE3ODQzOTY3OTAsImp0aSI6ImIzODJkOGIyZWI5ODRmMTdhZDEwYWQ0MGQ1OWM4MzE4IiwidXNlcl9pZCI6IjEifQ.Dlg8JARxoDl3wd96vLv76LUw1cwukItCNfVV8UnG0oQ',
    'VERSION': '1.0.0',

    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'SORT_OPERATIONS': False,

    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'docExpansion': 'none',
        'defaultModelsExpandDepth': -1,
    },

}


SIMPLE_JWT = {
    'AUTH_HEADER_TYPES': ('Bearer', 'JWT'),
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15000),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
}


if False:
    EMAIL_BACKEND = env('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
    EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
    EMAIL_PORT = env.int('EMAIL_PORT', default=587)
    EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
    EMAIL_TIMEOUT = env.int('EMAIL_TIMEOUT', default=60)
    EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='test@gmail.com')
    EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='xxx-xxx-xxx')
    DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='test@gmail.com')

else:
    EMAIL_BACKEND = env('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
    DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='test@gmail.com')
    ANYMAIL = {
        "BREVO_API_KEY": env('EMAIL_HOST_PASSWORD', default='xxx-xxx-xxx'),
    }

print(EMAIL_BACKEND)



# Frontend URL for email sending verifications links
FRONTEND_URL = env('FRONTEND_URL', default='http://localhost:3000')


PASSWORD_RESET_TIMEOUT = env.int('PASSWORD_RESET_TIMEOUT', default=600)
OTP_EXPIRE_TIMEOUT = env.int('OTP_EXPIRE_TIMEOUT', default=600)
MAX_WRONG_OTP_ATTEMPTS = env.int('MAX_WRONG_OTP_ATTEMPTS', default=5)
OTP_LOCKED_UNTIL = env.int('OTP_LOCKED_UNTIL', default=600)
OTP_RESEND_COOLDOWN = env.int('OTP_RESEND_COOLDOWN', default=15)
MAX_LOGIN_ATTEMPTS = env.int('MAX_LOGIN_ATTEMPTS', default=5)
ACCOUNT_LOCKOUT_DURATION = env.int('ACCOUNT_LOCKOUT_DURATION', default=600)

TEACHER_INVITATION_EXPIRE_DAYS = env.int('TEACHER_INVITATION_EXPIRE_DAYS', default=3)



JAZZMIN_SETTINGS = {
    # ====================================================
    # Branding
    # ====================================================
    "site_title": "University Management",
    "site_header": "University Management",
    "site_brand": "University Management",
    "welcome_sign": "Welcome to University Management Admin",

    "site_logo": "images/logo2.png",
    "login_logo": "images/logo2.png",
    "site_icon": "images/logo2.png",

    # ========== Theme =======

    "theme": "flatly",
    "dark_mode_theme": "darkly",

    "navbar": "navbar-primary",

    "accent": "accent-info",

    "sidebar": "sidebar-dark-primary",

    "brand_colour": "navbar-primary",

    "sidebar_nav_small_text": False,
    "sidebar_disable_expand": False,

    # ====================================================
    # Copyright & Layout
    # ====================================================
    "copyright": "University Management",
    "show_sidebar": True,
    "navigation_expanded": True,
    "custom_css": "css/admin.css",
    "custom_js": None,
    "related_modal_active": True,
    "use_google_fonts_idle": True,
    "show_ui_builder": False,

    # ====================================================
    # Top Menu / Navigation
    # ====================================================
    # "topmenu_links": [
    #     {"name": "Home", "url": "admin:index", "permissions": ["auth.view_user"]},
    #     {"model": "Management.User"},
    #     {"app": "Management"},
    # ],

    # ====================================================
    # User Dropdown
    # ====================================================
    # "usermenu_links": [
    #     {"model": "Management.User"},
    # ],

    # ====================================================
    # Sidebar Icons
    # ====================================================
    "icons": {
        # Auth
        "auth.Group": "fas fa-users",
        "Management.User": "fas fa-user-circle",

        # Security
        "Management.UserSecurity": "fas fa-shield-alt",
        "Management.OTP": "fas fa-key",
        "Management.EmailChangeRequest": "fas fa-envelope",

        # Faculty / Department
        "Management.Faculty": "fas fa-university",
        "Management.Department": "fas fa-building",

        # Session
        "Management.Session": "fas fa-calendar-alt",
        "Management.YearSemester": "fas fa-calendar-week",

        # Teacher
        "Management.Teacher": "fas fa-chalkboard-teacher",
        "Management.TeacherInvitation": "fas fa-user-plus",

        # Student
        "Management.Student": "fas fa-user-graduate",

        # Course
        "Management.Course": "fas fa-book",
        "Management.CourseAssessment": "fas fa-clipboard-list",
        "Management.SessionCourse": "fas fa-layer-group",
        "Management.SessionCourseTeacher": "fas fa-chalkboard",
        "Management.StudentCourse": "fas fa-book-open",
        "Management.StudentAssessmentMark": "fas fa-star",

        # Course Content
        "Management.CourseMaterial": "fas fa-file-alt",
        "Management.CourseMaterialFile": "fas fa-file",
        "Management.CourseAnnouncement": "fas fa-bullhorn",
        "Management.CourseAnnouncementFile": "fas fa-file",
        "Management.Assignment": "fas fa-tasks",
        "Management.AssignmentSubmission": "fas fa-check-double",
        "Management.AssignmentSubmissionFile": "fas fa-file",

        # Attendance
        "Management.AttendanceSession": "fas fa-calendar-check",
        "Management.StudentAttendance": "fas fa-clipboard-check",

        # Exam Committee
        "Management.ExamCommittee": "fas fa-users-cog",
        "Management.ExamCommitteeMember": "fas fa-user-tie",
    },

    # ====================================================
    # Default Icon (for any model without an icon above)
    # ====================================================
    "default_icon_parents": "fas fa-chevron-circle-right",
    "default_icon_children": "fas fa-circle",

    # ====================================================
    # Sidebar ordering
    # ====================================================
    "order_with_respect_to": [
        # 🔐 Administration & Security
        "auth",
        "Management.User",
        "Management.UserSecurity",
        "Management.OTP",
        "Management.EmailChangeRequest",

        # 🏫 Academic Structure
        "Management.Faculty",
        "Management.Department",
        "Management.Session",
        "Management.YearSemester",

        # 👤 People
        "Management.Teacher",
        "Management.TeacherInvitation",
        "Management.Student",

        # 📚 Course Management
        "Management.Course",
        "Management.CourseAssessment",
        "Management.SessionCourse",
        "Management.SessionCourseTeacher",
        "Management.StudentCourse",
        "Management.StudentAssessmentMark",

        # 📄 Course Materials & Content
        "Management.CourseMaterial",
        "Management.CourseAnnouncement",
        "Management.Assignment",
        "Management.AssignmentSubmission",

        # ✅ Attendance
        "Management.AttendanceSession",
        "Management.StudentAttendance",

        # 🏛️ Examination
        "Management.ExamCommittee",
        "Management.ExamCommitteeMember",
    ],

    # ====================================================
    # Hide child file models (accessed via inlines)
    # ====================================================
    "hide_models": [
        "Management.CourseMaterialFile",
        "Management.CourseAnnouncementFile",
        "Management.AssignmentSubmissionFile",
        # "auth.Group",
        # "auth.Permission",
    ],

    # ====================================================
    # Language Switch
    # ====================================================
    "language_chooser": False,
}
