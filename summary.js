(function (window) {
    const MODEL_CANDIDATES = [
        { name: 'gemini-2.5-flash', version: 'v1' },
        { name: 'gemini-2.5-flash-latest', version: 'v1' },
        { name: 'gemini-2.5-flash', version: 'v1beta' },
        { name: 'gemini-1.5-flash-latest', version: 'v1beta' }
    ];
    const API_KEY_STORAGE = 'nuuko_api_key';
    const DEFAULT_API_KEY = 'AIzaSyCfP1MPXM26dNrtT3oL_o_A7VpQDwYlFnc';
    const SUMMARY_QUEUE_KEY = 'nuuko_summary_queue';
    const SUMMARY_LOG_KEY = 'nuuko_summary_logs';
    const TOKEN_USAGE_STORAGE_KEY = 'nuuko_token_usage';
    const TOKEN_THRESHOLD_PER_MIN = Number(window?.NUUKO_SUMMARY_TOKEN_THRESHOLD || 200000);
    const ESTIMATED_OUTPUT_TOKENS = 400; // rough guess per summary
    const MAX_REQUEST_CHARS = 4000;
    const MAX_RETRIES = 2;
    const RETRY_DELAY_MS = 1500;

    const SummaryService = {
        init,
        getApiKey,
        saveApiKey,
        generateSummary,
        queueJob,
        flushQueue,
        buildPrompt,
        sanitizeEntries,
        logEvent,
        getTelemetry
    };

    window.NuukoSummaryService = SummaryService;

    function init() {
        window.addEventListener('online', () => {
            flushQueue();
        });
        flushQueue();
    }

    function getApiKey() {
        return localStorage.getItem(API_KEY_STORAGE) || DEFAULT_API_KEY || '';
    }

    function saveApiKey(key) {
        if (!key || typeof key !== 'string') {
            localStorage.removeItem(API_KEY_STORAGE);
            logEvent({ type: 'api-key-cleared' });
            return '';
        }
        const trimmed = key.trim();
        localStorage.setItem(API_KEY_STORAGE, trimmed);
        logEvent({ type: 'api-key-saved' });
        return trimmed;
    }

    async function generateSummary(options = {}) {
        const {
            entries = [],
            rangeStart = null,
            rangeEnd = null,
            cadence = 'manual',
            abortSignal
        } = options;

        if (!Array.isArray(entries) || entries.length === 0) {
            throw new Error('No entries available for summary');
        }

        const apiKey = getApiKey();
        if (!apiKey) {
            throw new Error('Missing Gemini API key');
        }

        const job = {
            entries,
            rangeStart,
            rangeEnd,
            cadence,
            createdAt: new Date().toISOString()
        };

        if (!navigator.onLine) {
            queueJob(job, 'offline');
            return { queued: true };
        }

        const analyticsSnapshot = buildAnalyticsSnapshot(entries);
        const sanitizedEntries = sanitizeEntries(entries);
        const prompt = buildPrompt(sanitizedEntries, { cadence, rangeStart, rangeEnd, analytics: analyticsSnapshot });
        const estimatedInputTokens = estimateTokensFromEntries(sanitizedEntries, analyticsSnapshot);
        if (willExceedTokenThreshold(estimatedInputTokens + ESTIMATED_OUTPUT_TOKENS)) {
            logEvent({ type: 'fallback-tokens', entries: entries.length });
            return generateFallbackSummary(entries, { rangeStart, rangeEnd, cadence, analyticsSnapshot });
        }

        const body = {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }]
                }
            ],
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
            ]
        };

        let response;
        let modelUsed = MODEL_CANDIDATES[0].name;
        try {
            const result = await sendRequest(apiKey, body, abortSignal);
            response = result.data;
            modelUsed = result.modelUsed;
        } catch (error) {
            const quotaError = /quota|429|rate/i.test(error.message || '');
            if (quotaError) {
                logEvent({ type: 'fallback-quota', message: error.message });
                return generateFallbackSummary(entries, { rangeStart, rangeEnd, cadence, reason: 'quota', analyticsSnapshot });
            }
            throw error;
        }

        const summaryPayload = extractSummaryPayload(response);
        const summaryText = summaryPayload.text;
        const outputTokens = estimateTokensFromText(summaryText);
        recordTokenUsage(estimatedInputTokens + outputTokens);

        const record = {
            id: `summary-${Date.now()}`,
            createdAt: new Date().toISOString(),
            rangeStart,
            rangeEnd,
            entryIds: entries.map(entry => entry.id),
            cadence,
            model: modelUsed,
            text: summaryText,
            highlights: summaryPayload.highlights,
            cards: summaryPayload.cards,
            summarySentence: summaryPayload.summarySentence,
            analytics: analyticsSnapshot,
            status: 'ready'
        };

        logEvent({ type: 'success', cadence, entries: entries.length, model: modelUsed });
        return { record };
    }

    function generateFallbackSummary(entries, context = {}) {
        const { rangeStart, rangeEnd, cadence, reason = 'threshold', analyticsSnapshot = buildAnalyticsSnapshot(entries) } = context;
        const fallbackText = [
            `You captured ${analyticsSnapshot.daysJournaled} days of journaling with about ${analyticsSnapshot.totalWords.toLocaleString()} words — ${analyticsSnapshot.wordContextLabel}.`,
            `Most of your entries began ${Math.round(analyticsSnapshot.startPhraseShare * 100)}% of the time with heart-on-the-sleeve phrases, and your moods leaned toward ${analyticsSnapshot.moodDistribution[0]?.mood || 'thoughtful'} moments.`,
            analyticsSnapshot.topWords.length
                ? `Words that kept returning: ${analyticsSnapshot.topWords.slice(0, 4).join(', ')}.`
                : 'Your language stayed wonderfully varied.'
        ].join('\n\n');

        const highlights = [
            `${analyticsSnapshot.daysJournaled} active days`,
            `longest streak: ${analyticsSnapshot.longestStreak} days`,
            analyticsSnapshot.topWords.length ? `frequent words: ${analyticsSnapshot.topWords.slice(0, 3).join(', ')}` : ''
        ].filter(Boolean);

        logEvent({ type: 'fallback-summary', entries: entries.length, reason });

        return {
            record: {
                id: `summary-${Date.now()}`,
                createdAt: new Date().toISOString(),
                rangeStart,
                rangeEnd,
                entryIds: entries.map(entry => entry.id),
                cadence,
                model: 'nuuko-llama-fallback',
                text: fallbackText,
                highlights,
                analytics: analyticsSnapshot,
                status: 'fallback'
            },
            fallback: true
        };
    }

    async function sendRequest(apiKey, body, abortSignal) {
        let lastError;
        for (const candidate of MODEL_CANDIDATES) {
            let attempt = 0;
            while (attempt <= MAX_RETRIES) {
                try {
                    const response = await requestModel(apiKey, body, candidate, abortSignal);
                    const data = await response.json();
                    return { data, modelUsed: candidate.name };
                } catch (error) {
                    lastError = error;
                    attempt += 1;
                    logEvent({ type: 'error', message: error.message, attempt, model: candidate.name });
                    const notFound = /not found/i.test(error.message || '');
                    if (!shouldRetry(error, attempt, notFound)) {
                        if (notFound) break; // try next model
                        throw error;
                    }
                    await wait(RETRY_DELAY_MS * attempt);
                }
            }
        }
        throw lastError || new Error('Failed to generate summary');
    }

    async function requestModel(apiKey, body, candidate, abortSignal) {
        const controller = new AbortController();
        const signal = abortSignal || controller.signal;
        const url = `https://generativelanguage.googleapis.com/${candidate.version}/models/${candidate.name}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
            signal
        });

        if (!response.ok) {
            let errorMessage = `Gemini error (${response.status})`;
            try {
                const errorData = await response.json();
                if (errorData?.error?.message) {
                    errorMessage = `${errorMessage}: ${errorData.error.message}`;
                }
            } catch {
                // ignore json parse error
            }
            const err = new Error(errorMessage);
            err.status = response.status;
            throw err;
        }
        return response;
    }

    function shouldRetry(error, attempt, notFound = false) {
        if (notFound) return false;
        if (attempt > MAX_RETRIES) return false;
        if (!error) return false;
        if (error.name === 'AbortError') return false;
        if (error.message && /quota|key|permission|unauthorized/i.test(error.message)) return false;
        return navigator.onLine;
    }

    function estimateTokensFromEntries(entries = [], analytics = null) {
        const analyticsChars = analytics ? JSON.stringify(analytics).length : 0;
        const totalChars = entries.reduce((sum, entry) => sum + (entry.content?.length || 0), 0) + analyticsChars;
        return Math.ceil(totalChars / 4);
    }

    function estimateTokensFromText(text = '') {
        return Math.ceil((text?.length || 0) / 4);
    }

    function getRecentTokenUsage() {
        try {
            const raw = localStorage.getItem(TOKEN_USAGE_STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            const cutoff = Date.now() - 60 * 1000;
            return parsed.filter(item => item.timestamp > cutoff);
        } catch {
            return [];
        }
    }

    function recordTokenUsage(tokens) {
        const history = getRecentTokenUsage();
        history.push({ timestamp: Date.now(), tokens });
        localStorage.setItem(TOKEN_USAGE_STORAGE_KEY, JSON.stringify(history));
    }

    function willExceedTokenThreshold(nextTokens) {
        if (!TOKEN_THRESHOLD_PER_MIN) return false;
        const usage = getRecentTokenUsage();
        const currentTotal = usage.reduce((sum, item) => sum + item.tokens, 0);
        return currentTotal + nextTokens >= TOKEN_THRESHOLD_PER_MIN;
    }

    function formatDayKey(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function capitalize(value = '') {
        if (!value) return '';
        return value.charAt(0).toUpperCase() + value.slice(1);
    }

    const STOPWORDS = new Set(['the','a','an','and','or','but','i','you','he','she','we','they','it','to','of','for','in','on','at','with','my','your','their','is','was','am','are','be','me']);
    const TOPIC_CATEGORIES = ['work', 'social', 'health', 'self'];

    function buildAnalyticsSnapshot(entries = []) {
        if (!entries.length) {
            return {
                daysJournaled: 0,
                longestStreak: 0,
                totalWords: 0,
                wordContextLabel: 'a gentle start',
                startPhraseShare: 0,
                moodDistribution: [],
                timeBuckets: {},
                topWords: [],
                quotes: [],
                topicCounts: {},
                avoidedTopics: TOPIC_CATEGORIES,
                mostActiveTime: 'evening'
            };
        }

        const dayKeys = entries
            .map(entry => formatDayKey(entry.createdAt))
            .filter(Boolean);
        const uniqueDays = new Set(dayKeys);
        const daysJournaled = uniqueDays.size;
        const longestStreak = calculateLongestStreak(dayKeys);
        const totalWords = entries.reduce((sum, entry) => sum + (entry.wordCount || 0), 0);
        const wordContextLabel = getWordContextLabel(totalWords);

        const startFeelCount = entries.filter(entry => entry.startingPhraseCategory === 'i_feel').length;
        const startPhraseShare = entries.length ? startFeelCount / entries.length : 0;

        const moodCounts = entries.reduce((map, entry) => {
            if (!entry.mood) return map;
            const mood = entry.mood.toLowerCase();
            map[mood] = (map[mood] || 0) + 1;
            return map;
        }, {});
        const moodDistribution = Object.entries(moodCounts)
            .map(([mood, count]) => ({
                mood,
                count,
                percentage: entries.length ? Math.round((count / entries.length) * 100) : 0
            }))
            .sort((a, b) => b.count - a.count);

        const timeBuckets = entries.reduce((map, entry) => {
            const bucket = entry.timeBucket || 'evening';
            map[bucket] = (map[bucket] || 0) + 1;
            return map;
        }, {});
        const mostActiveTime = Object.entries(timeBuckets).sort((a, b) => b[1] - a[1])[0]?.[0] || 'evening';

        const topWords = computeTopWords(entries);
        const quotes = pickQuotes(entries);

        const topicCounts = entries.reduce((map, entry) => {
            const topics = Array.isArray(entry.topics) ? entry.topics : [];
            TOPIC_CATEGORIES.forEach(topic => {
                if (topics.includes(topic)) {
                    map[topic] = (map[topic] || 0) + 1;
                }
            });
            return map;
        }, {});
        TOPIC_CATEGORIES.forEach(topic => {
            if (typeof topicCounts[topic] === 'undefined') {
                topicCounts[topic] = 0;
            }
        });
        const avoidedTopics = TOPIC_CATEGORIES
            .map(topic => ({ topic, count: topicCounts[topic] || 0 }))
            .sort((a, b) => a.count - b.count)
            .filter(item => item.count === 0)
            .map(item => item.topic);

        return {
            daysJournaled,
            longestStreak,
            totalWords,
            wordContextLabel,
            startPhraseShare,
            moodDistribution,
            timeBuckets,
            topWords,
            quotes,
            topicCounts,
            avoidedTopics,
            mostActiveTime
        };
    }

    function calculateLongestStreak(dayKeys = []) {
        if (!dayKeys.length) return 0;
        const numericDays = Array.from(new Set(dayKeys))
            .map(key => new Date(key).setHours(0, 0, 0, 0))
            .sort((a, b) => a - b);
        let longest = 1;
        let run = 1;
        for (let i = 1; i < numericDays.length; i++) {
            if ((numericDays[i] - numericDays[i - 1]) === 86400000) {
                run += 1;
            } else {
                run = 1;
            }
            longest = Math.max(longest, run);
        }
        return longest;
    }

    function getWordContextLabel(totalWords) {
        if (totalWords >= 50000) return 'basically a novel';
        if (totalWords >= 20000) return 'half a novel';
        if (totalWords >= 10000) return 'like a short story collection';
        if (totalWords >= 5000) return 'like a long essay';
        if (totalWords >= 1000) return 'a lovely zine';
        return 'a gentle start';
    }

    function computeTopWords(entries = []) {
        const frequency = {};
        entries.forEach(entry => {
            const words = (entry.content || '')
                .toLowerCase()
                .replace(/[^a-z\s]/g, '')
                .split(/\s+/)
                .filter(word => word && !STOPWORDS.has(word));
            words.forEach(word => {
                frequency[word] = (frequency[word] || 0) + 1;
            });
        });
        return Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([word]) => word);
    }

    function pickQuotes(entries = []) {
        const candidates = [];
        entries.forEach(entry => {
            const sentences = (entry.content || '').split(/[\.\!\?]/).map(sentence => sentence.trim()).filter(Boolean);
            sentences.forEach(sentence => {
                if (sentence.length >= 20 && sentence.length <= 160) {
                    candidates.push(sentence);
                }
            });
        });
        return candidates.slice(0, 2);
    }

    function extractSummaryPayload(response) {
        const text = response?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('\n\n') || '';
        if (!text.trim()) {
            return {
                text: 'Gemini did not return any insights this time.',
                highlights: [],
                cards: [],
                summarySentence: ''
            };
        }

        try {
            const jsonMatch = text.match(/\{[\s\S]*\}$/);
            const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
            return {
                text: parsed.summarySentence || text.trim(),
                highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
                cards: Array.isArray(parsed.cards) ? parsed.cards : [],
                summarySentence: parsed.summarySentence || ''
            };
        } catch (error) {
            console.warn('[Nuuko] failed to parse summary JSON', error);
            return {
                text: text.trim(),
                highlights: extractHighlightsFromText(text),
                cards: [],
                summarySentence: ''
            };
        }
    }

    function extractHighlightsFromText(text) {
        const sentences = text.split(/[\.\!\?]\s/).map(sentence => sentence.trim()).filter(Boolean);
        return sentences.slice(0, 3).map(sentence => sentence.length > 160 ? `${sentence.substring(0, 160)}…` : sentence);
    }

    function sanitizeEntries(entries) {
        const sanitized = [];
        let charCount = 0;

        for (const entry of entries) {
            if (!entry?.content) continue;
            const safeContent = String(entry.content).replace(/\s+/g, ' ').trim();
            const excerpt = safeContent.slice(0, 600);

            const snippet = {
                id: entry.id,
                mood: entry.mood || '',
                tags: Array.isArray(entry.tags) ? entry.tags.join(', ') : '',
                createdAt: entry.createdAt,
                content: excerpt
            };

            charCount += excerpt.length;
            if (charCount > MAX_REQUEST_CHARS) break;
            sanitized.push(snippet);
        }

        return sanitized;
    }

    function buildPrompt(entries, context = {}) {
        const { cadence = 'manual', rangeStart, rangeEnd, analytics } = context;
        const rangeText = buildRangeText(rangeStart, rangeEnd);
        const cadenceText = cadence === 'weekly'
            ? 'for the past week'
            : cadence === 'monthly'
                ? 'for the past month'
                : 'recently';

        const entryText = entries.slice(0, 5).map((entry, index) => {
            const heading = `Entry ${index + 1} (${formatDate(entry.createdAt)}${entry.mood ? `, mood: ${entry.mood}` : ''}${entry.tags ? `, tags: ${entry.tags}` : ''})`;
            return `${heading}\n${entry.content}`;
        }).join('\n\n');

        const analyticsPayload = analytics ? JSON.stringify(analytics) : '{}';

        return [
            `You are Nuuko, a gentle journaling companion. Based on the analytics summary and entry snippets below, produce a JSON payload representing 8 cozy \"wrapped\" cards for the user.`,
            `Each card should include:`,
            `1. Title`,
            `2. Subtitle`,
            `3. Body copy (1-2 sentences)`,
            `4. Optional list data (for charts/keywords)`,
            `5. Emoji or icon hint (optional)`,
            `Required cards: activity summary, word volume comparison, expression pattern (% starting with \"I feel\" etc.), mood distribution, top words, time-of-day habit, quotes, avoided topics. Feel warm, encouraging, storybook-like.`,
            `Return JSON matching this schema:`,
            `{ \"cards\": [ { \"type\": \"activity\", \"title\": \"...\", \"subtitle\": \"...\", \"body\": \"...\", \"data\": { ... } }, ... ], \"highlights\": [\"...\"], \"summarySentence\": \"...\" }`,
            `Do not add extra commentary outside JSON.`,
            '',
            `Cadence: ${cadenceText} ${rangeText}`.trim(),
            `Analytics Summary: ${analyticsPayload}`,
            '',
            'Representative entry snippets:',
            entryText
        ].join('\n');
    }

    function buildRangeText(start, end) {
        if (!start || !end) return '';
        return `between ${formatDate(start)} and ${formatDate(end)}`;
    }

    function formatDate(value) {
        if (!value) return '';
        try {
            return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase();
        } catch {
            return '';
        }
    }

    function queueJob(job, reason = 'manual') {
        const queue = getQueue();
        queue.push(job);
        localStorage.setItem(SUMMARY_QUEUE_KEY, JSON.stringify(queue));
        logEvent({ type: 'queue', reason, entries: job.entries?.length || 0 });
    }

    async function flushQueue() {
        if (!navigator.onLine) return;
        const queue = getQueue();
        if (queue.length === 0) return;

        const nextJob = queue.shift();
        localStorage.setItem(SUMMARY_QUEUE_KEY, JSON.stringify(queue));

        try {
            const result = await generateSummary(nextJob);
            if (result?.record && window.NuukoStorage?.saveSummaryRecord) {
                await NuukoStorage.saveSummaryRecord({
                    ...result.record,
                    rangeStart: nextJob.rangeStart,
                    rangeEnd: nextJob.rangeEnd
                });
                if (window.NuukoStorage?.updateSettings) {
                    await NuukoStorage.updateSettings({
                        lastSummaryRun: result.record.createdAt
                    });
                }
            }
        } catch (error) {
            queue.unshift(nextJob);
            localStorage.setItem(SUMMARY_QUEUE_KEY, JSON.stringify(queue));
            logEvent({ type: 'queue-error', message: error.message });
            return;
        }

        if (queue.length > 0) {
            await wait(500);
            flushQueue();
        }
    }

    function getQueue() {
        const data = localStorage.getItem(SUMMARY_QUEUE_KEY);
        if (!data) return [];
        try {
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function wait(duration) {
        return new Promise((resolve) => setTimeout(resolve, duration));
    }

    function logEvent(event = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            ...event
        };
        const logs = getTelemetry(49);
        logs.unshift(entry);
        localStorage.setItem(SUMMARY_LOG_KEY, JSON.stringify(logs.slice(0, 50)));
    }

    function getTelemetry(limit = 20) {
        const data = localStorage.getItem(SUMMARY_LOG_KEY);
        if (!data) return [];
        try {
            const parsed = JSON.parse(data);
            if (!Array.isArray(parsed)) return [];
            return parsed.slice(0, limit);
        } catch {
            return [];
        }
    }
})(window);
