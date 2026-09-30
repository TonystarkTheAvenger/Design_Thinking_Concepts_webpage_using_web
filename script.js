document.addEventListener('DOMContentLoaded', () => {

    // --- THEME TOGGLE --- //
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        // Toggle icon text optionally
        if (document.body.classList.contains('dark')) {
            themeToggle.textContent = '☀️';
        } else {
            themeToggle.textContent = '🌙';
        }
    });

    // Setup initial icon
    if (document.body.classList.contains('dark')) {
        themeToggle.textContent = '☀️';
    } else {
        themeToggle.textContent = '🌙';
    }

    // --- DYNAMIC DATA --- //
    const personaNeeds = ['Clarity', 'Visibility', 'Ownership', 'Timely updates'];
    
    const snapshotData = [
        { label: 'Tech comfort', score: 8, color: 'var(--chart-1)' },
        { label: 'Patience for follow-ups', score: 2, color: 'var(--destructive)' },
        { label: 'Need for transparency', score: 10, color: 'var(--primary)' },
        { label: 'Tolerance for ambiguity', score: 3, color: 'var(--chart-4)' }
    ];

    const painPoints = [
        { icon: "📱", title: "Fragmented reporting", desc: "Different residents use different channels, so requests are difficult to consolidate." },
        { icon: "🔁", title: "Duplicate complaints", desc: "The same broken lift or leaking pipe may be reported by several residents." },
        { icon: "⏰", title: "Weak prioritization", desc: "Urgent issues and cosmetic issues enter the same communication stream." },
        { icon: "👤", title: "Missing ownership", desc: "A complaint can exist without a clearly visible person responsible." },
        { icon: "👀", title: "No status visibility", desc: "Residents cannot tell whether an issue is new, assigned, or resolved." },
        { icon: "📊", title: "No usable history", desc: "Recurring problems are difficult to spot without structured records." }
    ];

    const journeyData = [
        { step: '01', title: 'Problem appears', desc: '🚰 Water leakage starts in the bathroom' },
        { step: '02', title: 'Report', desc: '📱 Aarav sends a WhatsApp message with a photo' },
        { step: '03', title: 'Waiting', desc: '⏳ No clear acknowledgement or expected resolution time' },
        { step: '04', title: 'Follow-up', desc: '📞 Aarav asks the security desk / society office for an update' },
        { step: '05', title: 'Assignment', desc: '🛠️ A maintenance worker is eventually contacted' },
        { step: '06', title: 'Resolution', desc: '✅ Problem gets fixed — but the resident has no clear record' }
    ];

    const successMetrics = [
        { q: "What is the problem?", a: "Clear description + evidence", icon: "📝" },
        { q: "Where is it?", a: "Exact location", icon: "📍" },
        { q: "Who owns it?", a: "Responsible person/team", icon: "👤" },
        { q: "What happens next?", a: "Visible status / next action", icon: "🔄" },
        { q: "When will it be resolved?", a: "Expected timeline or update", icon: "⏳" }
    ];

    // --- DYNAMIC RENDERING --- //
    
    // Render Persona Needs
    document.getElementById('persona-needs').innerHTML = personaNeeds
        .map(need => `<span>${need}</span>`).join('');

    // Render Progress Bars (widths start at 0, filled via Observer)
    const progressHTML = snapshotData.map(item => `
        <div class="progress-row">
            <span class="label">${item.label}</span>
            <div class="progress-bar">
                <div class="fill" data-target="${item.score * 10}%" style="background-color: ${item.color};"></div>
            </div>
            <span class="score">${item.score}/10</span>
        </div>
    `).join('');
    document.getElementById('progress-container').innerHTML = progressHTML;

    // Render Pain Points
    const painHTML = painPoints.map((p, index) => `
        <div class="dynamic-card scroll-anim" data-anim="fade-up" style="transition-delay: ${index * 100}ms;">
            <h4 style="font-size: 1.2rem; margin-bottom: 0.5rem;">${p.icon} ${p.title}</h4>
            <p style="color: var(--muted-foreground);">${p.desc}</p>
        </div>
    `).join('');
    document.getElementById('pain-points-grid').innerHTML = painHTML;

    // Render Journey
    const journeyHTML = journeyData.map((j, index) => `
        <div class="journey-step scroll-anim" data-anim="slide-left" style="transition-delay: ${index * 150}ms;">
            <div class="step-num font-mono">STEP ${j.step}</div>
            <h4 style="color: var(--primary); font-size: 1.2rem;">${j.title}</h4>
            <p>${j.desc}</p>
        </div>
    `).join('');
    document.getElementById('journey-timeline').innerHTML = journeyHTML;

    // Render Success Metrics
    const successHTML = successMetrics.map((s, index) => `
        <div class="success-item scroll-anim" data-anim="scale-in" style="transition-delay: ${index * 100}ms;">
            <div class="icon">${s.icon}</div>
            <div>
                <h4 style="color: var(--chart-1);">${s.q}</h4>
                <p style="color: var(--muted-foreground);">➔ ${s.a}</p>
            </div>
        </div>
    `).join('');
    document.getElementById('success-metrics').innerHTML = successHTML;


    // --- ADVANCED INTERSECTION OBSERVER --- //
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Trigger structural animation
                entry.target.classList.add('is-visible');
                
                // If this is the persona snapshot, trigger the progress bars to fill
                if (entry.target.classList.contains('snapshot-container')) {
                    const fills = entry.target.querySelectorAll('.fill');
                    fills.forEach(fill => {
                        fill.style.width = fill.getAttribute('data-target');
                    });
                }

                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Re-select all elements with scroll-anim class (including newly injected ones)
    document.querySelectorAll('.scroll-anim').forEach(el => {
        scrollObserver.observe(el);
    });

    console.log("Dynamic content rendered, theme toggle initialized, and advanced scroll animations active.");
});
