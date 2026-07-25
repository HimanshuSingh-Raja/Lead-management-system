# LeadDesk Mini — Enterprise Lead Management System

**LeadDesk Mini** is an enterprise-ready, production-grade Lead Management System built for the **Digital Heroes Internship Task**. It pairs a high-converting public landing page with an advanced, real-time Lead Management CRM powered by Next.js 15, Firebase Authentication, Cloud Firestore, HTTP-only Session Cookies, Edge Middleware, Recharts analytics, and Role-Based Access Control (RBAC).

---

## 🚀 Project Overview

In any growing business, prospective clients reach out via the web saying, *"I want to build a website/product."* LeadDesk Mini provides a seamless end-to-end pipeline:
1. **Public Lead Capture**: Converts prospect intent into qualified leads with client & server-side validation.
2. **Secure Real-Time Storage**: Saves leads instantly to Cloud Firestore with server timestamps.
3. **Enterprise CRM Dashboard**: Authenticated admins and managers analyze pipeline performance via Recharts, manage lead statuses (`New` → `Contacted` → `Closed` / `Lost`), search across multi-columns, assign leads, log activity trails, and export reports.

---

## ✨ Features

- **Public Landing Page**: High-converting SaaS design with responsive hero section, features, FAQ, and footer.
- **Dual-Layer Validation**: React Hook Form + Zod on the client; server-side Zod payload verification on `/api/leads`.
- **Production-Level Firebase Auth & HTTP-Only Cookies**: Secure email & password sign-in backed by HTTP-only `__session` cookies and Next.js Edge Middleware server-side route protection (zero flash of protected content).
- **Role-Based Access Control (RBAC)**: Enforces granular permissions for `Admin`, `Manager`, and `Sales` roles.
- **Pipeline Analytics**: Interactive Recharts visualizations (Monthly Pipeline Volume Area Chart, Lead Status Donut Chart, Acquisition Channel Bar Chart).
- **Advanced Lead Table**: Multi-column search, multi-criteria status/priority filters, column sorting, customizable pagination (5, 10, 25, 50 rows per page with page controls and record counters).
- **Full CRUD Capabilities**: Edit lead details, priorities, follow-up dates, assignee, and internal notes with a destructive delete confirmation modal.
- **Import & Export Tools**: Bulk CSV uploader with row validation, CSV export, JSON export, and print-ready report generation.
- **Audit Trail & Activity Log**: Real-time system audit history tracking creations, updates, deletions, assignments, and status changes.
- **In-App Notification Center**: Popover notification bell for lead assignments, status changes, and follow-up reminders.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Analytics Charts**: Recharts
- **Icons**: Lucide React
- **Validation**: React Hook Form & Zod
- **Backend & Database**: Firebase Authentication, Cloud Firestore, Firebase Admin SDK
- **Notifications**: Sonner & In-App Popover

---

## 📁 Folder Structure

```text
LeadcodeMini/
├── app/
│   ├── admin/
│   │   └── page.tsx              # Advanced CRM Admin Dashboard (Analytics, Leads, Audit Trail, Settings)
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts    # POST endpoint: Sets HTTP-only __session cookie
│   │   │   └── logout/route.ts   # POST endpoint: Destroys __session cookie
│   │   └── leads/
│   │       ├── route.ts          # POST (Create lead) endpoint with activity logging
│   │       └── [id]/route.ts     # PUT (Update) & DELETE endpoints with validation
│   ├── login/
│   │   └── page.tsx              # Firebase Email/Password Sign-In page
│   ├── unauthorized/
│   │   └── page.tsx              # 401 Unauthorized fallback page
│   ├── layout.tsx                # Root layout wrapped in AuthProvider & Toaster
│   └── page.tsx                  # Public landing page with lead form
├── components/
│   ├── crm/                      # CRM Core Modules
│   │   ├── activity-log-drawer.tsx# Audit trail timeline drawer
│   │   ├── analytics-charts.tsx   # Recharts visualization charts
│   │   ├── delete-confirm-modal.tsx# Destructive delete modal
│   │   ├── edit-lead-modal.tsx    # Full lead editing modal dialog
│   │   ├── export-tools.tsx       # CSV, JSON & Print export tools
│   │   ├── import-csv-modal.tsx   # Bulk CSV uploader & validator
│   │   └── notifications-popover.tsx# In-app notification center
│   ├── lead-form.tsx             # Public validated lead form
│   ├── navbar.tsx                # Dynamic responsive navigation bar
│   └── ui.tsx                    # Reusable Logo and Framer Motion wrappers
├── lib/
│   ├── auth-context.tsx          # React AuthContext & RBAC permissions hook
│   ├── firebase-admin.ts         # Server-side Firebase Admin SDK (adminDb & adminAuth)
│   ├── firebase.ts               # Client-side Firebase App, Auth & Firestore setup
│   ├── types.ts                  # Extended CRM TypeScript interfaces
│   └── validation.ts             # Zod validation schemas
├── firestore.rules               # Security rules for leads, users, activity_logs, and notifications
├── middleware.ts                 # Next.js Edge Middleware for server-side route security
├── next.config.ts                # Next.js config with Webpack module aliases
├── render.yaml                   # Render.com deployment blueprint configuration
├── vercel.json                   # Vercel deployment configuration
└── package.json                  # Dependencies and build scripts
```

---

## 🗄️ Database Design

### Collection 1: `leads`
Stores all captured and managed client lead records.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Auto-generated document ID |
| `fullName` | `string` | Full name of the lead contact |
| `email` | `string` | Valid email address |
| `phone` | `string` | Optional phone number |
| `company` | `string` | Company or organization name |
| `budget` | `string` | Budget selection range (e.g. `Under $5,000`, `$5,000 – $15,000`, `$50,000+`) |
| `message` | `string` | Inbound inquiry message |
| `status` | `string` | Lead stage: `New` \| `Contacted` \| `Closed` \| `Lost` |
| `priority` | `string` | Lead priority: `Low` \| `Medium` \| `High` \| `Urgent` |
| `source` | `string` | Lead channel: `Website` \| `Referral` \| `LinkedIn` \| `Cold Call` \| `Organic` \| `Other` |
| `assignedTo` | `string` | Email or UID of assigned sales representative |
| `followUpDate` | `string` | Scheduled follow-up date (`YYYY-MM-DD`) |
| `notes` | `Array<LeadNote>` | Array of internal notes (`id`, `content`, `author`, `createdAt`) |
| `createdAt` | `Timestamp` | Firestore server timestamp of lead submission |
| `updatedAt` | `Timestamp` | Firestore server timestamp of last update |

#### Status Values Breakdown
- **`New`**: Default state upon submission. Awaiting initial contact.
- **`Contacted`**: Outreach initiated; active conversation underway.
- **`Closed`**: Deal won or project successfully onboarded.
- **`Lost`**: Lead disqualified or declined proposal.

---

### Collection 2: `users`
Stores user profile information and access roles.

| Field | Type | Description |
| :--- | :--- | :--- |
| `uid` | `string` | Firebase Auth UID |
| `email` | `string` | User email address |
| `role` | `string` | Access role: `Admin` \| `Manager` \| `Sales` |
| `displayName` | `string` | User full name |
| `createdAt` | `Timestamp` | Account creation timestamp |

---

### Collection 3: `activity_logs`
Stores the complete audit trail of system events.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Document ID |
| `leadId` | `string` | Associated lead ID |
| `type` | `string` | Event type (`CREATED`, `UPDATED`, `DELETED`, `STATUS_CHANGED`, `ASSIGNED`) |
| `description` | `string` | Detailed event log summary |
| `performedBy` | `string` | Email of user who performed the action |
| `timestamp` | `Timestamp` | Event timestamp |

---

### Collection 4: `notifications`
Stores in-app alerts and notifications.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Document ID |
| `title` | `string` | Notification title |
| `message` | `string` | Notification message body |
| `type` | `string` | Notification type (`ASSIGNMENT`, `STATUS`, `FOLLOWUP`, `NEW_LEAD`) |
| `read` | `boolean` | Read status |
| `targetUserEmail` | `string` | Recipient user email |
| `createdAt` | `Timestamp` | Timestamp |

---

## 🔐 Authentication & Security Flow

1. **Sign-In**: The client authenticates via Firebase Auth `signInWithEmailAndPassword(auth, email, password)`.
2. **ID Token & HTTP-Only Session Cookie**: Upon successful sign-in, the client fetches the Firebase ID Token (`user.getIdToken()`) and posts it to `/api/auth/login`. The server sets an HTTP-only, `SameSite=Lax`, `Secure` cookie named `__session`.
3. **Server-Side Edge Middleware Route Protection**: Next.js Edge Middleware (`middleware.ts`) intercepts requests to `/admin`. If the `__session` cookie is missing, the server performs an instant `NextResponse.redirect` to `/login` before rendering protected HTML, preventing any flash of unauthenticated content.
4. **Session Persistence**: Firebase Auth's `onAuthStateChanged` restores client state on page refresh; HTTP-only cookies persist across requests.
5. **Session Destruction**: Clicking "Sign out" calls `signOut(auth)` and posts to `/api/auth/logout`, destroying the `__session` cookie on the server.

---

## ⚡ Installation & Setup

1. **Clone Repository**:
   ```bash
   git clone https://github.com/HimanshuSingh-Raja/Lead-management-system.git
   cd Lead-management-system
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your Firebase credentials
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

5. **Verify Type-Safety & Production Build**:
   ```bash
   npx tsc --noEmit
   npm run lint
   npm run build
   ```

---

## ⚙️ Environment Variables

Create `.env.local` in the project root:

# Client
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Admin
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY=your_private_key

## 🚢 Deployment

### Deploy on Vercel
1. Push repository to GitHub.
2. Import project into [Vercel](https://vercel.com).
3. Add all variables from `.env.local.example` under **Project Settings → Environment Variables**.
4. Set Build Command: `npm run build`.
5. Deploy and add live Vercel domain to **Firebase Console → Authentication → Settings → Authorized domains**.

---

## 🔑 Test Credentials (Admin User)

- **Email**: `admin@leaddesk.com`
- **Password**: `Admin@12345`

---

## 🌐 Live URL & Repositories

- **GitHub Repository**: [https://github.com/HimanshuSingh-Raja/Lead-management-system](https://github.com/HimanshuSingh-Raja/Lead-management-system)
- **Live Deployment URL**: `https://lead-management-system.onrender.com`

---

## 📹 Loom Video Walkthrough

- **Video Link**: `[Insert Loom Video Link Here]`

---

## 📸 Screenshots

- **Public Landing Page**: Responsive Hero section, Lead form with validation, features & footer credit.
- **Firebase Auth Login**: Email/Password authentication with loading spinners & error notifications.
- **Admin CRM Dashboard**: Real-time leads pipeline, Recharts analytics, multi-column search, status toggles, audit trail log, and CSV import/export.

---

Built for [Digital Heroes Training Task](https://digitalheroesco.com).
