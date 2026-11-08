# MediLink Sri Lanka — Doctor Channeling Platform

MediLink is a production-grade, demo-ready MERN doctor channeling (appointment booking) platform designed for Sri Lanka, inspired by Doc990 and eChannelling. The system connects patients with certified Sri Lankan Medical Council (SLMC) specialist doctors across premier private hospitals and channeling centres (including Asiri Central, Lanka Hospitals, Nawaloka, Durdans, and Hemas).

Built with a modern teal-and-slate medical aesthetic, MediLink features a race-safe atomic booking engine that strictly prevents overbooking, full role-based access control, PayHere checkout (sandbox/live by environment configuration), optional AWS S3 uploads, and optional SMTP notification capabilities.

---

## Architecture & Monorepo Structure

```
medilink/
├── package.json               # Root scripts (install:all, dev, seed, test)
├── .gitignore                 # Root gitignore (ensures secrets and build output never commit)
├── README.md                  # Comprehensive platform documentation
├── server/                    # Node.js Express REST API (ES Modules)
│   ├── .env.example           # Environment template (all values empty)
│   ├── package.json           # Backend dependencies and scripts
│   ├── jest.config.js         # Jest ES module configuration
│   ├── src/
│   │   ├── config/            # DB, environment getters, and fail-fast validation
│   │   ├── models/            # Mongoose schemas with validation and partial unique indexes
│   │   │   ├── User.js        # User model with role protection ('patient', 'doctor', 'hospital_admin', 'admin')
│   │   │   ├── Doctor.js      # SLMC registration, fee, bio, and approvalStatus
│   │   │   ├── Hospital.js    # Facilities and channeling centres
│   │   │   ├── Specialization.js # Medical taxonomies
│   │   │   ├── DoctorHospital.js # Hospital affiliations
│   │   │   ├── Schedule.js    # Channeling sessions with atomic counters
│   │   │   ├── Appointment.js # Bookings with partial unique index (Rule 5)
│   │   │   └── Payment.js     # PayHere/simulated/cash payment records and gateway refs
│   │   ├── middleware/        # JWT auth, requireRole, mongoSanitize, validation, errorHandler
│   │   ├── controllers/       # Auth, Public, Patient, Doctor, HospitalAdmin, Admin, Uploads
│   │   ├── routes/            # REST API routers
│   │   ├── services/          # PayHere signatures/checkout, S3 presigned URLs, Nodemailer
│   │   ├── utils/             # Time calculations, 24-hr overlap checks, response helpers
│   │   ├── seed/              # Idempotent database seeder with Sri Lankan medical data
│   │   ├── app.js             # Express application factory
│   │   └── server.js          # HTTP server launcher with DB connection and graceful shutdown
│   └── tests/                 # Jest & Supertest automated integration test suites
└── client/                    # Vite + React 18 + Tailwind CSS Single-Page Application
    ├── .env.example           # Client environment template
    ├── package.json           # Frontend dependencies (Lucide icons, Recharts, Axios, React Router)
    ├── vite.config.js         # Vite configuration with API proxy (/api -> localhost:5000)
    ├── tailwind.config.js     # Custom medical brand teal color scheme
    └── src/
        ├── api/               # Axios client with JWT interceptor and token purge
        ├── context/           # AuthContext (user, doctor, hospital, login, logout, roles)
        ├── components/        # Navbar, Footer, Skeletons, StatusBadge, EmptyState, ProtectedRoute
        ├── pages/
        │   ├── public/        # Home, DoctorsSearch, DoctorDetail, Login, RegisterPatient, RegisterDoctor
        │   ├── patient/       # MyAppointments, BookingPayment, PatientProfile
        │   ├── doctor/        # DoctorDashboard, DoctorProfileEdit, DoctorHospitals, DoctorSchedules, SessionAppointments
        │   ├── hospital/      # HospitalDashboard, HospitalSchedules
        │   └── admin/         # AdminDashboard, DoctorApprovals, ManageHospitals, ManageSpecializations, ManageUsers, AllAppointments
        └── App.jsx & main.jsx # Route definitions and entry points
```

---

## Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **MongoDB**: MongoDB Atlas connection string or local MongoDB instance (v6.0+)
- **npm**: v9.0.0 or higher

---

## Quick Start & Setup

### 1. Install all dependencies from root

```bash
npm run install:all
```
This single command installs root dependencies (`concurrently`), `/server` dependencies, and `/client` dependencies.

### 2. Configure Environment Variables

Create `.env` files in both `/server` and `/client` directories using the provided templates:

#### Backend (`/server/.env`)
```bash
cp server/.env.example server/.env
```
Fill in at least `MONGODB_URI` and `JWT_SECRET`. Optional variables can be left empty:

```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/medilink?retryWrites=true&w=majority
JWT_SECRET=super_secret_jwt_key_for_medilink_channeling_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# PayHere Sandbox (requires a public HTTPS backend URL for server notifications)
PAYHERE_MERCHANT_ID=
PAYHERE_MERCHANT_SECRET=
PAYHERE_SANDBOX=true
API_PUBLIC_URL=https://your-public-api-domain.example

# Optional S3 configuration (leaves safe/simulated if empty)
AWS_REGION=ap-south-1
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Optional SMTP configuration (leaves safe/simulated if empty)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
MAIL_FROM=MediLink Sri Lanka <noreply@medilink.lk>

# Admin seed credentials
SEED_ADMIN_EMAIL=admin@medilink.lk
SEED_ADMIN_PASSWORD=Admin@123456
```

#### Frontend (`/client/.env`)
```bash
cp client/.env.example client/.env
```
```ini
# Leave empty in local development to use the Vite proxy (/api -> localhost:5000)
VITE_API_URL=
```

### 3. Seed Database with Realistic Sri Lankan Data

```bash
npm run seed
```
This idempotent script creates:
- 1 Platform Administrator
- 10 Medical Specializations (Cardiology, Dermatology, Neurology, Pediatrics, Orthopedics, Ophthalmology, etc.)
- 8 Premier Sri Lankan Hospitals (Asiri Central, Lanka Hospitals, Nawaloka, Durdans, Kings Hospital, Hemas Wattala, Asiri Surgical, Ninewells)
- 12 Approved Consultant Specialists with SLMC numbers and hospital affiliations
- Upcoming channeling schedules for the next 14 days with realistic patient capacities
- 1 Hospital Administrator for Asiri Central Hospital
- 2 Demo Patients with sample bookings

### 4. Run Both Applications Simultaneously

```bash
npm run dev
```
- **Backend API**: Running at `http://localhost:5000`
- **Frontend App**: Running at `http://localhost:5173`
- **API Health Check**: `http://localhost:5000/api/health`

---

## Development Demo Credentials

> [!NOTE]
> The credentials below are generated by the idempotent seed script strictly for development, testing, and presentation demonstrations.

| Role | Name | Email | Password | Scope / Details |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Platform Admin | `admin@medilink.lk` | `Admin@123456` | Full platform control, doctor approvals, analytics |
| **Hospital Admin** | Asiri Central Admin | `hospital.admin@medilink.lk` | `HospAdmin@123` | Scoped strictly to Asiri Central Hospital |
| **Doctor** | Dr. Anura Senanayake | `anura.senanayake@medilink.lk` | `Doctor@123` | Cardiologist (Asiri Central, Lanka Hospitals, Durdans) |
| **Doctor** | Dr. Malini Jayawardena | `malini.j@medilink.lk` | `Doctor@123` | Dermatologist (Asiri Central, Ninewells, Durdans) |
| **Doctor** | Dr. Ruwan Wickramasinghe | `ruwan.w@medilink.lk` | `Doctor@123` | Neurologist (Lanka Hospitals, Asiri Central) |
| **Patient** | Kasun Perera | `patient1@medilink.lk` | `Patient@123` | Active booking on schedule #1 |
| **Patient** | Nimali Silva | `patient2@medilink.lk` | `Patient@123` | Active booking on schedule #2 |

*Tip: The Login page includes quick one-click demo login buttons for seamless presentation testing.*

---

## Environment Variables Reference

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | No | `5000` | Port for the Express backend server |
| `NODE_ENV` | No | `development` | Environment mode (`development`, `production`, `test`) |
| `MONGODB_URI` | **Yes** | — | MongoDB Atlas connection string (**fails fast if missing**) |
| `JWT_SECRET` | **Yes** | — | Secret key for signing authentication JWT tokens (**fails fast if missing**) |
| `JWT_EXPIRES_IN` | No | `7d` | Token expiry duration |
| `CLIENT_URL` | No | `http://localhost:5173` | Allowed CORS origin and PayHere return/cancel URL base |
| `PAYHERE_MERCHANT_ID` | No | — | PayHere merchant ID from the merchant portal |
| `PAYHERE_MERCHANT_SECRET` | No | — | Domain-specific PayHere merchant secret; keep server-side only |
| `PAYHERE_SANDBOX` | No | `true` | Uses PayHere sandbox unless explicitly set to `false` |
| `API_PUBLIC_URL` | Required for PayHere | — | Public HTTPS backend base URL used for PayHere server notification callback |
| `AWS_REGION` | No | `ap-south-1` | AWS S3 bucket region |
| `AWS_S3_BUCKET` | No | — | AWS S3 bucket name (if empty, upload endpoints return safe "not configured") |
| `AWS_ACCESS_KEY_ID` | No | — | AWS IAM Access Key ID with S3 read/write permissions |
| `AWS_SECRET_ACCESS_KEY` | No | — | AWS IAM Secret Access Key |
| `SMTP_HOST` | No | — | SMTP mail server host (if empty, emails are logged safely without crashing) |
| `SMTP_PORT` | No | `587` | SMTP mail server port |
| `SMTP_USER` | No | — | SMTP username / address |
| `SMTP_PASS` | No | — | SMTP password / app password |
| `MAIL_FROM` | No | `MediLink <noreply@medilink.lk>` | Sender header for transactional channeling emails |
| `SEED_ADMIN_EMAIL` | No | `admin@medilink.lk` | Initial platform admin account created by seed script |
| `SEED_ADMIN_PASSWORD` | No | `Admin@123456` | Password for seed platform admin |
| `VITE_API_URL` | No | `""` | Optional client API base URL (defaults to Vite proxy `/api`) |

---

## AWS S3 Bucket CORS Configuration

If you configure AWS S3 for direct client image and SLMC document uploads via presigned URLs, apply the following CORS rule to your S3 bucket permissions in the AWS Management Console:

```json
[
  {
    "AllowedHeaders": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "HEAD"
    ],
    "AllowedOrigins": [
      "http://localhost:5173",
      "http://localhost:5000"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

### Bucket Privacy & Security
- Keep the S3 bucket **Block all public access** enabled (`true`).
- Objects are uploaded directly from the browser using short-lived presigned PUT URLs (`POST /api/uploads/presign`).
- Documents (like doctor SLMC registration certificates) are protected and only accessible via authenticated, short-lived signed GET URLs (`GET /api/uploads/view?key=`) restricted to the owner doctor and platform administrators.

---

## Critical Business Rules Implemented

1. **Approved Doctors Only**: Doctors appear in public searches and can create channeling schedules only when their `approvalStatus` is `approved`.
2. **Approved Hospital Affiliations**: Doctors can schedule sessions only at hospitals where their `DoctorHospital` link has been `approved` by the hospital administrator or platform admin.
3. **Session Validations & Overlap Rejection**:
   - Schedule date must be in the future.
   - `endTime` must be strictly after `startTime`.
   - `maxPatients` must be between 1 and 100.
   - A doctor cannot hold two overlapping schedules on the same date, even at different hospitals.
4. **Race-Safe Atomic Booking**:
   - Single atomic `findOneAndUpdate` on Schedule matching `{ _id, status: 'active', bookedCount < maxPatients, session not yet started }` and incrementing `{ bookedCount: 1, lastAppointmentNo: 1 }`.
   - The returned `lastAppointmentNo` is assigned as the `appointmentNo`.
   - If appointment creation encounters any failure, a compensation step decrements `bookedCount`.
   - Read-then-write anti-patterns are strictly avoided.
5. **No Double Active Bookings**:
   - Enforced by a partial unique MongoDB index on `{ patient: 1, schedule: 1 }` where `{ status: 'booked' }`. Friendly error: *"You already have an active booking for this channeling schedule."*
6. **2-Hour Cancellation Rule**:
   - Patients can cancel bookings up to 2 hours before the session start time.
   - Cancellation decrements `bookedCount`. Appointment numbers are **never reused**.
7. **Schedule Cancellation Cascade**:
   - When a doctor or admin cancels a schedule, all associated active patient appointments are automatically marked `cancelled`, and cancellation email alerts are dispatched (if SMTP is configured).
8. **Consultation Completion**:
   - Only the doctor of that schedule (or a platform admin) can mark an appointment as `completed`.
9. **PayHere Payment Gateway**:
   - Checkout hashes are generated on the backend; merchant secrets are never sent to the browser.
   - Payment success is recorded only after a signed PayHere server notification is verified against merchant ID, order ID, amount and currency.
   - Notifications are idempotent; the browser return URL is not treated as proof of payment.
   - Confirmation email is dispatched after a verified successful payment. The legacy simulated endpoint remains only for backwards compatibility.
10. **Ownership Scope**:
    - Patients see only their own bookings; doctors manage only their profile and schedules; hospital admins view and approve requests only for their facility; platform admins possess global scope.

---

## API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a patient (role locked to `patient`)
- `POST /api/auth/register-doctor` — Register a doctor (creates pending profile)
- `POST /api/auth/login` — Login with email and password
- `GET /api/auth/me` — Get current authenticated user profile

### Public (`/api`)
- `GET /api/specializations` — List all medical specialties
- `GET /api/hospitals` — List all active hospitals
- `GET /api/doctors` — Search doctors (filters: specialization, hospital, name, city, date; pagination)
- `GET /api/doctors/:id` — View doctor profile and upcoming sessions with open seats
- `GET /api/schedules` — Filter upcoming channeling schedules

### Patient (`/api`)
- `POST /api/appointments` — Atomic, race-safe appointment booking
- `GET /api/appointments/mine` — View own upcoming and past appointments
- `PATCH /api/appointments/:id/cancel` — Cancel appointment (enforces 2-hour window rule)
- `POST /api/payments/:appointmentId/payhere/checkout` — Create a server-signed PayHere checkout session (authenticated patient)
- `GET /api/payments/:appointmentId/status` — Read the authenticated patient payment status after PayHere redirects back
- `POST /api/payments/payhere/notify` — Public PayHere server callback; validates the MD5 signature, merchant, order, amount and currency before updating payment state
- `POST /api/payments/:appointmentId/pay` — Legacy simulated payment endpoint retained for existing test/demo compatibility; not used by the patient checkout UI

### Doctor (`/api`)
- `GET /api/doctors/me` — View own doctor profile
- `PUT /api/doctors/me` — Update bio, fee, profile photo, SLMC document
- `POST /api/doctors/me/hospital-requests` — Request hospital affiliation
- `GET /api/doctors/me/hospitals` — List affiliated hospitals and statuses
- `POST /api/schedules/mine` — Create channeling schedule (enforces overlap rules)
- `GET /api/schedules/mine` — List own schedules
- `PATCH /api/schedules/:id/cancel` — Cancel session (cascades to all patient bookings)
- `GET /api/schedules/:id/appointments` — View session patient roster
- `PATCH /api/appointments/:id/complete` — Mark patient consultation completed

### Hospital Admin & Admin (`/api`)
- `GET /api/doctor-hospitals` — View affiliation requests (scoped to hospital for hospital admin)
- `PATCH /api/doctor-hospitals/:id` — Approve or reject doctor affiliation

### Platform Admin (`/api/admin`)
- `GET /api/admin/doctors` — List all doctors with status filter
- `PATCH /api/admin/doctors/:id/approval` — Approve or reject doctor profile
- `GET /api/admin/hospitals` — List hospitals
- `POST /api/admin/hospitals` — Create hospital facility
- `PUT /api/admin/hospitals/:id` — Update hospital facility
- `DELETE /api/admin/hospitals/:id` — Toggle active status
- `GET /api/admin/specializations` — List specializations
- `POST /api/admin/specializations` — Create specialization
- `PUT /api/admin/specializations/:id` — Update specialization
- `DELETE /api/admin/specializations/:id` — Delete specialization
- `GET /api/admin/users` — List platform users with search and role filter
- `PATCH /api/admin/users/:id/status` — Toggle user active state
- `POST /api/admin/hospital-admins` — Provision hospital admin linked to facility
- `GET /api/admin/appointments` — Platform-wide appointment audit log
- `GET /api/admin/stats` — Platform metrics, 14-day trends, top specialties

### Uploads (`/api/uploads`)
- `POST /api/uploads/presign` — Generate presigned S3 PUT URL
- `GET /api/uploads/view?key=` — Generate short-lived signed GET URL (SLMC docs restricted)

---

## Automated Test Verification

MediLink features a comprehensive automated integration test suite built with **Jest**, **Supertest**, and **mongodb-memory-server**. Tests execute in complete isolation without requiring an external running database:

```bash
npm test
```

### Verified Test Suites:
1. `tests/roleProtection.test.js` — Verifies unauthorized rejection (401), patient role boundaries (403), doctor role boundaries (403), and admin permissions.
2. `tests/scheduleOverlap.test.js` — Verifies past date rejection, invalid start/end time rejection, and rejection of overlapping schedules on the same date across hospitals.
3. `tests/bookingRace.test.js` — **30 Concurrent Requests Test**: Fires 30 simultaneous booking requests against a session with only 5 seats. Asserts strictly 5 succeed (201), 25 return sold out (409), all 5 obtain unique appointment numbers (1 to 5), and DB `bookedCount` equals 5.
4. `tests/cancellationAndCascade.test.js` — Verifies successful cancellation >= 2 hours before session with booked count decrement, rejection < 2 hours before session, and doctor schedule cancellation cascade.
5. `tests/e2eSmoke.test.js` — End-to-end full channeling lifecycle verification (register -> search -> book -> pay -> view -> cancel) using the retained legacy demo payment endpoint.
6. `tests/payhereService.test.js` — Verifies deterministic checkout hash generation and rejects forged or modified PayHere notification signatures.

---

## Known Limitations and Future Work

1. **SMS Gateway Integration (deferred)**: In Sri Lanka, platforms like Doc990 send SMS appointment notifications via Dialog, Mobitel, or Hutch SMS gateways. While MediLink includes transactional email notifications via Nodemailer, SMS gateway integration would be valuable for wider patient reach.
2. **PayHere Production Enablement**: The PayHere integration supports sandbox and live endpoints, but live payments require an approved PayHere merchant account, domain-specific merchant secret, public HTTPS callback URL, and end-to-end production verification. Automated refunds are not implemented; cancellation of a paid PayHere appointment must be handled through an approved refund process rather than automatically marking it refunded.
3. **Doctor Queue Live Tracking**: Real-time WebSocket or Server-Sent Events (SSE) updates to show patients the currently serving appointment number live on screen during the session.
4. **Refund Processing Automation**: When an appointment is cancelled > 2 hours in advance, payment status is updated to `refunded`. Direct automated bank reversal integration could be wired with a real payment gateway.

---

## License

Developed for academic and internship demonstration purposes. All rights reserved.

---

## Docker deployment (local / single-host)

The repository includes a Docker Compose setup with the existing Express API, Vite-built React app served by Nginx, and MongoDB. It preserves the current client/server architecture.

1. Copy `server/.env.example` to `server/.env`.
2. Set at least `JWT_SECRET` to a long random secret. For the Compose MongoDB service, leave `MONGODB_URI` empty to use the Compose default, or set it to a reachable MongoDB URI (for example MongoDB Atlas).
3. Run `docker compose up --build -d` from the repository root.
4. Open `http://localhost:8080` and check `http://localhost:8080/api/health`.
5. View logs with `docker compose logs -f server` and stop with `docker compose down`. Use `docker compose down -v` only when you intentionally want to delete the local MongoDB volume.

The backend container reads `server/.env`; never commit real credentials. The GitHub Actions workflow runs the existing backend test suite and builds the frontend on pushes and pull requests. It does not deploy to a cloud host yet.

### External integrations

AWS S3 and SMTP still require provider accounts and credentials. PayHere checkout is implemented with sandbox/live selection, server-side hash generation, signed notification verification, amount/currency checks and idempotent status updates. Keep `PAYHERE_SANDBOX=true` until the merchant account and domain are approved. PayHere cannot deliver server notifications to localhost: expose the backend through a public HTTPS domain/tunnel and set `API_PUBLIC_URL`. Live payments and refunds require provider-side account approval and operational testing. SMS notifications remain deferred.
