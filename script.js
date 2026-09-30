document.addEventListener('DOMContentLoaded', () => {

    // --- THEME TOGGLE --- //
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        if (document.body.classList.contains('dark')) {
            themeToggle.textContent = '☀️';
        } else {
            themeToggle.textContent = '🌙';
        }
    });

    // Default is now Light theme, so no .dark class initially
    if (document.body.classList.contains('dark')) {
        themeToggle.textContent = '☀️';
    } else {
        themeToggle.textContent = '🌙';
    }

    // --- ASCII ANIMATION --- //
    const asciiContainer = document.getElementById('ascii-anim');
    const asciiFrames = [];
    const width = 36;
    const height = 11;
    
    // Generate an abstract, dynamic wave animation in ASCII
    for (let f = 0; f < 30; f++) {
        let frame = "";
        for (let y = 0; y < height; y++) {
            let line = "";
            for (let x = 0; x < width; x++) {
                // Math logic for a beautiful sine wave representing 'flow' and 'system integration'
                const waveY = Math.sin((x + f * 1.5) * 0.3) * 3 + (height / 2);
                const dist = Math.abs(y - waveY);
                
                if (dist < 0.5) line += "█";
                else if (dist < 1.2) line += "▓";
                else if (dist < 2.0) line += "▒";
                else if (dist < 3.0) line += "░";
                else line += " ";
            }
            frame += line + "\n";
        }
        asciiFrames.push(frame);
    }

    let currentFrame = 0;
    if (asciiContainer) {
        setInterval(() => {
            asciiContainer.textContent = asciiFrames[currentFrame];
            currentFrame = (currentFrame + 1) % asciiFrames.length;
        }, 100); // 10 FPS
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

    // Render Progress Bars
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
            <h4 style="font-size: 1.2rem; margin-bottom: 0.5rem; color: var(--primary);">${p.icon} ${p.title}</h4>
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
                entry.target.classList.add('is-visible');
                
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

    document.querySelectorAll('.scroll-anim').forEach(el => {
        scrollObserver.observe(el);
    });

    console.log("Dynamic ASCII wave and scroll animations initialized.");
});
