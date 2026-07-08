# 🛡️ VaultBot: Gamifying and Automating Wealth-Building

> 🚀 **Live App:** [https://vaultbot-f1d9.onrender.com](https://vaultbot-f1d9.onrender.com)

> **Pitch Context:** Built for the Hackathon to address personal finance consistency. VaultBot bridges the gap between sports passion and saving habits, transforming how young adults interact with their wealth.

## 🔐 Demo Login Credentials

Use these credentials to log in and explore the app:

| Field            | Value            |
| ---------------- | ---------------- |
| **First Name**   | John             |
| **Last Name**    | Doe              |
| **Email**        | John@example.com |
| **Password**     | Example.1234     |
| **Phone Number** | 08123456789      |

---

## 🎯 The Problem & Goal

### The Problem

Traditional savings apps are **monotonous and passive**. Despite having good financial intentions, most users suffer from **"action paralysis" or lack of discipline**. They forget to set aside money regularly, view saving as a chore, and eventually abandon their savings goals.

### The Solution: VaultBot

**VaultBot** is an automated, secure personal finance platform that turns savings from a chore into an engaging habit. By introducing gamification and automation, we help users achieve financial well-being frictionlessly.

Our core innovation is **Fantasy Savings**: linking a user's saving triggers directly to the fixtures and performance of their favorite Premier League football team. If your team plays or wins, you save. We also support **Vault Savings**—traditional scheduled automated transfers (daily, weekly, monthly)—so users can build healthy habits on their own terms.

---

## ✨ Key Features

1. **Gamified Savings (Fantasy Savings)**:
   - Link a savings goal to any of the 20 Premier League teams.
   - Automatically sets aside money on match fixtures.
2. **Scheduled Automation (Vault Savings)**:
   - Set up standard recurring plans (Daily, Weekly, Monthly, Yearly).
   - Real-time progress trackers against custom goal targets.
3. **Visual Analytics & Analytics Dashboard**:
   - Area growth charts and goal distribution pie charts built using Recharts.
   - Clean, beautiful dark/light mode toggle with premium glassmorphism card styling.
4. **Automated Audit Ledger**:
   - Complete audit trail of deposits and auto-saved transactions with interactive query and status filters.
5. **Secure Authentication & Session Recovery**:
   - JSON Web Token (JWT) stateless auth.
   - Automatic token validation and global session persistence in React Context to prevent state drops on page reload.

---

## 🛠️ The Tech Stack

### Frontend

- **Framework**: React 19 & Vite
- **State & Data Fetching**: TanStack React Query (v5) & React Context API
- **Styling & Animations**: Tailwind CSS & Framer Motion (for fluid wizard steps and micro-interactions)
- **UI Icons**: Lucide React

### Backend

- **Framework**: Node.js & Express (TypeScript)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth & Logging**: JWT, bcrypt, Winston logger

### Quality Control

- **Testing**: Jest & Supertest (API unit and integration coverage)
- **Code Standards**: ESLint, Prettier

---

## ⚙️ How to Run the Project

Follow these steps to spin up the local development environment:

### 1. Prerequisites

- **Node.js** (v18 or higher recommended)
- **PostgreSQL** running locally or via Docker

### 2. Installation

Clone the repository and install the dependencies from the root directory:

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the `apps/api` directory:

```env
PORT=5000
DATABASE_URL="postgresql://<username>:<password>@localhost:5432/vaultbot?schema=public"
JWT_SECRET="your-super-secure-jwt-secret-key"
```

### 4. Database Initialization

Run Prisma migrations to create the database schema:

```bash
cd apps/api
npx prisma migrate dev --name init
cd ../..
```

### 5. Running the Application

From the workspace root, run the concurrent dev command:

```bash
npm run dev
```

- **Backend API** will run at `http://localhost:5000`
- **Frontend App** will run at `http://localhost:5173`

---

## 🧪 Testing, Quality Assurance, & Workflow

We maintain a rigorous CI/CD-ready monorepo workflow. All validation commands are run from the workspace root:

### Running Tests

To run the automated test suite (Jest/Supertest coverage for authentication, session verification, and plan configurations):

```bash
npm run dev:api-test
```

### Code Quality & Formatting

To analyze code for syntax errors and warnings using ESLint:

```bash
npm run lint
```

To automatically format the code according to our styling standard (Prettier):

```bash
npm run format
```

### Full CI/CD Pipeline Check

Run code formatting, ESLint validation, and testing concurrently to verify deploy-readiness:

```bash
npm run CICD
```

---

## 📈 Project Monorepo Workflow

The project uses a structured package architecture:

- **`apps/api/`**: The backend services, database configuration, route handlers, and API tests.
- **`apps/web/`**: The frontend UI components, global auth contexts, protected routing controls, and page views.
- **`types/`**: Shared TypeScript types to enforce type-safety across both client and server boundaries.
