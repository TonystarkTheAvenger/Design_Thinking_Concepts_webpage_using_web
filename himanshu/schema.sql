-- SQLite Database Schema for Apartment Maintenance System
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('resident', 'technician', 'manager')),
    unit TEXT,
    phone TEXT,
    specialty TEXT
);

CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('Plumbing', 'Electrical', 'HVAC', 'Carpentry', 'Appliance', 'General')),
    priority TEXT NOT NULL CHECK(priority IN ('Low', 'Medium', 'High', 'Emergency')),
    status TEXT NOT NULL CHECK(status IN ('Open', 'Assigned', 'In_Progress', 'Resolved', 'Closed')),
    unit TEXT NOT NULL,
    created_by_user_id INTEGER,
    created_by_name TEXT NOT NULL,
    assigned_to_user_id INTEGER,
    assigned_to_name TEXT,
    technician_notes TEXT DEFAULT '',
    parts_used TEXT DEFAULT '',
    rating INTEGER CHECK(rating BETWEEN 1 AND 5),
    feedback TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    FOREIGN KEY(created_by_user_id) REFERENCES users(id),
    FOREIGN KEY(assigned_to_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);
