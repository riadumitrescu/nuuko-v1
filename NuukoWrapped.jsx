import React from 'react';

const paperTexture =
  'radial-gradient(circle at 10% 20%, rgba(255,255,255,0.72) 0, rgba(249,242,231,0.75) 32%, rgba(246,237,224,0.8) 65%, #f7f1e5 100%), url("data:image/svg+xml,%3Csvg width=\'160\' height=\'160\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'p\' x=\'0\' y=\'0\' width=\'32\' height=\'32\' patternUnits=\'userSpaceOnUse\'%3E%3Ccircle cx=\'1\' cy=\'1\' r=\'1\' fill=\'%23d8cbb4\' fill-opacity=\'0.12\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'160\' height=\'160\' fill=\'url(%23p)\'/%3E%3C/svg%3E")';

const WrappedShell = ({ children }) => (
  <div
    className="min-h-screen bg-[#f7f1e5] px-6 py-10 text-amber-900"
    style={{ backgroundImage: paperTexture }}
  >
    <div className="mx-auto flex max-w-6xl flex-col gap-6">{children}</div>
  </div>
);

const WrappedCard = ({ title, icon, children, className = '' }) => (
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

const StatCard = ({ label, value }) => (
  <div className="rounded-2xl border border-amber-100 bg-white/70 px-5 py-4 text-center shadow-md shadow-amber-100/60 backdrop-blur">
    <div className="font-serif text-3xl font-semibold text-amber-900">{value}</div>
    <div className="text-sm uppercase tracking-wide text-amber-700/70">{label}</div>
  </div>
);

const WordCloud = ({ words }) => (
  <div className="flex flex-wrap gap-2">
    {words.map((word, idx) => (
      <span
        key={idx}
        className="rounded-full bg-amber-50 px-3 py-1 text-amber-900 shadow-sm shadow-amber-100"
        style={{ fontSize: `${word.weight * 0.18 + 0.9}rem`, opacity: 0.8 + word.weight * 0.05 }}
      >
        {word.label}
      </span>
    ))}
  </div>
);

const MoodChart = ({ moods }) => (
  <div className="space-y-3">
    {moods.map((mood) => (
      <div key={mood.label} className="space-y-1">
        <div className="flex items-center justify-between text-sm text-amber-900">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: mood.color }} />
            {mood.label}
          </span>
          <span className="font-medium">{mood.value}%</span>
        </div>
        <div className="h-2 rounded-full bg-amber-100 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${mood.value}%`, background: mood.color }}
          />
        </div>
      </div>
    ))}
  </div>
);

const ClockChart = ({ label }) => (
  <div className="relative mx-auto h-40 w-40 rounded-full bg-white shadow-inner shadow-amber-100">
    <div
      className="absolute inset-2 rounded-full"
      style={{
        background: 'conic-gradient(from 220deg, #f4c389 0deg 110deg, #f7f1e5 110deg 360deg)',
      }}
    />
    <div className="absolute inset-7 rounded-full bg-[#fffaf2]" />
    <div className="absolute inset-0 flex items-center justify-center font-semibold text-amber-900">
      {label}
    </div>
  </div>
);

const Quotes = ({ quotes }) => (
  <div className="flex flex-wrap gap-4">
    {quotes.map((quote, idx) => (
      <div
        key={idx}
        className="relative w-full max-w-xs rounded-2xl bg-white px-4 py-5 text-amber-900 shadow-[0_12px_32px_rgba(120,85,50,0.12)]"
      >
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
          <div className="h-4 w-4 rounded-full bg-amber-200 shadow-inner shadow-amber-300" />
        </div>
        <p className="font-serif text-lg leading-snug">{quote.text}</p>
        <p className="mt-2 text-xs uppercase tracking-[0.15em] text-amber-600/70">{quote.context}</p>
      </div>
    ))}
  </div>
);

const QuadrantBars = ({ items }) => (
  <div className="grid grid-cols-2 gap-4">
    {items.map((item) => (
      <div key={item.label} className="rounded-2xl bg-white/80 p-3 shadow-inner shadow-amber-100">
        <div className="flex items-center justify-between text-sm text-amber-900">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
            {item.label}
          </span>
          <span className="font-semibold">{item.value}</span>
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
);

export function NuukoWrapped({
  summaryTitle = 'Your Week with Nuuko',
  daysJournaled = 6,
  totalWords = 2421,
  longestStreak = 9,
  moodMix = [
    { label: 'thoughtful', value: 45, color: '#f2c48d' },
    { label: 'calm', value: 30, color: '#b2d7c5' },
    { label: 'joyful', value: 15, color: '#f6d6a9' },
    { label: 'wistful', value: 10, color: '#d9c6d1' },
  ],
  wordCloud = [
    { label: 'growth', weight: 6 },
    { label: 'quiet', weight: 5 },
    { label: 'clarity', weight: 5 },
    { label: 'evening walks', weight: 7 },
    { label: 'breath', weight: 4 },
    { label: 'stretch', weight: 3 },
    { label: 'tea', weight: 2 },
  ],
  quotes = [
    { text: 'Every page is a soft landing back to myself.', context: 'favorite line' },
    { text: 'Two minutes of noticing created a whole evening of calm.', context: 'reflection' },
  ],
  avoidance = [
    { label: 'work', value: 70, color: '#f2c48d' },
    { label: 'social', value: 40, color: '#d9c6d1' },
    { label: 'health', value: 55, color: '#b2d7c5' },
    { label: 'self', value: 30, color: '#f6d6a9' },
  ],
  timeOfDayText = 'You write the most in the evenings.',
}) {
  return (
    <WrappedShell>
      <header className="rounded-3xl border border-amber-100 bg-white/75 px-8 py-8 text-center shadow-[0_20px_50px_rgba(120,85,50,0.08)]">
        <p className="text-sm uppercase tracking-[0.25em] text-amber-700/70">Nuuko Wrapped</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-amber-900">{summaryTitle}</h1>
        <p className="mt-2 text-sm text-amber-800/80">A gentle collage of your journaling.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="days journaled" value={daysJournaled} />
        <StatCard label="words" value={totalWords.toLocaleString()} />
        <StatCard label="longest streak" value={`${longestStreak}d`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <WrappedCard title="Activity" icon="📔">
          <p className="font-serif text-2xl text-amber-900">You journaled {daysJournaled} days.</p>
          <p className="mt-1 text-sm text-amber-700/80">Longest streak: {longestStreak} days</p>
        </WrappedCard>

        <WrappedCard title="Words" icon="✏️">
          <p className="font-serif text-2xl text-amber-900">
            You wrote {totalWords.toLocaleString()} words this window.
          </p>
          <div className="mt-4">
            <WordCloud words={wordCloud} />
          </div>
        </WrappedCard>

        <WrappedCard title="Mood mix" icon="🌤️">
          <MoodChart moods={moodMix} />
        </WrappedCard>

        <WrappedCard title="Time of day" icon="🕰️">
          <div className="flex items-center gap-6">
            <ClockChart label="Evening" />
            <p className="text-sm text-amber-800/80">{timeOfDayText}</p>
          </div>
        </WrappedCard>

        <WrappedCard title="Quotes" icon="📎" className="lg:col-span-2">
          <Quotes quotes={quotes} />
        </WrappedCard>

        <WrappedCard title="Avoidance patterns" icon="🧭" className="lg:col-span-2">
          <QuadrantBars items={avoidance} />
        </WrappedCard>
      </div>
    </WrappedShell>
  );
}

// Optional: sample data you can import for testing
export const sampleWrappedData = {
  summaryTitle: 'Summary for Nov 18',
  daysJournaled: 3,
  totalWords: 121,
  longestStreak: 2,
  moodMix: [
    { label: 'thoughtful', value: 75, color: '#f2c48d' },
    { label: 'joyful', value: 25, color: '#f6d6a9' },
  ],
  wordCloud: [
    { label: 'gentle', weight: 6 },
    { label: 'warmth', weight: 5 },
    { label: 'clarity', weight: 4 },
    { label: 'evening', weight: 3 },
  ],
  quotes: [
    { text: 'Your longest streak shows a beautiful rhythm blossoming.', context: 'streak' },
    { text: 'Every single entry is a soft step forward.', context: 'encouragement' },
  ],
  avoidance: [
    { label: 'work', value: 55, color: '#f2c48d' },
    { label: 'social', value: 35, color: '#d9c6d1' },
    { label: 'health', value: 45, color: '#b2d7c5' },
    { label: 'self', value: 30, color: '#f6d6a9' },
  ],
  timeOfDayText: 'You write the most in the evenings.',
};
