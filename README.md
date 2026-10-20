# FeeFlow — Fee Collection & Receipt Management System
### Problem Statement 3 (PS3) | MERN Stack Project

> An institute fee management web platform to record fee payments, track pending dues, calculate late fees, generate official verifiable receipts, and provide real-time financial analytics.

---

## 🏛️ 1. Problem Statement & System Domain
* **Domain**: Education / Institute Finance & Accounts Management
* **Assigned Roll Number Ending Digit**: `3` (PS3)
* **Users / Roles**:
  1. **Accountant / Admin**: Full access to financial analytics dashboard, course fee structure management (CRUD), collecting payments with instant receipt generation, student ledgers, and overdue defaulter tracking.
  2. **Student**: Self-service portal to review enrolled course fee structures, itemized fee heads, real-time pending balance, payment histories, and printable official receipts.

---

## 🚀 2. Core Features & Business Logic
1. **Role-Based Authentication (JWT + bcrypt)**: Secure authentication with encrypted passwords and authorization middleware (`allowRoles('admin')`, `allowRoles('student')`). Student accounts link directly with `rollNumber`, `course`, and `semester`.
2. **Dynamic Fee Structure CRUD**: Configurable course fee structures with itemized fee heads (e.g., Tuition, Examination, Laboratory, Library, Transport) and dynamic sum computation.
3. **Payment Recording with Validation**: Admin can record partial or full payments via multiple modes: `Cash`, `UPI`, `Card`, and `Net Banking`.
4. **Strict Business Rules (Enforced on Backend)**:
   - **Rule A**: Rejects zero or negative payment amounts (`HTTP 400`).
   - **Rule B**: Rejects payment attempts if all dues are already settled (`HTTP 400`).
   - **Rule C**: Prevents overpayment (rejects payments exceeding the current pending balance).
5. **Status Workflow Engine**:
   - `Unpaid`: No payment received yet.
   - `Partially Paid`: Outstanding balance remaining.
   - `Paid`: Entire dues settled.
   - `Overdue`: Due date passed with unpaid or partial balance.
6. **Unique Serialized Receipt Generation**: Automatically increments and assigns formatted unique receipt numbers (`RCP-2026-0001`, `RCP-2026-0002`...).
7. **Official Printable Receipt Canvas**: Dedicated page (`/receipts/:receiptNo`) formatted for print (`window.print()`) with institute banner, student breakdown, and verification watermark.
8. **Live Financial Analytics Dashboard**:
   - Total Collected Revenue
   - Total Outstanding Dues
   - Total Billed Fees across Enrolled Students
   - Mode-wise Collection breakdown (Cash, UPI, Card, Net Banking with percentages)
   - Real-time Overdue Defaulters list (showing overdue days and balances)
   - Recent payment transaction stream

---

## 🛠️ 3. Technology Stack & Architecture

```
├── backend/                  # Node.js + Express.js REST API
│   ├── config/               # Database connection (Mongoose Atlas)
│   ├── controllers/          # Business logic & request handlers
│   ├── middleware/           # JWT authHandler & central errorHandler
│   ├── models/               # User, FeeStructure, Payment (3 linked collections)
│   ├── routes/               # Express resource routers (/api/...)
│   ├── scripts/              # Seed script (populates 10+ payment records)
│   ├── server.js             # Express app entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/                 # React.js SPA (Vite + React Router)
│   ├── public/               # Static assets & _redirects (Netlify SPA routing)
│   ├── src/
│   │   ├── api/              # Encapsulated API client modules
│   │   ├── components/       # Navbar, ProtectedRoute, FeeStructureForm, Badges
│   │   ├── pages/            # Dashboard, Ledger, Fees, Receipts, Auth pages
│   │   ├── App.jsx           # Routes & client-side state
│   │   ├── main.jsx          # BrowserRouter entry point
│   │   └── index.css         # Modern design system & print styles
│   ├── vercel.json           # Vercel SPA rewrite configuration
│   ├── .env.example
│   └── package.json
```

---

## 🔑 4. Demo Login Credentials

You can use the one-click demo credentials button on `/login` or enter:

| Role | Email | Password | Access / Capabilities |
| :--- | :--- | :--- | :--- |
| **Accountant / Admin** | `admin@institute.edu` | `Admin@123` | Dashboard metrics, Fee Structures CRUD, Record Payments, Defaulters list |
| **Student (B.Tech CSE)** | `aarav.patel@student.edu` | `Student@123` | View B.Tech fees, payment history, download receipt |
| **Student (B.Tech CSE - Partial)** | `priya.nair@student.edu` | `Student@123` | View partial payment status & overdue dues |
| **Student (BCA)** | `rohan.verma@student.edu` | `Student@123` | View BCA semester fees & receipts |

---

## 📋 5. API Endpoint Documentation

All endpoints return JSON only (`res.status(...).json(...)`) and are mounted under `/api/...`:

### 🔐 Authentication (`/api/auth`)
* `POST /api/auth/register` — Register student or admin account.
* `POST /api/auth/login` — Authenticate and receive JWT token.
* `GET /api/auth/me` — *(Private)* Get currently authenticated user details.

### 📚 Fee Structures (`/api/fee-structures`)
* `GET /api/fee-structures` — *(Private)* List fee structures (optional query: `?course=...&semester=...`).
* `GET /api/fee-structures/:id` — *(Private)* Retrieve single fee structure.
* `POST /api/fee-structures` — *(Admin Only)* Create course fee structure with fee heads.
* `PUT /api/fee-structures/:id` — *(Admin Only)* Update course fee structure.
* `DELETE /api/fee-structures/:id` — *(Admin Only)* Delete fee structure.

### 💳 Payments & Receipts (`/api/payments`)
* `POST /api/payments` — *(Admin Only)* Record fee payment, validate rules, auto-generate receipt.
* `GET /api/payments` — *(Private)* List all payments with filters (`studentId`, `paymentMode`, `course`).
* `GET /api/payments/receipt/:receiptNo` — *(Private: Admin or Student owner)* Retrieve official receipt.
* `GET /api/payments/student-summary/:studentId` — *(Private)* Get fee summary and ledger.
* `GET /api/payments/my-summary` — *(Student Only)* Get logged-in student's fee summary.

### 📊 Dashboard Analytics (`/api/dashboard`)
* `GET /api/dashboard/stats` — *(Admin Only)* Fetch total collected, pending, defaulters, and mode breakdown.

### 👥 Students (`/api/students`)
* `GET /api/students` — *(Admin Only)* Enrolled students roster (searchable).
* `GET /api/students/:id` — *(Admin Only)* Individual student ledger and payment history.

---

## ⚙️ 6. Local Setup & Execution Guide

### Prerequisites
* **Node.js** (v18+ or v20+)
* **MongoDB** (Local daemon or MongoDB Atlas URI)

### 1. Backend Setup
```bash
cd backend
npm install

# Configure environment variables
cp .env.example .env
# Edit .env if using MongoDB Atlas:
# MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/fee_management_db

# Seed database with sample students, fee structures, and 12 payments:
npm run seed

# Start development server:
npm run dev
# Server will run on http://localhost:5001
```

### 2. Frontend Setup
```bash
cd ../frontend
npm install

# Configure environment variables
cp .env.example .env
# Default: VITE_API_URL=http://localhost:5001/api

# Start Vite dev server:
npm run dev
# Frontend will run on http://localhost:5173
```

---

## 🌐 7. Production Deployment Instructions

### Backend (Render / Railway)
1. Push code to GitHub repository (`main` branch).
2. Create a new **Web Service** on [Render](https://render.com).
3. Set **Root Directory** to `backend`.
4. Set **Build Command** to `npm install`.
5. Set **Start Command** to `node server.js`.
6. Add Environment Variables:
   - `MONGO_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: Random secure string.
   - `CLIENT_URL`: Your deployed frontend URL (e.g., `https://feeflow.vercel.app`).
   - `PORT`: `5001` (or leave default assigned by Render).

### Frontend (Vercel / Netlify)
1. Import repository on [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Set **Framework Preset** to `Vite`.
4. Add Environment Variable:
   - `VITE_API_URL`: Your deployed Render API URL + `/api` (e.g., `https://feeflow-backend.onrender.com/api`).
5. Deploy! The included `vercel.json` and `_redirects` ensure SPA routes work on refresh without 404s.

---

## 🎥 8. Demo Video & Presentation Links
* **YouTube Explanation Video (5–10 min)**: *Add your YouTube video link here*
* **Project Presentation Slides (Google Drive - Viewer Access)**: *Add your Google Drive presentation link here*
