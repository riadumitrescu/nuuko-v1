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

const SUMMARY_DEFAULT_WINDOW_DAYS = 7;
const SUMMARY_MONTH_WINDOW_DAYS = 30;
const SUMMARY_YEAR_WINDOW_DAYS = 365;
const SUMMARY_ENTRY_LIMIT = 12;
let pendingSummaryContext = null;
let summaryToastTimeout = null;

function getSummaryCadenceSetting() {
    const settings = window.NuukoStorage ? NuukoStorage.getSettingsSnapshot() : {};
    return settings.summaryCadence || 'weekly';
}

function showSummaryToast(message) {
    const toast = document.getElementById('summaryToast');
    const textEl = document.getElementById('summaryToastText');
    if (!toast || !textEl) return;
    textEl.textContent = message || 'your reflections are ready';
    toast.classList.remove('hidden');
    toast.style.opacity = '1';
    clearTimeout(summaryToastTimeout);
    summaryToastTimeout = setTimeout(() => {
        toast.style.opacity = '0';
        summaryToastTimeout = setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3800);
}

function formatRangeLabel(start, end) {
    if (!start || !end) return 'your reflections';
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return 'your reflections';
    }
    const sameMonth = startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear();
    if (sameMonth) {
        return `${startDate.toLocaleString('en-US', { month: 'long' })} reflections`;
    }
    return `${startDate.toLocaleString('en-US', { month: 'short', day: 'numeric' })} – ${endDate.toLocaleString('en-US', { month: 'short', day: 'numeric' })}`;
}

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
    if (!window.NuukoStorage) return [];
    return NuukoStorage.getEntriesSnapshot();
}

function getStats() {
    if (!window.NuukoStorage) return {};
    return NuukoStorage.getStatsSnapshot();
}

function updateStats() {
    if (!window.NuukoStorage || typeof NuukoStorage.recalculateStats !== 'function') {
        return Promise.resolve(getStats());
    }
    return NuukoStorage.recalculateStats();
}

// === USER PERSONALIZATION ===
function getUserName() {
    if (!window.NuukoStorage) {
        return localStorage.getItem('nuuko_user_name') || 'name';
    }
    return NuukoStorage.getSettingsSnapshot().userName || 'name';
}

function saveUserName(name) {
    if (!window.NuukoStorage) {
        localStorage.setItem('nuuko_user_name', name.toLowerCase());
        return;
    }
    NuukoStorage.updateSettings({ userName: name.toLowerCase() });
}

function refreshUserNameDisplay() {
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = getUserName();
    }
}

function editUserName() {
    const currentName = getUserName();
    const newName = prompt('What should we call you?', currentName);
    
    if (newName && newName.trim() !== '') {
        const cleanName = newName.trim().toLowerCase();
        saveUserName(cleanName);
        refreshUserNameDisplay();
    }
}

// === PROMPT SYSTEM ===
function getCurrentPrompt() {
    if (!window.NuukoStorage) {
        return localStorage.getItem('nuuko_current_prompt') || DAILY_PROMPTS[0];
    }
    return NuukoStorage.getSettingsSnapshot().currentPrompt || DAILY_PROMPTS[0];
}

function saveCurrentPrompt(prompt) {
    if (!window.NuukoStorage) {
        localStorage.setItem('nuuko_current_prompt', prompt);
        return;
    }
    NuukoStorage.updateSettings({ currentPrompt: prompt });
}

function updatePromptDisplays(promptText, { animateHome = true, animateWrite = false } = {}) {
    const homePrompt = document.getElementById('dailyPrompt');
    if (homePrompt) {
        if (animateHome) {
            homePrompt.style.opacity = '0';
            setTimeout(() => {
                homePrompt.textContent = promptText;
                homePrompt.style.opacity = '1';
            }, 150);
        } else {
            homePrompt.textContent = promptText;
        }
    }

    const writePrompt = document.getElementById('writePagePrompt');
    if (writePrompt) {
        if (animateWrite) {
            writePrompt.style.opacity = '0';
            setTimeout(() => {
                writePrompt.textContent = promptText;
                writePrompt.style.opacity = '1';
            }, 120);
        } else {
            writePrompt.textContent = promptText;
        }
    }

    const editorInput = document.getElementById('promptEditInput');
    if (editorInput && document.activeElement !== editorInput) {
        editorInput.value = promptText;
    }
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
    updatePromptDisplays(newPrompt, { animateHome: true, animateWrite: true });
    cancelPromptEdit(false);
    
    // Add a little magic animation to the wand
    const wandElement = document.querySelector('[onclick="changePrompt()"]');
    if (wandElement) {
        wandElement.style.transform = 'scale(1.1) rotate(15deg)';
        setTimeout(() => {
            wandElement.style.transform = 'scale(1) rotate(0deg)';
        }, 200);
    }
}

function startPromptEdit() {
    const editor = document.getElementById('promptEditor');
    const input = document.getElementById('promptEditInput');
    if (!editor || !input) return;
    input.value = getCurrentPrompt();
    editor.classList.remove('hidden');
    setTimeout(() => input.focus(), 50);
}

function cancelPromptEdit(resetValue = true) {
    const editor = document.getElementById('promptEditor');
    const input = document.getElementById('promptEditInput');
    if (!editor || !input) return;
    editor.classList.add('hidden');
    if (resetValue) {
        input.value = getCurrentPrompt();
    }
}

function savePromptEdit() {
    const input = document.getElementById('promptEditInput');
    if (!input) return;
    const nextPrompt = input.value.trim();
    if (!nextPrompt) {
        alert('Write a prompt or cancel editing.');
        return;
    }
    saveCurrentPrompt(nextPrompt);
    updatePromptDisplays(nextPrompt, { animateHome: false });
    cancelPromptEdit(false);
}

function togglePromptSection(show) {
    const section = document.getElementById('promptSection');
    const notice = document.getElementById('promptHiddenNotice');
    if (!section || !notice) return;
    if (show) {
        section.classList.remove('hidden');
        notice.classList.add('hidden');
    } else {
        section.classList.add('hidden');
        notice.classList.remove('hidden');
    }
}

function dismissPromptSection() {
    togglePromptSection(false);
}

function restorePromptSection() {
    togglePromptSection(true);
}

window.startPromptEdit = startPromptEdit;
window.cancelPromptEdit = () => cancelPromptEdit(true);
window.savePromptEdit = savePromptEdit;
window.dismissPromptSection = dismissPromptSection;
window.restorePromptSection = restorePromptSection;

function initializeWritePromptCard() {
    const promptText = getCurrentPrompt();
    updatePromptDisplays(promptText, { animateHome: false });
    cancelPromptEdit(false);
}

// === ENTRY HELPERS ===
function sortEntriesByDate(entries, order = 'desc') {
    const sortedEntries = [...entries];
    sortedEntries.sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return order === 'asc' ? timeA - timeB : timeB - timeA;
    });
    return sortedEntries;
}

function getEntryPreview(content = '', maxLength = 130) {
    if (!content) return '';
    return content.length > maxLength ? `${content.substring(0, maxLength)}...` : content;
}

function renderBookPage(entry, side, options = {}) {
    if (!entry) return renderBlankPage(side);
    
    const { previewLength = 130 } = options;
    const entryDate = entry.createdAt ? new Date(entry.createdAt) : new Date();
    const formattedDate = entryDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const preview = getEntryPreview(entry.content, previewLength);
    const moodBadge = entry.mood ? `<span class="book-page-mood">${entry.mood}</span>` : '';
    
    return `
        <div class="book-page book-page--${side} slide-up" style="animation-delay: var(--book-delay);" role="button" tabindex="0" data-entry-id="${entry.id}" aria-label="open entry from ${formattedDate}">
            <div class="book-page-header">
                <span class="book-page-date">${formattedDate}</span>
                ${moodBadge}
            </div>
            <p class="book-page-preview">${preview}</p>
            <div class="book-page-footer">${entry.wordCount || 0} words</div>
        </div>
    `;
}

function renderBlankPage(side) {
    return `
        <div class="book-page book-page--${side} book-page--empty slide-up" style="animation-delay: var(--book-delay);" aria-hidden="true">
            <span class="empty-text">blank page</span>
        </div>
    `;
}

function createBookShelfMarkup(entries, options = {}) {
    const {
        limit = null,
        animationStep = 0.12,
        previewLength = 130,
        fillEmpty = true
    } = options;
    
    const workingEntries = typeof limit === 'number' ? [...entries].slice(0, limit) : [...entries];
    
    if (workingEntries.length === 0) {
        return '';
    }
    
    const booksMarkup = [];
    for (let i = 0; i < workingEntries.length; i += 2) {
        const bookIndex = Math.floor(i / 2);
        const leftEntry = workingEntries[i];
        const rightEntry = workingEntries[i + 1];
        
        booksMarkup.push(`
            <div class="book-open" style="--book-delay: ${bookIndex * animationStep}s;">
                ${renderBookPage(leftEntry, 'left', { previewLength })}
                <div class="book-spine" aria-hidden="true"></div>
                ${rightEntry ? renderBookPage(rightEntry, 'right', { previewLength }) : (fillEmpty ? renderBlankPage('right') : '')}
            </div>
        `);
    }
    
    return `
        <div class="library-shelf">
            ${booksMarkup.join('')}
        </div>
    `;
}

function initializeBookPageInteractions(rootElement) {
    if (!rootElement) return;
    
    const pages = rootElement.querySelectorAll('.book-page[data-entry-id]');
    pages.forEach(page => {
        if (page.dataset.bookPageReady === 'true') return;
        
        const handleActivation = () => {
            handleBookPageActivation(page);
        };
        
        page.addEventListener('click', handleActivation);
        page.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleActivation();
            }
        });
        
        applyFocusStyles([page]);
        page.dataset.bookPageReady = 'true';
    });
}

function handleBookPageActivation(pageElement) {
    if (!pageElement || !pageElement.dataset.entryId) return;
    
    const rawId = pageElement.dataset.entryId;
    const numericId = Number(rawId);
    const entryId = Number.isNaN(numericId) ? rawId : numericId;
    
    if (pageElement.closest('#libraryModal')) {
        closeLibraryModal(false);
    }
    
    openEntryModal(entryId);
}

function applyFocusStyles(elements) {
    if (!elements) return;
    
    const items = Array.from(elements);
    items.forEach(element => {
        if (!element || element.dataset.focusBound === 'true') return;
        
        element.addEventListener('focus', () => {
            element.style.outline = '2px solid var(--nuuko-green)';
            element.style.outlineOffset = '2px';
        });
        
        element.addEventListener('blur', () => {
            element.style.outline = 'none';
        });
        
        element.dataset.focusBound = 'true';
    });
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
    refreshUserNameDisplay();
    
    // Load current prompt
    const promptElement = document.getElementById('dailyPrompt');
    if (promptElement) {
        promptElement.textContent = getCurrentPrompt();
    }
    
    // Load and display library
    loadLibrary();
    
    const seeAllButton = document.getElementById('seeAllEntries');
    if (seeAllButton) {
        seeAllButton.addEventListener('click', (event) => {
            event.preventDefault();
            openLibraryModal();
        });
    }
    
    // Generate calendar
    renderCalendar();

    // Calendar controls
    document.getElementById('calendarPrev')?.addEventListener('click', () => {
        calendarState.month -= 1;
        if (calendarState.month < 0) {
            calendarState.month = 11;
            calendarState.year -= 1;
        }
        calendarState.view = 'month';
        renderCalendar();
    });
    document.getElementById('calendarNext')?.addEventListener('click', () => {
        calendarState.month += 1;
        if (calendarState.month > 11) {
            calendarState.month = 0;
            calendarState.year += 1;
        }
        calendarState.view = 'month';
        renderCalendar();
    });
    document.getElementById('calendarToday')?.addEventListener('click', () => {
        const now = new Date();
        calendarState.year = now.getFullYear();
        calendarState.month = now.getMonth();
        calendarState.view = 'month';
        renderCalendar();
    });
    document.getElementById('calendarYearView')?.addEventListener('click', () => {
        calendarState.view = calendarState.view === 'year' ? 'month' : 'year';
        renderCalendar();
    });
    
    // Update stats display
    updateStatsDisplay();
}

function loadLibrary() {
    // Show only the two most recent entries, newest first
    const entries = sortEntriesByDate(getEntries(), 'desc').slice(0, 2);
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
        libraryContent.innerHTML = createBookShelfMarkup(entries, {
            limit: 2,
            animationStep: 0.12,
            previewLength: 130,
            fillEmpty: false
        });
        initializeBookPageInteractions(libraryContent);
    }
}

const calendarState = {
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    view: 'month'
};

function renderCalendar() {
    if (calendarState.view === 'year') {
        renderYearCalendar();
    } else {
        renderMonthCalendar();
    }
}

function renderMonthCalendar() {
    const calendarElement = document.getElementById('calendar');
    const monthLabel = document.getElementById('currentMonth');
    const yearLabel = document.getElementById('currentYearLabel');
    if (!calendarElement || !monthLabel || !yearLabel) return;
    
    const month = calendarState.month;
    const year = calendarState.year;
    const today = new Date();
    const isThisMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDate = today.getDate();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const entries = getEntries();
    const entriesThisMonth = entries.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        return entryDate.getMonth() === month && entryDate.getFullYear() === year;
    });
    
    const daysWithEntries = new Set(entriesThisMonth.map(entry => new Date(entry.createdAt).getDate()));
    
    let calendarHTML = '';
    for (let i = 0; i < firstDay; i++) {
        calendarHTML += '<div></div>';
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const hasEntry = daysWithEntries.has(day);
        const isToday = isThisMonth && day === todayDate;
        let classes = 'calendar-day';
        classes += hasEntry ? ' active' : ' inactive';
        const style = isToday ? 'border: 1px solid var(--nuuko-clay);' : '';
        calendarHTML += `<div class="${classes}" style="${style}">${day}</div>`;
    }
    
    const headers = ['s', 'm', 't', 'w', 't', 'f', 's']
        .map(letter => `<div class="text-center text-sm" style="color: var(--nuuko-stone); padding: 0.25rem 0; font-weight: 600;">${letter}</div>`)
        .join('');
    
    monthLabel.textContent = new Date(year, month, 1).toLocaleString('en-US', { month: 'long' }).toLowerCase();
    yearLabel.textContent = year;
    calendarElement.classList.remove('calendar--year');
    calendarElement.innerHTML = headers + calendarHTML;
}

function renderYearCalendar() {
    const calendarElement = document.getElementById('calendar');
    const monthLabel = document.getElementById('currentMonth');
    const yearLabel = document.getElementById('currentYearLabel');
    if (!calendarElement || !monthLabel || !yearLabel) return;
    
    const year = calendarState.year;
    const entries = getEntries();
    monthLabel.textContent = 'year view';
    yearLabel.textContent = year;
    calendarElement.classList.add('calendar--year');
    
    const monthsMarkup = Array.from({ length: 12 }).map((_, idx) => {
        const monthEntries = entries.filter(entry => {
            const d = new Date(entry.createdAt);
            return d.getFullYear() === year && d.getMonth() === idx;
        });
        const uniqueDays = new Set(monthEntries.map(entry => new Date(entry.createdAt).getDate()));
        const title = new Date(year, idx, 1).toLocaleString('en-US', { month: 'short' });
        return `
            <button class="year-month-card" data-month="${idx}">
                <div class="year-month-title">${title}</div>
                <div class="year-month-count">${uniqueDays.size} days</div>
            </button>
        `;
    }).join('');
    
    calendarElement.innerHTML = monthsMarkup;
    
    calendarElement.querySelectorAll('.year-month-card').forEach((btn) => {
        btn.addEventListener('click', () => {
            const month = Number(btn.dataset.month);
            calendarState.month = Number.isNaN(month) ? calendarState.month : month;
            calendarState.view = 'month';
            renderCalendar();
        });
    });
}

function updateStatsDisplay(options = {}) {
    const render = (stats) => {
        const safeStats = stats || {};
        const daysShowingElement = document.getElementById('daysShowing');
        const pagesWrittenElement = document.getElementById('pagesWritten');
        
        if (daysShowingElement) {
            daysShowingElement.textContent = safeStats.daysSinceStart || 0;
        }
        
        if (pagesWrittenElement) {
            pagesWrittenElement.textContent = safeStats.totalEntries || 0;
        }
        
        const streakElements = document.querySelectorAll('[data-stat="streak"]');
        const entriesElements = document.querySelectorAll('[data-stat="entries"]');
        
        streakElements.forEach(el => {
            el.textContent = Math.min(safeStats.daysSinceStart || 0, safeStats.totalEntries || 0);
        });
        
        entriesElements.forEach(el => {
            el.textContent = safeStats.totalEntries || 0;
        });
    };
    
    if (options.refresh) {
        updateStats().then(render);
        return;
    }
    
    render(getStats());
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
    const handleDataRefresh = () => {
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            loadLibrary();
            renderCalendar();
            updateStatsDisplay();
        }
    };
    
    // Handle storage changes from other tabs
    window.addEventListener('storage', (e) => {
        if (e.key === 'nuuko_entries' || e.key === 'nuuko_stats') {
            // Refresh the current page data
            if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
                loadLibrary();
                renderCalendar();
                updateStatsDisplay();
            }
        }
    });
    
    window.addEventListener('nuuko:storage', (event) => {
        const type = event?.detail?.type;
        if (type === 'settings') {
            refreshUserNameDisplay();
            const promptElement = document.getElementById('dailyPrompt');
            if (promptElement) {
                promptElement.textContent = getCurrentPrompt();
            }
            refreshSummaryCardState();
            syncSummarySettingsControls();
        }
        
        if (type === 'entries' || type === 'stats') {
            handleDataRefresh();
            refreshSummaryCardState();
        }
        
        if (type === 'summaries') {
            refreshSummaryCardState();
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

function syncSummarySettingsControls() {
    const toggleGroup = document.getElementById('cadenceToggleGroup');
    if (!toggleGroup) return;
    const cadence = getSummaryCadenceSetting();
    toggleGroup.querySelectorAll('.cadence-toggle').forEach((button) => {
        const isActive = button.dataset.cadence === cadence;
        button.classList.toggle('active', isActive);
        button.style.background = isActive ? 'rgba(107, 143, 113, 0.15)' : '';
        button.style.borderColor = isActive ? 'rgba(107, 143, 113, 0.35)' : '';
        button.style.color = isActive ? 'var(--nuuko-espresso)' : '';
    });
    const status = document.getElementById('insightsCadenceStatus');
    if (status) {
        if (cadence === 'manual') {
            status.textContent = 'nuuko will summarize whenever you tap generate.';
        } else {
            status.textContent = `nuuko will summarize every ${cadence}.`;
        }
    }
}

// === MODAL FUNCTIONS ===
function openLibraryModal() {
    const modal = document.getElementById('libraryModal');
    const content = document.getElementById('libraryModalContent');
    
    if (!modal || !content) return;
    
    const entries = sortEntriesByDate(getEntries(), 'desc');
    
    if (entries.length === 0) {
        content.innerHTML = `
            <div class="library-empty-state">
                <span class="empty-icon" aria-hidden="true">🪶</span>
                <p>no notes yet — today's a fresh page</p>
            </div>
        `;
    } else {
        content.innerHTML = createBookShelfMarkup(entries, {
            animationStep: 0.08,
            previewLength: 180,
            fillEmpty: true
        });
        initializeBookPageInteractions(content);
    }
    
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    const closeBtn = document.getElementById('closeLibraryModal');
    if (closeBtn) {
        closeBtn.focus();
    }
}

function closeLibraryModal(restoreFocus = true) {
    const modal = document.getElementById('libraryModal');
    if (!modal) return;
    
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    
    const modalBody = modal.querySelector('.modal-body');
    if (modalBody) {
        modalBody.scrollTop = 0;
    }
    
    const entryModal = document.getElementById('entryModal');
    if (!entryModal || entryModal.classList.contains('hidden')) {
        document.body.style.overflow = '';
    }
    
    if (restoreFocus) {
        const triggerButton = document.getElementById('seeAllEntries');
        if (triggerButton) {
            triggerButton.focus();
        }
    }
}

function openEntryModal(entryId) {
    const entries = getEntries();
    const entry = entries.find(e => String(e.id) === String(entryId));
    
    if (!entry) return;
    
    const modal = document.getElementById('entryModal');
    const modalDate = document.getElementById('modalDate');
    const modalMood = document.getElementById('modalMood');
    const modalContent = document.getElementById('modalContent');
    const modalStats = document.getElementById('modalStats');
    const modalTags = document.getElementById('modalTags');
    
    // Populate modal content
    modalDate.textContent = formatDate(new Date(entry.createdAt));
    if (modal?.dataset) {
        modal.dataset.entryId = entry.id;
    }
    
    if (entry.mood) {
        modalMood.innerHTML = `<span>${entry.mood}</span>`;
    } else {
        modalMood.innerHTML = '';
    }
    
    modalContent.textContent = entry.content;
    
    if (modalTags) {
        if (Array.isArray(entry.tags) && entry.tags.length > 0) {
            modalTags.innerHTML = `
                <div style="display: flex; flex-wrap: wrap; gap: 0.35rem;">
                    ${entry.tags.map(tag => `<span style="background: rgba(107, 143, 113, 0.15); color: var(--nuuko-green); padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.75rem;">${tag}</span>`).join('')}
                </div>
            `;
        } else {
            modalTags.innerHTML = '';
        }
    }
    
    const summaryNote = entry.includeInSummaries === false
        ? 'kept out of AI summaries'
        : 'included in AI summaries';
    modalStats.textContent = `${entry.wordCount || 0} words • written on ${formatDate(new Date(entry.createdAt))} • ${summaryNote}`;
    
    // Show modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeEntryModal() {
    const modal = document.getElementById('entryModal');
    modal.classList.add('hidden');
    if (modal?.dataset) {
        modal.dataset.entryId = '';
    }
    
    const libraryModal = document.getElementById('libraryModal');
    if (!libraryModal || libraryModal.classList.contains('hidden')) {
        document.body.style.overflow = '';
    }
}

// Initialize modal functionality
function initializeModal() {
    const modal = document.getElementById('entryModal');
    const closeBtn = document.getElementById('closeModal');
    const libraryModal = document.getElementById('libraryModal');
    const closeLibraryBtn = document.getElementById('closeLibraryModal');
    const modalEditButton = document.getElementById('modalEditButton');
    const modalDeleteButton = document.getElementById('modalDeleteButton');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeEntryModal);
    }
    
    if (closeLibraryBtn) {
        closeLibraryBtn.addEventListener('click', () => closeLibraryModal());
    }
    
    if (modal) {
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeEntryModal();
            }
        });
    }
    
    if (libraryModal) {
        libraryModal.addEventListener('click', (e) => {
            if (e.target === libraryModal) {
                closeLibraryModal();
            }
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        
        if (libraryModal && !libraryModal.classList.contains('hidden')) {
            closeLibraryModal();
        }
        
        if (modal && !modal.classList.contains('hidden')) {
            closeEntryModal();
        }
    });
    
    if (modalEditButton) {
        modalEditButton.addEventListener('click', () => {
            const entryId = modal?.dataset?.entryId;
            if (!entryId) return;
            window.location.href = `write.html?entryId=${entryId}`;
        });
    }
    
    if (modalDeleteButton) {
        modalDeleteButton.addEventListener('click', async () => {
            const entryId = modal?.dataset?.entryId;
            if (!entryId) return;
            const confirmed = confirm('Delete this entry? This cannot be undone.');
            if (!confirmed) return;
            
            try {
                if (window.NuukoStorage) {
                    await NuukoStorage.deleteEntry(entryId);
                } else {
                    const existing = JSON.parse(localStorage.getItem('nuuko_entries') || '[]')
                        .filter(entry => String(entry.id) !== String(entryId));
                    localStorage.setItem('nuuko_entries', JSON.stringify(existing));
                }
                closeEntryModal();
                loadLibrary();
                renderCalendar();
                updateStatsDisplay({ refresh: true });
            } catch (error) {
                console.error('[Nuuko] failed to delete entry', error);
                alert('we could not delete that entry. please try again.');
            }
        });
    }
}

// === SUMMARY FUNCTIONS ===
function initializeSummaryCard() {
    const card = document.getElementById('summaryCard');
    if (!card || !window.NuukoSummaryService) return;
    const shareButton = document.getElementById('summaryShareButton');
    const consentClose = document.getElementById('closeSummaryConsentModal');
    const consentCancel = document.getElementById('summaryConsentCancel');
    const consentConfirm = document.getElementById('summaryConsentConfirm');

    shareButton?.addEventListener('click', () => openSummaryConsentFlow('home'));
    consentClose?.addEventListener('click', closeSummaryConsentModal);
    consentCancel?.addEventListener('click', closeSummaryConsentModal);
    consentConfirm?.addEventListener('click', handleSummaryGeneration);

    refreshSummaryCardState();
}

function refreshSummaryCardState() {
    const lastRunElement = document.getElementById('summaryLastRun');
    const eligibleElement = document.getElementById('summaryEligibleCount');
    const shareButton = document.getElementById('summaryShareButton');
    const shareSpinner = document.getElementById('summaryShareSpinner');
    const shareText = document.getElementById('summaryShareButtonText');
    const latestSummary = window.NuukoStorage?.getSummariesSnapshot()?.[0] || null;
    const cadenceLabel = document.getElementById('summaryCadenceLabel');
    const context = buildSummaryContext({ allowEmpty: true, skipStatus: true });
    const eligibleCount = context?.entries?.length || 0;
    const cadence = getSummaryCadenceSetting();

    if (lastRunElement) {
        lastRunElement.textContent = latestSummary
            ? `last summary on ${formatReadableDate(latestSummary.createdAt)}`
            : 'no summaries yet';
    }

    if (cadenceLabel) {
        const labelMap = {
            manual: 'manual cadence (only when you tap share)',
            weekly: 'weekly cadence',
            monthly: 'monthly cadence',
            yearly: 'yearly cadence'
        };
        cadenceLabel.textContent = labelMap[cadence] || `${cadence} cadence`;
    }

    if (eligibleElement) {
        eligibleElement.textContent = eligibleCount === 0
            ? 'no entries in this window yet'
            : `${eligibleCount} ${eligibleCount === 1 ? 'entry' : 'entries'} ready to summarize`;
    }

    if (shareSpinner) {
        shareSpinner.classList.add('hidden');
    }
    if (shareText) {
        shareText.textContent = 'share with gemini';
    }
    if (shareButton) {
        const hasEntries = eligibleCount > 0;
        shareButton.disabled = false;
        shareButton.removeAttribute('aria-disabled');
        shareButton.classList.remove('btn-disabled');
        shareButton.dataset.hasEntries = String(hasEntries);
        shareButton.title = hasEntries
            ? 'share this window with gemini'
            : 'add an entry first (we\'ll remind you if it\'s empty)';
    }
}

function openSummaryConsentFlow(source = 'home') {
    const context = buildSummaryContext();
    if (!context || context.entries.length === 0) {
        if (source === 'home') {
            setSummaryStatus('no reflections to share yet', 'error');
            toggleShareLoadingState(false);
        } else {
            alert('No entries ready to share in this window yet.');
        }
        return;
    }
    pendingSummaryContext = { ...context, source };
    renderSummaryConsentList(context);
    openSummaryConsentModal();
}

function buildSummaryContext(options = {}) {
    const allowEmpty = Boolean(options.allowEmpty);
    const cadence = getSummaryCadenceSetting();
    const settings = window.NuukoStorage ? NuukoStorage.getSettingsSnapshot() : {};
    const entries = getEntries();
    if (!entries.length && !allowEmpty) return null;

    const { rangeStart, rangeEnd } = computeSummaryRange(cadence, settings);
    const selectedEntries = filterSummaryEntries(entries, rangeStart, rangeEnd, SUMMARY_ENTRY_LIMIT);
    if (!allowEmpty && selectedEntries.length === 0) return null;

    return {
        entries: selectedEntries,
        rangeStart,
        rangeEnd,
        cadence
    };
}

function computeSummaryRange(cadence, settings = {}) {
    const now = new Date();
    const end = now.toISOString();
    let windowDays = SUMMARY_DEFAULT_WINDOW_DAYS;
    if (cadence === 'monthly') windowDays = SUMMARY_MONTH_WINDOW_DAYS;
    if (cadence === 'yearly') windowDays = SUMMARY_YEAR_WINDOW_DAYS;
    const isManual = cadence === 'manual';
    let startDate = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

    if (!isManual && settings.lastSummaryRun) {
        const lastRun = new Date(settings.lastSummaryRun);
        if (!Number.isNaN(lastRun.getTime()) && lastRun < now) {
            startDate = lastRun;
        }
    }

    return {
        rangeStart: startDate.toISOString(),
        rangeEnd: end
    };
}

function filterSummaryEntries(entries, rangeStart, rangeEnd, limit) {
    const start = new Date(rangeStart).getTime();
    const end = new Date(rangeEnd).getTime();
    if (Number.isNaN(start) || Number.isNaN(end)) return [];

    return entries
        .filter(entry => entry?.createdAt)
        .filter(entry => entry.includeInSummaries !== false)
        .filter(entry => {
            const time = new Date(entry.createdAt).getTime();
            return time >= start && time <= end;
        })
        .slice(0, limit);
}

function renderSummaryConsentList(context) {
    const listElement = document.getElementById('summaryConsentList');
    const countElement = document.getElementById('summaryConsentCount');
    const wordElement = document.getElementById('summaryConsentWordCount');
    const rangeElement = document.getElementById('summaryConsentRange');

    if (!listElement) return;

    const entries = context.entries || [];
    const totalWords = entries.reduce((sum, entry) => sum + (entry.wordCount || 0), 0);

    listElement.innerHTML = entries.map((entry) => {
        const preview = entry.content?.slice(0, 200) || '';
        const safePreview = escapeHtml(preview);
        const tags = Array.isArray(entry.tags) ? entry.tags : [];
        const tagsMarkup = tags.length > 0
            ? `<div style="display:flex; flex-wrap:wrap; gap:0.35rem; margin-top:0.35rem;">
                    ${tags.map(tag => `<span style="background: rgba(154, 107, 81, 0.12); color: var(--nuuko-clay); padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.75rem;">${escapeHtml(tag)}</span>`).join('')}
               </div>`
            : '';

        return `
            <div class="paper-texture" style="padding: 1rem; border-radius: 16px; border: 1px solid rgba(61, 52, 44, 0.08);">
                <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                    <strong style="font-size: 0.95rem; color: var(--nuuko-espresso);">${formatReadableDate(entry.createdAt)}</strong>
                    ${entry.mood ? `<span style="font-size: 0.75rem; color: var(--nuuko-green); text-transform: lowercase;">${escapeHtml(entry.mood)}</span>` : ''}
                </div>
                <p style="margin: 0; font-size: 0.9rem; color: var(--nuuko-stone); line-height: 1.6;">${safePreview}${entry.content?.length > 200 ? '…' : ''}</p>
                ${tagsMarkup}
            </div>
        `;
    }).join('');

    if (countElement) {
        countElement.textContent = `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} will be shared`;
    }

    if (wordElement) {
        wordElement.textContent = `${totalWords} words total`;
    }

    if (rangeElement) {
        rangeElement.textContent = `window: ${formatReadableDate(context.rangeStart)} → ${formatReadableDate(context.rangeEnd)}`;
    }
}

function openSummaryConsentModal() {
    const modal = document.getElementById('summaryConsentModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    toggleShareLoadingState(false);
}

function closeSummaryConsentModal() {
    const modal = document.getElementById('summaryConsentModal');
    if (!modal) return;
    modal.classList.add('hidden');
    const otherModalOpen = document.getElementById('libraryModal')?.classList.contains('hidden') === false
        || document.getElementById('entryModal')?.classList.contains('hidden') === false;
    document.body.style.overflow = otherModalOpen ? 'hidden' : '';
    pendingSummaryContext = null;
    setModalLoadingState(false);
}

async function handleSummaryGeneration() {
    if (!pendingSummaryContext || !window.NuukoSummaryService) return;
    const onHomeCard = Boolean(document.getElementById('summaryStatusText'));
    if (onHomeCard) {
        setSummaryStatus('sending to gemini…', 'info');
        toggleShareLoadingState(true);
    }
    setModalLoadingState(true);
    try {
        const contextSnapshot = pendingSummaryContext ? { ...pendingSummaryContext } : {};
        const result = await NuukoSummaryService.generateSummary(pendingSummaryContext || {});
        if (result.queued) {
            if (onHomeCard) {
                setSummaryStatus('offline right now — summary queued for later', 'info');
            }
        } else if (result.record) {
            const rangeStart = contextSnapshot.rangeStart ?? result.record.rangeStart ?? null;
            const rangeEnd = contextSnapshot.rangeEnd ?? result.record.rangeEnd ?? null;
            if (window.NuukoStorage?.saveSummaryRecord) {
                await NuukoStorage.saveSummaryRecord({
                    ...result.record,
                    rangeStart,
                    rangeEnd
                });
                await NuukoStorage.updateSettings({
                    lastSummaryRun: result.record.createdAt
                });
            }
            const label = formatRangeLabel(rangeStart, rangeEnd);
            localStorage.setItem('nuuko_last_summary_highlight', result.record.id);
            localStorage.setItem('nuuko_last_summary_label', label);
            showSummaryToast(`${label} reflections are ready`);
            window.dispatchEvent(new CustomEvent('nuuko:summary-finished', { detail: { summaryId: result.record.id } }));
            if (onHomeCard) {
                setSummaryStatus('summary ready — peek under patterns → ai summaries', 'success');
            }
        }
        closeSummaryConsentModal();
        refreshSummaryCardState();
    } catch (error) {
        console.error('[Nuuko] summary failed', error);
        if (onHomeCard) {
            setSummaryStatus(error.message || 'could not generate summary', 'error');
        } else {
            alert(error.message || 'could not generate summary');
        }
    }
    setModalLoadingState(false);
    toggleShareLoadingState(false);
}

function setSummaryStatus(message, tone = 'info') {
    const statusElement = document.getElementById('summaryStatusText');
    if (!statusElement) return;
    const tones = {
        info: 'rgba(61, 52, 44, 0.7)',
        success: 'var(--nuuko-green)',
        error: 'var(--mood-anxious)'
    };
    statusElement.style.color = tones[tone] || tones.info;
    statusElement.textContent = message || '';
}

function toggleShareLoadingState(isLoading) {
    const button = document.getElementById('summaryShareButton');
    const spinner = document.getElementById('summaryShareSpinner');
    const text = document.getElementById('summaryShareButtonText');
    if (!button || !spinner || !text) return;
    if (isLoading) {
        button.disabled = true;
        spinner.classList.remove('hidden');
        text.textContent = 'sending…';
    } else {
        spinner.classList.add('hidden');
        text.textContent = 'share with gemini';
        button.disabled = false;
    }
}

function setModalLoadingState(isLoading) {
    const confirmButton = document.getElementById('summaryConsentConfirm');
    if (!confirmButton) return;
    confirmButton.disabled = isLoading;
    confirmButton.innerHTML = isLoading
        ? '<span class=\"spinner\" style=\"width: 18px; height: 18px;\"></span><span>sending…</span>'
        : '<img src=\"assets/icons/icon-insights.svg\" alt=\"confirm\" style=\"width: 16px; height: 16px;\"><span>share with gemini</span>';
}

function escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

function formatReadableDate(isoString) {
    if (!isoString) return 'unknown date';
    try {
        return new Date(isoString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        }).toLowerCase();
    } catch {
        return 'unknown date';
    }
}

function initializeSummarySettingsPanel() {
    const toggleGroup = document.getElementById('cadenceToggleGroup');
    const status = document.getElementById('insightsCadenceStatus');
    const generateButton = document.getElementById('insightsGenerateButton');
    if (!toggleGroup) return;

    const updateStatusText = (value) => {
        if (!status) return;
        if (value === 'manual') {
            status.textContent = 'nuuko will summarize whenever you tap generate.';
        } else {
            status.textContent = `nuuko will summarize every ${value}.`;
        }
    };

    const highlightActiveToggle = (value) => {
        const toggles = toggleGroup.querySelectorAll('.cadence-toggle');
        toggles.forEach((btn) => {
            const isActive = btn.dataset.cadence === value;
            btn.classList.toggle('active', isActive);
            btn.style.background = isActive ? 'rgba(107, 143, 113, 0.15)' : '';
            btn.style.borderColor = isActive ? 'rgba(107, 143, 113, 0.35)' : '';
            btn.style.color = isActive ? 'var(--nuuko-espresso)' : '';
        });
    };

    const current = getSummaryCadenceSetting();
    highlightActiveToggle(current);
    updateStatusText(current);

    toggleGroup.querySelectorAll('.cadence-toggle').forEach((button) => {
        button.addEventListener('click', async () => {
            const nextValue = button.dataset.cadence || 'weekly';
            if (window.NuukoStorage?.updateSettings) {
                await NuukoStorage.updateSettings({ summaryCadence: nextValue });
            }
            highlightActiveToggle(nextValue);
            updateStatusText(nextValue);
            refreshSummaryCardState();
        });
    });

    generateButton?.addEventListener('click', () => openSummaryConsentFlow('insights'));
}

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', async () => {
    if (window.NuukoStorage?.ready) {
        try {
            await NuukoStorage.ready;
        } catch (error) {
            console.warn('[Nuuko] Storage initialization issue:', error);
        }
    }
    
    if (window.NuukoSummaryService?.init) {
        window.NuukoSummaryService.init();
    }
    
    // Initialize based on current page
    const path = window.location.pathname;
    
    if (path.includes('index.html') || path === '/' || path === '') {
        initializeHomepage();
        initializeModal();
        initializeSummaryCard();
    } else if (path.includes('insights.html')) {
        initializeModal();
        initializeSummarySettingsPanel();
    } else if (path.includes('write.html')) {
        initializeModal();
        initializeWritePromptCard();
    } else {
        initializeModal();
    }
    
    // Add global functionality
    addScrollAnimations();
    addGlobalEventListeners();
    
    // Add focus states for accessibility
    applyFocusStyles(document.querySelectorAll('.btn, .nav-link, .book-page, .close-btn'));
});

// === DEMO DATA (for development) ===
async function addDemoData() {
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
    
    if (window.NuukoStorage?.ready) {
        await NuukoStorage.ready;
    }
    
    if (window.NuukoStorage && typeof NuukoStorage.replaceEntries === 'function') {
        await NuukoStorage.replaceEntries(demoEntries);
    } else {
        localStorage.setItem('nuuko_entries', JSON.stringify(demoEntries));
        localStorage.setItem('nuuko_stats', JSON.stringify({
            totalEntries: demoEntries.length,
            totalWords: demoEntries.reduce((sum, entry) => sum + entry.wordCount, 0),
            lastEntryDate: demoEntries[0].createdAt,
            daysSinceStart: 3
        }));
    }
    
    updateStatsDisplay({ refresh: true });
}

// Expose demo function globally for testing
window.addDemoData = addDemoData;
