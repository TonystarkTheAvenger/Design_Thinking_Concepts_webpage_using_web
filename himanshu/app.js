/**
 * Apartment Maintenance System — Core Application Logic
 * Role-based views (Resident, Technician, Manager)
 * Backed by DB layer (SQLite or LocalStorage fallback)
 */

document.addEventListener('DOMContentLoaded', async () => {
    // --- 1. STATE MANAGEMENT --- //
    const state = {
        currentRole: 'resident', // 'resident' | 'technician' | 'manager'
        currentUser: null,
        users: [],
        tickets: [],
        stats: {},
        activeTicketDetail: null,
        techFilter: 'all',
        adminSearch: '',
        adminCategory: '',
        adminPriority: '',
        adminStatus: ''
    };

    // --- 2. THEME SETUP --- //
    const themeToggleBtn = document.getElementById('theme-toggle');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme') || (prefersDark ? 'dark' : 'light');

    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        themeToggleBtn.textContent = '☀️';
    } else {
        document.body.classList.remove('dark');
        themeToggleBtn.textContent = '🌙';
    }

    themeToggleBtn.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark');
        themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    // --- 3. TOAST NOTIFICATIONS --- //
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<span>🔔</span> <span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }

    // --- 4. DATABASE INITIALIZATION & STATUS --- //
    const dbStatusEl = document.getElementById('db-status');
    const dbStatusTextEl = document.getElementById('db-status-text');

    async function initDatabaseStatus() {
        const { mode, isApiConnected } = await DB.init();
        if (isApiConnected) {
            dbStatusEl.className = 'db-pill sqlite';
            dbStatusTextEl.textContent = 'SQLite Database (Port 8000)';
            dbStatusEl.title = 'Connected directly to Python SQLite backend (server.py)';
        } else {
            dbStatusEl.className = 'db-pill localstorage';
            dbStatusTextEl.textContent = 'Local Database (Offline Mode)';
            dbStatusEl.title = 'Running on client-side persistent storage. Start server.py for SQLite backend.';
        }
    }
    await initDatabaseStatus();

    // Load initial users
    state.users = await DB.getUsers();

    // Role profile configs
    const ROLE_PROFILES = {
        resident: state.users.find(u => u.role === 'resident') || { id: 1, name: "Aarav Mehta", unit: "Unit 402", phone: "+91 98765 43210" },
        technician: state.users.find(u => u.role === 'technician') || { id: 5, name: "Suresh Patil", specialty: "Plumbing & Sanitization", phone: "+91 98765 22222" },
        manager: state.users.find(u => u.role === 'manager') || { id: 7, name: "Priya Sharma", specialty: "Facilities Management", phone: "+91 98765 99999" }
    };
    state.currentUser = ROLE_PROFILES[state.currentRole];

    // --- 5. REFRESH DATA & VIEWS --- //
    async function loadData() {
        state.tickets = await DB.getTickets();
        state.stats = await DB.getStats();
        renderActiveProfile();
        renderCurrentView();
    }

    function renderActiveProfile() {
        const u = state.currentUser;
        const avatarEl = document.getElementById('current-user-avatar');
        const nameEl = document.getElementById('current-user-name');
        const detailsEl = document.getElementById('current-user-details');
        const newTicketBtn = document.getElementById('btn-new-ticket');

        const initials = u.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        avatarEl.textContent = initials;
        nameEl.textContent = u.name;

        if (state.currentRole === 'resident') {
            detailsEl.textContent = `Resident · ${u.unit} · ${u.phone}`;
            newTicketBtn.style.display = 'inline-flex';
        } else if (state.currentRole === 'technician') {
            detailsEl.textContent = `Technician · ${u.specialty || 'General Service'} · ${u.phone}`;
            newTicketBtn.style.display = 'none';
        } else {
            detailsEl.textContent = `Property Manager · Admin Office · ${u.phone}`;
            newTicketBtn.style.display = 'inline-flex';
        }
    }

    function renderCurrentView() {
        // Toggle view containers
        document.querySelectorAll('.role-section').forEach(sec => sec.classList.remove('active-section'));

        if (state.currentRole === 'resident') {
            document.getElementById('resident-dashboard').classList.add('active-section');
            renderResidentView();
        } else if (state.currentRole === 'technician') {
            document.getElementById('technician-dashboard').classList.add('active-section');
            renderTechnicianView();
        } else {
            document.getElementById('manager-dashboard').classList.add('active-section');
            renderManagerView();
        }
    }

    // Helper: badge markup
    function getPriorityBadge(priority) {
        const pLower = (priority || 'medium').toLowerCase();
        let label = priority;
        if (priority === 'Emergency') label = '🚨 Emergency';
        return `<span class="badge badge-${pLower}">${label}</span>`;
    }

    function getStatusBadge(status) {
        const sClean = (status || 'Open').replace('_', ' ');
        const sClass = (status || 'Open').toLowerCase();
        return `<span class="badge badge-status-${sClass}">${sClean}</span>`;
    }

    // --- 6. RENDER RESIDENT VIEW --- //
    function renderResidentView() {
        const myTickets = state.tickets.filter(t => t.created_by_user_id === state.currentUser.id || t.unit === state.currentUser.unit);
        const activeTickets = myTickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed');
        const pastTickets = myTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed');

        document.getElementById('resident-active-count').textContent = activeTickets.length;
        document.getElementById('resident-past-count').textContent = pastTickets.length;

        const activeContainer = document.getElementById('resident-active-tickets');
        if (activeTickets.length === 0) {
            activeContainer.innerHTML = `
                <div class="theme-card text-muted" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <h3>No Active Issues! 🎉</h3>
                    <p class="mt-1">All your maintenance requests have been resolved.</p>
                </div>
            `;
        } else {
            activeContainer.innerHTML = activeTickets.map(t => {
                const step = t.status === 'Open' ? 1 : t.status === 'Assigned' ? 2 : t.status === 'In_Progress' ? 3 : 4;
                return `
                    <div class="ticket-card interactive-card">
                        <div class="ticket-top">
                            <div>
                                <span class="ticket-num">${t.ticket_number}</span>
                                <h4 class="ticket-title">${t.title}</h4>
                            </div>
                            ${getPriorityBadge(t.priority)}
                        </div>

                        <div class="ticket-unit-row font-mono">
                            <span class="tag">${t.category}</span>
                            <span>${t.unit}</span>
                        </div>

                        <p class="ticket-desc">${t.description}</p>

                        <!-- Visual Progress Stepper -->
                        <div class="progress-stepper">
                            <div class="step-item ${step >= 1 ? (step === 1 ? 'active' : 'completed') : ''}">
                                <div class="step-circle">${step > 1 ? '✓' : '1'}</div>
                                <span>Reported</span>
                            </div>
                            <div class="step-item ${step >= 2 ? (step === 2 ? 'active' : 'completed') : ''}">
                                <div class="step-circle">${step > 2 ? '✓' : '2'}</div>
                                <span>Assigned</span>
                            </div>
                            <div class="step-item ${step >= 3 ? (step === 3 ? 'active' : 'completed') : ''}">
                                <div class="step-circle">${step > 3 ? '✓' : '3'}</div>
                                <span>Working</span>
                            </div>
                            <div class="step-item ${step >= 4 ? 'completed' : ''}">
                                <div class="step-circle">${step >= 4 ? '✓' : '4'}</div>
                                <span>Resolved</span>
                            </div>
                        </div>

                        <div class="ticket-footer">
                            <div class="assignee-info">
                                <strong>Staff:</strong>
                                <span>${t.assigned_to_name ? `🔧 ${t.assigned_to_name}` : '<em class="text-muted">Awaiting assignment</em>'}</span>
                            </div>
                            <button class="btn btn-sm btn-secondary" onclick="window.viewTicketDetails(${t.id})">Details</button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        const pastContainer = document.getElementById('resident-past-tickets');
        if (pastTickets.length === 0) {
            pastContainer.innerHTML = `
                <div class="theme-card text-muted" style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                    <p>No past resolved requests found.</p>
                </div>
            `;
        } else {
            pastContainer.innerHTML = pastTickets.map(t => {
                const stars = t.rating ? '★'.repeat(t.rating) + '☆'.repeat(5 - t.rating) : null;
                return `
                    <div class="ticket-card">
                        <div class="ticket-top">
                            <div>
                                <span class="ticket-num">${t.ticket_number}</span>
                                <h4 class="ticket-title">${t.title}</h4>
                            </div>
                            ${getStatusBadge(t.status)}
                        </div>

                        <div class="ticket-unit-row font-mono">
                            <span class="tag">${t.category}</span>
                            <span>Resolved on ${t.resolved_at ? t.resolved_at.split(' ')[0] : 'Completed'}</span>
                        </div>

                        <p class="ticket-desc">${t.description}</p>
                        ${t.technician_notes ? `<p class="tech-notes-card mt-1 font-mono text-muted" style="font-size:0.8rem"><strong>Fix:</strong> ${t.technician_notes}</p>` : ''}

                        <div class="ticket-footer">
                            <div>
                                ${stars ? `<span style="color:#ffb703; font-size:1.1rem">${stars}</span>` : `<button class="btn btn-sm btn-primary" onclick="window.openFeedbackModal(${t.id}, '${t.ticket_number}')">⭐ Rate Work</button>`}
                            </div>
                            <button class="btn btn-sm btn-secondary" onclick="window.viewTicketDetails(${t.id})">History</button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // --- 7. RENDER TECHNICIAN VIEW --- //
    function renderTechnicianView() {
        const myJobs = state.tickets.filter(t => {
            if (state.techFilter === 'assigned') return t.status === 'Assigned';
            if (state.techFilter === 'in_progress') return t.status === 'In_Progress';
            if (state.techFilter === 'resolved') return t.status === 'Resolved';
            return true;
        });

        const container = document.getElementById('technician-tickets');
        if (myJobs.length === 0) {
            container.innerHTML = `
                <div class="theme-card text-muted" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <h3>No work orders match this filter.</h3>
                </div>
            `;
            return;
        }

        container.innerHTML = myJobs.map(t => `
            <div class="ticket-card interactive-card">
                <div class="ticket-top">
                    <div>
                        <span class="ticket-num">${t.ticket_number}</span>
                        <h4 class="ticket-title">${t.title}</h4>
                    </div>
                    ${getPriorityBadge(t.priority)}
                </div>

                <div class="ticket-unit-row font-mono">
                    <span class="tag">${t.category}</span>
                    <strong>📍 ${t.unit}</strong>
                </div>

                <p class="ticket-desc">${t.description}</p>

                <div class="meta-box" style="padding:0.6rem; font-size:0.8rem">
                    <div><strong>Resident:</strong> ${t.created_by_name}</div>
                    <div><strong>Status:</strong> ${getStatusBadge(t.status)}</div>
                </div>

                ${t.technician_notes ? `<div class="tech-notes-card font-mono" style="font-size:0.8rem"><strong>Work Log:</strong> ${t.technician_notes}</div>` : ''}

                <div class="ticket-footer">
                    <div style="display: flex; gap: 6px;">
                        ${t.status === 'Assigned' ? `<button class="btn btn-sm btn-primary" onclick="window.quickStartJob(${t.id})">▶ Start Job</button>` : ''}
                        ${t.status === 'In_Progress' ? `<button class="btn btn-sm btn-primary" onclick="window.openTechWorkModal(${t.id})">📝 Log &amp; Finish</button>` : ''}
                        ${t.status === 'Resolved' ? `<span class="text-success font-mono" style="font-size:0.85rem">✓ Completed</span>` : ''}
                    </div>
                    <button class="btn btn-sm btn-secondary" onclick="window.viewTicketDetails(${t.id})">Log History</button>
                </div>
            </div>
        `).join('');
    }

    // --- 8. RENDER MANAGER / ADMIN VIEW --- //
    function renderManagerView() {
        // KPI Updates
        document.getElementById('kpi-total').textContent = state.stats.total || 0;
        document.getElementById('kpi-open').textContent = state.stats.open || 0;
        document.getElementById('kpi-active').textContent = state.stats.active || 0;
        document.getElementById('kpi-resolved').textContent = state.stats.resolved || 0;
        document.getElementById('kpi-emergency').textContent = state.stats.emergency || 0;

        // Filter tickets
        let filtered = state.tickets.filter(t => {
            if (state.adminCategory && t.category !== state.adminCategory) return false;
            if (state.adminPriority && t.priority !== state.adminPriority) return false;
            if (state.adminStatus && t.status !== state.adminStatus) return false;
            if (state.adminSearch) {
                const q = state.adminSearch.toLowerCase();
                const match = t.ticket_number.toLowerCase().includes(q) ||
                              t.title.toLowerCase().includes(q) ||
                              t.unit.toLowerCase().includes(q) ||
                              t.created_by_name.toLowerCase().includes(q);
                if (!match) return false;
            }
            return true;
        });

        const tbody = document.getElementById('admin-tickets-tbody');
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:2rem" class="text-muted">No tickets match criteria.</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(t => `
            <tr>
                <td class="font-mono"><strong>${t.ticket_number}</strong></td>
                <td>
                    <strong>${t.title}</strong>
                    <div class="tag mt-1" style="display:inline-block">${t.category}</div>
                </td>
                <td class="font-mono"><strong>${t.unit}</strong></td>
                <td>${getPriorityBadge(t.priority)}</td>
                <td>${getStatusBadge(t.status)}</td>
                <td>
                    ${t.assigned_to_name ? `<span>🔧 ${t.assigned_to_name}</span>` : `<button class="btn btn-sm btn-secondary" onclick="window.openAssignModal(${t.id}, '${t.ticket_number}')">+ Assign</button>`}
                </td>
                <td class="font-mono text-muted" style="font-size:0.8rem">${t.created_at.split(' ')[0]}</td>
                <td>
                    <div style="display:flex; gap:6px;">
                        <button class="btn btn-sm btn-secondary" onclick="window.viewTicketDetails(${t.id})">View</button>
                        ${!t.assigned_to_name ? `<button class="btn btn-sm btn-primary" onclick="window.openAssignModal(${t.id}, '${t.ticket_number}')">Assign</button>` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // --- 9. MODAL HANDLERS --- //
    function openModal(id) {
        document.getElementById(id).classList.add('show');
    }

    function closeModal(id) {
        document.getElementById(id).classList.remove('show');
    }

    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-close');
            closeModal(modalId);
        });
    });

    // Close on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal.id);
        });
    });

    // --- 10. ROLE SWITCHING --- //
    document.querySelectorAll('.role-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const role = tab.getAttribute('data-role');
            state.currentRole = role;
            state.currentUser = ROLE_PROFILES[role];
            renderActiveProfile();
            renderCurrentView();
            showToast(`Switched to ${tab.querySelector('strong').textContent} perspective.`);
        });
    });

    // --- 11. TECHNICIAN PILL FILTERS --- //
    document.querySelectorAll('[data-tech-filter]').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('[data-tech-filter]').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            state.techFilter = pill.getAttribute('data-tech-filter');
            renderTechnicianView();
        });
    });

    // --- 12. ADMIN SEARCH & FILTERS --- //
    document.getElementById('admin-search-input').addEventListener('input', (e) => {
        state.adminSearch = e.target.value.trim();
        renderManagerView();
    });

    document.getElementById('admin-filter-category').addEventListener('change', (e) => {
        state.adminCategory = e.target.value;
        renderManagerView();
    });

    document.getElementById('admin-filter-priority').addEventListener('change', (e) => {
        state.adminPriority = e.target.value;
        renderManagerView();
    });

    document.getElementById('admin-filter-status').addEventListener('change', (e) => {
        state.adminStatus = e.target.value;
        renderManagerView();
    });

    // --- 13. RAISE TICKET SUBMISSION --- //
    document.getElementById('btn-new-ticket').addEventListener('click', () => {
        // Preset default unit & reporter for current user
        document.getElementById('ticket-unit').value = state.currentUser.unit || 'Unit 402';
        document.getElementById('ticket-reporter').value = state.currentUser.name;
        openModal('modal-new-ticket');
    });

    document.getElementById('form-new-ticket').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('ticket-title').value.trim();
        const category = document.getElementById('ticket-category').value;
        const priority = document.getElementById('ticket-priority').value;
        const unit = document.getElementById('ticket-unit').value.trim();
        const description = document.getElementById('ticket-description').value.trim();

        const created = await DB.createTicket({
            title,
            category,
            priority,
            unit,
            description,
            created_by_user_id: state.currentUser.id,
            created_by_name: state.currentUser.name
        });

        closeModal('modal-new-ticket');
        document.getElementById('form-new-ticket').reset();
        await loadData();
        showToast(`Ticket ${created.ticket_number} created successfully!`, 'success');
    });

    // --- 14. GLOBAL WINDOW ACTIONS --- //

    // View Ticket Details & Logs
    window.viewTicketDetails = async function (id) {
        const ticket = await DB.getTicketById(id);
        if (!ticket) return;
        state.activeTicketDetail = ticket;

        document.getElementById('detail-ticket-num').textContent = ticket.ticket_number;
        document.getElementById('detail-ticket-title').textContent = ticket.title;
        document.getElementById('detail-category').textContent = ticket.category;
        document.getElementById('detail-priority').innerHTML = getPriorityBadge(ticket.priority);
        document.getElementById('detail-status').innerHTML = getStatusBadge(ticket.status);
        document.getElementById('detail-description').textContent = ticket.description;
        document.getElementById('detail-unit').textContent = ticket.unit;
        document.getElementById('detail-reporter').textContent = ticket.created_by_name;
        document.getElementById('detail-assigned').textContent = ticket.assigned_to_name ? `🔧 ${ticket.assigned_to_name}` : 'Unassigned';
        document.getElementById('detail-created').textContent = ticket.created_at;

        // Tech notes
        const techNotesBox = document.getElementById('detail-tech-notes');
        const partsUsedBox = document.getElementById('detail-parts-used');
        techNotesBox.textContent = ticket.technician_notes || 'No work notes logged yet.';
        partsUsedBox.textContent = ticket.parts_used || 'None';

        // Feedback
        const feedbackBox = document.getElementById('detail-feedback-box');
        if (ticket.rating) {
            feedbackBox.style.display = 'block';
            document.getElementById('detail-rating-display').innerHTML = '<span style="color:#ffb703; font-size:1.4rem">' + '★'.repeat(ticket.rating) + '☆'.repeat(5 - ticket.rating) + '</span>';
            document.getElementById('detail-feedback-text').textContent = ticket.feedback ? `"${ticket.feedback}"` : 'No written feedback provided.';
        } else {
            feedbackBox.style.display = 'none';
        }

        // Timeline logs
        renderActivityLogs(ticket.logs || []);
        openModal('modal-ticket-detail');
    };

    function renderActivityLogs(logs) {
        const timelineEl = document.getElementById('detail-activity-timeline');
        if (logs.length === 0) {
            timelineEl.innerHTML = `<p class="text-muted" style="font-size:0.8rem">No activity logged yet.</p>`;
            return;
        }
        timelineEl.innerHTML = logs.map(l => `
            <div class="activity-item">
                <span class="activity-action">${l.action}</span>
                <span class="activity-time">${l.created_at.split(' ')[1] || l.created_at}</span>
                <div class="activity-note"><strong>${l.user_name}:</strong> ${l.note || ''}</div>
            </div>
        `).join('');
    }

    // Add note to active ticket detail
    document.getElementById('btn-add-log').addEventListener('click', async () => {
        const input = document.getElementById('new-log-input');
        const note = input.value.trim();
        if (!note || !state.activeTicketDetail) return;

        await DB.addLog(state.activeTicketDetail.id, {
            user_name: state.currentUser.name,
            action: `${state.currentUser.role.toUpperCase()} Update`,
            note
        });

        input.value = '';
        const refreshed = await DB.getTicketById(state.activeTicketDetail.id);
        state.activeTicketDetail = refreshed;
        renderActivityLogs(refreshed.logs || []);
        showToast('Update note added to ticket log.');
    });

    // Assign Technician (Manager)
    window.openAssignModal = function (ticketId, ticketNum) {
        document.getElementById('assign-ticket-id').value = ticketId;
        document.getElementById('assign-ticket-label').textContent = ticketNum;
        openModal('modal-assign');
    };

    document.getElementById('form-assign').addEventListener('submit', async (e) => {
        e.preventDefault();
        const ticketId = document.getElementById('assign-ticket-id').value;
        const techId = parseInt(document.getElementById('assign-tech-select').value);
        const assignNote = document.getElementById('assign-note').value.trim();

        const techUser = state.users.find(u => u.id === techId);
        const techName = techUser ? techUser.name : 'Staff Technician';

        await DB.updateTicket(ticketId, {
            status: 'Assigned',
            assigned_to_user_id: techId,
            assigned_to_name: techName,
            log_action: 'Staff Assigned',
            log_user: state.currentUser.name,
            log_note: `Dispatched ${techName}. ${assignNote ? `Note: ${assignNote}` : ''}`
        });

        closeModal('modal-assign');
        await loadData();
        showToast(`Assigned to ${techName}.`, 'success');
    });

    // Quick Start Job (Technician)
    window.quickStartJob = async function (ticketId) {
        await DB.updateTicket(ticketId, {
            status: 'In_Progress',
            log_action: 'Job In Progress',
            log_user: state.currentUser.name,
            log_note: `${state.currentUser.name} arrived at unit and started work.`
        });
        await loadData();
        showToast('Work order marked as In Progress.', 'info');
    };

    // Log Work & Complete (Technician)
    window.openTechWorkModal = function (ticketId) {
        document.getElementById('tech-work-ticket-id').value = ticketId;
        openModal('modal-tech-work');
    };

    document.getElementById('form-tech-work').addEventListener('submit', async (e) => {
        e.preventDefault();
        const ticketId = document.getElementById('tech-work-ticket-id').value;
        const status = document.getElementById('tech-work-status').value;
        const techNotes = document.getElementById('tech-work-notes').value.trim();
        const partsUsed = document.getElementById('tech-work-parts').value.trim();

        await DB.updateTicket(ticketId, {
            status,
            technician_notes: techNotes,
            parts_used: partsUsed,
            log_action: status === 'Resolved' ? 'Work Completed' : 'Work Log Updated',
            log_user: state.currentUser.name,
            log_note: `${techNotes} ${partsUsed ? `(Parts: ${partsUsed})` : ''}`
        });

        closeModal('modal-tech-work');
        document.getElementById('form-tech-work').reset();
        await loadData();
        showToast(`Job record saved (${status}).`, 'success');
    });

    // Resident Feedback & Star Rating
    window.openFeedbackModal = function (ticketId, ticketNum) {
        document.getElementById('feedback-ticket-id').value = ticketId;
        document.getElementById('feedback-ticket-label').textContent = ticketNum;
        openModal('modal-feedback');
    };

    const starSpans = document.querySelectorAll('#star-rating-picker span');
    starSpans.forEach(star => {
        star.addEventListener('click', () => {
            const val = parseInt(star.getAttribute('data-star'));
            document.getElementById('feedback-rating-val').value = val;
            starSpans.forEach(s => {
                const sVal = parseInt(s.getAttribute('data-star'));
                if (sVal <= val) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
    });

    document.getElementById('form-feedback').addEventListener('submit', async (e) => {
        e.preventDefault();
        const ticketId = document.getElementById('feedback-ticket-id').value;
        const rating = parseInt(document.getElementById('feedback-rating-val').value);
        const feedback = document.getElementById('feedback-comments').value.trim();

        await DB.updateTicket(ticketId, {
            rating,
            feedback,
            log_action: 'Resident Rated Work',
            log_user: state.currentUser.name,
            log_note: `Rated ${rating} stars: "${feedback || 'No comments'}"`
        });

        closeModal('modal-feedback');
        document.getElementById('form-feedback').reset();
        await loadData();
        showToast('Thank you! Your feedback has been recorded.', 'success');
    });

    // --- 15. EXPORT & RESET DB --- //
    document.getElementById('btn-export-db').addEventListener('click', async () => {
        const data = await DB.exportJSON();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `maintenance_db_export_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Database exported as JSON.', 'info');
    });

    document.getElementById('btn-reset-db').addEventListener('click', async () => {
        if (confirm("Reset database to initial sample data?")) {
            await DB.resetData();
            await loadData();
            showToast('Database reset to initial sample state.', 'info');
        }
    });

    // Initial load
    await loadData();
});
