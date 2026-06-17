# Kilele Ridge Group Enterprise Platform

A modern, premium, mobile-first business and financial management platform for managing multiple independent business units — Tujijenge Savings Circle, Wealth Alliance, Table Banking, and Rentals — from a single ecosystem.

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Backend     | Django 5.x + Django REST Framework  |
| Frontend    | React 18 + Vite                     |
| Database    | PostgreSQL (Supabase)               |
| Auth        | Email OTP (JWT)                     |
| Payments    | M-Pesa Daraja API                   |
| Storage     | Supabase Storage                    |

---

## Project Structure

```
kilele/
├── backend/
│   ├── core/                        # Single Django app
│   │   ├── migrations/
│   │   ├── __init__.py
│   │   ├── models.py                # All models
│   │   ├── serializers.py           # All serializers
│   │   ├── views.py                 # All views
│   │   ├── urls.py                  # App URLs
│   │   ├── permissions.py           # Custom permissions
│   │   ├── utils.py                 # Helpers (OTP, MPESA, etc.)
│   │   └── admin.py
│   ├── kilele/
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py                  # Root URL config
│   │   └── wsgi.py
│   ├── requirements.txt
│   └── manage.py
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── styles/
        │   └── main.css
        ├── services/
        │   └── api.js               # All API calls
        ├── components/
        │   ├── Navbar.jsx
        │   └── Sidebar.jsx
        └── pages/
            ├── Login.jsx            # Email OTP login
            ├── Dashboard.jsx        # Role-based dashboard
            ├── Members.jsx          # Members management
            ├── Contributions.jsx    # Contributions & arrears
            ├── Loans.jsx            # Loans management
            ├── Investments.jsx      # Wealth Alliance
            ├── TableBanking.jsx     # Table Banking
            ├── Rentals.jsx          # Properties & tenants
            ├── Mpesa.jsx            # MPESA engine
            ├── Reports.jsx          # Reports & exports
            ├── Approvals.jsx        # Approval queue
            ├── AuditLog.jsx         # Audit trail
            ├── Rules.jsx            # Rule engine (Super Admin)
            ├── Users.jsx            # User management (Super Admin)
            └── Profile.jsx          # Member self-portal
```

---

## Setup Instructions

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Fill in .env values (see Environment Variables below)

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start dev server
python manage.py runserver
```

### Frontend

```bash
cd frontend

npm install
npm run dev
```

---

## Environment Variables

Create `backend/.env`:

```env
SECRET_KEY=your-django-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Supabase PostgreSQL
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-db-password
DB_HOST=db.xxxxxxxxxxxx.supabase.co
DB_PORT=5432

# Email (OTP delivery)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your@email.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@kileleridge.co.ke

# MPESA Daraja
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_SHORTCODE=your-shortcode
MPESA_PASSKEY=your-passkey
MPESA_ENV=sandbox   # or production

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRY_HOURS=24

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://app.kileleridge.co.ke

# Supabase Storage
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_KEY=your-supabase-anon-key
```

---

## User Roles

| Role            | Access                                      |
|-----------------|---------------------------------------------|
| SUPER_ADMIN     | Full access. All branches. All settings.    |
| BRANCH_ADMIN    | Assigned branch only.                       |
| FINANCE_OFFICER | Process transactions. Cannot change rules.  |
| AUDITOR         | Read-only.                                  |
| MEMBER          | Own Tujijenge / Table Banking account.      |
| INVESTOR        | Own Wealth Alliance account.                |
| TENANT          | Own Rentals account.                        |

---

## Authentication Flow

1. User enters email on login page.
2. Backend generates a 6-digit OTP and emails it.
3. User enters OTP on verify page.
4. Backend issues JWT access + refresh tokens.
5. Frontend stores tokens in `localStorage`.
6. All API requests include `Authorization: Bearer <token>`.
7. Token refresh handled automatically in `api.js`.

---

## Branch Overview

### Tujijenge Savings Circle
- Monthly share contributions (default KES 2,000/share)
- Loan eligibility = Total Contributions × 3
- Payment allocation order: Interest → MPESA Charges → Penalties → Loan Principal → Contribution → Arrears → Shares → Advance Credit
- Annual distribution to eligible members

### Wealth Alliance
- Capital investment tracking
- Portfolio value = Capital + Reinvestments + Dividends + Gains − Withdrawals
- ROI = (Net Gain ÷ Capital) × 100
- Dividend pool declared by Super Admin, split proportionally

### Table Banking
- Simple contributions + lending fund
- Available Fund = Contributions + Interest − Outstanding Loans − Withdrawals − Charges
- Deadline: 15th of every month

### Rentals
- Property → Unit → Tenant → Lease chain
- Rent billing auto-generated monthly
- Profitability = Collected Rent − Maintenance − Utilities − Management Costs

---

## Key API Endpoints

```
POST   /api/auth/request-otp/          # Step 1: Send OTP
POST   /api/auth/verify-otp/           # Step 2: Get JWT
POST   /api/auth/refresh/              # Refresh token
POST   /api/auth/logout/

GET    /api/dashboard/                 # Role-aware dashboard KPIs

GET    /api/members/                   # List / filter members
POST   /api/members/                   # Create member
GET    /api/members/{id}/statement/    # Member statement

GET    /api/contributions/
POST   /api/contributions/

GET    /api/loans/
POST   /api/loans/
POST   /api/loans/{id}/approve/
POST   /api/loans/{id}/disburse/

GET    /api/investments/
POST   /api/investments/
POST   /api/investments/{id}/declare-dividend/

GET    /api/table-banking/members/
GET    /api/table-banking/lending-fund/

GET    /api/properties/
GET    /api/units/
GET    /api/tenants/
GET    /api/leases/
GET    /api/rent-collections/

POST   /api/mpesa/callback/            # Daraja webhook
POST   /api/mpesa/upload-csv/
GET    /api/mpesa/queue/               # Review / exception queue

GET    /api/approvals/
POST   /api/approvals/{id}/approve/
POST   /api/approvals/{id}/reject/

GET    /api/audit-logs/

GET    /api/reports/{type}/            # PDF/Excel/CSV
GET    /api/rules/                     # Rule engine
PUT    /api/rules/{key}/               # Update rule

GET    /api/users/                     # Super Admin only
POST   /api/users/
```

---

## Deployment

### Recommended Architecture

```
www.kileleridge.co.ke     → Landing website (React static)
app.kileleridge.co.ke     → React SPA (Vercel / Netlify)
api.kileleridge.co.ke     → Django API (VPS / Railway / Render)
db.*.supabase.co          → PostgreSQL (Supabase)
```

### Production Checklist

- [ ] `DEBUG=False` in settings
- [ ] `ALLOWED_HOSTS` set to production domain
- [ ] HTTPS enforced
- [ ] CORS locked to production origin
- [ ] Database backups enabled on Supabase
- [ ] Email SMTP configured and tested
- [ ] MPESA environment set to `production`
- [ ] Static files served via whitenoise or CDN
- [ ] JWT secret rotated from default

---

## Business Rules (All Configurable via Rule Engine)

| Rule                      | Default        |
|---------------------------|----------------|
| Contribution per share    | KES 2,000      |
| Contribution deadline     | 10th midnight  |
| Interest rate             | 10% monthly    |
| Loan multiplier           | 3×             |
| Registration fee          | KES 2,000      |
| Table Banking deadline    | 15th           |
| Exit notice period        | 60 days        |
| MPESA auto-allocate conf. | ≥ 90%          |
| MPESA review queue conf.  | 70–89%         |
| MPESA exception threshold | < 70%          |

All rules are stored in the `SystemRule` model and editable by Super Admin without code changes.

---

## requirements.txt

```
Django>=5.0
djangorestframework>=3.15
djangorestframework-simplejwt>=5.3
django-cors-headers>=4.3
psycopg2-binary>=2.9
python-decouple>=3.8
Pillow>=10.0
openpyxl>=3.1
reportlab>=4.0
requests>=2.31
celery>=5.3
redis>=5.0
```

---

## License

Private — Kilele Ridge Group. All rights reserved.