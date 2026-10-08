# TypeMaster - Pro Typing Speed Test & Analytics 🚀

A modern full-stack typing speed test application built to match the reference UI and complete backend architecture diagram with **Supabase (PostgreSQL)** integration.

---

## 🌟 Key Features

1. **Dashboard (Image 1 recreation)**:
   - Live telemetry cards: Best WPM (78 ↑ 12%), Average WPM (64 ↑ 8%), Accuracy (96.4% ↑ 2%), Tests Completed (128 ↑ 15%), Current Streak (12 days).
   - Hero banner with 3D illustration, quick duration toggles (1m, 3m, 5m, Custom), difficulty toggles (Easy, Medium, Hard), and one-click test launcher.
   - Interactive SVG charts: WPM Performance trend and Accuracy curve with 7-day data.
   - Achievements card with real-time status (Speed Master, Accuracy King, 10-Day Streak, 100 Tests Completed).
   - Recent tests log with result badges (Excellent, Great, Good) and modal detail viewer.

2. **Typing Test Engine (Image 2 recreation)**:
   - High-precision character-by-character validation and active word highlighter.
   - Circular countdown timer with animated SVG ring progress.
   - Speedometer WPM counter, accuracy percentage, character tally, and error tracker.
   - **Interactive Virtual Keyboard** highlighting target and error keys in real time.
   - **Web Audio API Mechanical Switch Synthesizer**: Realistic Cherry MX Blue, Brown, Red, and Typewriter acoustics.
   - Right-hand live stats sparklines, typing tips, and shortcut guides.

3. **Backend Workflow & Supabase Architecture (Image 3 implementation)**:
   - **Step 1 & 2 (Prompt Retrieval)**: Fetches prompts by category and difficulty from the `prompts` table in Supabase.
   - **Step 3 (Active Test)**: Fully client-side zero-latency calculation loop.
   - **Step 4 (Validation & Anti-Cheat Service)**: Checks for botting (>250 WPM), cadence irregularities, and duration anomalies.
   - **Step 5 (Transactions & Writes)**:
     - `test_logs` table insert.
     - `users` table stats recalculation (Best WPM, Average WPM, Tests Completed).
     - `streaks` table processing (daily check, increment/reset).
     - `achievements` table milestone evaluation (Speed Master, Accuracy King, etc.).
   - **Step 6 (Dashboard Aggregation)**: Bundles stats, history, trends, and profile data into one unified response.
   - **Step 7 (Premium Gatekeeper)**: User tier checks for advanced analytics and official printable certificates.

---

## 🗄️ Supabase Setup Instructions

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
2. Go to **SQL Editor** in Supabase and paste the contents of `supabase_schema.sql` (located in the root folder of this project), then click **Run**.
3. In Supabase, go to **Project Settings → API** and copy:
   - **Project URL**
   - **Project API keys (anon public)**
4. In this app, either:
   - Paste them into `.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, **OR**
   - Click the **Supabase** badge in the top navigation bar or **Settings** tab and paste them directly into the modal!

> **Note:** Even without Supabase credentials configured yet, the app features an embedded local storage database engine with identical schemas and seeded data so it runs with 0 glitches immediately out of the box!

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Vanilla CSS Design System with customized design tokens
- **Audio Engine**: Web Audio API Oscillator & Biquad Filter Synthesizer
- **Database**: Supabase (PostgreSQL) + Local Engine Fallback
- **Icons**: Lucide React
- **Confetti**: Canvas Confetti

---

## 💻 Running Locally

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Visit `http://localhost:5173/` in your browser.
