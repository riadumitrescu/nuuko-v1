/**
 * Utilities to prepare Nuuko Wrapped data from journal entries.
 * All functions are pure: pass an array of entries and get structured stats back.
 *
 * Expected entry shape (best effort):
 * { id, createdAt, wordCount, content, mood }
 */

const MOOD_SCORES = {
  joyful: 4,
  happy: 4,
  calm: 3,
  thoughtful: 3,
  neutral: 2,
  meh: 2,
  low: 1,
  sad: 1,
  anxious: 1,
  stressed: 1,
};

export function computeWrappedMetrics(entries = [], options = {}) {
  const filtered = filterByRange(entries, options.rangeStart, options.rangeEnd);
  const stats = computeJournalingStats(filtered);
  const timeOfDay = buildTimeOfDayBins(filtered);
  const moodSeries = buildMoodSeries(filtered);
  const quotes = pickStandoutQuotes(filtered, options.maxQuotes || 3);

  return {
    stats,
    timeOfDay,
    moodSeries,
    quotes,
    entries: filtered,
  };
}

export function computeJournalingStats(entries = []) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return {
      totalWords: 0,
      daysWritten: 0,
      longestStreak: 0,
      averageWordsPerDay: 0,
    };
  }

  const daySet = new Set();
  let totalWords = 0;

  entries.forEach((entry) => {
    const day = toDayKey(entry.createdAt);
    if (day) daySet.add(day);
    totalWords += getWordCount(entry);
  });

  const daysWritten = daySet.size;
  const longestStreak = computeLongestStreak(daySet);
  const averageWordsPerDay = daysWritten ? Math.round(totalWords / daysWritten) : 0;

  return { totalWords, daysWritten, longestStreak, averageWordsPerDay };
}

export function buildTimeOfDayBins(entries = []) {
  const bins = [
    { label: 'morning', from: 5, to: 11, count: 0 },
    { label: 'afternoon', from: 11, to: 17, count: 0 },
    { label: 'evening', from: 17, to: 22, count: 0 },
    { label: 'night', from: 22, to: 24, count: 0, wrap: true },
  ];

  entries.forEach((entry) => {
    const date = new Date(entry.createdAt || entry.timestamp || entry.date);
    if (Number.isNaN(date.getTime())) return;
    const hour = date.getHours();
    bins.forEach((bin) => {
      if (bin.wrap) {
        if (hour >= bin.from || hour < 5) bin.count += 1;
      } else if (hour >= bin.from && hour < bin.to) {
        bin.count += 1;
      }
    });
  });

  const total = bins.reduce((sum, item) => sum + item.count, 0) || 1;
  const sorted = [...bins].sort((a, b) => b.count - a.count);
  const top = sorted[0] || { label: 'evening', count: 0 };

  return {
    bins: bins.map((item) => ({
      label: item.label,
      count: item.count,
      percentage: Math.round((item.count / total) * 100),
    })),
    primaryLabel: top.label,
  };
}

export function buildMoodSeries(entries = []) {
  const byDay = new Map();

  entries.forEach((entry) => {
    const day = toDayKey(entry.createdAt);
    if (!day) return;
    const mood = (entry.mood || '').toLowerCase();
    const score = MOOD_SCORES[mood] ?? 2;
    const existing = byDay.get(day);
    if (!existing) {
      byDay.set(day, { day, moods: { [mood]: 1 }, scoreSum: score, count: 1 });
    } else {
      existing.moods[mood] = (existing.moods[mood] || 0) + 1;
      existing.scoreSum += score;
      existing.count += 1;
    }
  });

  const series = Array.from(byDay.values())
    .map((item) => ({
      day: item.day,
      averageScore: Number((item.scoreSum / item.count).toFixed(2)),
      topMood: Object.entries(item.moods).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral',
    }))
    .sort((a, b) => (a.day < b.day ? -1 : 1));

  return series;
}

export function pickStandoutQuotes(entries = [], max = 3) {
  const candidates = entries
    .map((entry) => {
      const text = (entry.content || '').trim();
      if (!text) return null;
      const snippet = text.length > 220 ? `${text.slice(0, 217)}…` : text;
      return {
        id: entry.id,
        snippet,
        wordCount: getWordCount(entry),
        createdAt: entry.createdAt,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.wordCount - a.wordCount || new Date(b.createdAt) - new Date(a.createdAt));

  return candidates.slice(0, max);
}

function filterByRange(entries, rangeStart, rangeEnd) {
  if (!rangeStart && !rangeEnd) return entries.slice();
  const start = rangeStart ? new Date(rangeStart).getTime() : null;
  const end = rangeEnd ? new Date(rangeEnd).getTime() : null;
  return entries.filter((entry) => {
    const ts = new Date(entry.createdAt || entry.timestamp || entry.date).getTime();
    if (Number.isNaN(ts)) return false;
    if (start && ts < start) return false;
    if (end && ts > end) return false;
    return true;
  });
}

function toDayKey(input) {
  if (!input) return null;
  const ts = new Date(input).getTime();
  if (Number.isNaN(ts)) return null;
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function computeLongestStreak(daySet) {
  if (!daySet || daySet.size === 0) return 0;
  const days = Array.from(daySet)
    .map((day) => new Date(day).getTime())
    .sort((a, b) => a - b);

  let longest = 1;
  let current = 1;

  for (let i = 1; i < days.length; i += 1) {
    const diffDays = (days[i] - days[i - 1]) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else if (diffDays > 1) {
      current = 1;
    }
  }

  return longest;
}

function getWordCount(entry) {
  if (typeof entry?.wordCount === 'number') return entry.wordCount;
  if (entry?.content) {
    const words = entry.content.trim().split(/\s+/).filter(Boolean);
    return words.length;
  }
  return 0;
}
