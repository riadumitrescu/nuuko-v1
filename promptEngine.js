(function (global) {
    const PROMPTS_PATH = 'prompts.json';
    let promptsCache = null;
    let promptsPromise = null;
    let sessionState = {
        bucket: null,
        primaryPrompt: null,
        secondaryPrompt: null
    };

    async function loadPrompts() {
        if (promptsCache) return promptsCache;
        if (promptsPromise) return promptsPromise;
        promptsPromise = fetch(PROMPTS_PATH)
            .then((res) => {
                if (!res.ok) throw new Error(`failed to load prompts (${res.status})`);
                return res.json();
            })
            .then((json) => {
                promptsCache = json;
                return json;
            });
        return promptsPromise;
    }

    function detectBucket(now = new Date()) {
        const hour = now.getHours();
        const day = now.getDay(); // 0 = Sunday

        const isMorning = hour >= 5 && hour <= 11;
        const isMidday = hour >= 12 && hour <= 16;
        const isEvening = !isMorning && !isMidday; // 17-23 & 0-4

        if (isMidday) return 'midday_checkin';

        if (isMorning) {
            if (day === 5) return 'friday_morning';
            if (day === 6 || day === 0) return 'weekend_morning';
            return 'weekday_morning_mon_thu';
        }

        if (isEvening) {
            if (day === 5) return 'friday_evening';
            if (day === 6) return 'saturday_evening';
            if (day === 0) return 'sunday_evening_reset';
            return 'weekday_evening_mon_thu';
        }

        return 'midday_checkin';
    }

    function isBeginningOfMonth(date = new Date()) {
        const day = date.getDate();
        return day >= 1 && day <= 3;
    }

    function isEndOfMonth(date = new Date()) {
        const day = date.getDate();
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        return day >= lastDay - 2;
    }

    function detectSeason(date = new Date()) {
        const month = date.getMonth(); // 0-based
        if ([8, 9, 10].includes(month)) return 'season_spring'; // Sep-Nov
        if ([11, 0, 1].includes(month)) return 'season_summer'; // Dec-Feb
        return null;
    }

    function randomChoice(arr = [], exclude) {
        if (!Array.isArray(arr) || arr.length === 0) return null;
        if (arr.length === 1) return arr[0];
        const filtered = exclude ? arr.filter(item => item !== exclude) : arr.slice();
        const pool = filtered.length ? filtered : arr;
        const idx = Math.floor(Math.random() * pool.length);
        return pool[idx];
    }

    function pickSecondaryPrompt(prompts, date) {
        const overlayBuckets = [];
        if (isBeginningOfMonth(date)) overlayBuckets.push('month_beginning');
        if (isEndOfMonth(date)) overlayBuckets.push('month_end');
        const seasonBucket = detectSeason(date);
        if (seasonBucket) overlayBuckets.push(seasonBucket);

        for (const bucket of overlayBuckets) {
            const list = prompts[bucket];
            if (list && list.length) {
                return { prompt: randomChoice(list), bucket };
            }
        }
        return { prompt: null, bucket: null };
    }

    async function getPrompt() {
        const prompts = await loadPrompts();
        const now = new Date();
        const bucket = detectBucket(now);
        const list = prompts[bucket];
        if (!list || !list.length) {
            throw new Error(`Missing or empty prompt bucket: ${bucket}`);
        }

        const primaryPrompt = randomChoice(list);
        const secondary = pickSecondaryPrompt(prompts, now);

        sessionState = {
            bucket,
            primaryPrompt,
            secondaryPrompt: secondary.prompt,
            secondaryBucket: secondary.bucket
        };

        return {
            primaryPrompt,
            secondaryPrompt: secondary.prompt || undefined,
            bucket
        };
    }

    async function refreshPrompt() {
        if (!sessionState.bucket) {
            return getPrompt();
        }
        const prompts = await loadPrompts();
        const list = prompts[sessionState.bucket];
        if (!list || !list.length) {
            throw new Error(`Missing or empty prompt bucket: ${sessionState.bucket}`);
        }
        const primaryPrompt = randomChoice(list, sessionState.primaryPrompt);
        sessionState.primaryPrompt = primaryPrompt;
        return {
            primaryPrompt,
            secondaryPrompt: sessionState.secondaryPrompt || undefined,
            bucket: sessionState.bucket
        };
    }

    const PromptEngine = {
        getPrompt,
        refreshPrompt,
        detectBucket,
        isBeginningOfMonth,
        isEndOfMonth,
        detectSeason,
        randomChoice
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PromptEngine;
    } else {
        global.NuukoPromptEngine = PromptEngine;
    }
})(typeof window !== 'undefined' ? window : globalThis);
