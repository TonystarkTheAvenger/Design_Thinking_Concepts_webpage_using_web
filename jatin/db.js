/**
 * FixFlow DB Layer — Jatin Spare Edition
 * Dual-Mode Database Support:
 * Seamlessly connects to Python SQLite Backend (server.py) on Port 8000
 * with automatic fallback to persistent Browser LocalStorage.
 */

const DB = (function () {
    const STORAGE_KEY_TICKETS = 'maint_db_jatin_tickets_v1';
    const STORAGE_KEY_USERS = 'maint_db_jatin_users_v1';
    const STORAGE_KEY_LOGS = 'maint_db_jatin_logs_v1';

    let isApiConnected = false;
    let apiBaseUrl = '';

    const DEFAULT_USERS = [
        { id: 1, name: "Aarav Mehta", email: "aarav.mehta@example.com", role: "resident", unit: "Unit 402", phone: "+91 98765 43210", specialty: null },
        { id: 2, name: "Neha Gupta", email: "neha.gupta@example.com", role: "resident", unit: "Unit 205", phone: "+91 98765 43211", specialty: null },
        { id: 3, name: "Rohit Verma", email: "rohit.verma@example.com", role: "resident", unit: "Unit 108", phone: "+91 98765 43212", specialty: null },
        { id: 4, name: "Rajesh Kumar", email: "rajesh.tech@example.com", role: "technician", unit: null, phone: "+91 98765 11111", specialty: "Electrical & HVAC" },
        { id: 5, name: "Suresh Patil", email: "suresh.tech@example.com", role: "technician", unit: null, phone: "+91 98765 22222", specialty: "Plumbing & Sanitization" },
        { id: 6, name: "Vikram Singh", email: "vikram.tech@example.com", role: "technician", unit: null, phone: "+91 98765 33333", specialty: "Carpentry & General" },
        { id: 7, name: "Priya Sharma", email: "priya.manager@example.com", role: "manager", unit: "Admin Office", phone: "+91 98765 99999", specialty: "Facilities Management" }
    ];

    const DEFAULT_TICKETS = [
        {
            id: 1,
            ticket_number: "TKT-1001",
            title: "Severe Bathroom Pipe Leakage",
            description: "Persistent water dripping from joint below sink pipe, pooling on floor.",
            category: "Plumbing",
            priority: "High",
            status: "In_Progress",
            unit: "Unit 402",
            created_by_user_id: 1,
            created_by_name: "Aarav Mehta",
            assigned_to_user_id: 5,
            assigned_to_name: "Suresh Patil",
            technician_notes: "Replaced worn Teflon seal and tightened primary elbow joint.",
            parts_used: "1x Teflon tape, 1x rubber O-ring",
            rating: null,
            feedback: "",
            created_at: "2026-10-03 09:30:00",
            updated_at: "2026-10-04 11:00:00",
            resolved_at: null
        },
        {
            id: 2,
            ticket_number: "TKT-1002",
            title: "Main Circuit Breaker Tripping Constantly",
            description: "Kitchen appliances tripping master MCB repeatedly whenever microwave turns on.",
            category: "Electrical",
            priority: "Emergency",
            status: "Assigned",
            unit: "Unit 205",
            created_by_user_id: 2,
            created_by_name: "Neha Gupta",
            assigned_to_user_id: 4,
            assigned_to_name: "Rajesh Kumar",
            technician_notes: "Initial inspection scheduled. Suspected overload or faulty 16A breaker.",
            parts_used: "",
            rating: null,
            feedback: "",
            created_at: "2026-10-04 08:15:00",
            updated_at: "2026-10-04 09:45:00",
            resolved_at: null
        },
        {
            id: 3,
            ticket_number: "TKT-1003",
            title: "Balcony Sliding Door Jammed",
            description: "Sliding glass door roller slipped out of lower channel; hard to close completely.",
            category: "Carpentry",
            priority: "Low",
            status: "Resolved",
            unit: "Unit 108",
            created_by_user_id: 3,
            created_by_name: "Rohit Verma",
            assigned_to_user_id: 6,
            assigned_to_name: "Vikram Singh",
            technician_notes: "Re-aligned bottom nylon rollers and lubricated track with silicone spray.",
            parts_used: "2x stainless screws, silicone lube",
            rating: 5,
            feedback: "Super quick fix, sliding very smoothly now. Thank you!",
            created_at: "2026-10-01 14:00:00",
            updated_at: "2026-10-02 16:30:00",
            resolved_at: "2026-10-02 16:30:00"
        },
        {
            id: 4,
            ticket_number: "TKT-1004",
            title: "AC Drain Line Clogged & Dripping Water",
            description: "Master bedroom AC leaking water down interior wall inside the bedroom.",
            category: "HVAC",
            priority: "High",
            status: "Open",
            unit: "Unit 402",
            created_by_user_id: 1,
            created_by_name: "Aarav Mehta",
            assigned_to_user_id: null,
            assigned_to_name: null,
            technician_notes: "",
            parts_used: "",
            rating: null,
            feedback: "",
            created_at: "2026-10-04 13:20:00",
            updated_at: "2026-10-04 13:20:00",
            resolved_at: null
        },
        {
            id: 5,
            ticket_number: "TKT-1005",
            title: "Intercom Handset Not Ringing",
            description: "Security gate calls not connecting to the indoor buzzer speaker.",
            category: "General",
            priority: "Medium",
            status: "Open",
            unit: "Unit 205",
            created_by_user_id: 2,
            created_by_name: "Neha Gupta",
            assigned_to_user_id: null,
            assigned_to_name: null,
            technician_notes: "",
            parts_used: "",
            rating: null,
            feedback: "",
            created_at: "2026-10-04 14:45:00",
            updated_at: "2026-10-04 14:45:00",
            resolved_at: null
        }
    ];

    const DEFAULT_LOGS = [
        { id: 1, ticket_id: 1, user_name: "Aarav Mehta", action: "Ticket Created", note: "Reported severe bathroom pipe leakage.", created_at: "2026-10-03 09:30:00" },
        { id: 2, ticket_id: 1, user_name: "Priya Sharma", action: "Assigned", note: "Assigned Suresh Patil (Plumbing Specialist).", created_at: "2026-10-03 10:15:00" },
        { id: 3, ticket_id: 1, user_name: "Suresh Patil", action: "Status Changed", note: "Started diagnosis in Unit 402.", created_at: "2026-10-04 10:45:00" },
        { id: 4, ticket_id: 2, user_name: "Neha Gupta", action: "Ticket Created", note: "Reported emergency circuit breaker trip.", created_at: "2026-10-04 08:15:00" },
        { id: 5, ticket_id: 2, user_name: "Priya Sharma", action: "Priority Flagged", note: "Marked as Emergency. Dispatched Rajesh Kumar.", created_at: "2026-10-04 09:45:00" },
        { id: 6, ticket_id: 3, user_name: "Rohit Verma", action: "Ticket Created", note: "Reported jammed balcony door.", created_at: "2026-10-01 14:00:00" },
        { id: 7, ticket_id: 3, user_name: "Vikram Singh", action: "Resolved", note: "Re-aligned rollers and greased track.", created_at: "2026-10-02 16:30:00" },
        { id: 8, ticket_id: 3, user_name: "Rohit Verma", action: "Feedback Added", note: "Gave 5-star rating: Super quick fix!", created_at: "2026-10-02 17:00:00" },
        { id: 9, ticket_id: 4, user_name: "Aarav Mehta", action: "Ticket Created", note: "Reported bedroom AC condensation drip.", created_at: "2026-10-04 13:20:00" },
        { id: 10, ticket_id: 5, user_name: "Neha Gupta", action: "Ticket Created", note: "Reported intercom buzzing malfunction.", created_at: "2026-10-04 14:45:00" }
    ];

    function initLocalStorage() {
        if (!localStorage.getItem(STORAGE_KEY_USERS)) {
            localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(DEFAULT_USERS));
        }
        if (!localStorage.getItem(STORAGE_KEY_TICKETS)) {
            localStorage.setItem(STORAGE_KEY_TICKETS, JSON.stringify(DEFAULT_TICKETS));
        }
        if (!localStorage.getItem(STORAGE_KEY_LOGS)) {
            localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(DEFAULT_LOGS));
        }
    }

    let activePort = null;

    async function checkApiConnection() {
        const candidates = [];
        if (window.location.protocol !== 'file:' && window.location.origin) {
            candidates.push(window.location.origin);
        }
        candidates.push('http://127.0.0.1:8001', 'http://localhost:8001', 'http://127.0.0.1:8000', 'http://localhost:8000');

        for (const base of candidates) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 900);
                const res = await fetch(`${base}/api/health`, { signal: controller.signal });
                clearTimeout(timeoutId);
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'ok') {
                        isApiConnected = true;
                        apiBaseUrl = base;
                        activePort = data.port || (base.includes(':8001') ? 8001 : 8000);
                        return true;
                    }
                }
            } catch (e) {
                // Try next candidate
            }
        }
        isApiConnected = false;
        apiBaseUrl = '';
        activePort = null;
        return false;
    }

    return {
        async init() {
            initLocalStorage();
            await checkApiConnection();
            return {
                mode: isApiConnected ? 'sqlite' : 'localstorage',
                isApiConnected,
                apiBaseUrl,
                activePort
            };
        },

        getActivePort() {
            return activePort;
        },

        getMode() {
            return isApiConnected ? 'sqlite' : 'localstorage';
        },

        async getUsers() {
            if (isApiConnected) {
                try {
                    const res = await fetch(`${apiBaseUrl}/api/users`);
                    if (res.ok) {
                        const data = await res.json();
                        return data.users;
                    }
                } catch (e) {
                    console.warn("API error, falling back to localStorage", e);
                }
            }
            return JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
        },

        async getTickets() {
            if (isApiConnected) {
                try {
                    const res = await fetch(`${apiBaseUrl}/api/tickets`);
                    if (res.ok) {
                        const data = await res.json();
                        return data.tickets;
                    }
                } catch (e) {
                    console.warn("API error, falling back to localStorage", e);
                }
            }
            return JSON.parse(localStorage.getItem(STORAGE_KEY_TICKETS) || '[]');
        },

        async getTicketById(id) {
            if (isApiConnected) {
                try {
                    const res = await fetch(`${apiBaseUrl}/api/tickets/${id}`);
                    if (res.ok) {
                        const data = await res.json();
                        return data.ticket;
                    }
                } catch (e) {
                    console.warn("API error, falling back to localStorage", e);
                }
            }
            const tickets = JSON.parse(localStorage.getItem(STORAGE_KEY_TICKETS) || '[]');
            const ticket = tickets.find(t => t.id === Number(id));
            if (!ticket) return null;
            const logs = JSON.parse(localStorage.getItem(STORAGE_KEY_LOGS) || '[]');
            const ticketLogs = logs.filter(l => l.ticket_id === Number(id)).sort((a,b) => b.id - a.id);
            return { ...ticket, logs: ticketLogs };
        },

        async createTicket(ticketData) {
            if (isApiConnected) {
                try {
                    const res = await fetch(`${apiBaseUrl}/api/tickets`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(ticketData)
                    });
                    if (res.ok) {
                        const data = await res.json();
                        return data.ticket;
                    }
                } catch (e) {
                    console.warn("API error, falling back to localStorage", e);
                }
            }

            const tickets = JSON.parse(localStorage.getItem(STORAGE_KEY_TICKETS) || '[]');
            const maxId = tickets.reduce((max, t) => Math.max(max, t.id), 1000);
            const newId = maxId + 1;
            const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

            const newTicket = {
                id: newId,
                ticket_number: `TKT-${newId}`,
                title: ticketData.title,
                description: ticketData.description,
                category: ticketData.category || "General",
                priority: ticketData.priority || "Medium",
                status: "Open",
                unit: ticketData.unit || "Unit 402",
                created_by_user_id: ticketData.created_by_user_id || 1,
                created_by_name: ticketData.created_by_name || "Aarav Mehta",
                assigned_to_user_id: null,
                assigned_to_name: null,
                technician_notes: "",
                parts_used: "",
                rating: null,
                feedback: "",
                created_at: now,
                updated_at: now,
                resolved_at: null
            };

            tickets.unshift(newTicket);
            localStorage.setItem(STORAGE_KEY_TICKETS, JSON.stringify(tickets));

            const logs = JSON.parse(localStorage.getItem(STORAGE_KEY_LOGS) || '[]');
            logs.unshift({
                id: Date.now(),
                ticket_id: newId,
                user_name: newTicket.created_by_name,
                action: "Ticket Created",
                note: `Submitted: ${newTicket.title}`,
                created_at: now
            });
            localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));

            return newTicket;
        },

        async updateTicket(id, updateData) {
            if (isApiConnected) {
                try {
                    const res = await fetch(`${apiBaseUrl}/api/tickets/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updateData)
                    });
                    if (res.ok) {
                        const data = await res.json();
                        return data.ticket;
                    }
                } catch (e) {
                    console.warn("API error, falling back to localStorage", e);
                }
            }

            const tickets = JSON.parse(localStorage.getItem(STORAGE_KEY_TICKETS) || '[]');
            const index = tickets.findIndex(t => t.id === Number(id));
            if (index === -1) return null;

            const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
            const existing = tickets[index];

            if (updateData.status === "Resolved" && !existing.resolved_at) {
                existing.resolved_at = now;
            }

            Object.assign(existing, updateData, { updated_at: now });
            tickets[index] = existing;
            localStorage.setItem(STORAGE_KEY_TICKETS, JSON.stringify(tickets));

            if (updateData.log_action) {
                const logs = JSON.parse(localStorage.getItem(STORAGE_KEY_LOGS) || '[]');
                logs.unshift({
                    id: Date.now(),
                    ticket_id: Number(id),
                    user_name: updateData.log_user || "System",
                    action: updateData.log_action,
                    note: updateData.log_note || `Updated status to ${existing.status}`,
                    created_at: now
                });
                localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
            }

            return existing;
        },

        async addLog(ticketId, logData) {
            if (isApiConnected) {
                try {
                    const res = await fetch(`${apiBaseUrl}/api/tickets/${ticketId}/log`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(logData)
                    });
                    if (res.ok) return true;
                } catch (e) {
                    console.warn("API addLog error, fallback to localStorage", e);
                }
            }
            const logs = JSON.parse(localStorage.getItem(STORAGE_KEY_LOGS) || '[]');
            const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
            logs.unshift({
                id: Date.now(),
                ticket_id: Number(ticketId),
                user_name: logData.user_name || "User",
                action: logData.action || "Note Added",
                note: logData.note || "",
                created_at: now
            });
            localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
            return true;
        },

        async deleteTicket(id) {
            if (isApiConnected) {
                try {
                    const res = await fetch(`${apiBaseUrl}/api/tickets/${id}`, { method: 'DELETE' });
                    if (res.ok) return true;
                } catch (e) {
                    console.warn("API deleteTicket error, fallback to localStorage", e);
                }
            }
            let tickets = JSON.parse(localStorage.getItem(STORAGE_KEY_TICKETS) || '[]');
            tickets = tickets.filter(t => t.id !== Number(id));
            localStorage.setItem(STORAGE_KEY_TICKETS, JSON.stringify(tickets));
            return true;
        },

        async getStats() {
            const tickets = await this.getTickets();
            const total = tickets.length;
            const open = tickets.filter(t => t.status === 'Open').length;
            const active = tickets.filter(t => t.status === 'Assigned' || t.status === 'In_Progress').length;
            const resolved = tickets.filter(t => t.status === 'Resolved').length;
            const emergency = tickets.filter(t => t.priority === 'Emergency').length;

            return { total, open, active, resolved, emergency };
        },

        async resetData() {
            if (isApiConnected) {
                try {
                    const res = await fetch(`${apiBaseUrl}/api/reset`, { method: 'POST' });
                    if (res.ok) return true;
                } catch (e) {}
            }
            localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(DEFAULT_USERS));
            localStorage.setItem(STORAGE_KEY_TICKETS, JSON.stringify(DEFAULT_TICKETS));
            localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(DEFAULT_LOGS));
            return true;
        },

        async exportJSON() {
            if (isApiConnected) {
                try {
                    const res = await fetch(`${apiBaseUrl}/api/export`);
                    if (res.ok) {
                        return await res.json();
                    }
                } catch (e) {}
            }
            const users = await this.getUsers();
            const tickets = await this.getTickets();
            const logs = JSON.parse(localStorage.getItem(STORAGE_KEY_LOGS) || '[]');
            return {
                exported_at: new Date().toISOString(),
                users,
                tickets,
                logs
            };
        }
    };
})();

window.DB = DB;
