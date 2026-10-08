# TypeMaster - Pro Typing Speed Test & Real-Time Telemetry 🚀

A modern full-stack typing speed test application built with **real-time data synchronization**, anti-cheat validation, and **Supabase (PostgreSQL)** authentication & storage.

---

## 🌟 Real-Time Features & Architecture

1. **Authentication & User Profiles**:
   - **Login & Register Page**: Modern interface supporting **Supabase Email/Password Auth**, user creation, and instant **Guest Mode**.
   - **Session Persistence**: User sessions and real-time profiles persist across browser reloads.
   - **Top Bar Profile Menu**: Switch accounts, view membership status, access Supabase settings, or sign out.

2. **100% Real-Time Data (Zero Static / Fake Samples)**:
   - Starts with genuine zero baseline for new accounts (`0 WPM`, `0 Tests`, `0 Streak`).
   - Every completed typing test triggers the **Anti-Cheat Validation Service**:
     - Verified submissions write directly to `test_logs`.
     - Recalculates **Best WPM**, **Average WPM**, **Tests Completed**, and **Overall Accuracy** in real time.
     - Evaluates genuine daily practice streaks in `streaks`.
     - Unlocks milestones (*First Keystrokes*, *Speed Master 75+*, *Accuracy King 98%+*, *Lightning Fast 100+*) in real time.
   - **Dynamic SVG Telemetry Charts**: WPM Performance and Accuracy trend graphs plot the user's actual chronological typing sessions.
   - **Recent Tests Table**: Displays real-time test history with instant detail inspection.

3. **Database Integration**:
   - **Supabase (PostgreSQL)**: Direct connection using `@supabase/supabase-js`.
   - **Embedded Real-Time Engine Fallback**: Allows immediate full-functionality testing even before pasting Supabase credentials.

---

## 🗄️ Supabase Setup Instructions

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** in Supabase and paste the contents of `supabase_schema.sql`, then click **Run**.
3. In Supabase, go to **Project Settings → API** and copy:
   - **Project URL**
   - **Project API keys (anon public)**
4. In TypeMaster:
   - Click the **Supabase** badge in the top navigation bar or **Settings** tab.
   - Paste your URL and Anon Key and click **Connect to Supabase**.

---

## 💻 Running Locally

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Visit `http://localhost:5173/` in your browser.
