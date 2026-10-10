# FixFlow OS — Independent Jatin Edition

A 100% self-contained, independent edition of the **FixFlow Apartment Maintenance Operating System**, featuring a rearranged **Executive Command Workspace**, **The Great Badge System**, and a signature **Electric Cyan Design Palette**.

## Key Features & Architecture

1. **100% Independent & Self-Contained**:
   - Dedicated SQLite backend (`jatin/server.py` on Port 8001).
   - Dedicated local database (`jatin/maintenance_jatin.db` & `jatin/init_db.py`).
   - Zero dependencies on parent directories or other folders.
   - Dual-Mode DB engine: Auto-connects to independent SQLite on Port 8001 (or 8000), with instantaneous client-side LocalStorage fallback.

2. **Rearranged Executive Command Layout**:
   - **Top Executive Command Bar**: Consolidated logo with glowing cyan mark (`✦ FF`), independent badge, DB engine pill, segmented view tabs, persona switcher, background design selector, DB export/reset tools, theme toggle, and primary "Report Issue" action.
   - **Horizontal KPI Ribbon**: 4 glass metric cards tracking Active Issues, Work in Motion, Verified Resolutions, and SLA Targets with 1-click queue filtering.
   - **Split-Screen Master-Detail Workspace**:
     - *Left Feed*: Fast search, filter chips, and interactive cards.
     - *Right Live Inspector & Resolution Lab*: Sticky inspection console with 4-step dispatch tracker, technician notes, 1-click status transitions, and instant note dispatcher.
   - **Audit & SLA Trail**: Transparent timestamped activity feed ensuring zero WhatsApp leak.

3. **The Great Badge System (`.grate-badge`)**:
   - Modern pill-shaped badges with frosted glass blur and glowing cyan borders.
   - Pulsing radar dots (`.grate-badge-pulse`) for urgent emergencies and active work orders.
   - Variants: `.grate-badge-cyan`, `.grate-badge-emergency`, `.grate-badge-progress`, `.grate-badge-resolved`, `.grate-badge-category`, `.grate-badge-unit`.

4. **Signature Cyan Aesthetic**:
   - Primary: `#06B6D4` (Electric Cyan), Bright: `#22D3EE`, Deep Teal: `#0E7490`.
   - Interactive canvas background with Cyan Waves, Delicate Grid, Constellation Mesh, and Minimal Aura.
   - High-contrast typography and fluid dark/light themes.

## Running the Application

### Option 1: Standalone Independent Backend (Port 8001)
From the `jatin/` directory:
```bash
python server.py
```
Open: [http://localhost:8001/](http://localhost:8001/)

### Option 2: Direct Browser Execution (Zero Server Required)
Open `jatin/index.html` directly in any web browser (`file:///.../jatin/index.html`). The application operates 100% offline with persistent LocalStorage.

### Option 3: Full Project Server (Port 8000)
From the root repository directory:
```bash
python server.py
```
Visit: [http://localhost:8000/jatin/](http://localhost:8000/jatin/)
