import { useMemo, useState } from 'react';
import { submitFeedback } from './submitFeedback';

const feedbackTypes = [
  'Bug',
  'Feature request',
  'UI issue',
  'Confusing copy',
  'General suggestion',
];

const ratingOptions = [
  { value: 1, label: '😞', title: 'Very unhappy' },
  { value: 2, label: '😐', title: 'Not great' },
  { value: 3, label: '🙂', title: 'Okay' },
  { value: 4, label: '😊', title: 'Happy' },
  { value: 5, label: '🤩', title: 'Delighted' },
];

export function FeedbackModal({ open, onClose }) {
  const [type, setType] = useState(feedbackTypes[0]);
  const [rating, setRating] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isDisabled = useMemo(() => {
    return !feedback.trim() || !rating || loading;
  }, [feedback, rating, loading]);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isDisabled) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await submitFeedback({
        type,
        rating,
        feedback: feedback.trim(),
        email: email.trim() || undefined,
      });

      setSuccess(true);
      setFeedback('');
      setEmail('');
      setRating(null);
    } catch (err) {
      setError('Could not send feedback. Please try again soon.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 bg-black/30 backdrop-blur-sm">
      <button
        aria-label="Close feedback"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <div className="relative w-full max-w-xl">
        <div className="relative overflow-hidden rounded-3xl bg-[#fff7ec] shadow-2xl shadow-amber-100/70 ring-1 ring-amber-200">
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-amber-100 blur-3xl" />
          <div className="flex items-start justify-between gap-6 px-8 pt-8">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-amber-700/70">nuuko</p>
              <h2 className="text-2xl font-semibold text-amber-900">Share a little feedback?</h2>
              <p className="mt-1 text-sm text-amber-800/80">
                Help us keep your journaling nook cozy and delightful.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-amber-900/70 transition hover:scale-105 hover:text-amber-900"
              aria-label="Close feedback modal"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="relative z-10 space-y-4 px-8 pb-8 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-amber-900">
                Type
                <select
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-amber-900 shadow-inner shadow-amber-100 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                >
                  {feedbackTypes.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <p className="text-sm font-semibold text-amber-900">Rating</p>
                <div className="mt-2 flex items-center gap-2 rounded-2xl bg-white px-2 py-2 shadow-inner shadow-amber-100">
                  {ratingOptions.map((option) => {
                    const isActive = rating === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        title={option.title}
                        aria-pressed={isActive}
                        onClick={() => setRating(option.value)}
                        className={`flex h-11 w-full items-center justify-center rounded-xl border border-transparent text-xl transition focus:outline-none focus:ring-2 focus:ring-amber-300 ${
                          isActive
                            ? 'bg-amber-100 text-amber-900 shadow-sm shadow-amber-200'
                            : 'hover:border-amber-200 hover:bg-amber-50 text-amber-800'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <label className="block text-sm font-semibold text-amber-900">
              Feedback
              <textarea
                required
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="What felt lovely? What felt off? What would make nuuko feel even cozier?"
                rows={4}
                className="mt-2 w-full resize-none rounded-2xl border border-amber-200 bg-white px-4 py-3 text-amber-900 shadow-inner shadow-amber-100 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </label>

            <label className="block text-sm font-semibold text-amber-900">
              Email <span className="text-amber-600/70">(optional)</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-amber-900 shadow-inner shadow-amber-100 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </label>

            <div className="flex items-center justify-between gap-3 pt-2">
              <p className="text-xs text-amber-800/70">
                We only send what you write here. Journaling entries never leave your device.
              </p>
              <button
                type="submit"
                disabled={isDisabled}
                className="inline-flex items-center gap-2 rounded-2xl bg-amber-900 px-5 py-3 text-sm font-semibold text-amber-50 shadow-lg shadow-amber-900/20 transition hover:-translate-y-0.5 hover:shadow-amber-900/30 disabled:translate-y-0 disabled:bg-amber-900/60 disabled:shadow-none"
              >
                {loading ? 'Sending...' : 'Send feedback'}
              </button>
            </div>

            {error && <p className="text-sm text-rose-600">{error}</p>}
            {success && (
              <div className="flex items-center gap-2 text-sm text-emerald-700 transition-opacity duration-500 ease-out">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-base">
                  ✨
                </span>
                <span>Thanks for sharing! We&apos;ll use this to keep nuuko feeling warm and welcoming.</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
