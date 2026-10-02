document.addEventListener('DOMContentLoaded', () => {

    // --- 1. THEME TOGGLE --- //
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        updateThemeIcon();
    });

    function updateThemeIcon() {
        if (document.body.classList.contains('dark')) {
            themeToggle.textContent = '☀️';
            themeToggle.style.transform = "rotate(360deg)";
        } else {
            themeToggle.textContent = '🌙';
            themeToggle.style.transform = "rotate(0deg)";
        }
    }
    updateThemeIcon();


    // --- 2. DYNAMIC DATA RENDERING --- //
    const personaNeeds = ['Clarity', 'Visibility', 'Ownership', 'Timely updates'];
    
    const snapshotData = [
        { label: 'Tech comfort', score: 8, color: 'var(--chart-1)' },
        { label: 'Patience for follow-ups', score: 2, color: 'var(--destructive)' },
        { label: 'Need for transparency', score: 10, color: 'var(--primary)' },
        { label: 'Tolerance for ambiguity', score: 3, color: 'var(--chart-4)' }
    ];

    const painPoints = [
        { icon: "📱", title: "Fragmented reporting", desc: "Different residents use different channels, making requests impossible to consolidate cleanly." },
        { icon: "🔁", title: "Duplicate complaints", desc: "The exact same broken lift is reported by 15 different residents, creating chaos." },
        { icon: "⏰", title: "Weak prioritization", desc: "A massive pipe burst and a cosmetic paint chip enter the exact same communication stream." },
        { icon: "👤", title: "Missing ownership", desc: "Complaints exist in the void without a visible, accountable person assigned to them." }
    ];

    const journeyData = [
        { step: '01', title: 'Problem appears', desc: '🚰 Water leakage starts in the bathroom.' },
        { step: '02', title: 'The Report', desc: '📱 Aarav sends a WhatsApp message with a photo to a noisy group chat.' },
        { step: '03', title: 'The Void', desc: '⏳ No clear acknowledgement, ticket number, or expected resolution time is given.' },
        { step: '04', title: 'The Follow-up', desc: '📞 Aarav gets frustrated and calls the security desk for an update.' },
        { step: '05', title: 'The Fix', desc: '✅ Problem gets fixed randomly — but Aarav has no clear record or notification of it happening.' }
    ];

    const successMetrics = [
        { q: "What is the problem?", a: "Clear description + evidence", icon: "📝" },
        { q: "Where is it?", a: "Exact location", icon: "📍" },
        { q: "Who owns it?", a: "Responsible person/team", icon: "👤" },
        { q: "What happens next?", a: "Visible status / next action", icon: "🔄" }
    ];
    
    // Render Functions
    document.getElementById('persona-needs').innerHTML = personaNeeds.map(need => `<span>${need}</span>`).join('');
    
    document.getElementById('progress-container').innerHTML = snapshotData.map(item => `
        <div class="progress-row">
            <span class="label">${item.label}</span>
            <div class="progress-bar"><div class="fill" data-target="${item.score * 10}%" style="background-color: ${item.color};"></div></div>
            <span class="score">${item.score}/10</span>
        </div>
    `).join('');

    document.getElementById('pain-points-grid').innerHTML = painPoints.map((p, index) => `
        <div class="dynamic-card scroll-anim" data-anim="scale-in" style="transition-delay: ${index * 100}ms;">
            <h4 style="font-size: 1.2rem; margin-bottom: 0.5rem; color: var(--primary);">${p.icon} ${p.title}</h4>
            <p style="color: var(--muted-foreground);">${p.desc}</p>
        </div>
    `).join('');

    document.getElementById('journey-timeline').innerHTML = journeyData.map((j, index) => `
        <div class="journey-step scroll-anim" data-anim="slide-left" style="transition-delay: ${index * 150}ms;">
            <div class="step-num font-mono">STEP ${j.step}</div>
            <h4 style="color: var(--primary); font-size: 1.2rem;">${j.title}</h4>
            <p>${j.desc}</p>
        </div>
    `).join('');

    document.getElementById('success-metrics').innerHTML = successMetrics.map((s, index) => `
        <div class="success-item scroll-anim" data-anim="slide-up" style="transition-delay: ${index * 150}ms;">
            <div class="icon">${s.icon}</div>
            <div>
                <h4 style="color: var(--chart-1); margin-bottom: 0.2rem;">${s.q}</h4>
                <p style="color: var(--muted-foreground);">➔ ${s.a}</p>
            </div>
        </div>
    `).join('');


    // --- 3. FULLY ANIMATED DYNAMICS --- //

    // 3.1 Typewriter Effect for Hero Title
    const titleElement = document.getElementById('typewriter-title');
    const textToType = "Fixing the Fixes";
    let typeIndex = 0;
    
    // Add blinking cursor
    titleElement.innerHTML = `<span class="cursor"></span>`;
    
    function typeWriter() {
        if (typeIndex < textToType.length) {
            // Insert character right before the cursor
            const textNode = document.createTextNode(textToType.charAt(typeIndex));
            titleElement.insertBefore(textNode, titleElement.querySelector('.cursor'));
            typeIndex++;
            setTimeout(typeWriter, 80 + Math.random() * 50); // Natural typing speed
        } else {
            // Typing finished, remove cursor after a few seconds or keep it blinking
            setTimeout(() => {
                const cursor = titleElement.querySelector('.cursor');
                if(cursor) cursor.style.display = 'none';
            }, 3000);
        }
    }
    // Start typing slightly after page load
    setTimeout(typeWriter, 500);

    // 3.2 Dynamic 3D Tilt Effect on Cards
    const interactiveCards = document.querySelectorAll('.interactive-card');
    interactiveCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position within the element.
            const y = e.clientY - rect.top;  // y position within the element.
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Calculate rotation (max 6 degrees for subtlety)
            const rotateX = ((y - centerY) / centerY) * -6;
            const rotateY = ((x - centerX) / centerX) * 6;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            card.style.transition = 'transform 0.1s ease-out';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            card.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
        });
    });

    // 3.3 Dynamic ASCII Animation
    const asciiContainer = document.getElementById('ascii-anim');
    const asciiFrames = [];
    const width = 36;
    const height = 11;
    
    for (let f = 0; f < 30; f++) {
        let frame = "";
        for (let y = 0; y < height; y++) {
            let line = "";
            for (let x = 0; x < width; x++) {
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
        }, 80); 
    }


    // --- 4. ADVANCED INTERSECTION OBSERVER --- //
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                
                // Trigger Progress Bars
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

    console.log("Full dynamic animations, 3D tilt effects, and storytelling layout initialized.");
});
