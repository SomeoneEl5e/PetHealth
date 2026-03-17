# 🐾 PetHealth

A full-stack web application for managing pet health records, vaccinations, and veterinary visits. Built with React and Node.js.

![CSS](https://img.shields.io/badge/CSS-49.9%25-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-47.2%25-yellow)

## 📋 Features

### For Pet Owners
- **Pet Management** — Add, edit, and delete pets with photos (stored on Cloudinary)
- **Vaccination Tracking** — Record vaccines with date, veterinarian, clinic, and notes
- **Vet Visit Logs** — Track visits with reasons, vets, and clinic details
- **AI Health Summary** — Get AI-generated health summaries for each pet (powered by OpenAI)
- **Profile Management** — Edit personal details, change password, manage account

### For Admins & Staff
- **Role-Based Access Control** — 4 roles: User, Editor, Sub-Admin, Admin
- **Vaccine Type Management** — Define vaccine types with timing schedules and target pet types
- **Pet Type & Breed Management** — Manage pet categories and breeds with validation
- **User Management** — View, edit roles, enable/disable user accounts
- **Statistics Dashboard** — Interactive charts with filters:
  - Donut charts (pets by type, gender, age)
  - Bar charts (by city, breed, visit reasons)
  - Column chart (monthly registrations)
  - Vaccination coverage progress bars
  - Top pet owners ranking table
  - Filterable by: pet type, gender, breed, city, vaccine, age group, and date period
- **Activity Tracking** — Monitor staff actions with period filters and per-user breakdowns

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, React Router 7 |
| **Backend** | Node.js, Express 5 |
| **Database** | MongoDB (Mongoose ODM) |
| **Authentication** | JWT (JSON Web Tokens) |
| **File Upload** | Multer + Cloudinary |
| **AI** | OpenAI API |
| **Styling** | Vanilla CSS with CSS Variables (dark/light mode) |

## 📁 Project Structure

```
PetHealth/
├── backend/
│   ├── server.js              # Express server setup
│   ├── models/
│   │   ├── user.js            # User schema (with embedded pets)
│   │   ├── pets.js            # Pet schema (embedded in User)
│   │   ├── vaccine.js         # Vaccine type definitions
│   │   ├── petType.js         # Pet type definitions
│   │   ├── breed.js           # Breed definitions
│   │   └── activityLog.js     # Staff activity logs
│   └── routers/
│       ├── login.js           # Authentication
│       ├── signup.js          # Registration
│       ├── me.js              # User profile
│       ├── pets.js            # Pet CRUD + vaccines + visits
│       ├── admin.js           # Admin panel + statistics
│       ├── ai.js              # AI health summary
│       ├── vaccines.js        # Public vaccine list
│       ├── petTypes.js        # Public pet types list
│       └── breeds.js          # Public breeds list
├── src/
│   ├── App.jsx                # Router setup
│   ├── index.css              # Global styles + CSS variables
│   ├── pages/
│   │   ├── Home.jsx           # Landing page
│   │   ├── Login.jsx          # Login form
│   │   ├── SignUp.jsx         # Registration form
│   │   ├── About.jsx          # About page
│   │   ├── PersonalData.jsx   # Pet dashboard
│   │   ├── EditProfile.jsx    # Profile editing
│   │   └── Admin.jsx          # Admin panel
│   └── components/
│       ├── Navbar.jsx         # Navigation bar
│       ├── Footer.jsx         # Footer
│       ├── PetCard.jsx        # Pet display card
│       ├── AddPetForm.jsx     # Add pet modal
│       ├── AddVaccineForm.jsx # Add vaccine modal
│       ├── AddVisitForm.jsx   # Add visit modal
│       ├── HistoryModal.jsx   # Visit/vaccine history
│       └── FeatureItem.jsx    # Home page feature card
├── package.json
└── vite.config.js
```

## 🏗️ Data Model

Pets are stored as **embedded documents** inside the User document (not as a separate collection).
Each pet contains embedded arrays for `vetVisits` and `vaccines`.

```
User
 └── pets[] (embedded)
      ├── vetVisits[] (embedded)
      └── vaccines[] (embedded)

Vaccine    ─── references ──→ PetType
Breed      ─── references ──→ PetType
ActivityLog ── references ──→ User
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- Cloudinary account (for image uploads)
- OpenAI API key (for AI summaries)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SomeoneEl5e/PetHealth.git
   cd PetHealth
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Create environment file**

   Create `backend/.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   OPENAI_API_KEY=your_openai_key
   ```

5. **Start MongoDB**
   ```bash
   mongod
   ```

6. **Run the backend**
   ```bash
   cd backend
   npm start
   ```

7. **Run the frontend** (in a new terminal)
   ```bash
   npm run dev
   ```

8. Open **http://localhost:5173** in your browser

## 🔐 API Overview

All API routes are under `/api/`:

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/signup` | No | Register new user |
| POST | `/api/login` | No | Login, receive JWT |
| GET | `/api/me` | Yes | Get user profile |
| PUT | `/api/me` | Yes | Update profile |
| GET | `/api/pets` | Yes | Get user's pets |
| POST | `/api/pets` | Yes | Add a pet |
| PUT | `/api/pets/:id` | Yes | Update a pet |
| DELETE | `/api/pets/:id` | Yes | Delete a pet |
| POST | `/api/pets/:id/vaccines` | Yes | Add vaccine to pet |
| POST | `/api/pets/:id/visits` | Yes | Add visit to pet |
| POST | `/api/ai/summary/:id` | Yes | Get AI health summary |
| GET | `/api/admin/statistics` | Admin | Get filtered statistics |
| GET | `/api/admin/activity-stats` | Admin | Get activity logs |

## 👥 Roles

| Role | Permissions |
|------|------------|
| **User** | Manage own pets, vaccines, visits |
| **Editor** | Manage vaccine types, pet types, breeds (own items, 24h window) |
| **Sub-Admin** | Everything Editor can + manage users + view statistics |
| **Admin** | Full access to all features |
