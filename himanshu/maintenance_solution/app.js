const STORAGE_KEY = "fixflow_v1";
const seedTickets = [
  {id:"FF-1042",title:"Bathroom water leak",category:"Plumbing",location:"8B · Master bathroom",priority:"High",status:"progress",assignee:"Rohit · Plumbing",eta:"Today · 6:30 PM",created:"Today · 10:06 AM",icon:"↯",reportedBy:"Aarav",description:"Water is leaking from the joint below the wash basin. The floor is getting wet.",updates:["Issue reported with photo","Society desk acknowledged the request","Rohit assigned · Plumbing","Technician visit scheduled for 5:30 PM"]},
  {id:"FF-1038",title:"Corridor light not working",category:"Electrical",location:"8th floor · Lift lobby",priority:"Normal",status:"open",assignee:"Unassigned",eta:"By tomorrow",created:"Yesterday · 8:42 PM",icon:"☼",reportedBy:"Aarav",description:"The main corridor light near the lift is not turning on.",updates:["Issue reported","Awaiting assignment"]},
  {id:"FF-1031",title:"Water pressure low",category:"Plumbing",location:"8B · Kitchen",priority:"Normal",status:"progress",assignee:"Sameer · Plumbing",eta:"Tomorrow · 2 PM",created:"Sep 30 · 9:18 AM",icon:"≈",reportedBy:"Aarav",description:"Kitchen tap pressure has been noticeably low for the last two days.",updates:["Issue reported","Maintenance checked pressure","Sameer assigned","Replacement valve requested"]},
  {id:"FF-1024",title:"Parking gate sensor",category:"Security",location:"Basement · Gate B",priority:"Normal",status:"resolved",assignee:"Vikram · Security",eta:"Resolved Sep 28",created:"Sep 27 · 7:02 AM",icon:"▣",reportedBy:"Aarav",description:"Gate B sensor was triggering intermittently.",updates:["Issue reported","Security team assigned","Sensor recalibrated","Resident confirmed fix"]},
  {id:"FF-1019",title:"Staircase tap leaking",category:"Plumbing",location:"Block A · Staircase 3",priority:"Low",status:"resolved",assignee:"Rohit · Plumbing",eta:"Resolved Sep 25",created:"Sep 24 · 1:27 PM",icon:"⌁",reportedBy:"Aarav",description:"Slow leak from the tap beside staircase 3.",updates:["Issue reported","Technician assigned","Washer replaced","Resolved"]}
];
const seedActivity = [
  ["FF-1042","Rohit accepted assignment","12 min ago","↯"],
  ["FF-1042","Society desk acknowledged your request","31 min ago","✓"],
  ["FF-1031","Valve replacement requested","Yesterday","≈"],
  ["FF-1024","You confirmed the parking gate was fixed","Sep 28","✓"],
  ["FF-1019","Request marked resolved","Sep 25","✓"]
];

let tickets = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || seedTickets;
let activity = JSON.parse(localStorage.getItem(STORAGE_KEY+"_activity") || "null") || seedActivity;
let role = "resident";
let listFilter = "all";

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const statusLabel = s => ({open:"Open",progress:"In progress",resolved:"Resolved"}[s] || s);
const save = () => { localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets)); localStorage.setItem(STORAGE_KEY+"_activity", JSON.stringify(activity)); };

function renderStats(){
  const active=tickets.filter(t=>t.status!=="resolved").length, progress=tickets.filter(t=>t.status==="progress").length, resolved=tickets.filter(t=>t.status==="resolved").length;
  $("#statActive").textContent=active; $("#statProgress").textContent=progress; $("#statResolved").textContent=resolved; $("#navCount").textContent=active;
}
function ticketRow(t, compact=false){
  return `<div class="ticket-item" data-id="${t.id}" tabindex="0" role="button" aria-label="Open ${t.title}">
    <div class="ticket-icon">${t.icon}</div>
    <div class="ticket-main"><strong>${t.title}</strong><span>${t.location} · ${t.id}</span><small>${t.assignee==='Unassigned'?'Waiting for assignment':'Owner: '+t.assignee}</small></div>
    ${compact?'':`<span class="assigned">${t.priority==='High'?'⚑ High':'Normal'}</span>`}
    <span class="status ${t.status}">${statusLabel(t.status)}</span>
  </div>`;
}
function renderDashboard(){
  $("#attentionList").innerHTML=tickets.filter(t=>t.status!=="resolved").slice(0,4).map(t=>ticketRow(t,true)).join("") || `<div class="empty">No active requests. Nice. suspiciously nice.</div>`;
  bindTicketClicks();
}
function getFilteredTickets(){
  const q=$("#searchInput")?.value.trim().toLowerCase() || "";
  return tickets.filter(t=>{
    const filterOk=listFilter==='all' || (listFilter==='open'&&t.status==='open') || (listFilter==='progress'&&t.status==='progress') || (listFilter==='resolved'&&t.status==='resolved');
    const searchOk=!q || [t.id,t.title,t.location,t.category,t.assignee].join(" ").toLowerCase().includes(q);
    return filterOk && searchOk;
  });
}
function renderTickets(){
  $("#fullTicketList").innerHTML=getFilteredTickets().map(t=>ticketRow(t,false)).join("") || `<div class="empty">Nothing matches that filter.</div>`;
  bindTicketClicks();
}
function renderActivity(){
  $("#activityList").innerHTML=activity.map(a=>`<div class="activity-entry"><div class="activity-dot">${a[3]}</div><div><strong>${a[1]}</strong><p><b>${a[0]}</b> · ${tickets.find(t=>t.id===a[0])?.title || "Maintenance request"}</p><time>${a[2]}</time></div></div>`).join("");
}
function bindTicketClicks(){ $$(".ticket-item").forEach(el=>{ const go=()=>openTicket(el.dataset.id); el.addEventListener("click",go); el.addEventListener("keydown",e=>{if(e.key==='Enter')go()}); }); }
function refresh(){renderStats();renderDashboard();renderTickets();renderActivity();}
function showView(name){
  $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
  $$(".view").forEach(v=>v.classList.toggle("active",v.id===`view-${name}`));
  $("#pageTitle").textContent={dashboard:"Dashboard",tickets:"My Requests",activity:"Activity"}[name];
  $(".sidebar").classList.remove("open");
}
function toast(title,text){$("#toastTitle").textContent=title;$("#toastText").textContent=text;$("#toast").classList.add("show");clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>$("#toast").classList.remove("show"),3200)}
function closeModal(){$("#modalBackdrop").hidden=true;document.body.style.overflow=""}
function openModal(html){$("#modalContent").innerHTML=html;$("#modalBackdrop").hidden=false;document.body.style.overflow="hidden"}
function openReport(){
  openModal(`<div class="modal-inner"><p class="eyebrow">NEW MAINTENANCE REQUEST</p><h2>What needs fixing?</h2><p class="modal-sub">Give the team enough context to solve it without asking you the same questions again.</p>
  <form id="reportForm"><div class="form-grid">
    <div class="field full"><label>Issue title</label><input name="title" required maxlength="70" placeholder="e.g. Bathroom water leak"></div>
    <div class="field"><label>Category</label><select name="category"><option>Plumbing</option><option>Electrical</option><option>Security</option><option>Lift</option><option>Cleaning</option><option>Other</option></select></div>
    <div class="field"><label>Exact location</label><input name="location" required placeholder="e.g. 8B · Kitchen"></div>
    <div class="field full"><label>How urgent is it?</label><div class="priority-row">
      <div class="priority-option"><input id="pNormal" type="radio" name="priority" value="Normal" checked><label for="pNormal">Normal</label></div>
      <div class="priority-option"><input id="pHigh" type="radio" name="priority" value="High"><label for="pHigh">⚑ High</label></div>
    </div></div>
    <div class="field full"><label>Describe the problem</label><textarea name="description" required placeholder="What happened? When did you notice it? Any useful details?"></textarea></div>
    <div class="field full"><label>Photo / evidence</label><label class="file-input">📎 <span id="fileName">Attach a photo (optional)</span><input id="evidence" type="file" accept="image/*"></label></div>
  </div><div class="modal-footer"><button type="button" class="secondary-btn" id="cancelReport">Cancel</button><button type="submit" class="primary-btn">Submit request</button></div></form></div>`);
  $("#cancelReport").onclick=closeModal; $("#evidence").onchange=e=>{ $("#fileName").textContent=e.target.files[0]?.name||"Attach a photo (optional)" };
  $("#reportForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);const id="FF-"+(1043+Math.floor(Math.random()*900));const t={id,title:f.get("title"),category:f.get("category"),location:f.get("location"),priority:f.get("priority"),status:"open",assignee:"Unassigned",eta:"Pending assignment",created:"Just now",icon:{Plumbing:"↯",Electrical:"☼",Security:"▣",Lift:"↕",Cleaning:"✦",Other:"•"}[f.get("category")],reportedBy:"Aarav",description:f.get("description"),updates:["Issue reported","Awaiting acknowledgement / assignment"]};tickets.unshift(t);activity.unshift([id,"You reported a new maintenance issue","Just now",t.icon]);save();refresh();closeModal();toast("Request submitted",`${id} is now in the queue.`);showView("tickets")};
}
function openTicket(id){
  const t=tickets.find(x=>x.id===id); if(!t)return;
  const events=t.updates.map((u,i)=>`<div class="detail-event ${i<t.updates.length-1?'done':''} ${i===t.updates.length-1&&t.status!=='resolved'?'current':''}"><strong>${u}</strong><p>${i===0?t.created:i===t.updates.length-1?t.eta:'Update recorded'}</p></div>`).join("");
  const managerControls=role!=='resident'?`<div class="staff-controls"><label>Workflow action</label><div class="inline"><select id="statusAction"><option value="open" ${t.status==='open'?'selected':''}>Open</option><option value="progress" ${t.status==='progress'?'selected':''}>In progress</option><option value="resolved" ${t.status==='resolved'?'selected':''}>Resolved</option></select><input id="assigneeAction" value="${t.assignee==='Unassigned'?'':t.assignee}" placeholder="Assign owner"></div><button class="primary-btn" id="saveTicketAction" style="margin-top:8px">Update request</button></div>`:'';
  const residentConfirm=t.status==='progress'?`<div class="modal-footer"><button class="primary-btn" id="confirmResolved">✓ Confirm issue is fixed</button></div>`:'';
  openModal(`<div class="modal-inner"><div style="display:flex;justify-content:space-between;gap:15px;align-items:start"><div><span class="status ${t.status}">${statusLabel(t.status)}</span><h2 style="margin-top:10px">${t.title}</h2><p class="modal-sub">${t.id} · ${t.category}</p></div><span class="status ${t.priority==='High'?'open':'progress'}">${t.priority==='High'?'⚑ High':'Normal'}</span></div>
  <p style="font-size:12px;line-height:1.6;color:#4e5d58">${t.description}</p><div class="detail-grid"><div class="detail-box"><span>LOCATION</span><strong>${t.location}</strong></div><div class="detail-box"><span>OWNER</span><strong>${t.assignee}</strong></div><div class="detail-box"><span>NEXT ACTION</span><strong>${t.status==='resolved'?'No action needed':'Technician / society team'}</strong></div><div class="detail-box"><span>EXPECTED</span><strong>${t.eta}</strong></div></div><div class="detail-timeline">${events}</div>${residentConfirm}${managerControls}</div>`);
  $("#confirmResolved")?.addEventListener("click",()=>{t.status='resolved';t.eta='Resolved just now';t.updates.push('Resident confirmed the fix');activity.unshift([t.id,'You confirmed the issue was fixed','Just now','✓']);save();refresh();closeModal();toast('Issue closed','Nice — the loop is officially closed.');});
  $("#saveTicketAction")?.addEventListener("click",()=>{const old=t.status;t.status=$("#statusAction").value;t.assignee=$("#assigneeAction").value.trim()||"Unassigned";t.updates.push(`${statusLabel(t.status)} · ${t.assignee}`);activity.unshift([t.id,`${statusLabel(t.status)} update recorded`, 'Just now','↻']);save();refresh();closeModal();toast('Request updated',`${t.id} is now ${statusLabel(t.status).toLowerCase()}.`);});
}

$$(".nav-item").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
$$("[data-go]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.go)));
$("#reportBtn").onclick=openReport; $("#reportBtn2").onclick=openReport;
$("#modalClose").onclick=closeModal; $("#modalBackdrop").addEventListener("click",e=>{if(e.target.id==='modalBackdrop')closeModal()});
document.addEventListener("keydown",e=>{if(e.key==='Escape')closeModal()});
$("#searchInput").addEventListener("input",renderTickets);
$$(".filter").forEach(b=>b.addEventListener("click",()=>{$$(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");listFilter=b.dataset.listFilter;renderTickets()}));
$$(".stat-card[data-filter]").forEach(b=>b.addEventListener("click",()=>{showView('tickets');const f=b.dataset.filter;listFilter=f==='active'?'open':f;$$(".filter").forEach(x=>x.classList.toggle("active",x.dataset.listFilter===listFilter));renderTickets()}));
$("#openSidebar").onclick=()=>$(".sidebar").classList.add("open"); $("#mobileMenuBtn").onclick=()=>$(".sidebar").classList.remove("open");
$("#notifBtn").onclick=()=>toast('All caught up','Latest update: Rohit is handling FF-1042.');
$("#roleSelect").onchange=e=>{role=e.target.value;document.body.classList.toggle('role-manager',role!=='resident');toast('Role switched',role==='resident'?'Resident view':'Team controls enabled');};

refresh();
