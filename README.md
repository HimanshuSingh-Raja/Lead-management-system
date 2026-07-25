# LeadDesk Mini — Digital Heroes Training Task

LeadDesk Mini is a full-stack, responsive lead capture and management platform built for the **Digital Heroes Internship Task**. It pairs a high-converting public SaaS landing page with a live, protected admin pipeline backed by Firebase Authentication and Cloud Firestore.

---

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Icons**: Lucide React
- **Validation**: React Hook Form & Zod (Client-side & Server-side)
- **Backend & Database**: Firebase Authentication, Cloud Firestore & Firebase Admin SDK
- **Notifications**: Sonner

---

## 📁 Folder Structure

```text
LeadcodeMini/
├── app/
│   ├── admin/
│   │   └── page.tsx              # Real-time protected Admin Dashboard
│   ├── api/
│   │   └── leads/
│   │       └── route.ts          # Server-validated API endpoint (Firebase Admin)
│   ├── login/
│   │   └── page.tsx              # Firebase Email/Password Sign-In page
│   ├── globals.css               # Design system & Tailwind directives
│   ├── layout.tsx                # Root layout with AuthProvider & Toaster
│   └── page.tsx                  # Public landing page & CTA components
├── components/
│   ├── get-started-redirect.tsx  # Router-interceptor for Get Started buttons
│   ├── lead-form.tsx             # Client-validated lead capture form
│   ├── navbar.tsx                # Dynamic responsive navigation bar
│   └── ui.tsx                    # Reusable Logo and Framer Motion wrappers
├── lib/
│   ├── auth-context.tsx          # React AuthContext & Firestore User Profile hook
│   ├── firebase-admin.ts         # Server-side Firebase Admin SDK initialization
│   ├── firebase.ts               # Client-side Firebase App, Auth & Firestore setup
│   ├── types.ts                  # TypeScript interfaces (Lead, UserProfile, LeadStatus)
│   └── validation.ts             # Zod validation schemas
├── firestore.rules               # Production Firestore security rules
├── eslint.config.mjs             # ESLint 9 Flat Config (Next.js & TypeScript)
├── next.config.ts                # Next.js config with Webpack module aliases
└── package.json                  # Package dependencies & scripts
```

---

## 🗄️ Database Model

### Collection: `leads`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Firestore document ID |
| `fullName` | `string` | Contact person full name |
| `email` | `string` | Valid email address |
| `budget` | `string` | Budget selection range |
| `message` | `string` | Inbound inquiry message |
| `status` | `string` (`"New"` \| `"Contacted"` \| `"Closed"`) | Current pipeline status |
| `createdAt` | `Timestamp` | Server timestamp of lead creation |
| `updatedAt` | `Timestamp` | Server timestamp of last status change |

### Collection: `users`
| Field | Type | Description |
| :--- | :--- | :--- |
| `uid` | `string` | Firebase Auth User UID |
| `email` | `string` | Registered administrator email |
| `role` | `string` | User access role (e.g. `"Admin"`, `"Manager"`) |
| `displayName` | `string` | User display name |
| `createdAt` | `Timestamp` | User document creation timestamp |

---

## 🔐 Authentication Flow

1. **State Persistence**: The `AuthProvider` (`lib/auth-context.tsx`) subscribes to Firebase Auth via `onAuthStateChanged`.
2. **User Profile Sync**: When a user logs in, `AuthProvider` subscribes to `users/{uid}` in Firestore to retrieve user data and role.
3. **Route Protection**: The `/admin` dashboard checks authentication state; unauthenticated users are automatically redirected to `/login`.
4. **Get Started Navigation**: "Get Started" buttons across the landing page navigate using Next.js `useRouter`. If logged in, users are taken directly to `/admin`; if not, they are directed to `/login`.

---

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory:

```env
# Client-side Firebase Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Server-side Firebase Admin SDK Credentials
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

## 🛠️ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/leaddesk-mini.git
   cd leaddesk-mini
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Firebase credentials
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

5. **Verify Build & Lint**:
   ```bash
   npx tsc --noEmit
   npm run lint
   npm run build
   ```

---

## 🚢 Deployment

### Vercel Deployment

1. Push your repository to GitHub and connect it to [Vercel](https://vercel.com).
2. Configure all environment variables from `.env.example` in **Vercel → Project Settings → Environment Variables**.
3. Ensure Firebase Auth authorized domains list your Vercel deployment URL (e.g. `your-app.vercel.app`).
4. Trigger deployment.

---

## 🔑 Admin Credentials (Test Account)

To test the live Admin Dashboard:

- **Email**: `admin@leaddesk.com`
- **Password**: `Admin@12345`

*(Note: Create this user in your Firebase Console under Authentication → Users).*

---

## 🌐 Live URLs

- **Production Deployment**: `https://leaddesk-mini.vercel.app` (replace with live URL)
- **Repository**: `https://github.com/HimanshuSingh-Raja/Lead-management-system`

---

## 📹 Demo Video (Loom Walkthrough)

- **Video Link**: `[Insert Loom Video Link Here]` *(e.g. https://www.loom.com/share/your-video-id)*

**Video Walkthrough Flow (5 Minutes max)**:
1. **Public Landing Page**: Overview of responsive Hero section, features, and footer.
2. **Lead Form Submission**: Demonstrating client-side validation & submitting a new lead.
3. **Firestore Verification**: Showing the lead entry saved in Cloud Firestore with `status: "New"`, `createdAt`, and `updatedAt`.
4. **Admin Sign-In**: Firebase Authentication email/password sign-in.
5. **Protected Admin Dashboard**: Viewing real-time leads, live counters, search by Name/Email, and status toggle (New → Contacted → Closed).

---

## 📸 Screenshots

- **Public Landing Page**: Clean responsive hero, lead capture form, features & FAQ.
- **Login Page**: Firebase authentication with validation & error handling.
- **Admin Dashboard**: Real-time leads list, status toggles, lead counters, and search filtering.

---

## 🔮 Future Improvements

1. **Email Notifications**: Send instant notification emails via SendGrid / Resend when a new lead is submitted.
2. **Lead Export**: CSV / Excel export functionality for leads in the admin dashboard.
3. **Advanced Analytics**: Visual conversion charts and pipeline velocity analytics.

---

Built for [Digital Heroes Training Task](https://digitalheroesco.com).
