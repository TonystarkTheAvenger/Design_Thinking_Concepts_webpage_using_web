# FixFlow — Spare Front End (Jatin Edition)

This is a complete, standalone, production-ready spare front end for the **FixFlow Apartment Maintenance OS**, featuring a fully subtle aesthetic, Scheele's green color harmony, crisp white badges, and multi-role operations.

## Architecture

- `index.html`: Complete dashboard UI with Role Switcher (Resident, Staff, Manager), Request Center, Attention Queue, Audit Trail, and Modals.
- `style.css`: Clean, fully subtle stylesheet with light/dark themes, Scheele's green accents (`#5db200`), frosted glass cards, and smooth micro-animations.
- `app.js`: Dynamic frontend application with real-time filtering, work order updates, 5-star resident reviews, role-based controls, and subtle ambient canvas background.
- `db.js`: Dual-mode database layer that auto-connects to the Python SQLite backend (`http://localhost:8000/api`) or operates offline via persistent Browser LocalStorage.

## Running the Application

### Option 1: Full-Stack Python Backend (Recommended)
Run the root server from the project directory:
```bash
python server.py
```
Then visit:
- **Jatin Spare Front End**: [http://localhost:8000/jatin/](http://localhost:8000/jatin/)
- **Himanshu Main Front End**: [http://localhost:8000/himanshu/](http://localhost:8000/himanshu/)
- **UX Case Study**: [http://localhost:8000/](http://localhost:8000/)

### Option 2: Direct Browser Execution
Open `jatin/index.html` directly in any modern web browser. The application will run seamlessly using persistent LocalStorage.
