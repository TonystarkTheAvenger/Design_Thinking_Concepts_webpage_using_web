/**
 * FixFlow OS — Independent Jatin Edition
 * Executive Command Workspace, Master-Detail Inspector, Great Badges & Pink Canvas
 */

document.addEventListener('DOMContentLoaded', async () => {
  // --- 1. APPLICATION STATE --- //
  const state = {
    currentRole: 'resident', // 'resident' | 'staff' | 'manager'
    currentView: 'dashboard', // 'dashboard' | 'tickets' | 'activity'
    currentUser: null,
    users: [],
    tickets: [],
    stats: {},
    activeTicketId: 1, // Currently selected ticket in live inspector
    listFilter: 'all',
    searchQuery: ''
  };

  // --- 2. THEME CONFIGURATION --- //
  const themeToggleBtn = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('theme_jatin') || 'light';

  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    if (themeToggleBtn) themeToggleBtn.textContent = '☀️';
  } else {
    document.body.classList.remove('dark');
    if (themeToggleBtn) themeToggleBtn.textContent = '🌙';
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark');
      themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
      localStorage.setItem('theme_jatin', isDark ? 'dark' : 'light');
    });
  }

  // --- 3. TOAST NOTIFICATION SYSTEM --- //
  function showToast(title, message = '') {
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toastTitle');
    const toastText = document.getElementById('toastText');
    if (!toast) return;

    toastTitle.textContent = title;
    toastText.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // --- 4. DATABASE INITIALIZATION --- //
  const dbStatusEl = document.getElementById('db-status');
  const dbStatusTextEl = document.getElementById('db-status-text');

  async function initDatabase() {
    const { mode, isApiConnected, activePort } = await DB.init();
    if (dbStatusEl && dbStatusTextEl) {
      if (isApiConnected) {
        dbStatusEl.className = 'grate-badge grate-badge-db sqlite';
        const portStr = activePort ? `Port ${activePort}` : 'Connected';
        dbStatusTextEl.textContent = `SQLite (${portStr})`;
        dbStatusEl.title = `Connected directly to Independent SQLite backend (${portStr})`;
      } else {
        dbStatusEl.className = 'grate-badge grate-badge-db';
        dbStatusTextEl.textContent = 'Local Database';
        dbStatusEl.title = 'Running on client-side persistent storage. Start server.py for SQLite backend.';
      }
    }
  }
  await initDatabase();

  // Load users
  state.users = await DB.getUsers();

  const ROLE_MAP = {
    resident: state.users.find(u => u.role === 'resident') || { id: 1, name: "Aarav Mehta", unit: "Unit 402", phone: "+91 98765 43210" },
    staff: state.users.find(u => u.role === 'technician') || { id: 5, name: "Suresh Patil", specialty: "Plumbing Specialist", phone: "+91 98765 22222" },
    manager: state.users.find(u => u.role === 'manager') || { id: 7, name: "Priya Sharma", specialty: "Facilities Director", phone: "+91 98765 99999" }
  };
  state.currentUser = ROLE_MAP[state.currentRole];

  // Helper for Great Badges
  function getPriorityBadge(priority) {
    if (priority === 'Emergency') {
      return `<span class="grate-badge grate-badge-emergency"><span class="grate-badge-dot"></span>⚡ Emergency</span>`;
    }
    if (priority === 'High') {
      return `<span class="grate-badge grate-badge-high"><span class="grate-badge-dot"></span>▲ High</span>`;
    }
    if (priority === 'Low') {
      return `<span class="grate-badge grate-badge-low"><span class="grate-badge-dot"></span>▼ Low</span>`;
    }
    return `<span class="grate-badge grate-badge-medium"><span class="grate-badge-dot"></span>◼ Medium</span>`;
  }

  function getStatusBadge(status) {
    if (status === 'In_Progress') {
      return `<span class="grate-badge grate-badge-progress"><span class="grate-badge-dot"></span>● In Progress</span>`;
    }
    if (status === 'Resolved') {
      return `<span class="grate-badge grate-badge-resolved"><span class="grate-badge-dot"></span>✓ Resolved</span>`;
    }
    if (status === 'Assigned') {
      return `<span class="grate-badge grate-badge-assigned"><span class="grate-badge-dot"></span>◐ Assigned</span>`;
    }
    return `<span class="grate-badge grate-badge-open"><span class="grate-badge-dot"></span>○ Open</span>`;
  }

  function getCategoryBadge(category) {
    const icons = {
      Plumbing: '🚰',
      Electrical: '⚡',
      HVAC: '❄',
      Carpentry: '🔨',
      General: '🛠'
    };
    return `<span class="grate-badge grate-badge-category">${icons[category] || '🔧'} ${category}</span>`;
  }

  // --- 5. DATA SYNC & RENDERING --- //
  async function reloadData() {
    state.tickets = await DB.getTickets();
    state.stats = await DB.getStats();

    // Ensure active ticket is valid
    if (!state.tickets.find(t => t.id === state.activeTicketId) && state.tickets.length > 0) {
      state.activeTicketId = state.tickets[0].id;
    }

    renderKPIStats();
    renderTicketFeed();
    renderLiveInspector();
    renderFullTicketsView();
    renderActivityView();
  }

  function renderKPIStats() {
    const activeEl = document.getElementById('statActive');
    const progressEl = document.getElementById('statProgress');
    const resolvedEl = document.getElementById('statResolved');
    const nextActionEl = document.getElementById('statNextAction');
    const nextActionSubEl = document.getElementById('statNextActionSub');

    if (activeEl) activeEl.textContent = state.stats.active || 0;
    if (progressEl) progressEl.textContent = state.stats.in_progress || 0;
    if (resolvedEl) resolvedEl.textContent = state.stats.resolved || 0;

    const inProgTicket = state.tickets.find(t => t.status === 'In_Progress') || state.tickets[0];
    if (inProgTicket) {
      if (nextActionEl) nextActionEl.textContent = `Today · ${inProgTicket.category}`;
      if (nextActionSubEl) nextActionSubEl.textContent = `${inProgTicket.ticket_number} · ${inProgTicket.unit}`;
    }

    const navCount = document.getElementById('navCount');
    if (navCount) navCount.textContent = state.tickets.length;
  }

  function getRoleScopedTickets() {
    if (state.currentRole === 'resident') {
      return state.tickets.filter(t => t.unit === state.currentUser.unit || t.created_by_user_id === state.currentUser.id);
    }
    if (state.currentRole === 'staff') {
      return state.tickets.filter(t => t.assigned_to_user_id === state.currentUser.id || t.status === 'Open');
    }
    return state.tickets;
  }

  function renderTicketFeed() {
    const container = document.getElementById('attentionList');
    if (!container) return;

    let list = getRoleScopedTickets();

    if (state.listFilter === 'open') {
      list = list.filter(t => t.status === 'Open' || t.status === 'Assigned');
    } else if (state.listFilter === 'progress') {
      list = list.filter(t => t.status === 'In_Progress');
    } else if (state.listFilter === 'resolved') {
      list = list.filter(t => t.status === 'Resolved' || t.status === 'Closed');
    }

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.ticket_number.toLowerCase().includes(q) ||
        t.unit.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:48px 16px; color:var(--muted); background:var(--card); border:1px dashed var(--border); border-radius:var(--radius);">
          <span style="font-size:24px; display:block; margin-bottom:8px;">✦</span>
          <strong style="color:var(--foreground);">No requests in this queue</strong>
          <p style="font-size:12px; margin-top:4px;">Try selecting another filter or report a new issue.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(t => {
      const isSelected = t.id === state.activeTicketId;
      const stars = t.rating ? '★'.repeat(t.rating) : '';

      return `
        <article class="ticket-feed-card ${isSelected ? 'selected' : ''}" onclick="window.selectTicket(${t.id})">
          <div class="ticket-card-top">
            <div class="ticket-card-badges">
              <span class="grate-badge grate-badge-unit">🏢 ${t.unit}</span>
              ${getCategoryBadge(t.category)}
              ${getPriorityBadge(t.priority)}
            </div>
            <span class="ticket-card-id">${t.ticket_number}</span>
          </div>

          <h3 class="ticket-card-title">${t.title}</h3>

          <div class="ticket-card-meta">
            <div class="ticket-card-assignee">
              <span>${t.assigned_to_name ? `🔧 ${t.assigned_to_name}` : 'Awaiting assignment'}</span>
              ${stars ? `<span style="color:#f59e0b; font-weight:bold; margin-left:6px;">${stars}</span>` : ''}
            </div>
            <div>
              ${getStatusBadge(t.status)}
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // --- 6. LIVE INSPECTOR & RESOLUTION LAB --- //
  async function renderLiveInspector() {
    const container = document.getElementById('inspectorContent');
    if (!container) return;

    const ticket = await DB.getTicketById(state.activeTicketId) || state.tickets[0];
    if (!ticket) {
      container.innerHTML = `
        <div style="text-align:center; padding:60px 20px; color:var(--muted);">
          <p>Select any ticket on the left to inspect real-time progress and dispatch actions.</p>
        </div>
      `;
      return;
    }

    state.activeTicketId = ticket.id;
    const step = ticket.status === 'Open' ? 1 : ticket.status === 'Assigned' ? 2 : ticket.status === 'In_Progress' ? 3 : 4;
    const isStaffOrManager = state.currentRole === 'staff' || state.currentRole === 'manager';
    const isResident = state.currentRole === 'resident';

    container.innerHTML = `
      <div class="inspector-header">
        <div class="inspector-title-area">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="grate-badge grate-badge-cyan">${ticket.ticket_number}</span>
            <span class="grate-badge grate-badge-unit">${ticket.unit}</span>
            ${getCategoryBadge(ticket.category)}
          </div>
          <h2>${ticket.title}</h2>
        </div>
        <div>
          ${getStatusBadge(ticket.status)}
        </div>
      </div>

      <div class="dispatch-stepper">
        <div class="dispatch-step ${step >= 1 ? 'done' : ''}">
          <div class="step-node">${step >= 1 ? '✓' : '1'}</div>
          <span class="step-label">Reported</span>
        </div>
        <div class="dispatch-step ${step >= 2 ? (step === 2 ? 'current' : 'done') : ''}">
          <div class="step-node">${step >= 2 ? '✓' : '2'}</div>
          <span class="step-label">Assigned</span>
        </div>
        <div class="dispatch-step ${step >= 3 ? (step === 3 ? 'current' : 'done') : ''}">
          <div class="step-node">${step >= 3 ? '✓' : '3'}</div>
          <span class="step-label">In Progress</span>
        </div>
        <div class="dispatch-step ${step >= 4 ? 'done' : ''}">
          <div class="step-node">${step >= 4 ? '✓' : '4'}</div>
          <span class="step-label">Resolved</span>
        </div>
      </div>

      <p class="inspector-desc">${ticket.description}</p>

      <div class="inspector-grid">
        <div class="inspector-stat-box">
          <span>Priority Level</span>
          <strong>${getPriorityBadge(ticket.priority)}</strong>
        </div>
        <div class="inspector-stat-box">
          <span>Reported By</span>
          <strong>${ticket.created_by_name}</strong>
        </div>
        <div class="inspector-stat-box">
          <span>Assigned Technician</span>
          <strong>${ticket.assigned_to_name ? `🔧 ${ticket.assigned_to_name}` : 'None (Pending)'}</strong>
        </div>
        <div class="inspector-stat-box">
          <span>Timestamp</span>
          <strong style="font-family:var(--font-mono); font-size:11px;">${ticket.created_at}</strong>
        </div>
      </div>

      ${ticket.technician_notes ? `
        <div class="inspector-stat-box" style="border-left: 3px solid var(--cyan);">
          <span>Technician Diagnostic Notes</span>
          <p style="font-size:12px; margin:4px 0;">${ticket.technician_notes}</p>
          ${ticket.parts_used ? `<small style="font-family:var(--font-mono); color:var(--muted)">Parts Requisition: ${ticket.parts_used}</small>` : ''}
        </div>
      ` : ''}

      ${ticket.rating ? `
        <div class="inspector-stat-box" style="border-left: 3px solid var(--success);">
          <span>Resident Feedback & Rating</span>
          <div style="color:#f59e0b; font-size:15px; margin:2px 0;">${'★'.repeat(ticket.rating)}${'☆'.repeat(5 - ticket.rating)}</div>
          <p style="font-size:12px;">"${ticket.feedback || 'Resolution verified by resident.'}"</p>
        </div>
      ` : ''}

      <!-- Quick Resolution Lab Controls -->
      <div class="inspector-actions">
        <div class="inspector-actions-title">⚡ Interactive Dispatch & Action Console</div>
        <div class="inspector-btn-row">
          ${isStaffOrManager && ticket.status === 'Assigned' ? `
            <button class="primary-btn" onclick="window.updateStatus(${ticket.id}, 'In_Progress')">▶ Start working</button>
          ` : ''}
          ${isStaffOrManager && ticket.status === 'In_Progress' ? `
            <button class="primary-btn" onclick="window.promptResolveModal(${ticket.id})">✓ Mark as resolved</button>
          ` : ''}
          ${state.currentRole === 'manager' && !ticket.assigned_to_name ? `
            <button class="secondary-btn" onclick="window.promptAssignModal(${ticket.id})">+ Assign staff</button>
          ` : ''}
          ${isResident && ticket.status === 'Resolved' && !ticket.rating ? `
            <button class="primary-btn" onclick="window.promptRatingModal(${ticket.id})">⭐ Rate technician's work</button>
          ` : ''}
          <button class="secondary-btn" onclick="window.openDetailModal(${ticket.id})">Full Record &amp; History</button>
        </div>

        <div class="inspector-note-box">
          <input id="quickNoteInput" placeholder="Add an update note to ticket audit trail...">
          <button class="secondary-btn" onclick="window.submitQuickNote(${ticket.id})">Add Note</button>
        </div>
      </div>
    `;
  }

  window.selectTicket = function(ticketId) {
    state.activeTicketId = ticketId;
    renderTicketFeed();
    renderLiveInspector();
  };

  window.submitQuickNote = async function(ticketId) {
    const input = document.getElementById('quickNoteInput');
    if (!input) return;
    const note = input.value.trim();
    if (!note) return;

    await DB.addLog(ticketId, {
      user_name: state.currentUser.name,
      action: 'Note Logged',
      note: note
    });

    input.value = '';
    showToast('Audit updated', 'Note saved to immutable trail.');
    await reloadData();
  };

  function renderFullTicketsView() {
    const container = document.getElementById('fullTicketList');
    if (!container) return;

    container.innerHTML = state.tickets.map(t => `
      <article class="ticket-feed-card" onclick="window.openDetailModal(${t.id})">
        <div class="ticket-card-top">
          <div class="ticket-card-badges">
            <span class="grate-badge grate-badge-unit">🏢 ${t.unit}</span>
            ${getCategoryBadge(t.category)}
            ${getPriorityBadge(t.priority)}
          </div>
          <span class="ticket-card-id">${t.ticket_number}</span>
        </div>
        <h3 class="ticket-card-title">${t.title}</h3>
        <div class="ticket-card-meta">
          <span>${t.assigned_to_name ? `Assigned: ${t.assigned_to_name}` : 'Awaiting assignment'}</span>
          <div>${getStatusBadge(t.status)}</div>
        </div>
      </article>
    `).join('');
  }

  async function renderActivityView() {
    const container = document.getElementById('activityList');
    if (!container) return;

    let allLogs = [];
    for (const t of state.tickets) {
      const full = await DB.getTicketById(t.id);
      if (full && full.logs) {
        allLogs.push(...full.logs);
      }
    }
    allLogs.sort((a, b) => b.id - a.id);

    if (allLogs.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--muted);">No activity recorded yet.</div>`;
      return;
    }

    container.innerHTML = allLogs.slice(0, 20).map(l => `
      <div class="audit-entry">
        <div class="audit-dot">✓</div>
        <div style="flex:1;">
          <strong>${l.user_name} · ${l.action}</strong>
          <p>${l.note || 'Updated ticket status'}</p>
          <time>${l.created_at}</time>
        </div>
      </div>
    `).join('');
  }

  // --- 7. NAVIGATION & VIEW SWITCHING --- //
  const navPills = document.querySelectorAll('.exec-nav-pill[data-view]');
  navPills.forEach(pill => {
    pill.addEventListener('click', () => {
      navPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const viewId = pill.getAttribute('data-view');
      switchView(viewId);
    });
  });

  function switchView(viewId) {
    state.currentView = viewId;
    const views = {
      dashboard: document.getElementById('view-dashboard'),
      tickets: document.getElementById('view-tickets'),
      activity: document.getElementById('view-activity')
    };

    Object.keys(views).forEach(k => {
      if (views[k]) {
        views[k].style.display = (k === viewId) ? 'block' : 'none';
        if (k === viewId) views[k].classList.add('active');
        else views[k].classList.remove('active');
      }
    });

    if (viewId === 'activity') renderActivityView();
    if (viewId === 'tickets') renderFullTicketsView();
  }

  // Filter Buttons
  const filterButtons = document.querySelectorAll('.filter-chip[data-list-filter]');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.listFilter = btn.getAttribute('data-list-filter');
      renderTicketFeed();
    });
  });

  // KPI Card Clicks as Filters
  document.querySelectorAll('.kpi-card[data-filter]').forEach(card => {
    card.addEventListener('click', () => {
      const filter = card.getAttribute('data-filter');
      state.listFilter = filter;
      filterButtons.forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-list-filter') === filter);
      });
      renderTicketFeed();
    });
  });

  // Search Inputs
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim();
      renderTicketFeed();
    });
  }

  const searchInput2 = document.getElementById('searchInput2');
  if (searchInput2) {
    searchInput2.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      const container = document.getElementById('fullTicketList');
      const filtered = state.tickets.filter(t => 
        t.title.toLowerCase().includes(q) ||
        t.ticket_number.toLowerCase().includes(q) ||
        t.unit.toLowerCase().includes(q)
      );
      container.innerHTML = filtered.map(t => `
        <article class="ticket-feed-card" onclick="window.openDetailModal(${t.id})">
          <div class="ticket-card-top">
            <div class="ticket-card-badges">
              <span class="grate-badge grate-badge-unit">🏢 ${t.unit}</span>
              ${getCategoryBadge(t.category)}
              ${getPriorityBadge(t.priority)}
            </div>
            <span class="ticket-card-id">${t.ticket_number}</span>
          </div>
          <h3 class="ticket-card-title">${t.title}</h3>
          <div class="ticket-card-meta">
            <span>${t.assigned_to_name ? `Assigned: ${t.assigned_to_name}` : 'Awaiting assignment'}</span>
            <div>${getStatusBadge(t.status)}</div>
          </div>
        </article>
      `).join('');
    });
  }

  // Persona Role Switcher
  const roleSelect = document.getElementById('roleSelect');
  if (roleSelect) {
    roleSelect.addEventListener('change', (e) => {
      state.currentRole = e.target.value;
      state.currentUser = ROLE_MAP[state.currentRole];
      showToast('Persona active', `Viewing workspace as ${state.currentUser.name}`);
      reloadData();
    });
  }

  // --- 8. MODALS & FORMS --- //
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalClose = document.getElementById('modalClose');
  const modalContent = document.getElementById('modalContent');

  function openModal(html) {
    modalContent.innerHTML = html;
    modalBackdrop.hidden = false;
    modalBackdrop.style.display = 'grid';
  }

  function closeModal() {
    modalBackdrop.hidden = true;
    modalBackdrop.style.display = 'none';
    modalContent.innerHTML = '';
  }

  modalClose.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modalBackdrop.hidden) {
      closeModal();
    }
  });

  function showReportModal() {
    const user = state.currentUser;
    const defaultUnit = user.unit || 'Unit 402';

    const html = `
      <div class="modal-inner">
        <h2>Report a maintenance issue</h2>
        <p class="modal-sub">Tell us what needs fixing. We'll assign the right staff and keep you updated.</p>

        <form id="newIssueForm">
          <div class="form-grid">
            <div class="field full">
              <label for="modalTitle">Issue title *</label>
              <input id="modalTitle" required placeholder="e.g. Master bathroom sink pipe leaking">
            </div>

            <div class="field">
              <label for="modalCategory">Category</label>
              <select id="modalCategory">
                <option value="Plumbing">Plumbing &amp; Water</option>
                <option value="Electrical">Electrical &amp; Power</option>
                <option value="HVAC">HVAC &amp; Air Conditioning</option>
                <option value="Carpentry">Carpentry &amp; Fixtures</option>
                <option value="General">General Maintenance</option>
              </select>
            </div>

            <div class="field">
              <label for="modalUnit">Apartment / Unit</label>
              <input id="modalUnit" value="${defaultUnit}">
            </div>

            <div class="field full">
              <label>Priority level</label>
              <div class="priority-row">
                <div class="priority-option">
                  <input type="radio" name="priority" id="p1" value="Low">
                  <label for="p1">Low</label>
                </div>
                <div class="priority-option">
                  <input type="radio" name="priority" id="p2" value="Medium" checked>
                  <label for="p2">Medium</label>
                </div>
                <div class="priority-option">
                  <input type="radio" name="priority" id="p3" value="High">
                  <label for="p3">High</label>
                </div>
                <div class="priority-option">
                  <input type="radio" name="priority" id="p4" value="Emergency">
                  <label for="p4" style="color:var(--destructive)">Emergency</label>
                </div>
              </div>
            </div>

            <div class="field full">
              <label for="modalDesc">Detailed description *</label>
              <textarea id="modalDesc" required placeholder="Describe the location, how long it has been occurring, and any access details..."></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="secondary-btn" onclick="document.getElementById('modalClose').click()">Cancel</button>
            <button type="submit" class="primary-btn">Submit request</button>
          </div>
        </form>
      </div>
    `;

    openModal(html);

    document.getElementById('newIssueForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('modalTitle').value.trim();
      const category = document.getElementById('modalCategory').value;
      const unit = document.getElementById('modalUnit').value.trim();
      const priority = document.querySelector('input[name="priority"]:checked').value;
      const description = document.getElementById('modalDesc').value.trim();

      const created = await DB.createTicket({
        title,
        category,
        priority,
        unit,
        description,
        created_by_user_id: user.id,
        created_by_name: user.name
      });

      closeModal();
      state.activeTicketId = created.id;
      await reloadData();
      showToast('Request submitted!', `Ticket #${created.ticket_number} created.`);
    });
  }

  document.getElementById('reportBtn').addEventListener('click', showReportModal);

  window.openDetailModal = async function(ticketId) {
    state.activeTicketId = ticketId;
    const ticket = await DB.getTicketById(ticketId);
    if (!ticket) return;

    const step = ticket.status === 'Open' ? 1 : ticket.status === 'Assigned' ? 2 : ticket.status === 'In_Progress' ? 3 : 4;
    const isStaffOrManager = state.currentRole === 'staff' || state.currentRole === 'manager';
    const isResident = state.currentRole === 'resident';

    const html = `
      <div class="modal-inner">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-right:32px;">
          <div>
            <div style="display:flex; gap:6px; margin-bottom:4px;">
              <span class="grate-badge grate-badge-cyan">${ticket.ticket_number}</span>
              <span class="grate-badge grate-badge-unit">${ticket.unit}</span>
            </div>
            <h2>${ticket.title}</h2>
          </div>
          <div>
            ${getStatusBadge(ticket.status)}
          </div>
        </div>

        <p class="modal-sub">${ticket.description}</p>

        <div class="inspector-grid" style="margin-bottom:16px;">
          <div class="inspector-stat-box">
            <span>Location &amp; Reporter</span>
            <strong>${ticket.unit} · ${ticket.created_by_name}</strong>
          </div>
          <div class="inspector-stat-box">
            <span>Category &amp; Priority</span>
            <strong>${ticket.category} · ${ticket.priority}</strong>
          </div>
          <div class="inspector-stat-box">
            <span>Assigned Staff</span>
            <strong>${ticket.assigned_to_name ? `🔧 ${ticket.assigned_to_name}` : 'Awaiting assignment'}</strong>
          </div>
          <div class="inspector-stat-box">
            <span>Reported At</span>
            <strong>${ticket.created_at}</strong>
          </div>
        </div>

        ${ticket.technician_notes ? `
          <div class="inspector-stat-box" style="margin-bottom:14px; border-left:3px solid var(--cyan);">
            <span>Technician Fix Log</span>
            <p style="font-size:12px; margin:2px 0;">${ticket.technician_notes}</p>
            ${ticket.parts_used ? `<small style="font-family:var(--font-mono); color:var(--muted)">Parts: ${ticket.parts_used}</small>` : ''}
          </div>
        ` : ''}

        ${ticket.rating ? `
          <div class="inspector-stat-box" style="margin-bottom:14px; border-left:3px solid var(--success);">
            <span>Resident Feedback</span>
            <div style="color:#f59e0b; font-size:16px;">${'★'.repeat(ticket.rating)}${'☆'.repeat(5 - ticket.rating)}</div>
            <p style="font-size:12px; margin:2px 0;">"${ticket.feedback || 'Great job!'}"</p>
          </div>
        ` : ''}

        <div class="dispatch-stepper" style="padding:10px 0;">
          <div class="dispatch-step ${step >= 1 ? 'done' : ''}">
            <div class="step-node">${step >= 1 ? '✓' : '1'}</div><div><span class="step-label">Reported</span></div>
          </div>
          <div class="dispatch-step ${step >= 2 ? 'done' : ''}">
            <div class="step-node">${step >= 2 ? '✓' : '2'}</div><div><span class="step-label">Assigned</span></div>
          </div>
          <div class="dispatch-step ${step >= 3 ? (step === 3 ? 'current' : 'done') : ''}">
            <div class="step-node">${step > 3 ? '✓' : '3'}</div><div><span class="step-label">In Progress</span></div>
          </div>
          <div class="dispatch-step ${step >= 4 ? 'done' : ''}">
            <div class="step-node">${step >= 4 ? '✓' : '4'}</div><div><span class="step-label">Resolved</span></div>
          </div>
        </div>

        ${isStaffOrManager ? `
          <div class="inspector-actions" style="margin-top:16px;">
            <div class="inspector-actions-title">Staff Controls</div>
            <div class="inspector-btn-row">
              ${ticket.status === 'Assigned' ? `
                <button class="primary-btn" onclick="window.updateStatus(${ticket.id}, 'In_Progress')">▶ Start working</button>
              ` : ''}
              ${ticket.status === 'In_Progress' ? `
                <button class="primary-btn" onclick="window.promptResolveModal(${ticket.id})">✓ Mark as resolved</button>
              ` : ''}
              ${state.currentRole === 'manager' && !ticket.assigned_to_name ? `
                <button class="secondary-btn" onclick="window.promptAssignModal(${ticket.id})">+ Assign staff</button>
              ` : ''}
            </div>
          </div>
        ` : ''}

        ${isResident && ticket.status === 'Resolved' && !ticket.rating ? `
          <div class="inspector-actions" style="margin-top:16px;">
            <div class="inspector-actions-title">Rate Resolution</div>
            <button class="primary-btn" onclick="window.promptRatingModal(${ticket.id})">⭐ Rate technician's work</button>
          </div>
        ` : ''}

        <div style="margin-top:20px; border-top:1px solid var(--line); padding-top:15px;">
          <label style="font-size:11px; font-weight:700; display:block; margin-bottom:6px; color:var(--muted)">Add note to audit trail</label>
          <div style="display:flex; gap:8px;">
            <input id="detailNewNote" style="flex:1; border:1px solid var(--border); background:var(--input); border-radius:var(--radius); padding:8px 12px; font-size:12px; color:var(--foreground);" placeholder="Add an update note...">
            <button class="secondary-btn" onclick="window.postDetailNote(${ticket.id})">Post</button>
          </div>
        </div>
      </div>
    `;

    openModal(html);
  };

  window.updateStatus = async function(ticketId, status) {
    await DB.updateTicket(ticketId, {
      status,
      log_action: 'Status Updated',
      log_user: state.currentUser.name,
      log_note: `${state.currentUser.name} marked ticket as ${status.replace('_', ' ')}`
    });
    closeModal();
    await reloadData();
    showToast('Status updated', `Ticket marked as ${status.replace('_', ' ')}.`);
  };

  window.promptResolveModal = function(ticketId) {
    const html = `
      <div class="modal-inner">
        <h2>Complete Repair</h2>
        <p class="modal-sub">Log the diagnostic fix and any replacement parts used.</p>
        <div class="field full" style="margin-bottom:12px;">
          <label>Diagnostic &amp; Repair Summary *</label>
          <textarea id="resolveNotes" placeholder="e.g. Cleared drain blockage and replaced gasket seal."></textarea>
        </div>
        <div class="field full" style="margin-bottom:16px;">
          <label>Replacement Parts Used</label>
          <input id="resolveParts" placeholder="e.g. 1x rubber O-ring, silicone tape">
        </div>
        <div class="modal-footer">
          <button class="secondary-btn" onclick="window.openDetailModal(${ticketId})">Back</button>
          <button class="primary-btn" onclick="window.submitResolve(${ticketId})">Confirm &amp; resolve</button>
        </div>
      </div>
    `;
    openModal(html);
  };

  window.submitResolve = async function(ticketId) {
    const notes = document.getElementById('resolveNotes').value.trim() || 'Work completed.';
    const parts = document.getElementById('resolveParts').value.trim() || 'None';

    await DB.updateTicket(ticketId, {
      status: 'Resolved',
      technician_notes: notes,
      parts_used: parts,
      log_action: 'Work Completed',
      log_user: state.currentUser.name,
      log_note: `Resolved: ${notes} (Parts: ${parts})`
    });

    closeModal();
    await reloadData();
    showToast('Work completed!', 'Ticket marked as resolved.');
  };

  window.promptAssignModal = function(ticketId) {
    const techs = state.users.filter(u => u.role === 'technician');
    const html = `
      <div class="modal-inner">
        <h2>Assign Maintenance Staff</h2>
        <p class="modal-sub">Select the appropriate technician for dispatch.</p>
        <div class="field full" style="margin-bottom:16px;">
          <label>Available Technicians</label>
          <select id="assignTechSelect">
            ${techs.map(t => `<option value="${t.id}">${t.name} (${t.specialty})</option>`).join('')}
          </select>
        </div>
        <div class="modal-footer">
          <button class="secondary-btn" onclick="document.getElementById('modalClose').click()">Cancel</button>
          <button class="primary-btn" onclick="window.submitAssign(${ticketId})">Confirm assignment</button>
        </div>
      </div>
    `;
    openModal(html);
  };

  window.submitAssign = async function(ticketId) {
    const techId = Number(document.getElementById('assignTechSelect').value);
    const tech = state.users.find(u => u.id === techId);
    if (!tech) return;

    await DB.updateTicket(ticketId, {
      assigned_to_user_id: tech.id,
      assigned_to_name: tech.name,
      status: 'Assigned',
      log_action: 'Staff Assigned',
      log_user: state.currentUser.name,
      log_note: `Assigned ${tech.name} (${tech.specialty})`
    });

    closeModal();
    await reloadData();
    showToast('Staff assigned', `${tech.name} has been notified.`);
  };

  window.promptRatingModal = function(ticketId) {
    const html = `
      <div class="modal-inner">
        <h2>Rate the Resolution</h2>
        <p class="modal-sub">How satisfied are you with the technician's fix?</p>
        <div style="font-size:28px; text-align:center; margin:16px 0; cursor:pointer;" id="starRatingBox">
          <span data-star="1" style="color:#f59e0b">★</span>
          <span data-star="2" style="color:#f59e0b">★</span>
          <span data-star="3" style="color:#f59e0b">★</span>
          <span data-star="4" style="color:#f59e0b">★</span>
          <span data-star="5" style="color:#f59e0b">★</span>
        </div>
        <div class="field full" style="margin-bottom:16px;">
          <label>Comments / Feedback (Optional)</label>
          <input id="feedbackInput" placeholder="e.g. Arrived on time and resolved quickly!">
        </div>
        <div class="modal-footer">
          <button class="secondary-btn" onclick="document.getElementById('modalClose').click()">Skip</button>
          <button class="primary-btn" onclick="window.submitRating(${ticketId})">Submit Review</button>
        </div>
      </div>
    `;
    openModal(html);

    let selectedRating = 5;
    const stars = document.querySelectorAll('#starRatingBox span');
    stars.forEach(s => {
      s.addEventListener('click', () => {
        selectedRating = Number(s.getAttribute('data-star'));
        stars.forEach(starEl => {
          const val = Number(starEl.getAttribute('data-star'));
          starEl.textContent = val <= selectedRating ? '★' : '☆';
        });
      });
    });

    window._currentRating = () => selectedRating;
  };

  window.submitRating = async function(ticketId) {
    const rating = window._currentRating ? window._currentRating() : 5;
    const feedback = document.getElementById('feedbackInput').value.trim();

    await DB.updateTicket(ticketId, {
      rating,
      feedback,
      log_action: 'Resident Rated',
      log_user: state.currentUser.name,
      log_note: `Rated ${rating}/5 stars: "${feedback || 'No comments'}"`
    });

    closeModal();
    await reloadData();
    showToast('Review submitted', 'Thank you for your feedback!');
  };

  window.postDetailNote = async function(ticketId) {
    const input = document.getElementById('detailNewNote');
    if (!input) return;
    const note = input.value.trim();
    if (!note) return;

    await DB.addLog(ticketId, {
      user_name: state.currentUser.name,
      action: 'Note Logged',
      note: note
    });

    showToast('Note added', 'Saved to immutable audit trail.');
    await reloadData();
    window.openDetailModal(ticketId);
  };

  // Database Export & Reset
  const btnExport = document.getElementById('btn-export-db');
  if (btnExport) {
    btnExport.addEventListener('click', async () => {
      const data = await DB.exportJSON();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fixflow_jatin_export_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Database exported', 'JSON export downloaded.');
    });
  }

  const btnReset = document.getElementById('btn-reset-db');
  if (btnReset) {
    btnReset.addEventListener('click', async () => {
      if (confirm('Reset FixFlow database to clean initial state?')) {
        await DB.resetData();
        showToast('Database reset', 'Restored to clean state.');
        await reloadData();
      }
    });
  }

  // --- 9. INTERACTIVE BACKGROUND (PINK PALETTE) --- //
  function initInteractiveBackground() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0, height = 0;
    const mouse = { x: -9999, y: -9999, active: false, radius: 140 };
    let currentStyle = 'subtle-waves';

    const bgSelect = document.getElementById('bgStyleSelect');
    if (bgSelect) {
      bgSelect.addEventListener('change', (e) => {
        currentStyle = e.target.value;
      });
    }

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    });

    window.addEventListener('mouseleave', () => {
      mouse.active = false;
    });

    const waves = [];
    window.addEventListener('click', (e) => {
      if (waves.length > 5) waves.shift();
      waves.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: 180,
        speed: 2.2,
        amplitude: 14,
        decay: 0.94
      });
    });

    const CONTOUR_COUNT = 8;
    function renderSubtleWaves(cyanRgb, isDark, time) {
      ctx.lineWidth = 0.9;
      const stepX = 20;

      for (let i = 0; i < CONTOUR_COUNT; i++) {
        const yBase = (height / (CONTOUR_COUNT + 1)) * (i + 1);
        const freq = 0.0016 + i * 0.0003;
        const baseAmp = 10 + i * 4;
        const phase = i * 0.8;

        ctx.beginPath();
        let first = true;

        for (let bx = 0; bx <= width + stepX; bx += stepX) {
          let by = yBase + Math.sin(time * freq + (bx / width) * 4.2 + phase) * baseAmp;

          if (mouse.active) {
            const dx = bx - mouse.x;
            const dy = by - mouse.y;
            const dist = Math.hypot(dx, dy);
            if (dist < mouse.radius && dist > 0) {
              const force = (1 - dist / mouse.radius);
              by -= (dy / dist) * force * 24;
            }
          }

          for (const wave of waves) {
            const dx = bx - wave.x;
            const dy = by - wave.y;
            const dist = Math.hypot(dx, dy);
            const waveDiff = dist - wave.radius;
            if (Math.abs(waveDiff) < 50) {
              const waveRatio = Math.cos((waveDiff / 50) * Math.PI * 0.5);
              by += waveRatio * wave.amplitude;
            }
          }

          if (first) {
            ctx.moveTo(bx, by);
            first = false;
          } else {
            ctx.lineTo(bx, by);
          }
        }

        const opacity = isDark 
          ? (0.10 + (i / CONTOUR_COUNT) * 0.16)
          : (0.07 + (i / CONTOUR_COUNT) * 0.12);
        ctx.strokeStyle = `rgba(${cyanRgb}, ${opacity})`;
        ctx.stroke();
      }
    }

    const SPACING = 40;
    function renderSubtleGrid(cyanRgb, isDark) {
      const defaultDotColor = isDark ? 'rgba(240, 240, 240, 0.06)' : 'rgba(30, 30, 30, 0.05)';
      const cols = Math.ceil(width / SPACING) + 1;
      const rows = Math.ceil(height / SPACING) + 1;

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const bx = c * SPACING;
          const by = r * SPACING;
          let px = bx;
          let py = by;
          let intensity = 0;

          if (mouse.active) {
            const dx = bx - mouse.x;
            const dy = by - mouse.y;
            const dist = Math.hypot(dx, dy);
            if (dist < mouse.radius && dist > 0) {
              const force = (1 - dist / mouse.radius);
              px += (dx / dist) * force * 8;
              py += (dy / dist) * force * 8;
              intensity += force * 0.6;
            }
          }

          if (intensity > 0.05) {
            const glow = Math.min(1, intensity);
            ctx.beginPath();
            ctx.arc(px, py, 1.4 + glow * 1.0, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${cyanRgb}, ${0.3 + glow * 0.5})`;
            ctx.fill();
          } else {
            ctx.fillStyle = defaultDotColor;
            ctx.fillRect(px - 0.5, py - 0.5, 1, 1);
          }
        }
      }
    }

    const particles = Array.from({ length: 36 }, () => ({
      x: Math.random() * (width || 1200),
      y: Math.random() * (height || 800),
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 1.5 + 1
    }));

    function renderSubtleMesh(cyanRgb, isDark) {
      ctx.lineWidth = 0.6;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cyanRgb}, ${isDark ? 0.25 : 0.18})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${cyanRgb}, ${(1 - dist / 90) * 0.1})`;
            ctx.stroke();
          }
        }
      }
    }

    function renderMinimalAura(cyanRgb, isDark) {
      const grad = ctx.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, Math.max(width, height) * 0.55);
      grad.addColorStop(0, `rgba(${cyanRgb}, ${isDark ? 0.05 : 0.03})`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    function mainLoop(time) {
      ctx.clearRect(0, 0, width, height);
      const isDark = document.body.classList.contains('dark');
      const cyanRgb = isDark ? '6, 182, 212' : '8, 145, 178';

      for (let w = waves.length - 1; w >= 0; w--) {
        const wave = waves[w];
        wave.radius += wave.speed;
        wave.amplitude *= wave.decay;
        if (wave.amplitude < 0.25 || wave.radius >= wave.maxRadius) {
          waves.splice(w, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${cyanRgb}, ${Math.min(0.25, (wave.amplitude / 22) * 0.2)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if (currentStyle === 'subtle-waves') {
        renderSubtleWaves(cyanRgb, isDark, time);
      } else if (currentStyle === 'subtle-grid') {
        renderSubtleGrid(cyanRgb, isDark);
      } else if (currentStyle === 'subtle-mesh') {
        renderSubtleMesh(cyanRgb, isDark);
      } else if (currentStyle === 'minimal') {
        renderMinimalAura(cyanRgb, isDark);
      }

      requestAnimationFrame(mainLoop);
    }
    requestAnimationFrame(mainLoop);
  }
  initInteractiveBackground();

  // Initial Data Load
  await reloadData();
});
