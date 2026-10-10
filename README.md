# 🛠️ Fixing the Fixes
*A UX case study on apartment maintenance—fully reimagined and interactive.*

We took a fragmented, frustrating process and applied core **Design Thinking** principles (Empathize & Define) to figure out *why* things break down between a leaky pipe and a fixed one.

This page isn't just a static report—it's built as a dynamic, interactive storytelling experience.

### ✨ The Vibe & Features
- **Storytelling Layout**: A restructured flow that takes you from the core Design Thinking approach, through the user journey, and directly into the climax of the problem statement.
- **Interactive 3D Cards**: Move your mouse over any card (or the ASCII art) to feel the 3D tilt physics in real-time.
- **Living Background**: Ambient, floating gradient blobs provide a dynamic pulse to the page.
- **Typewriter Intro & ASCII Art**: A custom JS-generated ASCII wave animation running alongside a dynamic typewriter title sequence.
- **Light & Dark Mode**: A custom, premium color palette with a seamless toggle.
- **Smooth Scrolling**: Vanilla JS intersection observers making everything stagger and glide into place.

Built purely with **HTML, CSS, & Vanilla JS** (no external libraries).

---

### 🚀 Full-Stack System & Front Ends
Taking the case study from concept to working software:
- **🏠 Resident Dashboard (`Aarav Mehta`)**: Report issues, live 4-step progress stepper, real-time assigned technician info, 5-star rating & review.
- **🔧 Technician Dashboard (`Suresh Patil / Rajesh Kumar`)**: Priority queue, quick job start, diagnostic logging, replacement parts tracking.
- **🏢 Property Manager Dashboard (`Priya Sharma`)**: Live KPI metrics, technician dispatch & assignment, multi-filter search, system audit trail.
- **🗄️ Relational SQLite Database**: Pre-seeded `maintenance.db` backed by Python standard library REST API (`server.py`), with auto fallback to browser LocalStorage for static deployment!
- **✨ Spare Front End (`jatin/`)**: A dedicated alternate frontend in `jatin/` connected to the same shared database backend with a fully subtle aesthetic!

### 💻 Running the Full-Stack Application

```bash
# Start full-stack server from root (serves Case Study, Himanshu, and Jatin frontends)
python server.py

# Visit in browser:
# -> UX Case Study: http://localhost:8000/
# -> Himanshu FixFlow: http://localhost:8000/himanshu/
# -> Jatin Spare Front End: http://localhost:8000/jatin/
# -> API Health: http://localhost:8000/api/health
```

Or open any `index.html` file directly in your browser—all editions run standalone with built-in client-side database persistence!

Drop in, open `index.html`, hover your mouse around, and enjoy the story. ✌️

