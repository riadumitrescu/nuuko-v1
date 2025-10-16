// Nuuko - Main JavaScript
// Handles homepage functionality and shared interactions

// === DAILY PROMPTS DATABASE ===
const DAILY_PROMPTS = [
    "what surprised you today?",
    "what made you smile recently?",
    "what are you grateful for right now?",
    "what challenged you today?",
    "what did you learn about yourself?",
    "what moment do you want to remember?",
    "what felt meaningful today?",
    "what are you curious about?",
    "what would you tell your younger self?",
    "what made you feel proud?",
    "what helped you feel calm?",
    "what connection did you make today?",
    "what inspired you recently?",
    "what would you like to let go of?",
    "what are you excited about?",
    "what small joy brightened your day?",
    "what act of kindness touched you?",
    "what made you feel hopeful?",
    "what would you do if you weren't afraid?",
    "what brings you peace?"
];

// === UTILITY FUNCTIONS ===
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    }).toLowerCase();
}

function getEncouragingMessage(entryCount) {
    if (entryCount === 1) return "nice start!";
    if (entryCount < 5) return "you're building a habit";
    if (entryCount < 10) return "look at you go!";
    if (entryCount < 20) return "quite the collection";
    return "you're a journaling pro!";
}

// === STORAGE FUNCTIONS ===
function getEntries() {
    return JSON.parse(localStorage.getItem('nuuko_entries') || '[]');
}

function getStats() {
    return JSON.parse(localStorage.getItem('nuuko_stats') || '{}');
}

function updateStats() {
    const entries = getEntries();
    const stats = {
        totalEntries: entries.length,
        totalWords: entries.reduce((sum, entry) => sum + (entry.wordCount || 0), 0),
        lastEntryDate: entries.length > 0 ? entries[0].createdAt : null,
        daysSinceStart: entries.length > 0 ? Math.floor((Date.now() - new Date(entries[entries.length - 1].createdAt).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0
    };
    
    localStorage.setItem('nuuko_stats', JSON.stringify(stats));
    return stats;
}

// === USER PERSONALIZATION ===
function getUserName() {
    return localStorage.getItem('nuuko_user_name') || 'name';
}

function saveUserName(name) {
    localStorage.setItem('nuuko_user_name', name.toLowerCase());
}

function editUserName() {
    const currentName = getUserName();
    const newName = prompt('What should we call you?', currentName);
    
    if (newName && newName.trim() !== '') {
        const cleanName = newName.trim().toLowerCase();
        saveUserName(cleanName);
        
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = cleanName;
        }
    }
}

// === PROMPT SYSTEM ===
function getCurrentPrompt() {
    return localStorage.getItem('nuuko_current_prompt') || DAILY_PROMPTS[0];
}

function saveCurrentPrompt(prompt) {
    localStorage.setItem('nuuko_current_prompt', prompt);
}

function changePrompt() {
    const currentPrompt = getCurrentPrompt();
    let newPrompt;
    
    // Get a different random prompt
    do {
        newPrompt = DAILY_PROMPTS[Math.floor(Math.random() * DAILY_PROMPTS.length)];
    } while (newPrompt === currentPrompt && DAILY_PROMPTS.length > 1);
    
    // Save the new prompt
    saveCurrentPrompt(newPrompt);
    
    // Update the UI with animation
    const promptElement = document.getElementById('dailyPrompt');
    if (promptElement) {
        promptElement.style.opacity = '0';
        setTimeout(() => {
            promptElement.textContent = newPrompt;
            promptElement.style.opacity = '1';
        }, 150);
    }
    
    // Add a little magic animation to the wand
    const wandElement = document.querySelector('[onclick="changePrompt()"]');
    if (wandElement) {
        wandElement.style.transform = 'scale(1.1) rotate(15deg)';
        setTimeout(() => {
            wandElement.style.transform = 'scale(1) rotate(0deg)';
        }, 200);
    }
}

// === HOMEPAGE FUNCTIONS ===
function initializeHomepage() {
    // Set current month
    const currentMonthElement = document.getElementById('currentMonth');
    if (currentMonthElement) {
        const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
        currentMonthElement.textContent = currentMonth;
    }
    
    // Load user name
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = getUserName();
    }
    
    // Load current prompt
    const promptElement = document.getElementById('dailyPrompt');
    if (promptElement) {
        promptElement.textContent = getCurrentPrompt();
    }
    
    // Load and display library
    loadLibrary();
    
    // Generate calendar
    generateCalendar();
    
    // Update stats display
    updateStatsDisplay();
}

function loadLibrary() {
    const entries = getEntries();
    const libraryContent = document.getElementById('libraryContent');
    
    if (!libraryContent) return;
    
    if (entries.length === 0) {
        // Show empty state
        libraryContent.innerHTML = `
            <div class="card text-center paper-texture" style="padding: 3rem 2rem;">
                <div style="width: 64px; height: 64px; background: linear-gradient(135deg, rgba(107, 143, 113, 0.2) 0%, rgba(154, 107, 81, 0.2) 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; backdrop-filter: blur(8px);">
                    <img src="assets/icons/icon-library.svg" alt="library" style="width: 20px; height: 20px;">
                </div>
                <h3 class="mb-sm">no notes yet — today's a fresh page</h3>
                <p class="mb-lg" style="max-width: 320px; margin-left: auto; margin-right: auto;">your first page is waiting to be written.</p>
                <a href="write.html" class="btn btn-primary">
                    <img src="assets/icons/icon-journal.svg" alt="write" style="width: 16px; height: 16px;">
                    <span>write your first page</span>
                </a>
            </div>
        `;
    } else {
        // Show recent entries in a book-like grid
        const recentEntries = entries.slice(0, 6);
        libraryContent.innerHTML = `
            <div class="grid-3" style="max-width: 1000px; margin: 0 auto;">
                ${recentEntries.map((entry, index) => {
                    const date = formatDate(new Date(entry.createdAt));
                    const preview = entry.content.length > 150 
                        ? entry.content.substring(0, 150) + '...'
                        : entry.content;
                    
                    return `
                        <div class="book-card slide-up" style="animation-delay: ${index * 0.1}s; padding: 1.5rem; cursor: pointer; transition: all 0.3s ease;" onclick="openEntryModal(${entry.id})">
                            <div class="flex items-center justify-between mb-md">
                                <span class="text-sm text-muted" style="font-weight: 500;">${date}</span>
                                ${entry.mood ? `<span style="font-size: 0.75rem; background: rgba(107, 143, 113, 0.1); color: var(--nuuko-green); padding: 0.375rem 0.75rem; border-radius: 12px; border: 1px solid rgba(107, 143, 113, 0.2);">${entry.mood}</span>` : ''}
                            </div>
                            <p style="color: var(--nuuko-espresso); font-size: 1rem; line-height: 1.6; margin-bottom: 0.75rem;">${preview}</p>
                            <div style="font-size: 0.875rem; color: var(--nuuko-stone); font-style: italic;">${entry.wordCount || 0} words</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
}

function generateCalendar() {
    const calendarElement = document.getElementById('calendar');
    if (!calendarElement) return;
    
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const todayDate = today.getDate();
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Get entries for this month
    const entries = getEntries();
    const entriesThisMonth = entries.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        return entryDate.getMonth() === month && entryDate.getFullYear() === year;
    });
    
    const daysWithEntries = new Set(entriesThisMonth.map(entry => 
        new Date(entry.createdAt).getDate()
    ));
    
    let calendarHTML = '';
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        calendarHTML += '<div></div>';
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const hasEntry = daysWithEntries.has(day);
        const isToday = day === todayDate;
        
        let classes = 'calendar-day';
        if (hasEntry) classes += ' active';
        else classes += ' inactive';
        
        let style = '';
        if (isToday) {
            style = 'border: 2px solid var(--nuuko-clay); border-radius: 8px;';
        }
        
        calendarHTML += `<div class="${classes}" style="${style}">${day}</div>`;
    }
    
    // Append calendar days to the existing calendar grid (after day headers)
    calendarElement.innerHTML += calendarHTML;
}

function updateStatsDisplay() {
    const stats = updateStats();
    
    // Update homepage stats
    const daysShowingElement = document.getElementById('daysShowing');
    const pagesWrittenElement = document.getElementById('pagesWritten');
    
    if (daysShowingElement) {
        daysShowingElement.textContent = stats.daysSinceStart || 0;
    }
    
    if (pagesWrittenElement) {
        pagesWrittenElement.textContent = stats.totalEntries || 0;
    }
    
    // Update sidebar stats if they exist (for other pages)
    const streakElements = document.querySelectorAll('[data-stat="streak"]');
    const entriesElements = document.querySelectorAll('[data-stat="entries"]');
    
    streakElements.forEach(el => {
        el.textContent = Math.min(stats.daysSinceStart || 0, stats.totalEntries || 0);
    });
    
    entriesElements.forEach(el => {
        el.textContent = stats.totalEntries || 0;
    });
}

// === ANIMATIONS ===
function addScrollAnimations() {
    // Add intersection observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe all slide-up elements
    document.querySelectorAll('.slide-up').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// === EVENT LISTENERS ===
function addGlobalEventListeners() {
    // Handle storage changes from other tabs
    window.addEventListener('storage', (e) => {
        if (e.key === 'nuuko_entries' || e.key === 'nuuko_stats') {
            // Refresh the current page data
            if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
                loadLibrary();
                generateCalendar();
                updateStatsDisplay();
            }
        }
    });
    
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
        // Quick navigation shortcuts
        if (e.altKey || e.metaKey) {
            switch(e.key) {
                case '1':
                    e.preventDefault();
                    window.location.href = 'index.html';
                    break;
                case '2':
                    e.preventDefault();
                    window.location.href = 'write.html';
                    break;
                case '3':
                    e.preventDefault();
                    window.location.href = 'insights.html';
                    break;
            }
        }
    });
}

// === MODAL FUNCTIONS ===
function openEntryModal(entryId) {
    const entries = getEntries();
    const entry = entries.find(e => e.id === entryId);
    
    if (!entry) return;
    
    const modal = document.getElementById('entryModal');
    const modalDate = document.getElementById('modalDate');
    const modalMood = document.getElementById('modalMood');
    const modalContent = document.getElementById('modalContent');
    const modalStats = document.getElementById('modalStats');
    
    // Populate modal content
    modalDate.textContent = formatDate(new Date(entry.createdAt));
    
    if (entry.mood) {
        modalMood.innerHTML = `<span>${entry.mood}</span>`;
    } else {
        modalMood.innerHTML = '';
    }
    
    modalContent.textContent = entry.content;
    modalStats.textContent = `${entry.wordCount || 0} words • written on ${formatDate(new Date(entry.createdAt))}`;
    
    // Show modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeEntryModal() {
    const modal = document.getElementById('entryModal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

// Initialize modal functionality
function initializeModal() {
    const modal = document.getElementById('entryModal');
    const closeBtn = document.getElementById('closeModal');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeEntryModal);
    }
    
    if (modal) {
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeEntryModal();
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                closeEntryModal();
            }
        });
    }
}

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    // Initialize based on current page
    const path = window.location.pathname;
    
    if (path.includes('index.html') || path === '/' || path === '') {
        initializeHomepage();
        initializeModal();
    }
    
    // Add global functionality
    addScrollAnimations();
    addGlobalEventListeners();
    
    // Add focus states for accessibility
    document.querySelectorAll('.btn, .nav-link, .book-card').forEach(element => {
        element.addEventListener('focus', () => {
            element.style.outline = '2px solid var(--nuuko-green)';
            element.style.outlineOffset = '2px';
        });
        
        element.addEventListener('blur', () => {
            element.style.outline = 'none';
        });
    });
});

// === DEMO DATA (for development) ===
function addDemoData() {
    const demoEntries = [
        {
            id: Date.now() - 86400000 * 3,
            content: "I was walking back from the station, half-lost in thought, when an old man selling herbs on the sidewalk waved at me. He handed me a tiny bag of mint and just said, \"For fresh thoughts.\" No explanation, no sales pitch — just that. I laughed and thanked him, and we talked for five minutes about how mint grows best when you ignore it a little. It reminded me how small kindness can completely snap you out of a loop. I wasn't expecting to feel that grounded just from a plant in a plastic bag.",
            mood: "grateful",
            wordCount: 95,
            createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
        },
        {
            id: Date.now() - 86400000 * 2,
            content: "Coffee shop was packed but I found a tiny corner table. The barista kept making these elaborate latte art designs even though it was chaos. When she handed me mine, it had a little leaf pattern and she whispered \"it's supposed to be good luck.\" Such a small moment but it made the whole morning feel intentional.",
            mood: "calm",
            wordCount: 57,
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
        },
        {
            id: Date.now() - 86400000,
            content: "Tried that new recipe but completely messed up the timing. Everything was either burnt or undercooked. But my roommate came home right when I was about to give up and we just ordered pizza instead. Sometimes the best evenings are the ones that don't go according to plan.",
            mood: "happy",
            wordCount: 52,
            createdAt: new Date(Date.now() - 86400000).toISOString()
        }
    ];
    
    localStorage.setItem('nuuko_entries', JSON.stringify(demoEntries));
    updateStats();
}

// Expose demo function globally for testing
window.addDemoData = addDemoData;
