# 🌉 SignBridge AI

> **Bridging the Communication Divide for the Deaf and Hard-of-Hearing Community**  
> An AI-powered assistive platform featuring real-time Indian Sign Language (ISL) translation, interactive learning, accessible healthcare navigation, government schemes directory, and an emergency SOS dispatch system.

---

## 🌟 Key Features

- **Real-Time ISL Translation:** Camera-powered hand landmark detection using MediaPipe & machine learning for accurate gesture recognition.
- **Interactive Sign Learning:** Flashcards, gamified practice modules, and real-time posture feedback.
- **Accessible Healthcare Hub:** Hospital directory, appointments, medical records management, and real-time WebRTC interpreter calling.
- **🚨 Emergency SOS System:** 1-tap silent emergency beacon with live GPS coordinates tracking and instant email alert dispatch via serverless edge functions.
- **Government Schemes & NGO Directory:** 26+ verified Central and Maharashtra State disability empowerment schemes, scholarships, and NGO support services.

---

## 🚀 Quick Start Guide for Clients & Developers

Follow these simple steps to clone, configure, and run the project locally.

### 1. Prerequisites
Ensure you have the following installed on your machine:
- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) (Version 18.x, 20.x, or newer)
- npm (comes bundled with Node.js)

---

### 2. Clone the Repository
Open your terminal or command prompt and clone the repository:

```bash
git clone https://github.com/Manthan-svg/capstone-project.git
cd capstone-project
```

---

### 3. Install Dependencies
Install all required project packages:

```bash
npm install
```

---

### 4. Configure Environment Variables
1. Copy the example environment file to create your `.env`:
   ```bash
   cp .env.example .env
   ```
   *(On Windows PowerShell, use: `Copy-Item .env.example .env`)*

2. Open `.env` and verify the values:
   ```env
   VITE_SUPABASE_URL=https://xiemxxhfhgvfnfehzhcc.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpZW14eGhmaGd2Zm5mZWh6aGNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NTY0ODMsImV4cCI6MjEwMTMzMjQ4M30.DCBLWAKhmdxprurYHkQYOidnl3IaVvVXO9ONoI5oAxI
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

---

### 5. Run the Application
Start the local development server:

```bash
npm run dev
```

The application will be accessible at:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 🛠️ Build for Production

To create an optimized production build:

```bash
npm run build
```

To preview the built production bundle locally:

```bash
npm run preview
```

---

## 🗄️ Database & Backend Architecture
The application uses **Supabase (PostgreSQL)** for backend services:
- **`learning_schema.sql`**: Learning modules, sign flashcards, and quizzes.
- **`healthcare_schema.sql`**: Hospitals, appointments, medical records, and SOS alerts.
- **`client_updates_4.sql`**: Maharashtra state disability schemes and verified NGOs.
- **`supabase/functions/sos-email/`**: Edge function for instant emergency alert email dispatches.
