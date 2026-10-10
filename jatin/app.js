/**
 * FixFlow — Apartment Maintenance OS (Jatin Edition)
 * Fully Subtle Frontend with Dual-Mode Database Support
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
    activeTicketId: null,
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
    const { mode, isApiConnected } = await DB.init();
    if (dbStatusEl && dbStatusTextEl) {
      if (isApiConnected) {
        dbStatusEl.className = 'db-pill sqlite';
        dbStatusTextEl.textContent = 'SQLite (Port 8000)';
        dbStatusEl.title = 'Connected directly to Python SQLite backend (server.py)';
      } else {
        dbStatusEl.className = 'db-pill localstorage';
        dbStatusTextEl.textContent = 'Local Database';
        dbStatusEl.title = 'Running on client-side persistent storage. Start server.py for SQLite backend.';
      }
    }
  }
  await initDatabase();

  // Load registered users
  state.users = await DB.getUsers();

  const ROLE_MAP = {
    resident: state.users.find(u => u.role === 'resident') || { id: 1, name: "Aarav Mehta", unit: "Unit 402", phone: "+91 98765 43210" },
    staff: state.users.find(u => u.role === 'technician') || { id: 5, name: "Suresh Patil", specialty: "Plumbing Specialist", phone: "+91 98765 22222" },
    manager: state.users.find(u => u.role === 'manager') || { id: 7, name: "Priya Sharma", specialty: "Facilities Director", phone: "+91 98765 99999" }
  };
  state.currentUser = ROLE_MAP[state.currentRole];

  // --- 5. DATA SYNC & VIEW RENDERING --- //
  async function reloadData() {
    state.tickets = await DB.getTickets();
    state.stats = await DB.getStats();

    updateProfileUI();
    renderStats();
    renderAttentionList();
    renderFeaturedUpdate();
    renderTicketsView();
    renderActivityView();
  }

  function updateProfileUI() {
    const user = state.currentUser;
    const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    document.getElementById('sidebarAvatar').textContent = initials;
    document.getElementById('topAvatar').textContent = initials;
    document.getElementById('sidebarUserName').textContent = user.name;

    const roleLabel = state.currentRole === 'resident' 
      ? `${user.unit || 'Unit 402'} · Resident`
      : state.currentRole === 'staff'
      ? `${user.specialty || 'Technician'} · Staff`
      : `Admin Office · Manager`;

    document.getElementById('sidebarUserRole').textContent = roleLabel;

    const greetingEl = document.getElementById('greeting');
    const subtleEl = document.getElementById('heroSubtle');
    const navTicketsLabel = document.getElementById('navTicketsLabel');

    if (state.currentRole === 'resident') {
      greetingEl.textContent = `Good afternoon, ${user.name.split(' ')[0]}.`;
      subtleEl.textContent = `Report it once. Track it all the way to fixed.`;
      navTicketsLabel.textContent = `My Requests`;
    } else if (state.currentRole === 'staff') {
      greetingEl.textContent = `Welcome back, ${user.name.split(' ')[0]}.`;
      subtleEl.textContent = `Work order queue: Diagnose, log parts, and complete repairs.`;
      navTicketsLabel.textContent = `Assigned Jobs`;
    } else {
      greetingEl.textContent = `Welcome, ${user.name.split(' ')[0]}.`;
      subtleEl.textContent = `Community oversight: Real-time SLAs, assignments, and audit trails.`;
      navTicketsLabel.textContent = `All Requests`;
    }

    const activeCount = state.tickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').length;
    document.getElementById('navCount').textContent = activeCount;
  }

  function renderStats() {
    const relevantTickets = getRoleScopedTickets();
    const active = relevantTickets.filter(t => t.status === 'Open' || t.status === 'Assigned').length;
    const progress = relevantTickets.filter(t => t.status === 'In_Progress').length;
    const resolved = relevantTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

    document.getElementById('statActive').textContent = active;
    document.getElementById('statProgress').textContent = progress;
    document.getElementById('statResolved').textContent = resolved;

    const activeWithTech = relevantTickets.find(t => t.status === 'In_Progress' || t.status === 'Assigned');
    if (activeWithTech) {
      document.getElementById('statNextAction').textContent = `Today · 5:30 PM`;
      document.getElementById('statNextActionSub').textContent = `${activeWithTech.category} · ${activeWithTech.ticket_number}`;
    } else {
      document.getElementById('statNextAction').textContent = `All clear`;
      document.getElementById('statNextActionSub').textContent = `No pending visits`;
    }
  }

  function getCategoryIcon(cat) {
    switch (cat) {
      case 'Plumbing': return '💧';
      case 'Electrical': return '⚡';
      case 'HVAC': return '❄️';
      case 'Carpentry': return '🔨';
      case 'Appliance': return '🔌';
      default: return '🛠️';
    }
  }

  function getRoleScopedTickets() {
    if (state.currentRole === 'resident') {
      return state.tickets.filter(t => t.created_by_user_id === state.currentUser.id || t.unit === state.currentUser.unit);
    } else if (state.currentRole === 'staff') {
      return state.tickets.filter(t => t.assigned_to_user_id === state.currentUser.id || t.status === 'Open');
    }
    return state.tickets;
  }

  function renderAttentionList() {
    const container = document.getElementById('attentionList');
    const relevant = getRoleScopedTickets().filter(t => t.status !== 'Resolved' && t.status !== 'Closed');

    if (relevant.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:32px 14px; color:var(--muted);">
          <strong>Everything is resolved!</strong>
          <p style="font-size:12px; margin-top:4px;">No pending maintenance issues.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = relevant.slice(0, 4).map(t => {
      const statusClass = t.status === 'In_Progress' ? 'progress' : t.status === 'Assigned' ? 'progress' : 'open';
      const statusText = t.status === 'In_Progress' ? 'In progress' : t.status === 'Assigned' ? 'Assigned' : 'Open';
      const priorityClass = t.priority === 'Emergency' ? 'emergency' : t.priority === 'High' ? 'high' : '';

      return `
        <div class="ticket-item" onclick="window.openDetailModal(${t.id})">
          <div class="ticket-icon">${getCategoryIcon(t.category)}</div>
          <div class="ticket-main">
            <strong>${t.title}</strong>
            <span>${t.unit} · ${t.category} ${priorityClass ? `<span class="priority-tag ${priorityClass}">${t.priority}</span>` : ''}</span>
            <small>${t.assigned_to_name ? `Assigned: ${t.assigned_to_name}` : 'Awaiting assignment'}</small>
          </div>
          <div>
            <span class="status ${statusClass}">${statusText}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderFeaturedUpdate() {
    const featured = state.tickets.find(t => t.status === 'In_Progress') || state.tickets[0];
    if (!featured) return;

    document.getElementById('featuredTitle').textContent = featured.title;
    document.getElementById('featuredIcon').textContent = getCategoryIcon(featured.category);
    document.getElementById('featuredAssignee').innerHTML = featured.assigned_to_name 
      ? `Assigned to <b>${featured.assigned_to_name} · ${featured.category}</b>` 
      : `Status: <b>Awaiting technician dispatch</b>`;

    const statusProgressMap = { Open: '25%', Assigned: '50%', In_Progress: '75%', Resolved: '100%' };
    document.getElementById('featuredProgress').style.width = statusProgressMap[featured.status] || '40%';
    document.getElementById('featuredStatusText').textContent = `Status: ${featured.status.replace('_', ' ')} · ${featured.unit}`;

    const step = featured.status === 'Open' ? 1 : featured.status === 'Assigned' ? 2 : featured.status === 'In_Progress' ? 3 : 4;
    document.getElementById('featuredMiniTimeline').innerHTML = `
      <div class="timeline-step ${step >= 1 ? 'done' : ''}">
        <span>✓</span>
        <div><strong>Reported</strong><small>${featured.created_at.slice(11, 16) || 'Logged'}</small></div>
      </div>
      <div class="timeline-step ${step >= 2 ? (step === 2 ? 'current' : 'done') : ''}">
        <span>${step >= 2 ? '✓' : '2'}</span>
        <div><strong>Assigned</strong><small>${featured.assigned_to_name || 'Pending'}</small></div>
      </div>
      <div class="timeline-step ${step >= 3 ? (step === 3 ? 'current' : 'done') : ''}">
        <span>${step > 3 ? '✓' : '3'}</span>
        <div><strong>In progress</strong><small>Diagnosing &amp; parts</small></div>
      </div>
      <div class="timeline-step ${step >= 4 ? 'done' : ''}">
        <span>${step >= 4 ? '✓' : '4'}</span>
        <div><strong>Resolved</strong><small>${featured.resolved_at ? 'Completed' : 'Pending'}</small></div>
      </div>
    `;
  }

  function renderTicketsView() {
    const container = document.getElementById('fullTicketList');
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
        <div style="text-align:center; padding:40px 14px; color:var(--muted);">
          <strong>No requests found</strong>
          <p style="font-size:12px; margin-top:4px;">Try searching for another term or changing the filter.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(t => {
      const statusClass = t.status === 'In_Progress' ? 'progress' : t.status === 'Resolved' ? 'resolved' : 'open';
      const statusText = t.status === 'In_Progress' ? 'In progress' : t.status === 'Resolved' ? 'Resolved' : (t.status === 'Assigned' ? 'Assigned' : 'Open');
      const stars = t.rating ? '★'.repeat(t.rating) : '';

      return `
        <div class="ticket-item" onclick="window.openDetailModal(${t.id})">
          <div class="ticket-icon">${getCategoryIcon(t.category)}</div>
          <div class="ticket-main">
            <strong>${t.title}</strong>
            <span>${t.unit} · ${t.category} · Priority: ${t.priority}</span>
            <small>${t.assigned_to_name ? `Technician: ${t.assigned_to_name}` : 'Unassigned'} ${stars ? `· Rating: <b style="color:#f59e0b">${stars}</b>` : ''}</small>
          </div>
          <div class="assigned" style="font-size:11px; color:var(--muted); font-family:var(--font-mono);">
            ${t.ticket_number}
          </div>
          <div>
            <span class="status ${statusClass}">${statusText}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  async function renderActivityView() {
    const container = document.getElementById('activityList');
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

    container.innerHTML = allLogs.slice(0, 15).map(l => `
      <div class="activity-entry">
        <div class="activity-dot">✓</div>
        <div style="flex:1;">
          <strong>${l.user_name} · ${l.action}</strong>
          <p>${l.note || 'Updated ticket status'}</p>
          <time>${l.created_at}</time>
        </div>
      </div>
    `).join('');
  }

  // --- 6. NAVIGATION & TABS --- //
  document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item[data-view]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const viewId = btn.getAttribute('data-view');
      switchView(viewId);
    });
  });

  document.querySelectorAll('[data-go="tickets"]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item[data-view]').forEach(b => b.classList.remove('active'));
      document.querySelector('.nav-item[data-view="tickets"]').classList.add('active');
      switchView('tickets');
    });
  });

  document.querySelectorAll('.stat-card[data-filter]').forEach(card => {
    card.addEventListener('click', () => {
      const filter = card.getAttribute('data-filter');
      state.listFilter = filter === 'active' ? 'open' : filter;
      document.querySelectorAll('.nav-item[data-view]').forEach(b => b.classList.remove('active'));
      document.querySelector('.nav-item[data-view="tickets"]').classList.add('active');
      document.querySelectorAll('.filter').forEach(f => {
        f.classList.toggle('active', f.getAttribute('data-list-filter') === state.listFilter);
      });
      switchView('tickets');
      renderTicketsView();
    });
  });

  function switchView(viewId) {
    state.currentView = viewId;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${viewId}`).classList.add('active');

    const pageTitleMap = {
      dashboard: 'Dashboard',
      tickets: 'Maintenance Requests',
      activity: 'Activity Audit Trail'
    };
    document.getElementById('pageTitle').textContent = pageTitleMap[viewId] || 'Dashboard';
  }

  // --- 7. ROLE SWITCHER --- //
  const roleSelect = document.getElementById('roleSelect');
  roleSelect.addEventListener('change', (e) => {
    const role = e.target.value;
    state.currentRole = role;
    state.currentUser = ROLE_MAP[role];
    showToast(`Switched view to ${e.target.options[e.target.selectedIndex].text}`);
    reloadData();
  });

  // --- 8. FILTERS & SEARCH --- //
  document.querySelectorAll('.filter[data-list-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter[data-list-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.listFilter = btn.getAttribute('data-list-filter');
      renderTicketsView();
    });
  });

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim();
      renderTicketsView();
    });
  }

  // --- 9. MODALS SYSTEM --- //
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalClose = document.getElementById('modalClose');
  const modalContent = document.getElementById('modalContent');

  function openModal(html) {
    modalContent.innerHTML = html;
    modalBackdrop.hidden = false;
  }

  function closeModal() {
    modalBackdrop.hidden = true;
    modalContent.innerHTML = '';
  }

  modalClose.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
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
      await reloadData();
      showToast('Request submitted!', `Ticket #${created.ticket_number} created.`);
    });
  }

  document.getElementById('reportBtn').addEventListener('click', showReportModal);
  document.getElementById('reportBtn2').addEventListener('click', showReportModal);

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
            <span style="font-size:11px; color:var(--muted); font-family:var(--font-mono);">${ticket.ticket_number}</span>
            <h2>${ticket.title}</h2>
          </div>
          <span class="status ${ticket.status === 'In_Progress' ? 'progress' : ticket.status === 'Resolved' ? 'resolved' : 'open'}">
            ${ticket.status.replace('_', ' ')}
          </span>
        </div>

        <p class="modal-sub">${ticket.description}</p>

        <div class="detail-grid">
          <div class="detail-box">
            <span>Location &amp; Reporter</span>
            <strong>${ticket.unit} · ${ticket.created_by_name}</strong>
          </div>
          <div class="detail-box">
            <span>Category &amp; Priority</span>
            <strong>${ticket.category} · ${ticket.priority}</strong>
          </div>
          <div class="detail-box">
            <span>Assigned Staff</span>
            <strong>${ticket.assigned_to_name ? `🔧 ${ticket.assigned_to_name}` : 'Awaiting assignment'}</strong>
          </div>
          <div class="detail-box">
            <span>Reported At</span>
            <strong>${ticket.created_at}</strong>
          </div>
        </div>

        ${ticket.technician_notes ? `
          <div class="detail-box" style="margin-bottom:14px; border-left:3px solid var(--accent);">
            <span>Technician Fix Log</span>
            <p style="font-size:12px; margin:2px 0;">${ticket.technician_notes}</p>
            ${ticket.parts_used ? `<small style="font-family:var(--font-mono); color:var(--muted)">Parts: ${ticket.parts_used}</small>` : ''}
          </div>
        ` : ''}

        ${ticket.rating ? `
          <div class="detail-box" style="margin-bottom:14px; border-left:3px solid var(--success);">
            <span>Resident Feedback</span>
            <div style="color:#f59e0b; font-size:16px;">${'★'.repeat(ticket.rating)}${'☆'.repeat(5 - ticket.rating)}</div>
            <p style="font-size:12px; margin:2px 0;">"${ticket.feedback || 'Great job!'}"</p>
          </div>
        ` : ''}

        <div class="timeline-mini" style="padding:10px 0;">
          <div class="timeline-step ${step >= 1 ? 'done' : ''}">
            <span>✓</span><div><strong>Reported</strong><small>${ticket.created_at}</small></div>
          </div>
          <div class="timeline-step ${step >= 2 ? 'done' : ''}">
            <span>${step >= 2 ? '✓' : '2'}</span><div><strong>Assigned</strong><small>${ticket.assigned_to_name || 'Staff'}</small></div>
          </div>
          <div class="timeline-step ${step >= 3 ? (step === 3 ? 'current' : 'done') : ''}">
            <span>${step > 3 ? '✓' : '3'}</span><div><strong>In Progress</strong><small>Diagnosis &amp; repair</small></div>
          </div>
          <div class="timeline-step ${step >= 4 ? 'done' : ''}">
            <span>${step >= 4 ? '✓' : '4'}</span><div><strong>Resolved</strong><small>${ticket.resolved_at || 'Pending'}</small></div>
          </div>
        </div>

        ${isStaffOrManager ? `
          <div class="staff-controls">
            <label>Staff &amp; Manager Controls</label>
            <div class="inline">
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
          <div class="staff-controls">
            <label>Rate Resolution</label>
            <button class="primary-btn" onclick="window.promptRatingModal(${ticket.id})">⭐ Rate technician's work</button>
          </div>
        ` : ''}

        <div style="margin-top:20px; border-top:1px solid var(--line); padding-top:15px;">
          <label style="font-size:11px; font-weight:700; display:block; margin-bottom:6px;">Add note to audit trail</label>
          <div style="display:flex; gap:8px;">
            <input id="detailNewNote" style="flex:1; border:1px solid var(--border); background:var(--input); border-radius:var(--radius); padding:8px 12px; font-size:12px;" placeholder="Add an update note...">
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
    showToast('Job marked as Resolved!', 'Resident will be notified to review.');
  };

  window.promptAssignModal = function(ticketId) {
    const html = `
      <div class="modal-inner">
        <h2>Assign Staff</h2>
        <p class="modal-sub">Dispatch a technician for this request.</p>
        <div class="field full" style="margin-bottom:16px;">
          <label>Select Technician</label>
          <select id="assignTechSelect">
            <option value="5">Suresh Patil — Plumbing &amp; Sanitization</option>
            <option value="4">Rajesh Kumar — Electrical &amp; HVAC</option>
            <option value="6">Vikram Singh — Carpentry &amp; General</option>
          </select>
        </div>
        <div class="modal-footer">
          <button class="secondary-btn" onclick="window.openDetailModal(${ticketId})">Back</button>
          <button class="primary-btn" onclick="window.submitAssign(${ticketId})">Assign</button>
        </div>
      </div>
    `;
    openModal(html);
  };

  window.submitAssign = async function(ticketId) {
    const techId = parseInt(document.getElementById('assignTechSelect').value);
    const techUser = state.users.find(u => u.id === techId) || { name: 'Staff Member' };

    await DB.updateTicket(ticketId, {
      status: 'Assigned',
      assigned_to_user_id: techId,
      assigned_to_name: techUser.name,
      log_action: 'Staff Assigned',
      log_user: state.currentUser.name,
      log_note: `Assigned to ${techUser.name}`
    });

    closeModal();
    await reloadData();
    showToast('Staff assigned', `Dispatched ${techUser.name}.`);
  };

  window.promptRatingModal = function(ticketId) {
    const html = `
      <div class="modal-inner">
        <h2>Rate Work Quality</h2>
        <p class="modal-sub">How was the maintenance resolution?</p>
        <div class="field full" style="margin-bottom:14px;">
          <label>Rating (1 to 5 Stars)</label>
          <select id="ratingScoreSelect">
            <option value="5">★★★★★ (5 Stars - Excellent)</option>
            <option value="4">★★★★☆ (4 Stars - Good)</option>
            <option value="3">★★★☆☆ (3 Stars - Average)</option>
            <option value="2">★★☆☆☆ (2 Stars - Poor)</option>
            <option value="1">★☆☆☆☆ (1 Star - Incomplete)</option>
          </select>
        </div>
        <div class="field full" style="margin-bottom:16px;">
          <label>Comments</label>
          <textarea id="ratingComment" placeholder="Any comments on response time or quality..."></textarea>
        </div>
        <div class="modal-footer">
          <button class="secondary-btn" onclick="window.openDetailModal(${ticketId})">Back</button>
          <button class="primary-btn" onclick="window.submitRating(${ticketId})">Submit feedback</button>
        </div>
      </div>
    `;
    openModal(html);
  };

  window.submitRating = async function(ticketId) {
    const rating = parseInt(document.getElementById('ratingScoreSelect').value);
    const feedback = document.getElementById('ratingComment').value.trim();

    await DB.updateTicket(ticketId, {
      rating,
      feedback,
      log_action: 'Resident Rated Work',
      log_user: state.currentUser.name,
      log_note: `Resident gave ${rating} stars: "${feedback || 'No comments'}"`
    });

    closeModal();
    await reloadData();
    showToast('Thank you!', 'Your rating has been saved.');
  };

  window.postDetailNote = async function(ticketId) {
    const note = document.getElementById('detailNewNote').value.trim();
    if (!note) return;

    await DB.addLog(ticketId, {
      user_name: state.currentUser.name,
      action: `${state.currentRole.toUpperCase()} Note`,
      note
    });

    showToast('Note added', 'Saved to the audit trail.');
    window.openDetailModal(ticketId);
  };

  // --- 10. DATABASE EXPORT & RESET --- //
  const btnExport = document.getElementById('btn-export-db');
  if (btnExport) {
    btnExport.addEventListener('click', async () => {
      const data = await DB.exportJSON();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `maintenance_db_jatin_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Database Exported', 'Downloaded backup JSON.');
    });
  }

  const btnReset = document.getElementById('btn-reset-db');
  if (btnReset) {
    btnReset.addEventListener('click', async () => {
      if (confirm('Reset database to clean initial sample state?')) {
        await DB.resetData();
        await reloadData();
        showToast('Database reset', 'Restored to clean demo data.');
      }
    });
  }

  // --- 11. SIDEBAR CONTROLS --- //
  const appShell = document.getElementById('appShell');
  const sidebar = document.getElementById('sidebar');
  const openSidebar = document.getElementById('openSidebar');
  const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
  const mobileMenuClose = document.getElementById('mobileMenuClose');

  function toggleSidebar() {
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle('open');
    } else {
      appShell.classList.toggle('sidebar-collapsed');
    }
  }

  function closeSidebar() {
    if (window.innerWidth <= 768) {
      sidebar.classList.remove('open');
    } else {
      appShell.classList.add('sidebar-collapsed');
    }
  }

  if (openSidebar) openSidebar.addEventListener('click', toggleSidebar);
  if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeSidebar);
  if (mobileMenuClose) mobileMenuClose.addEventListener('click', closeSidebar);

  // Top Actions
  const notifBtn = document.getElementById('notifBtn');
  if (notifBtn) {
    notifBtn.addEventListener('click', () => {
      showToast('Notifications Active', '3 requests in progress · Next technician visit at 5:30 PM');
    });
  }

  const topAvatar = document.getElementById('topAvatar');
  if (topAvatar) {
    topAvatar.addEventListener('click', () => {
      showToast(state.currentUser.name, `${state.currentRole.toUpperCase()} · Greenview Residency`);
    });
  }

  // Button Ripple Animations
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button, .primary-btn, .secondary-btn, .icon-btn, .filter, .stat-card, .nav-item, .sidebar-toggle-btn');
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });

  // --- 12. FULLY SUBTLE BACKGROUND CANVAS ENGINE --- //
  function initInteractiveBackground() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = 0, height = 0, dpr = 1;

    function resize() {
      dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const mouse = { x: width / 2, y: height / 2, active: false, radius: 150 };
    window.addEventListener('pointermove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    });
    window.addEventListener('pointerleave', () => {
      mouse.active = false;
    });

    const waves = [];
    window.addEventListener('click', (e) => {
      waves.push({
        x: e.clientX,
        y: e.clientY,
        radius: 4,
        maxRadius: Math.max(width, height) * 0.9,
        speed: 6.5,
        amplitude: 22,
        decay: 0.982
      });
    });

    const bgStyleSelect = document.getElementById('bgStyleSelect');
    let currentStyle = localStorage.getItem('jatin_bg_style') || 'subtle-waves';
    if (bgStyleSelect) {
      bgStyleSelect.value = currentStyle;
      bgStyleSelect.addEventListener('change', (e) => {
        currentStyle = e.target.value;
        localStorage.setItem('jatin_bg_style', currentStyle);
        showToast('Background Style', `Switched to ${e.target.options[e.target.selectedIndex].text}`);
      });
    }

    const CONTOUR_COUNT = 7;
    const CONTOUR_POINTS = 28;

    function renderSubtleWaves(scheeleRgb, isDark, time) {
      ctx.lineWidth = 1.0;

      for (let i = 0; i < CONTOUR_COUNT; i++) {
        const yBase = (height / (CONTOUR_COUNT + 1)) * (i + 1);
        const freq = 0.0006 + i * 0.00015;
        const phase = i * 0.9;
        const baseAmp = 12 + i * 3.5;

        ctx.beginPath();
        let first = true;

        for (let j = 0; j <= CONTOUR_POINTS; j++) {
          const bx = (width / CONTOUR_POINTS) * j;
          let by = yBase + Math.sin(time * freq + j * 0.25 + phase) * baseAmp
                         + Math.cos(time * (freq * 0.55) + j * 0.14) * (baseAmp * 0.35);

          if (mouse.active) {
            const dx = bx - mouse.x;
            const dy = by - mouse.y;
            const dist = Math.hypot(dx, dy);
            if (dist < mouse.radius && dist > 0) {
              const force = (1 - dist / mouse.radius);
              by += (dy / dist) * force * 24;
            }
          }

          for (const wave of waves) {
            const dx = bx - wave.x;
            const dy = by - wave.y;
            const dist = Math.hypot(dx, dy);
            const waveDiff = dist - wave.radius;
            if (Math.abs(waveDiff) < 60) {
              const waveRatio = Math.cos((waveDiff / 60) * Math.PI * 0.5);
              by += waveRatio * wave.amplitude * 1.1;
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
          ? (0.10 + (i / CONTOUR_COUNT) * 0.14)
          : (0.08 + (i / CONTOUR_COUNT) * 0.12);
        ctx.strokeStyle = `rgba(${scheeleRgb}, ${opacity})`;
        ctx.stroke();

        if (i % 2 === 1) {
          const markerX = ((i * 180 + time * 0.015) % (width - 120)) + 60;
          const markerY = yBase + Math.sin(time * freq + (markerX / width) * 5.0 + phase) * baseAmp;
          ctx.beginPath();
          ctx.arc(markerX, markerY, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${scheeleRgb}, ${opacity + 0.2})`;
          ctx.fill();
        }
      }
    }

    const SPACING = 38;
    function renderSubtleGrid(scheeleRgb, isDark) {
      const defaultDotColor = isDark ? 'rgba(235, 235, 235, 0.08)' : 'rgba(30, 30, 30, 0.06)';
      const crosshairColor = isDark ? 'rgba(235, 235, 235, 0.15)' : 'rgba(30, 30, 30, 0.12)';
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

          const isMajorNode = (c % 4 === 0 && r % 4 === 0);

          if (intensity > 0.05) {
            const glow = Math.min(1, intensity);
            ctx.beginPath();
            ctx.arc(px, py, 1.4 + glow * 1.0, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${scheeleRgb}, ${0.25 + glow * 0.4})`;
            ctx.fill();
            if (isMajorNode) {
              ctx.strokeStyle = `rgba(${scheeleRgb}, ${0.3 + glow * 0.3})`;
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.moveTo(px - 3, py); ctx.lineTo(px + 3, py);
              ctx.moveTo(px, py - 3); ctx.lineTo(px + 3, py);
              ctx.stroke();
            }
          } else if (isMajorNode) {
            ctx.strokeStyle = crosshairColor;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(px - 2.5, py); ctx.lineTo(px + 2.5, py);
            ctx.moveTo(px, py - 2.5); ctx.lineTo(px + 2.5, py);
            ctx.stroke();
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

    function renderSubtleMesh(scheeleRgb, isDark) {
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
        ctx.fillStyle = `rgba(${scheeleRgb}, ${isDark ? 0.22 : 0.16})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${scheeleRgb}, ${(1 - dist / 90) * 0.08})`;
            ctx.stroke();
          }
        }

        if (mouse.active) {
          const mDist = Math.hypot(p.x - mouse.x, p.y - mouse.y);
          if (mDist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(${scheeleRgb}, ${(1 - mDist / 120) * 0.2})`;
            ctx.stroke();
          }
        }
      }
    }

    function renderMinimalAura(scheeleRgb, isDark) {
      const grad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, Math.max(width, height) * 0.6);
      grad.addColorStop(0, `rgba(${scheeleRgb}, ${isDark ? 0.04 : 0.025})`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    function mainLoop(time) {
      ctx.clearRect(0, 0, width, height);
      const isDark = document.body.classList.contains('dark');
      const scheeleRgb = isDark ? '93, 178, 0' : '68, 128, 0';

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
        ctx.strokeStyle = `rgba(${scheeleRgb}, ${Math.min(0.2, (wave.amplitude / 22) * 0.18)})`;
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }

      if (currentStyle === 'subtle-waves') {
        renderSubtleWaves(scheeleRgb, isDark, time);
      } else if (currentStyle === 'subtle-grid') {
        renderSubtleGrid(scheeleRgb, isDark);
      } else if (currentStyle === 'subtle-mesh') {
        renderSubtleMesh(scheeleRgb, isDark);
      } else if (currentStyle === 'minimal') {
        renderMinimalAura(scheeleRgb, isDark);
      }

      if (mouse.active) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 14, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${scheeleRgb}, 0.22)`;
        ctx.lineWidth = 0.7;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${scheeleRgb}, 0.5)`;
        ctx.fill();
        ctx.restore();
      }

      requestAnimationFrame(mainLoop);
    }
    requestAnimationFrame(mainLoop);
  }
  initInteractiveBackground();

  // Initial Data Load
  await reloadData();
});
