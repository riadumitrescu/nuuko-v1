import { computeWrappedMetrics, pickStandoutQuotes } from './wrappedData.js';

const PAPER_TEXTURE =
  'radial-gradient(circle at 10% 20%, rgba(255,255,255,0.72) 0, rgba(249,242,231,0.75) 32%, rgba(246,237,224,0.8) 65%, #f7f1e5 100%), url("data:image/svg+xml,%3Csvg width=\'160\' height=\'160\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'p\' x=\'0\' y=\'0\' width=\'32\' height=\'32\' patternUnits=\'userSpaceOnUse\'%3E%3Ccircle cx=\'1\' cy=\'1\' r=\'1\' fill=\'%23d8cbb4\' fill-opacity=\'0.12\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'160\' height=\'160\' fill=\'url(%23p)\'/%3E%3C/svg%3E")';

const WRAPPED_MOUNT_ID = 'wrappedMount';

let pendingRender = null;

document.addEventListener('DOMContentLoaded', () => {
  scheduleRender();
});

window.addEventListener('nuuko:storage', (event) => {
  const type = event?.detail?.type;
  if (type === 'entries' || type === 'stats') {
    scheduleRender();
  }
});

async function scheduleRender() {
  if (pendingRender) return;
  pendingRender = requestAnimationFrame(async () => {
    pendingRender = null;
    await renderWrappedSection();
  });
}

async function renderWrappedSection() {
  const mount = document.getElementById(WRAPPED_MOUNT_ID);
  if (!mount) return;

  const entries = await getEntriesSnapshot();
  if (!entries.length) {
    mount.innerHTML = renderEmptyState();
    return;
  }

  const metrics = computeWrappedMetrics(entries);
  const reflection = craftReflection(metrics);
  const quotes = pickStandoutQuotes(entries, 3);
  const avoidance = computeAvoidance(entries);
  const currentStreak = computeCurrentStreak(entries);

  mount.innerHTML = '';
  mount.appendChild(buildWrappedLayout({ metrics, quotes, reflection, avoidance, currentStreak }));
}

async function getEntriesSnapshot() {
  if (!window.NuukoStorage) return [];
  try {
    if (window.NuukoStorage.ready) {
      await window.NuukoStorage.ready;
    }
  } catch (error) {
    console.warn('[NuukoWrapped] storage not ready', error);
  }
  return window.NuukoStorage.getEntriesSnapshot
    ? window.NuukoStorage.getEntriesSnapshot()
    : [];
}

function renderEmptyState() {
  return `
    <div class="rounded-3xl border border-amber-100 bg-white/70 p-10 text-center shadow-[0_20px_50px_rgba(120,85,50,0.08)]" style="background-image: ${PAPER_TEXTURE};">
      <p class="text-sm uppercase tracking-[0.25em] text-amber-700/70 mb-3">wrapped</p>
      <p class="font-serif text-2xl text-amber-900 mb-2">Your collage will appear here</p>
      <p class="text-amber-700/80">Write a few entries and share a summary to unlock this view.</p>
    </div>
  `;
}

function buildWrappedLayout({ metrics, quotes, reflection, avoidance, currentStreak }) {
  const container = document.createElement('div');
  container.className = 'rounded-[32px] bg-[#f7f1e5]/70 p-1';

  const header = document.createElement('div');
  header.className =
    'rounded-3xl border border-amber-100 bg-white/75 px-8 py-8 text-center shadow-[0_20px_50px_rgba(120,85,50,0.08)]';
  header.innerHTML = `
    <p class="text-sm uppercase tracking-[0.25em] text-amber-700/70">Nuuko Wrapped</p>
    <h2 class="mt-2 font-serif text-4xl font-semibold text-amber-900">Your Week with Nuuko</h2>
    <p class="mt-2 text-sm text-amber-800/80">A gentle collage of words, moods, and tiny rituals.</p>
  `;

  const statGrid = document.createElement('div');
  statGrid.className = 'mt-6 grid gap-4 md:grid-cols-4';
  statGrid.append(
    createStatCard('days', metrics.stats.daysWritten),
    createStatCard('words', metrics.stats.totalWords.toLocaleString()),
    createStatCard('avg words/day', metrics.stats.averageWordsPerDay),
    createStatCard('longest streak', `${metrics.stats.longestStreak}d`)
  );

  const cardsGrid = document.createElement('div');
  cardsGrid.className = 'mt-6 grid gap-4 lg:grid-cols-2';
  cardsGrid.append(
    createWordSummaryCard(metrics.stats),
    createTimeOfDayCard(metrics.timeOfDay),
    createMoodChartCard(metrics.moodSeries),
    createStreakCard(metrics.stats, currentStreak),
    createReflectionCard(reflection),
    createActivityCard(metrics.stats),
    createQuotesCard(quotes),
    createAvoidanceCard(avoidance)
  );

  container.append(header, statGrid, cardsGrid);
  return container;
}

function createStatCard(label, value) {
  const card = document.createElement('div');
  card.className =
    'rounded-2xl border border-amber-100 bg-white/70 px-5 py-4 text-center shadow-md shadow-amber-100/60 backdrop-blur';
  card.innerHTML = `
    <div class="font-serif text-3xl font-semibold text-amber-900">${value}</div>
    <div class="text-sm uppercase tracking-wide text-amber-700/70">${label}</div>
  `;
  return card;
}

function createWordSummaryCard(stats) {
  const card = createCardShell('Words & pace', '✏️');
  const wordsAsPages = Math.max(1, Math.round(stats.totalWords / 250));
  const wordsAsTweets = Math.max(1, Math.round(stats.totalWords / 30));
  card.querySelector('.card-body').innerHTML = `
    <p class="font-serif text-2xl text-amber-900">${stats.totalWords.toLocaleString()} words this window.</p>
    <p class="mt-2 text-sm text-amber-700/80">That’s like ${wordsAsPages} cozy pages or ~${wordsAsTweets} tweets.</p>
  `;
  return card;
}

function createTimeOfDayCard(timeData) {
  const card = createCardShell('Time of day', '🕰️');
  const body = card.querySelector('.card-body');
  const sorted = [...timeData.bins].sort((a, b) => b.count - a.count);
  const top = sorted[0] || { label: 'evening', percentage: 0 };
  const donut = createDonut(top.percentage);
  const list = document.createElement('div');
  list.className = 'mt-3 space-y-1';
  timeData.bins.forEach((bin) => {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 text-sm text-amber-800';
    row.innerHTML = `
      <span class="h-2 w-2 rounded-full bg-amber-300"></span>
      <span class="capitalize">${bin.label}</span>
      <span class="text-amber-700/70">${bin.percentage}%</span>
    `;
    list.appendChild(row);
  });
  const text = document.createElement('p');
  text.className = 'font-serif text-xl text-amber-900';
  text.textContent = `You write the most in the ${top.label}.`;
  const wrapper = document.createElement('div');
  wrapper.className = 'flex flex-col gap-3 sm:flex-row sm:items-center';
  wrapper.append(donut, text);
  body.append(wrapper, list);
  return card;
}

function createMoodChartCard(series) {
  const card = createCardShell('Mood over time', '🌤️');
  const body = card.querySelector('.card-body');
  if (!series.length) {
    body.innerHTML = '<p class="text-sm text-amber-700/70">No moods logged yet.</p>';
    return card;
  }
  const svg = buildMoodSparkline(series);
  const caption = document.createElement('p');
  caption.className = 'mt-2 text-xs uppercase tracking-[0.18em] text-amber-700/70';
  caption.textContent = 'pastel line shows your daily blend';
  body.append(svg, caption);
  return card;
}

function createStreakCard(stats, currentStreak) {
  const card = createCardShell('Streaks', '🔥');
  const body = card.querySelector('.card-body');
  body.innerHTML = `
    <div class="grid grid-cols-3 gap-3">
      ${createMiniStat(stats.longestStreak, 'longest')}
      ${createMiniStat(currentStreak, 'current')}
      ${createMiniStat(stats.daysWritten, 'days showed up')}
    </div>
  `;
  return card;
}

function createReflectionCard(reflection) {
  const card = createCardShell('Reflection', '📖');
  card.classList.add('lg:col-span-2');
  const body = card.querySelector('.card-body');
  body.innerHTML = `
    <p class="font-serif text-lg leading-relaxed text-amber-900">${reflection}</p>
    <p class="mt-2 text-xs uppercase tracking-[0.18em] text-amber-700/70">warm summary from this window</p>
  `;
  return card;
}

function createActivityCard(stats) {
  const card = createCardShell('Activity recap', '📔');
  const body = card.querySelector('.card-body');
  body.innerHTML = `
    <ul class="space-y-2 text-sm text-amber-800">
      <li>Showed up ${stats.daysWritten} days.</li>
      <li>${stats.totalWords.toLocaleString()} total words.</li>
      <li>Average ${stats.averageWordsPerDay} words per day.</li>
      <li>Longest streak ${stats.longestStreak} days.</li>
    </ul>
  `;
  return card;
}

function createQuotesCard(quotes) {
  const card = createCardShell('Favorite quotes', '📎');
  const body = card.querySelector('.card-body');
  if (!quotes.length) {
    body.innerHTML = '<p class="text-sm text-amber-700/70">We’ll add highlights once you write a bit more.</p>';
    return card;
  }
  const list = document.createElement('div');
  list.className = 'flex flex-wrap gap-3';
  quotes.forEach((quote, idx) => {
    const item = document.createElement('div');
    item.className =
      'w-full max-w-xs rounded-2xl bg-white px-4 py-4 text-amber-900 shadow-[0_12px_28px_rgba(120,85,50,0.12)]';
    item.style.borderLeft = `4px solid ${['#f2c48d', '#b2d7c5', '#d9c6d1'][idx % 3]}`;
    item.innerHTML = `
      <p class="font-serif text-base leading-snug">${quote.snippet}</p>
      <p class="mt-2 text-xs uppercase tracking-[0.12em] text-amber-700/70">${
        quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : ''
      }</p>
    `;
    list.appendChild(item);
  });
  body.appendChild(list);
  return card;
}

function createAvoidanceCard(data) {
  const card = createCardShell('Avoidance patterns', '🧭');
  const body = card.querySelector('.card-body');
  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-2 gap-3';
  data.forEach((item) => {
    const block = document.createElement('div');
    block.className = 'rounded-2xl bg-white/80 p-3 shadow-inner shadow-amber-100';
    block.innerHTML = `
      <div class="flex items-center justify-between text-sm text-amber-900">
        <span class="flex items-center gap-2">
          <span class="h-2 w-2 rounded-full" style="background:${item.color};"></span>
          ${item.label}
        </span>
        <span class="font-semibold">${item.value}%</span>
      </div>
      <div class="mt-2 h-2 rounded-full bg-amber-100 overflow-hidden">
        <div class="h-full rounded-full" style="width:${item.value}%; background:${item.color};"></div>
      </div>
    `;
    grid.appendChild(block);
  });
  body.appendChild(grid);
  return card;
}

function createCardShell(title, icon) {
  const card = document.createElement('div');
  card.className =
    'rounded-3xl border border-amber-100/80 bg-[#fffaf2]/80 shadow-[0_18px_48px_rgba(120,85,50,0.08)] backdrop-blur-sm';
  card.style.backgroundImage = PAPER_TEXTURE;
  card.innerHTML = `
    <div class="flex items-start gap-3 px-6 pt-6">
      <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100/70 text-lg shadow-inner shadow-amber-200/60">${icon}</div>
      <div class="flex-1">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700/70">${title}</p>
      </div>
    </div>
    <div class="card-body px-6 pb-6 pt-3"></div>
  `;
  return card;
}

function createMiniStat(value, label) {
  return `
    <div class="rounded-2xl bg-white/80 px-4 py-3 text-center shadow-inner shadow-amber-100">
      <div class="font-serif text-2xl text-amber-900">${value}</div>
      <div class="text-xs uppercase tracking-wide text-amber-700/70">${label}</div>
    </div>
  `;
}

function createDonut(percent) {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 120 120');
  svg.classList.add('h-28', 'w-28');
  const base = document.createElementNS(svgNS, 'circle');
  base.setAttribute('cx', '60');
  base.setAttribute('cy', '60');
  base.setAttribute('r', '40');
  base.setAttribute('fill', 'none');
  base.setAttribute('stroke', '#f3e6d6');
  base.setAttribute('stroke-width', '10');
  svg.appendChild(base);
  const progress = document.createElementNS(svgNS, 'circle');
  const circumference = 2 * Math.PI * 40;
  progress.setAttribute('cx', '60');
  progress.setAttribute('cy', '60');
  progress.setAttribute('r', '40');
  progress.setAttribute('fill', 'none');
  progress.setAttribute('stroke', '#f2c48d');
  progress.setAttribute('stroke-width', '10');
  progress.setAttribute('stroke-linecap', 'round');
  progress.setAttribute('stroke-dasharray', `${(percent / 100) * circumference} ${circumference}`);
  progress.setAttribute('transform', 'rotate(-90 60 60)');
  svg.appendChild(progress);
  const text = document.createElementNS(svgNS, 'text');
  text.setAttribute('x', '60');
  text.setAttribute('y', '64');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('class', 'text-sm font-semibold fill-amber-900');
  text.textContent = `${percent}%`;
  svg.appendChild(text);
  return svg;
}

function buildMoodSparkline(series) {
  const svgNS = 'http://www.w3.org/2000/svg';
  const width = 260;
  const height = 80;
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.classList.add('w-full', 'max-w-full', 'drop-shadow-sm');

  const maxScore = 4;
  const step = series.length > 1 ? width / (series.length - 1) : width;
  const points = series.map((item, idx) => {
    const x = idx * step;
    const y = height - (item.averageScore / maxScore) * height;
    return { x, y };
  });

  const area = document.createElementNS(svgNS, 'path');
  const areaPath = [
    `M ${points[0].x} ${height}`,
    ...points.map((p) => `L ${p.x} ${p.y}`),
    `L ${points[points.length - 1].x} ${height}`,
    'Z',
  ].join(' ');
  area.setAttribute('d', areaPath);
  area.setAttribute('fill', 'rgba(242, 196, 141, 0.35)');
  svg.appendChild(area);

  const line = document.createElementNS(svgNS, 'path');
  line.setAttribute(
    'd',
    points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  );
  line.setAttribute('fill', 'none');
  line.setAttribute('stroke', '#d6a57c');
  line.setAttribute('stroke-width', '2.5');
  line.setAttribute('stroke-linecap', 'round');
  svg.appendChild(line);

  points.forEach((p, idx) => {
    const dot = document.createElementNS(svgNS, 'circle');
    dot.setAttribute('cx', p.x);
    dot.setAttribute('cy', p.y);
    dot.setAttribute('r', '3.5');
    dot.setAttribute('fill', '#c27c52');
    svg.appendChild(dot);
    if (idx === points.length - 1) {
      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', p.x + 6);
      label.setAttribute('y', p.y - 6);
      label.setAttribute('fill', '#c27c52');
      label.setAttribute('font-size', '10');
      label.textContent = 'today';
      svg.appendChild(label);
    }
  });

  return svg;
}

function craftReflection(metrics) {
  const topMood = metrics.moodSeries.at(-1)?.topMood || 'thoughtful';
  const tone = metrics.timeOfDay.primaryLabel || 'evening';
  const { daysWritten, totalWords, longestStreak } = metrics.stats;
  const words = totalWords.toLocaleString();
  return `You showed up ${daysWritten} days, pouring ${words} words into your notebook. Most reflections unfurled in the ${tone}, when ${topMood} feelings bubbled up. That ${longestStreak}-day streak hints at a rhythm worth cherishing—notice what stirred joy and what asked for softness, then keep tending those moments.`;
}

function computeAvoidance(entries = []) {
  const categories = {
    work: { label: 'work', count: 0, color: '#f2c48d' },
    social: { label: 'social', count: 0, color: '#d9c6d1' },
    health: { label: 'health', count: 0, color: '#b2d7c5' },
    self: { label: 'self', count: 0, color: '#f6d6a9' },
  };
  let total = 0;
  entries.forEach((entry) => {
    (entry.tags || []).forEach((tag) => {
      const key = String(tag).toLowerCase();
      if (categories[key]) {
        categories[key].count += 1;
        total += 1;
      }
    });
  });
  if (!total) {
    return Object.values(categories).map((item) => ({ ...item, value: 25 }));
  }
  return Object.values(categories).map((item) => ({
    label: item.label,
    value: Math.round((item.count / total) * 100),
    color: item.color,
  }));
}

function computeCurrentStreak(entries = []) {
  const days = new Set();
  entries.forEach((entry) => {
    const date = entry?.createdAt ? new Date(entry.createdAt) : null;
    if (!date || Number.isNaN(date.getTime())) return;
    date.setHours(0, 0, 0, 0);
    days.add(date.getTime());
  });
  if (!days.size) return 0;
  const sorted = Array.from(days).sort((a, b) => b - a);
  let streak = 1;
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i += 1) {
    const diff = (prev - sorted[i]) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      streak += 1;
      prev = sorted[i];
    } else if (diff > 1) {
      break;
    }
  }
  return streak;
}
