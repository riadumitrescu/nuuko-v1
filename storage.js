(function (window) {
    const supportsIndexedDB = typeof window !== 'undefined' && 'indexedDB' in window;
    const DB_NAME = 'nuuko_journal';
    const DB_VERSION = 1;
    const STORE_NAMES = {
        entries: 'entries',
        summaries: 'summaries',
        settings: 'settings',
        stats: 'stats',
        insights: 'insights_cache'
    };
    const MIGRATION_FLAG = 'nuuko_storage_migrated_v1';
    const DEFAULT_SETTINGS = {
        id: 'app',
        userName: 'name',
        currentPrompt: 'what surprised you today?',
        summaryCadence: 'weekly',
        wrappedCadence: 'weekly',
        prompts: [],
        lastSummaryRun: null,
        dataRetention: {
            type: 'count',
            value: 50
        }
    };
    const DEFAULT_STATS = {
        id: 'global',
        totalEntries: 0,
        totalWords: 0,
        lastEntryDate: null,
        daysSinceStart: 0
    };
    const state = {
        dbPromise: null,
        readyPromise: null,
        cache: {
            entries: [],
            summaries: [],
            settings: { ...DEFAULT_SETTINGS },
            stats: { ...DEFAULT_STATS },
            insights: []
        },
        legacyMode: !supportsIndexedDB,
        sessionId: generateSessionId()
    };
    const broadcastChannel = typeof BroadcastChannel !== 'undefined'
        ? new BroadcastChannel('nuuko-storage')
        : null;

    init();

    function init() {
        if (!supportsIndexedDB) {
            console.warn('[NuukoStorage] IndexedDB not supported. Falling back to legacy localStorage.');
            loadLegacyCache();
            state.readyPromise = Promise.resolve();
            exposeAPI();
            return;
        }

        state.readyPromise = openDatabase()
            .then(() => migrateFromLegacy())
            .then(() => hydrateCache())
            .catch((error) => {
                console.error('[NuukoStorage] Failed to initialize IndexedDB. Falling back to localStorage.', error);
                state.legacyMode = true;
                loadLegacyCache();
            })
            .finally(() => {
                if (broadcastChannel) {
                    broadcastChannel.onmessage = (event) => {
                        if (!event || !event.data) return;
                        const { type, sourceId } = event.data;
                        if (!type || sourceId === state.sessionId) return;
                        hydrateCache().then(() => {
                            window.dispatchEvent(new CustomEvent('nuuko:storage', {
                                detail: { type, external: true }
                            }));
                        });
                    };
                }
            });
        
        exposeAPI();
    }

    function exposeAPI() {
        window.NuukoStorage = {
            ready: Promise.resolve(state.readyPromise),
            isLegacyMode: () => state.legacyMode,
            getEntriesSnapshot: () => [...state.cache.entries],
            getStatsSnapshot: () => ({ ...state.cache.stats }),
            getSettingsSnapshot: () => ({ ...state.cache.settings }),
            getSummariesSnapshot: () => [...state.cache.summaries],
            getInsightsCacheSnapshot: () => [...state.cache.insights],
            getLatestInsightsCache,
            saveInsightsCache,
            saveSummaryRecord,
            deleteSummaryRecord,
            saveEntry,
            deleteEntry,
            replaceEntries,
            updateSettings,
            recalculateStats,
            getEntryById,
            exportData,
            importData,
            clearAllData
        };
    }

    function generateSessionId() {
        if (window.crypto && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function loadLegacyCache() {
        const entries = parseJSON(localStorage.getItem('nuuko_entries')) || [];
        const stats = parseJSON(localStorage.getItem('nuuko_stats')) || computeStatsFromEntries(entries);
        const userName = localStorage.getItem('nuuko_user_name') || DEFAULT_SETTINGS.userName;
        const currentPrompt = localStorage.getItem('nuuko_current_prompt') || DEFAULT_SETTINGS.currentPrompt;

        state.cache.entries = entries.map(normalizeEntry).sort(sortByCreatedAtDesc);
        state.cache.stats = { ...DEFAULT_STATS, ...stats };
        state.cache.settings = {
            ...DEFAULT_SETTINGS,
            userName,
            currentPrompt
        };
        const legacyInsights = parseJSON(localStorage.getItem('nuuko_insights_cache')) || [];
        state.cache.insights = legacyInsights;
        const legacySummaries = parseJSON(localStorage.getItem('nuuko_summaries')) || [];
        state.cache.summaries = legacySummaries.map(normalizeSummary).sort(sortByCreatedAtDesc);
    }

    function openDatabase() {
        if (state.dbPromise) return state.dbPromise;
        state.dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const db = request.result;
                db.onversionchange = () => {
                    db.close();
                    console.warn('[NuukoStorage] Database version changed, closing connection.');
                };
                resolve(db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAMES.entries)) {
                    const store = db.createObjectStore(STORE_NAMES.entries, { keyPath: 'id' });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                }
                if (!db.objectStoreNames.contains(STORE_NAMES.summaries)) {
                    db.createObjectStore(STORE_NAMES.summaries, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORE_NAMES.settings)) {
                    db.createObjectStore(STORE_NAMES.settings, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORE_NAMES.stats)) {
                    db.createObjectStore(STORE_NAMES.stats, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORE_NAMES.insights)) {
                    db.createObjectStore(STORE_NAMES.insights, { keyPath: 'id' });
                }
            };
        });
        return state.dbPromise;
    }

    function parseJSON(str) {
        if (!str) return null;
        try {
            return JSON.parse(str);
        } catch {
            return null;
        }
    }

    async function migrateFromLegacy() {
        if (state.legacyMode || localStorage.getItem(MIGRATION_FLAG)) return;

        const legacyEntries = parseJSON(localStorage.getItem('nuuko_entries')) || [];
        const legacyStats = parseJSON(localStorage.getItem('nuuko_stats'));
        const legacyName = localStorage.getItem('nuuko_user_name');
        const legacyPrompt = localStorage.getItem('nuuko_current_prompt');

        if (
            legacyEntries.length === 0 &&
            !legacyStats &&
            !legacyName &&
            !legacyPrompt
        ) {
            localStorage.setItem(MIGRATION_FLAG, 'true');
            return;
        }

        await runTransaction([STORE_NAMES.entries], 'readwrite', (tx) => {
            const store = tx.objectStore(STORE_NAMES.entries);
            legacyEntries.forEach((entry) => store.put(entry));
        });

        const statsRecord = legacyStats || computeStatsFromEntries(legacyEntries);
        await putValue(STORE_NAMES.stats, { ...DEFAULT_STATS, ...statsRecord });

        const settingsRecord = {
            ...DEFAULT_SETTINGS,
            ...(legacyName ? { userName: legacyName } : {}),
            ...(legacyPrompt ? { currentPrompt: legacyPrompt } : {})
        };
        await putValue(STORE_NAMES.settings, settingsRecord);

        const legacyInsights = parseJSON(localStorage.getItem('nuuko_insights_cache')) || [];
        if (legacyInsights.length > 0) {
            await runTransaction([STORE_NAMES.insights], 'readwrite', (tx) => {
                const store = tx.objectStore(STORE_NAMES.insights);
                legacyInsights.forEach((item) => store.put(item));
            });
        }

        localStorage.removeItem('nuuko_entries');
        localStorage.removeItem('nuuko_stats');
        localStorage.removeItem('nuuko_user_name');
        localStorage.removeItem('nuuko_current_prompt');
        localStorage.removeItem('nuuko_insights_cache');
        localStorage.setItem(MIGRATION_FLAG, 'true');
    }

    async function hydrateCache() {
        if (state.legacyMode) return;
        const db = await openDatabase();
        const [entries, summaries, settingsList, statsList, insights] = await Promise.all([
            getAllFromStore(db, STORE_NAMES.entries),
            getAllFromStore(db, STORE_NAMES.summaries),
            getAllFromStore(db, STORE_NAMES.settings),
            getAllFromStore(db, STORE_NAMES.stats),
            getAllFromStore(db, STORE_NAMES.insights)
        ]);

        state.cache.entries = entries.map(normalizeEntry).sort(sortByCreatedAtDesc);
        state.cache.summaries = summaries.map(normalizeSummary).sort(sortByCreatedAtDesc);
        state.cache.settings = settingsList[0]
            ? { ...DEFAULT_SETTINGS, ...settingsList[0] }
            : { ...DEFAULT_SETTINGS };

        if (statsList[0]) {
            state.cache.stats = { ...DEFAULT_STATS, ...statsList[0] };
        } else {
            await recalculateStats();
        }

        state.cache.insights = insights
            .map((item) => ({
                ...item,
                computedAt: item.computedAt || item.updatedAt || item.createdAt || null
            }))
            .sort((a, b) => new Date(b.computedAt || 0) - new Date(a.computedAt || 0));
    }

    function getAllFromStore(db, storeName) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    function sortByCreatedAtDesc(a, b) {
        const timeA = new Date(a?.createdAt || 0).getTime();
        const timeB = new Date(b?.createdAt || 0).getTime();
        return timeB - timeA;
    }

    function runTransaction(storeNames, mode, executor) {
        if (state.legacyMode) return Promise.resolve();
        return openDatabase().then((db) => new Promise((resolve, reject) => {
            const tx = db.transaction(storeNames, mode);
            let result;
            try {
                result = executor(tx);
            } catch (error) {
                tx.abort();
                reject(error);
                return;
            }
            tx.oncomplete = () => resolve(result);
            tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed'));
            tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
        }));
    }

    function putValue(storeName, value) {
        if (state.legacyMode) {
            if (storeName === STORE_NAMES.entries) {
                const entries = parseJSON(localStorage.getItem('nuuko_entries')) || [];
                const filtered = entries.filter((entry) => entry.id !== value.id);
                const normalizedEntries = [value, ...filtered].map(normalizeEntry).sort(sortByCreatedAtDesc);
                localStorage.setItem('nuuko_entries', JSON.stringify(normalizedEntries));
                state.cache.entries = normalizedEntries;
                return Promise.resolve(value);
            }

            if (storeName === STORE_NAMES.stats) {
                localStorage.setItem('nuuko_stats', JSON.stringify(value));
                state.cache.stats = value;
                return Promise.resolve(value);
            }

            if (storeName === STORE_NAMES.settings) {
                if (value.userName) localStorage.setItem('nuuko_user_name', value.userName);
                if (value.currentPrompt) localStorage.setItem('nuuko_current_prompt', value.currentPrompt);
                state.cache.settings = { ...state.cache.settings, ...value };
                return Promise.resolve(value);
            }

            return Promise.resolve(value);
        }

        return runTransaction([storeName], 'readwrite', (tx) => {
            tx.objectStore(storeName).put(value);
        }).then(() => value);
    }

    async function saveEntry(entry) {
        if (!entry || typeof entry.id === 'undefined') throw new Error('Entry must include an id');
        const normalizedEntry = normalizeEntry({ ...entry });
        if (!normalizedEntry.createdAt) {
            normalizedEntry.createdAt = new Date().toISOString();
        }
        normalizedEntry.updatedAt = new Date().toISOString();

        await putValue(STORE_NAMES.entries, normalizedEntry);
        upsertEntryCache(normalizedEntry);
        await applyRetentionPolicy();
        await recalculateStats();
        notifyChange('entries');
        return normalizedEntry;
    }

    async function deleteEntry(entryId) {
        if (typeof entryId === 'undefined') return;
        state.cache.entries = state.cache.entries.filter((entry) => entry.id !== entryId);

        if (state.legacyMode) {
            localStorage.setItem('nuuko_entries', JSON.stringify(state.cache.entries));
        } else {
            await runTransaction([STORE_NAMES.entries], 'readwrite', (tx) => {
                tx.objectStore(STORE_NAMES.entries).delete(entryId);
            });
        }

        await recalculateStats();
        notifyChange('entries');
    }

    async function replaceEntries(entries) {
        state.cache.entries = Array.isArray(entries)
            ? entries.slice().map(normalizeEntry).sort(sortByCreatedAtDesc)
            : [];

        if (state.legacyMode) {
            localStorage.setItem('nuuko_entries', JSON.stringify(state.cache.entries));
        } else {
            await runTransaction([STORE_NAMES.entries], 'readwrite', (tx) => {
                const store = tx.objectStore(STORE_NAMES.entries);
                store.clear();
                state.cache.entries.forEach((entry) => store.put(entry));
            });
        }

        await recalculateStats();
        notifyChange('entries');
    }

    function upsertEntryCache(entry) {
        const existingIndex = state.cache.entries.findIndex((item) => item.id === entry.id);
        if (existingIndex > -1) {
            state.cache.entries[existingIndex] = entry;
        } else {
                state.cache.entries.push(entry);
            }
            state.cache.entries.sort(sortByCreatedAtDesc);
        }

    async function applyRetentionPolicy() {
        const retention = state.cache.settings?.dataRetention;
        if (!retention) return;

        if (retention.type === 'count' && typeof retention.value === 'number') {
            if (state.cache.entries.length > retention.value) {
                const entriesToRemove = state.cache.entries.slice(retention.value);
                state.cache.entries = state.cache.entries.slice(0, retention.value);

                if (state.legacyMode) {
                    localStorage.setItem('nuuko_entries', JSON.stringify(state.cache.entries));
                } else {
                    await runTransaction([STORE_NAMES.entries], 'readwrite', (tx) => {
                        const store = tx.objectStore(STORE_NAMES.entries);
                        entriesToRemove.forEach((entry) => store.delete(entry.id));
                    });
                }
            }
        }
        // Future: support retention.type === 'days'
    }

    async function updateSettings(partial) {
        const current = state.cache.settings || { ...DEFAULT_SETTINGS };
        const next = { ...current, ...partial };
        await putValue(STORE_NAMES.settings, next);
        state.cache.settings = next;
        notifyChange('settings');
        return next;
    }

    async function recalculateStats() {
        const stats = computeStatsFromEntries(state.cache.entries);
        state.cache.stats = { ...DEFAULT_STATS, ...stats };
        await putValue(STORE_NAMES.stats, state.cache.stats);
        notifyChange('stats');
        return state.cache.stats;
    }

    function computeStatsFromEntries(entries) {
        if (!Array.isArray(entries) || entries.length === 0) {
            return { ...DEFAULT_STATS };
        }

        const totalEntries = entries.length;
        const totalWords = entries.reduce((sum, entry) => sum + (entry.wordCount || 0), 0);
        const sortedByCreatedAt = entries.slice().sort(sortByCreatedAtDesc);
        const newest = sortedByCreatedAt[0];
        const oldest = sortedByCreatedAt[sortedByCreatedAt.length - 1];
        const daysSinceStart = oldest?.createdAt
            ? Math.floor((Date.now() - new Date(oldest.createdAt).getTime()) / (1000 * 60 * 60 * 24)) + 1
            : 0;

        return {
            ...DEFAULT_STATS,
            totalEntries,
            totalWords,
            lastEntryDate: newest?.createdAt || null,
            daysSinceStart
        };
    }

    function notifyChange(type) {
        window.dispatchEvent(new CustomEvent('nuuko:storage', { detail: { type } }));
        if (broadcastChannel) {
            broadcastChannel.postMessage({ type, sourceId: state.sessionId });
        }
    }

    async function exportData() {
        return {
            entries: [...state.cache.entries],
            stats: { ...state.cache.stats },
            settings: { ...state.cache.settings },
            summaries: [...state.cache.summaries],
            insights: [...state.cache.insights]
        };
    }

    async function importData(payload = {}) {
        const entries = Array.isArray(payload.entries) ? payload.entries : [];
        const stats = payload.stats || computeStatsFromEntries(entries);
        const settings = payload.settings || { ...DEFAULT_SETTINGS };

        await replaceEntries(entries);
        state.cache.stats = { ...DEFAULT_STATS, ...stats };
        await putValue(STORE_NAMES.stats, state.cache.stats);

        await updateSettings(settings);
    }

    async function clearAllData() {
        state.cache.entries = [];
        state.cache.stats = { ...DEFAULT_STATS };
        state.cache.settings = { ...DEFAULT_SETTINGS };
        state.cache.insights = [];

        if (state.legacyMode) {
            localStorage.removeItem('nuuko_entries');
            localStorage.removeItem('nuuko_stats');
            localStorage.removeItem('nuuko_user_name');
            localStorage.removeItem('nuuko_current_prompt');
            localStorage.removeItem('nuuko_insights_cache');
            return;
        }

        await runTransaction(Object.values(STORE_NAMES), 'readwrite', (tx) => {
            Object.values(STORE_NAMES).forEach((name) => {
                tx.objectStore(name).clear();
            });
        });

        await putValue(STORE_NAMES.settings, { ...DEFAULT_SETTINGS });
        await putValue(STORE_NAMES.stats, { ...DEFAULT_STATS });
        notifyChange('entries');
        notifyChange('settings');
        notifyChange('insights');
    }

    function normalizeEntry(entry = {}) {
        const next = { ...entry };
        if (!Array.isArray(next.tags)) {
            next.tags = [];
        }
        if (typeof next.includeInSummaries === 'undefined') {
            next.includeInSummaries = true;
        }
        return next;
    }

    function normalizeSummary(summary = {}) {
        const next = { ...summary };
        next.id = next.id || `summary-${Date.now()}`;
        next.createdAt = next.createdAt || new Date().toISOString();
        next.rangeStart = next.rangeStart || null;
        next.rangeEnd = next.rangeEnd || null;
        next.entryIds = Array.isArray(next.entryIds) ? next.entryIds : [];
        next.model = next.model || 'gemini-1.5-flash';
        next.highlights = Array.isArray(next.highlights) ? next.highlights : [];
        next.status = next.status || 'ready';
        next.analytics = next.analytics || null;
        return next;
    }

    function upsertInsightsCache(record) {
        if (!record) return;
        const existingIndex = state.cache.insights.findIndex((item) => item.id === record.id);
        if (existingIndex > -1) {
            state.cache.insights[existingIndex] = record;
        } else {
            state.cache.insights.push(record);
        }
        state.cache.insights.sort((a, b) => new Date(b.computedAt || 0) - new Date(a.computedAt || 0));
    }

    async function saveInsightsCache(record = {}) {
        const payload = {
            id: record.id || 'latest',
            computedAt: record.computedAt || new Date().toISOString(),
            data: record.data !== undefined ? record.data : record
        };

        if (state.legacyMode) {
            const cache = [payload];
            localStorage.setItem('nuuko_insights_cache', JSON.stringify(cache));
            state.cache.insights = cache;
        } else {
            await putValue(STORE_NAMES.insights, payload);
            upsertInsightsCache(payload);
        }
        
        notifyChange('insights');
        return payload;
    }

    function getLatestInsightsCache() {
        if ((!state.cache.insights || state.cache.insights.length === 0) && state.legacyMode) {
            const cache = parseJSON(localStorage.getItem('nuuko_insights_cache')) || [];
            state.cache.insights = cache;
        }
        
        if (!state.cache.insights || state.cache.insights.length === 0) return null;
        return state.cache.insights
            .slice()
            .sort((a, b) => new Date(b.computedAt || 0) - new Date(a.computedAt || 0))[0];
    }

    function upsertSummaryCache(record) {
        if (!record) return;
        const idx = state.cache.summaries.findIndex(item => item.id === record.id);
        if (idx > -1) {
            state.cache.summaries[idx] = record;
        } else {
            state.cache.summaries.push(record);
        }
        state.cache.summaries.sort(sortByCreatedAtDesc);
    }

    async function saveSummaryRecord(summary = {}) {
        const record = normalizeSummary(summary);
        if (state.legacyMode) {
            const updated = [record, ...state.cache.summaries].sort(sortByCreatedAtDesc);
            state.cache.summaries = updated;
            localStorage.setItem('nuuko_summaries', JSON.stringify(updated));
        } else {
            await putValue(STORE_NAMES.summaries, record);
            upsertSummaryCache(record);
        }
        notifyChange('summaries');
        return record;
    }

    async function deleteSummaryRecord(summaryId) {
        if (typeof summaryId === 'undefined' || summaryId === null) return;
        state.cache.summaries = state.cache.summaries.filter((item) => item.id !== summaryId);

        if (state.legacyMode) {
            localStorage.setItem('nuuko_summaries', JSON.stringify(state.cache.summaries));
        } else {
            await runTransaction([STORE_NAMES.summaries], 'readwrite', (tx) => {
                tx.objectStore(STORE_NAMES.summaries).delete(summaryId);
            });
        }

        notifyChange('summaries');
    }

    async function getEntryById(entryId) {
        if (typeof entryId === 'undefined' || entryId === null) return null;
        const targetId = String(entryId);
        const cached = state.cache.entries.find((entry) => String(entry.id) === targetId);
        if (cached) {
            return { ...cached };
        }

        if (state.legacyMode) {
            const entries = parseJSON(localStorage.getItem('nuuko_entries')) || [];
            const legacyEntry = entries.find((entry) => String(entry.id) === targetId);
            return legacyEntry ? normalizeEntry(legacyEntry) : null;
        }

        const db = await openDatabase();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAMES.entries, 'readonly');
            const store = tx.objectStore(STORE_NAMES.entries);
            const request = store.get(entryId);
            request.onsuccess = () => {
                resolve(request.result ? normalizeEntry(request.result) : null);
            };
            request.onerror = () => reject(request.error);
        });
    }
})(window);
