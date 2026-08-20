# SignBridge AI - Comprehensive Testing Guide

Welcome to the **SignBridge AI** testing phase! This guide will walk you through setting up the project locally on your machine and systematically testing every feature based on the different user roles we have built. 

Please follow this document step-by-step to identify any bugs, UI glitches, or broken flows.

---

## Part 1: Initial Setup

Before you start testing, you need to get the app running on your local machine.

### 1. Prerequisites
- **Node.js**: Make sure you have Node.js installed (v18 or higher recommended).
- **Code Editor**: VS Code is recommended.

### 2. Project Setup
1. Receive the project files from Kanad (either via a Git repository link or a ZIP file) and extract them into a folder.
2. Open your terminal, navigate into the project folder, and run:
   ```bash
   npm install
   ```

### 3. Environment Variables (.env)
You need to connect to the central Supabase database. 
1. Create a file named `.env` in the root folder of the project.
2. Ask Kanad for the environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_GEMINI_API_KEY`) and paste them inside the `.env` file.

### 4. Start the Server
Run the following command in your terminal:
```bash
npm run dev
```
Open `http://localhost:5173` in your web browser. You should see the SignBridge AI Landing page!

---

## Part 2: Testing User Roles & Features

Our platform relies on role-based dashboards. We recommend opening **two different web browsers** (e.g., Chrome and Edge) or an **Incognito window** so you can test interactions between two different accounts at the same time (like a Deaf User and an Interpreter).

*(Note: Currently, email verification is paused in the database, so you can use dummy emails like `test1@test.com` to sign up quickly.)*

### Phase A: Standard Users (Deaf / Hearing)
Create a normal account and select either "Deaf User" or "Hearing User".

**Test Checklist:**
- [ ] **Home Dashboard:** Does the main dashboard load correctly?
- [ ] **Community Forum:** Navigate to the Community section. Can you view, create, and reply to forum threads?
- [ ] **Learning Hub:** Check if you can access ASL tutorials or upload resources.
- [ ] **Messaging:** Can you send a private message to another user?

### Phase B: The Live Interpreter Flow (Requires 2 Browsers)
This is our core communication feature. 

**Test Checklist:**
1. **Browser 1 (Interpreter):** Sign up for a new account and select the **Interpreter** role.
   - [ ] Verify you are instantly redirected to the `Interpreter Portal`.
   - [ ] Ensure your dashboard shows a queue of "Pending Requests" (it will be empty at first).
2. **Browser 2 (Deaf User):** Log into a standard user account.
   - [ ] Go to the **Healthcare** tab in the sidebar.
   - [ ] Click the **"Request Live Interpreter Now"** button.
3. **Browser 1 (Interpreter):**
   - [ ] The pending request should instantly appear on the Interpreter's screen!
   - [ ] Click **"Accept & Join Call"**.
   - [ ] You should be placed into a Secure Video Call room with a "Waiting for answer..." status.
4. **Browser 2 (Deaf User):**
   - [ ] The screen should update to say "Interpreter Found!".
   - [ ] Click **"Join Video Call"**.
5. **The Video Call Room:**
   - [ ] Does the video feed work for both parties?
   - [ ] **Live Captioning:** Click the "Start Captions" button and speak into your microphone. Do the captions appear on the *other* person's screen?
   - [ ] Click "End Call". Does it properly disconnect and return you to the dashboard?

### Phase C: Healthcare (Doctor & Hospital)
Create two accounts for this phase: one Doctor and one Hospital.

**Test Checklist:**
1. **Hospital User:** 
   - [ ] Sign up and verify redirection to the `Hospital Portal`.
   - [ ] Test adding Doctors to your hospital's roster.
   - [ ] Check if you can view overall appointment statistics.
2. **Doctor User:**
   - [ ] Sign up and verify redirection to the `Doctor Portal`.
   - [ ] Can you view a list of scheduled appointments?
3. **Patient Booking:**
   - [ ] Log in as a normal user. Go to the **Healthcare** section.
   - [ ] Attempt to book an appointment with a specific Doctor/Hospital.
   - [ ] Ensure the appointment shows up correctly on the Doctor's dashboard.

### Phase D: Employment (Employer)
Create an account with the **Employer** role.

**Test Checklist:**
- [ ] **Employer Portal:** Are you redirected to the `Employer Portal` correctly upon login?
- [ ] **Job Postings:** Can you create a new job posting targeted at the Deaf community?
- [ ] **Applicant Tracking:** Can standard users apply for the job, and does the Employer see those applications?

---

## Part 3: Bug Reporting Protocol

When you encounter an issue, please document it clearly for Kanad so it can be fixed!

**Format your bug reports like this:**
1. **Role Logged In As:** (e.g., Interpreter)
2. **Action Attempted:** (e.g., Clicked 'Accept Call')
3. **Expected Result:** (e.g., Should navigate to the video room)
4. **Actual Result:** (e.g., Got a red error saying "Unauthorized")
5. **Screenshots:** Attach full-screen screenshots (including the URL bar) if possible!

Happy Testing! 🚀
