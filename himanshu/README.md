# 🏢 Apartment Maintenance System — Multi-Role Hub

A fully functional, role-based apartment maintenance management system designed as the solution to the **"Fixing the Fixes"** UX Case Study.

---

## 🌟 Key Features

1. **Role-Based Dashboards**:
   - 🏠 **Resident Dashboard (e.g. Aarav Mehta - Unit 402)**:
     - Log maintenance requests with category, priority, unit, and detailed notes.
     - Live 4-step visual progress tracking (`Reported` ➔ `Assigned` ➔ `Working` ➔ `Resolved`).
     - Real-time assigned staff details and repair notes.
     - 5-Star rating & feedback submission for resolved requests.
   - 🔧 **Technician Dashboard (e.g. Suresh Patil / Rajesh Kumar)**:
     - Filter work orders (`All`, `Assigned`, `In Progress`, `Completed`).
     - Quick job activation (`▶ Start Job`).
     - Maintenance log input (repair actions, diagnostic notes, replacement parts used).
     - Direct unit location and resident contact details.
   - 🏢 **Property Manager / Admin Dashboard (e.g. Priya Sharma)**:
     - Real-time KPI metrics (Total Tickets, Open/Unassigned, In Progress, Resolved, Emergency Alerts).
     - Instant technician dispatch & assignment.
     - Search by ticket number, resident name, or unit; filter by category, priority, and status.
     - Full accountability audit trail and log inspector.

2. **Dual-Mode Database**:
   - **SQLite Backend (`maintenance.db`)**: Real relational SQLite database running with Python's standard library `sqlite3` and `http.server` (zero extra dependencies!).
   - **Universal Browser Storage (Offline/Static Mode)**: Automatic fallback to client-side storage when opened without running the Python server or when hosted on static sites like GitHub Pages.
   - **1-Click Export & Reset**: Export the entire database state as JSON or reset to clean demo data at any time.

---

## 🚀 How to Run

### Option 1: Run with Python SQLite Backend (Recommended)

1. Open your terminal in this directory:
   ```bash
   cd "himanshu"
   ```
2. Initialize the SQLite database (already pre-seeded):
   ```bash
   python init_db.py
   ```
3. Start the Python server:
   ```bash
   python server.py
   ```
4. Open your browser at:
   ```
   http://localhost:8000/
   ```

### Option 2: Open Directly in Browser (No Server Needed)

Simply double-click [`index.html`](./index.html) to run in standalone browser mode with full client-side database persistence.

---

## 📁 File Structure

- `index.html` — Multi-role responsive web application.
- `style.css` — Custom theme, dark/light mode, role badges, progress steppers, and modals.
- `app.js` — Core application logic and role state management.
- `db.js` — Universal database layer (SQLite REST API + LocalStorage fallback).
- `schema.sql` — SQLite schema definitions (`users`, `tickets`, `activity_logs`).
- `init_db.py` — Database seeder with realistic test data.
- `server.py` — Python HTTP server + REST API endpoints.
