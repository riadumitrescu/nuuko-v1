import React, { useMemo } from 'react';
import {
  computeWrappedMetrics,
  pickStandoutQuotes,
} from './wrappedData';

const paperTexture =
  'radial-gradient(circle at 10% 20%, rgba(255,255,255,0.72) 0, rgba(249,242,231,0.75) 32%, rgba(246,237,224,0.8) 65%, #f7f1e5 100%), url("data:image/svg+xml,%3Csvg width=\'160\' height=\'160\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'p\' x=\'0\' y=\'0\' width=\'32\' height=\'32\' patternUnits=\'userSpaceOnUse\'%3E%3Ccircle cx=\'1\' cy=\'1\' r=\'1\' fill=\'%23d8cbb4\' fill-opacity=\'0.12\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'160\' height=\'160\' fill=\'url(%23p)\'/%3E%3C/svg%3E")';

const CardShell = ({ title, icon, children, className = '' }) => (
  <div
    className={`rounded-3xl border border-amber-100/80 bg-[#fffaf2]/80 shadow-[0_18px_48px_rgba(120,85,50,0.08)] backdrop-blur-sm ${className}`}
    style={{ backgroundImage: paperTexture }}
  >
    <div className="flex items-start gap-3 px-6 pt-6">
      {icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100/70 text-lg shadow-inner shadow-amber-200/60">
          {icon}
        </div>
      )}
      <div className="flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700/70">
          {title}
        </p>
      </div>
    </div>
    <div className="px-6 pb-6 pt-3">{children}</div>
  </div>
);

const StatPill = ({ label, value }) => (
  <div className="rounded-2xl border border-amber-100 bg-white/70 px-5 py-4 text-center shadow-md shadow-amber-100/60 backdrop-blur">
    <div className="font-serif text-3xl font-semibold text-amber-900">{value}</div>
    <div className="text-sm uppercase tracking-wide text-amber-700/70">{label}</div>
  </div>
);

const MoodSparkline = ({ series }) => {
  if (!series.length) return <p className="text-sm text-amber-700/70">No moods yet.</p>;
  const maxScore = 4;
  const width = 260;
  const height = 80;
  const step = series.length > 1 ? width / (series.length - 1) : width;
  const points = series.map((item, idx) => {
    const x = idx * step;
    const y = height - (item.averageScore / maxScore) * height;
    return { x, y };
  });
  const areaPath = [
    `M ${points[0].x} ${height}`,
    ...points.map((p) => `L ${p.x} ${p.y}`),
    `L ${points[points.length - 1].x} ${height}`,
    'Z',
  ].join(' ');
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-full drop-shadow-sm">
      <path d={areaPath} fill="rgba(242, 196, 141, 0.35)" />
      <path d={linePath} fill="none" stroke="#d6a57c" strokeWidth="2.5" strokeLinecap="round" />
      {points.map((p, idx) => (
        <circle key={idx} cx={p.x} cy={p.y} r="3.5" fill="#c27c52" />
      ))}
    </svg>
  );
};

const Donut = ({ percent, label }) => {
  const radius = 40;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const dash = (percent / 100) * circumference;
  return (
    <svg viewBox="0 0 120 120" className="h-28 w-28">
      <circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke="#f3e6d6"
        strokeWidth={stroke}
      />
      <circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke="#f2c48d"
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
      />
      <text x="60" y="64" textAnchor="middle" className="text-sm font-semibold fill-amber-900">
        {label}
      </text>
    </svg>
  );
};

const quoteColor = ['#f2c48d', '#b2d7c5', '#d9c6d1'];

export function NuukoWrappedCards({
  entries = [],
  rangeStart,
  rangeEnd,
  reflectionText,
  avoidance = [
    { label: 'work', value: 55, color: '#f2c48d' },
    { label: 'social', value: 35, color: '#d9c6d1' },
    { label: 'health', value: 45, color: '#b2d7c5' },
    { label: 'self', value: 30, color: '#f6d6a9' },
  ],
}) {
  const metrics = useMemo(
    () => computeWrappedMetrics(entries, { rangeStart, rangeEnd }),
    [entries, rangeStart, rangeEnd]
  );

  const currentStreak = useMemo(() => computeCurrentStreak(entries), [entries]);
  const wordsAsPages = Math.max(1, Math.round(metrics.stats.totalWords / 250));
  const wordsAsTweets = Math.max(1, Math.round(metrics.stats.totalWords / 30));

  const quotes =
    metrics.quotes?.length && metrics.quotes.length > 0
      ? metrics.quotes
      : pickStandoutQuotes(entries, 3);
  const reflection = reflectionText || 'A gentle reflection will appear here once Gemini responds.';

  const topBin = metrics.timeOfDay.bins?.[0] ?? { percentage: 0, label: 'evening' };

  return (
    <div
      className="min-h-screen bg-[#f7f1e5] px-6 py-10 text-amber-900"
      style={{ backgroundImage: paperTexture }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-amber-100 bg-white/75 px-8 py-8 text-center shadow-[0_20px_50px_rgba(120,85,50,0.08)]">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-700/70">Nuuko Wrapped</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold text-amber-900">
            Your Week with Nuuko
          </h1>
          <p className="mt-2 text-sm text-amber-800/80">
            A cozy collage of words, moods, and little habits.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-4">
          <StatPill label="days" value={metrics.stats.daysWritten} />
          <StatPill label="words" value={metrics.stats.totalWords.toLocaleString()} />
          <StatPill label="avg words/day" value={metrics.stats.averageWordsPerDay} />
          <StatPill label="longest streak" value={`${metrics.stats.longestStreak}d`} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <CardShell title="Words & pace" icon="✏️">
            <p className="font-serif text-2xl text-amber-900">
              {metrics.stats.totalWords.toLocaleString()} words this window.
            </p>
            <p className="mt-2 text-sm text-amber-700/80">
              That&apos;s like {wordsAsPages} pages or ~{wordsAsTweets} tweets.
            </p>
          </CardShell>

          <CardShell title="Time of day" icon="🕰️">
            <div className="flex items-center gap-4">
              <Donut percent={topBin.percentage || 0} label={metrics.timeOfDay.primaryLabel} />
              <div>
                <p className="font-serif text-xl text-amber-900">
                  You write most in the {metrics.timeOfDay.primaryLabel || 'evenings'}.
                </p>
                <div className="mt-3 space-y-1">
                  {metrics.timeOfDay.bins.map((bin) => (
                    <div key={bin.label} className="flex items-center gap-2 text-sm text-amber-800">
                      <span className="h-2 w-2 rounded-full bg-amber-300" />
                      <span className="capitalize">{bin.label}</span>
                      <span className="text-amber-700/70">{bin.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardShell>

          <CardShell title="Mood over time" icon="🌤️">
            <MoodSparkline series={metrics.moodSeries} />
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-amber-700/70">
              pastel line shows your daily mood blend
            </p>
          </CardShell>

          <CardShell title="Streaks" icon="🔥">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/80 px-4 py-3 text-center shadow-inner shadow-amber-100">
                <div className="font-serif text-2xl text-amber-900">{metrics.stats.longestStreak}</div>
                <div className="text-xs uppercase tracking-wide text-amber-700/70">longest</div>
              </div>
              <div className="rounded-2xl bg-white/80 px-4 py-3 text-center shadow-inner shadow-amber-100">
                <div className="font-serif text-2xl text-amber-900">{currentStreak}</div>
                <div className="text-xs uppercase tracking-wide text-amber-700/70">current</div>
              </div>
              <div className="rounded-2xl bg-white/80 px-4 py-3 text-center shadow-inner shadow-amber-100">
                <div className="font-serif text-2xl text-amber-900">{metrics.stats.daysWritten}</div>
                <div className="text-xs uppercase tracking-wide text-amber-700/70">days showed up</div>
              </div>
            </div>
          </CardShell>

          <CardShell title="Reflection" icon="📖" className="lg:col-span-2">
            <p className="font-serif text-lg leading-relaxed text-amber-900">{reflection}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-amber-700/70">
              warm summary from your journaling window
            </p>
          </CardShell>

          <CardShell title="Activity recap" icon="📔">
            <ul className="space-y-2 text-sm text-amber-800">
              <li>Showed up {metrics.stats.daysWritten} days.</li>
              <li>Wrote {metrics.stats.totalWords.toLocaleString()} words.</li>
              <li>Average pace {metrics.stats.averageWordsPerDay} words/day.</li>
              <li>Longest streak {metrics.stats.longestStreak} days.</li>
            </ul>
          </CardShell>

          <CardShell title="Favorite quotes" icon="📎">
            {quotes?.length ? (
              <div className="flex flex-wrap gap-3">
                {quotes.map((quote, idx) => (
                  <div
                    key={quote.id || idx}
                    className="w-full max-w-xs rounded-2xl bg-white px-4 py-4 text-amber-900 shadow-[0_12px_28px_rgba(120,85,50,0.12)]"
                    style={{ borderLeft: `4px solid ${quoteColor[idx % quoteColor.length]}` }}
                  >
                    <p className="font-serif text-base leading-snug">{quote.snippet}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-amber-700/70">
                      {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : '—'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-amber-700/70">We&apos;ll collect a few lines once you write.</p>
            )}
          </CardShell>

          <CardShell title="Avoidance patterns" icon="🧭">
            <div className="grid grid-cols-2 gap-3">
              {avoidance.map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/80 p-3 shadow-inner shadow-amber-100">
                  <div className="flex items-center justify-between text-sm text-amber-900">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                      {item.label}
                    </span>
                    <span className="font-semibold">{item.value}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-amber-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.value}%`, background: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardShell>
        </div>
      </div>
    </div>
  );
}

function computeCurrentStreak(entries = []) {
  const days = new Set();
  entries.forEach((entry) => {
    const day = entry?.createdAt ? new Date(entry.createdAt) : null;
    if (!day || Number.isNaN(day.getTime())) return;
    day.setHours(0, 0, 0, 0);
    days.add(day.getTime());
  });
  if (days.size === 0) return 0;
  const sorted = Array.from(days).sort((a, b) => b - a);
  let streak = 1;
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i += 1) {
    const diffDays = (prev - sorted[i]) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      streak += 1;
      prev = sorted[i];
    } else if (diffDays > 1) {
      break;
    }
  }
  return streak;
}

// Optional sample for manual testing:
export const sampleWrappedEntries = [
  {
    id: 1,
    createdAt: new Date().toISOString(),
    wordCount: 320,
    mood: 'thoughtful',
    content: 'Every page is a soft landing back to myself.',
  },
  {
    id: 2,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    wordCount: 180,
    mood: 'joyful',
    content: 'Evening walks brought a gentle warmth to the week.',
  },
  {
    id: 3,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    wordCount: 260,
    mood: 'calm',
    content: 'Two minutes of noticing created a whole evening of calm.',
  },
];
